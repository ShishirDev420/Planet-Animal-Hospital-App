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

  // Refs for Audio and WebSocket
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const isMutedRef = useRef(isMuted);

  // Keep ref in sync with state for the audio processor closure
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const stopConversation = useCallback(() => {
    setIsActive(false);
    setVolume(0);
    
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
    }
    if (analyserRef.current) analyserRef.current.disconnect();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
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
            // Handle Emergency Keywords
            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.text) {
                const lowerText = part.text.toLowerCase();
                if (lowerText.includes('emergency') || lowerText.includes('toxic') || lowerText.includes('chocolate') || lowerText.includes('immediate')) {
                  setEmergency(true);
                }
              }
            }

            // Handle Audio Playback
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioCtxRef.current) {
              const int16Data = base64ToInt16Array(base64Audio);
              const float32Data = int16ToFloat32(int16Data);
              
              // Gemini Live API outputs audio at 24kHz. Setting the buffer to 24000 ensures 
              // the AudioContext resamples it correctly without dropping the pitch.
              const buffer = audioCtxRef.current.createBuffer(1, float32Data.length, 24000);
              buffer.getChannelData(0).set(float32Data);
              
              const sourceNode = audioCtxRef.current.createBufferSource();
              sourceNode.buffer = buffer;
              sourceNode.connect(audioCtxRef.current.destination);
              
              const startTime = Math.max(nextPlayTimeRef.current, audioCtxRef.current.currentTime);
              sourceNode.start(startTime);
              nextPlayTimeRef.current = startTime + buffer.duration;
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
              nextPlayTimeRef.current = audioCtxRef.current?.currentTime || 0;
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

  const orbScale = isActive ? 1 + (volume * 0.4) : 1;
  const orbGlow = isActive 
    ? `0 0 ${60 + volume * 100}px rgba(250,204,21,${0.4 + volume * 0.6}), inset 0 0 ${40 + volume * 60}px rgba(250,204,21,${0.3 + volume * 0.5})` 
    : '0 0 0px rgba(250,204,21,0)';

  return (
    <div className="flex flex-col h-screen bg-slate-900 overflow-hidden relative">
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
      <div className="px-6 py-8 z-20 flex flex-col items-center justify-center mt-10">
        <h1 onClick={triggerMockEmergency} className="font-black text-white text-2xl tracking-tight cursor-pointer">AI Vet Doctor</h1>
        <p className="text-planet-yellow font-bold text-sm tracking-widest uppercase mt-1 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full bg-planet-yellow ${isActive ? 'animate-pulse' : ''}`}></span>
          {isActive ? 'Listening...' : 'Ready'}
        </p>
      </div>

      {/* Voice Orb */}
      <div className="flex-1 flex items-center justify-center relative z-10 pb-20">
        <motion.div
          animate={{
            scale: orbScale,
            boxShadow: orbGlow
          }}
          transition={{ type: "spring", stiffness: 800, damping: 25, mass: 0.5 }}
          className="relative w-56 h-56 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center overflow-hidden cursor-pointer"
          onClick={!isActive ? startConversation : undefined}
        >
          {/* Inner Core */}
          <motion.div 
            animate={{
              scale: isActive ? 0.8 + (volume * 0.6) : 0.8,
            }}
            transition={{ type: "spring", stiffness: 800, damping: 25, mass: 0.5 }}
            className="w-28 h-28 rounded-full bg-gradient-to-br from-planet-yellow to-orange-400 blur-md opacity-80"
          ></motion.div>
          
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center text-white font-bold tracking-wider uppercase text-sm">
              Tap to Speak
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Dock */}
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-12 left-0 right-0 flex justify-center z-20 pb-safe"
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-8 py-4 flex items-center gap-8 shadow-2xl">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-slate-700 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              
              <button 
                onClick={handleEndCall}
                className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:bg-red-600 active:scale-90 transition-all"
              >
                <PhoneOff size={28} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
