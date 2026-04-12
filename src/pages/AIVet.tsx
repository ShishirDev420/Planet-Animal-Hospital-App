import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
Role: You are the 'Planet Animal AI Vet', an authoritative, calm, and highly knowledgeable veterinary assistant.
Language Mirroring: You are a linguistic chameleon. You MUST dynamically match the user's exact language and fluency. If the user speaks in proper, fluent English, you MUST respond in proper, fluent, native-sounding English. If the user mixes Hindi and English (Hinglish), you should respond in natural Hinglish. Never force Hinglish if the user is speaking pure English.
Tone: Your voice must sound lively, energetic, and deeply reassuring. Speak with the warmth and clarity of a top-tier veterinarian.
Grounding: You MUST use the Google Search tool to verify symptoms and local outbreaks before advising.

Context:
User Name: Harshal.
Pet Name: Johnny.
Breed: American Bully.
Current Weight: 65 kg.
You must use this weight for any toxicity or dosage calculations.
`;

// --- Audio Utility Functions ---
const base64ToInt16Array = (base64: string) => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
};

const int16ToFloat32 = (int16Array: Int16Array) => {
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
};

const float32ToInt16 = (float32Array: Float32Array) => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
};

const int16ToBase64 = (int16Array: Int16Array) => {
  const bytes = new Uint8Array(int16Array.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export default function AIVet() {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<{id: string, role: 'user' | 'ai', text: string, isComplete?: boolean}[]>([
    { id: 'init', role: 'ai', text: 'Hi Harshal, I am the Planet Animal AI Vet. How can I help Johnny today?', isComplete: true }
  ]);

  // Refs for Audio and WebSocket
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const isMutedRef = useRef(isMuted);
  
  // VAD and Interruption Refs
  const isSpeakingRef = useRef(false);
  const silenceFramesRef = useRef(0);
  const activeAudioNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Queueing and State Refs
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isIgnoringAudioRef = useRef(false);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, isUserSpeaking]);

  // Keep ref in sync with state for the audio processor closure
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const stopConversation = useCallback(() => {
    setIsActive(false);
    setVolume(0);
    setIsUserSpeaking(false);
    setIsThinking(false);
    
    audioQueueRef.current = [];
    isIgnoringAudioRef.current = false;
    
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
    }
    if (analyserRef.current) analyserRef.current.disconnect();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    
    activeAudioNodesRef.current.forEach(node => {
      try { node.stop(); } catch (e) {}
    });
    activeAudioNodesRef.current = [];

    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(console.error);
    }
    
    sessionRef.current = null;
  }, []);

  useEffect(() => {
    return () => stopConversation();
  }, [stopConversation]);

  const startConversation = async () => {
    if (isActive) return;
    setIsActive(true);

    try {
      // 1. Setup Audio Context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      
      audioCtxRef.current = audioCtx;
      nextPlayTimeRef.current = audioCtx.currentTime;

      const scheduleAudio = () => {
        if (!audioCtxRef.current) return;
        const currentTime = audioCtxRef.current.currentTime;
        
        if (nextPlayTimeRef.current < currentTime) {
          nextPlayTimeRef.current = currentTime;
        }

        while (audioQueueRef.current.length > 0) {
          // Lookahead of 0.5 seconds to ensure gapless playback without over-queueing
          if (nextPlayTimeRef.current - currentTime > 0.5) {
            break;
          }

          const buffer = audioQueueRef.current.shift()!;
          const sourceNode = audioCtxRef.current.createBufferSource();
          sourceNode.buffer = buffer;
          sourceNode.connect(audioCtxRef.current.destination);

          sourceNode.onended = () => {
            activeAudioNodesRef.current = activeAudioNodesRef.current.filter(n => n !== sourceNode);
            scheduleAudio();
          };

          activeAudioNodesRef.current.push(sourceNode);
          sourceNode.start(nextPlayTimeRef.current);
          nextPlayTimeRef.current += buffer.duration;
        }
      };

      // 2. Get Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 3. Setup Analyser for Visualization
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      // 4. Setup Processor for sending audio
      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(audioCtx.destination); // Required for processor to run

      // 5. Connect to Gemini Live API
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            // Handle Emergency Keywords and Text Transcripts
            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.text) {
                const lowerText = part.text.toLowerCase();
                if (lowerText.includes('emergency') || lowerText.includes('toxic') || lowerText.includes('chocolate') || lowerText.includes('immediate')) {
                  setEmergency(true);
                }
                
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last && last.role === 'ai' && !last.isComplete) {
                    return [...prev.slice(0, -1), { ...last, text: last.text + part.text }];
                  } else {
                    return [...prev, { id: crypto.randomUUID(), role: 'ai', text: part.text, isComplete: false }];
                  }
                });
                setIsThinking(false);
              }
            }

            if (message.serverContent?.turnComplete) {
               isIgnoringAudioRef.current = false;
               setMessages(prev => {
                 const last = prev[prev.length - 1];
                 if (last && last.role === 'ai') {
                   return [...prev.slice(0, -1), { ...last, isComplete: true }];
                 }
                 return prev;
               });
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              isIgnoringAudioRef.current = false;
              audioQueueRef.current = [];
              nextPlayTimeRef.current = audioCtxRef.current?.currentTime || 0;
            }

            // Handle Audio Playback
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioCtxRef.current && !isIgnoringAudioRef.current) {
              const int16Data = base64ToInt16Array(base64Audio);
              const float32Data = int16ToFloat32(int16Data);
              
              // Gemini Live API outputs audio at 24kHz. Setting the buffer to 24000 ensures 
              // the AudioContext resamples it correctly without dropping the pitch.
              const buffer = audioCtxRef.current.createBuffer(1, float32Data.length, 24000);
              buffer.getChannelData(0).set(float32Data);
              
              audioQueueRef.current.push(buffer);
              scheduleAudio();
            }
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }],
          outputAudioTranscription: {}
        }
      });

      sessionPromise.then((session) => {
        sessionRef.current = session;
        
        processor.onaudioprocess = (e) => {
          // Zero out output to prevent feedback loop to speakers
          e.outputBuffer.getChannelData(0).fill(0);
          
          if (isMutedRef.current) return; // Don't send if muted

          const inputData = e.inputBuffer.getChannelData(0);
          const int16Data = float32ToInt16(inputData);
          const base64Data = int16ToBase64(int16Data);
          
          session.sendRealtimeInput({
            audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        };
      });

      // Start Visualization Loop
      const updateVolume = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Amplify the volume to make it more responsive
        const normalized = Math.min(1, avg / 64); // Normalize 0-1 with higher sensitivity
        
        setVolume(normalized);

        // VAD Logic & Kill Switch
        if (normalized > 0.15) {
          if (!isSpeakingRef.current) {
            isSpeakingRef.current = true;
            setIsUserSpeaking(true);
            setIsThinking(false);
            
            const lastMsg = messagesRef.current[messagesRef.current.length - 1];
            const isAIResponding = lastMsg && lastMsg.role === 'ai' && !lastMsg.isComplete;
            const hasAudio = activeAudioNodesRef.current.length > 0 || audioQueueRef.current.length > 0;

            // Execute Kill Switch if AI is currently speaking/queued or responding
            if (hasAudio || isAIResponding) {
              isIgnoringAudioRef.current = true;
              audioQueueRef.current = [];

              activeAudioNodesRef.current.forEach(node => {
                try { node.stop(); } catch (e) {}
              });
              activeAudioNodesRef.current = [];
              
              if (audioCtxRef.current) {
                nextPlayTimeRef.current = audioCtxRef.current.currentTime;
              }
              
              setMessages(prev => {
                 const last = prev[prev.length - 1];
                 if (last && last.role === 'ai' && !last.isComplete) {
                   return [...prev.slice(0, -1), { ...last, isComplete: true }];
                 }
                 return prev;
              });

              // Contextual Interruption Awareness
              if (sessionRef.current) {
                sessionRef.current.sendRealtimeInput({
                  text: "[System Note: The user interrupted you mid-sentence here. Acknowledge the new input naturally.]"
                });
              }
            }
          }
          silenceFramesRef.current = 0;
        } else {
          silenceFramesRef.current++;
          if (silenceFramesRef.current > 30) { // ~0.5s of silence at 60fps
            if (isSpeakingRef.current) {
              isSpeakingRef.current = false;
              setIsUserSpeaking(false);
              setIsThinking(true);
              setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', text: '🎤 Voice message sent', isComplete: true }]);
            }
          }
        }

        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

    } catch (error) {
      console.error("Failed to start conversation", error);
      stopConversation();
    }
  };

  const handleEndCall = () => {
    stopConversation();
    navigate('/');
  };

  // For demonstration purposes, we can trigger the emergency state manually by clicking the title
  const triggerMockEmergency = () => {
    setEmergency(true);
  };

  return (
    <div className="flex flex-col h-screen bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-amber-50/70 via-slate-50 to-emerald-50/30 overflow-hidden relative">
      {/* Emergency Banner */}
      <AnimatePresence>
        {emergency && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="absolute top-0 left-0 right-0 z-50 bg-red-600 text-white p-4 shadow-2xl cursor-pointer pb-safe"
            onClick={() => window.open('https://maps.google.com/?q=24/7+Planet+Animal+Hospital', '_blank')}
          >
            <div className="flex items-center justify-center gap-3 max-w-md mx-auto pt-8">
              <AlertTriangle className="animate-pulse shrink-0" size={24} />
              <span className="font-black text-sm text-center uppercase tracking-wider">
                EMERGENCY DETECTED: Tap here for nearest 24/7 Planet Animal Hospital
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-6 py-8 z-20 flex flex-col items-center justify-center mt-10 shrink-0">
        <h1 onClick={triggerMockEmergency} className="font-black text-slate-900 text-2xl tracking-tight cursor-pointer">AI Vet Doctor</h1>
        <p className={`font-bold text-sm tracking-widest uppercase mt-1 flex items-center gap-2 ${isUserSpeaking ? 'text-emerald-500' : 'text-slate-500'}`}>
          <span className={`w-2 h-2 rounded-full ${isUserSpeaking ? 'bg-emerald-500' : 'bg-slate-400'} ${isActive ? 'animate-pulse' : ''}`}></span>
          {isActive ? (isUserSpeaking ? 'Listening...' : 'Connected') : 'Ready'}
        </p>
      </div>

      {/* Conversational UI */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-40 z-10 hide-scrollbar">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-5 rounded-3xl border shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-2xl ${
                msg.role === 'user' 
                  ? 'bg-amber-50/40 border-amber-100/60 rounded-tr-sm text-slate-800' 
                  : 'bg-white/40 border-white/60 rounded-tl-sm text-slate-800'
              }`}>
                <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
              </div>
            </motion.div>
          ))}
          
          {isUserSpeaking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex justify-end"
            >
              <div className="max-w-[80%] p-5 rounded-3xl border shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-2xl bg-amber-50/40 border-amber-100/60 rounded-tr-sm text-slate-800 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-sm font-medium text-slate-500 italic">Listening...</p>
              </div>
            </motion.div>
          )}

          {isThinking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex justify-start"
            >
              <div className="px-4 py-2 w-16 bg-white/40 backdrop-blur-md border border-white/50 rounded-full flex justify-center items-center gap-1 shadow-sm">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse delay-150"></div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </AnimatePresence>
      </div>

      {/* Bottom Dock */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center z-20 pb-safe">
        {!isActive ? (
          <button 
            onClick={startConversation}
            className="px-8 py-4 rounded-full bg-white/50 backdrop-blur-xl border border-white/40 text-slate-800 font-bold tracking-wider uppercase text-sm shadow-lg hover:scale-105 transition-transform flex items-center gap-3"
          >
            <Mic size={20} />
            Tap to Speak
          </button>
        ) : (
          <div className="bg-white/50 backdrop-blur-xl border border-white/40 rounded-full px-8 py-4 flex items-center gap-8 shadow-2xl">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-sm ${isMuted ? 'bg-slate-700 text-white' : 'bg-white/80 text-slate-800 hover:bg-white'}`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            
            <button 
              onClick={handleEndCall}
              className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-600 active:scale-90 transition-all"
            >
              <PhoneOff size={28} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
