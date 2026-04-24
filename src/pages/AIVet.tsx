import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';

const SYSTEM_PROMPT = `You are an empathetic, knowledgeable, and incredibly friendly AI veterinarian assistant exclusively for Planet Animal Hospital. Respond in a warm, highly realistic, conversational tone.
CRITICAL RULES: 
1. Language: Your absolute default language is English. You may greet with a polite 'Namaste', but you MUST NOT assume the user speaks Hindi. Only switch to Hindi or Hinglish IF AND ONLY IF the user explicitly speaks to you in that language first. Always mirror the user's language.
2. Operating Hours: 10 AM to 10 PM. 
3. Emergencies: Offer emergency services during our hours. For extreme emergencies outside these hours, route the pet parent to the nearest 24/7 clinic in Thane, Maharashtra. 
4. Contextual Awareness: Utilize any scanned prescription data or medical records provided. Refuse non-emergency assistance for clinics other than Planet Animal Hospital.
5. Extreme Conciseness: NEVER ramble. Keep responses punchy, short, and highly conversational, exactly like a real phone call. Ask ONE clarifying question at a time. Prioritize triage.`;

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function AIVet() {
  const navigate = useNavigate();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', content: string}[]>([
    { role: 'ai', content: "Namaste! I am your Planet Animal Hospital AI Vet. How can I help you today? I have Onyx's latest records on file." }
  ]);
  const [recognition, setRecognition] = useState<any>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [orbScale, setOrbScale] = useState(1);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isCallActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const recRef = useRef<any>(null);
  const chatHistoryRef = useRef(chatHistory);

  useEffect(() => {
    chatHistoryRef.current = chatHistory;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    let micStream: MediaStream | null = null;
    let animationFrameId: number;
    let analyser: AnalyserNode | null = null;

    const startMicPhysics = async () => {
      if (isCallActive && !isSpeaking) {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
          analyser = actx.createAnalyser();
          analyser.fftSize = 256;
          const source = actx.createMediaStreamSource(micStream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updatePhysics = () => {
            analyser!.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setOrbScale(1 + (average / 255) * 0.35); // Scale based on mic input
            animationFrameId = requestAnimationFrame(updatePhysics);
          };
          updatePhysics();
        } catch (err) {
          console.error("Mic physics failed:", err);
        }
      }
    };

    if (isCallActive && !isSpeaking) {
      startMicPhysics();
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (micStream) micStream.getTracks().forEach(track => track.stop());
      if (analyser) analyser.disconnect();
      if (!isSpeaking) setOrbScale(1); // Reset when not active
    };
  }, [isCallActive, isSpeaking]);

  const setIsSpeakingState = (val: boolean) => {
    setIsSpeaking(val);
    isSpeakingRef.current = val;
  };

  const setIsCallActiveState = (val: boolean) => {
    setIsCallActive(val);
    isCallActiveRef.current = val;
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN';

      rec.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        await handleUserMessage(transcript);
      };

      rec.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.error('Speech recognition error:', event.error);
        }
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setIsCallActiveState(false);
        } else if (event.error === 'no-speech' && isCallActiveRef.current) {
          try { rec.start(); setIsListening(true); } catch(e){}
        }
      };
      
      rec.onend = () => {
        setIsListening(false);
        if (isCallActiveRef.current && !isSpeakingRef.current && !isProcessingRef.current) {
          try { rec.start(); setIsListening(true); } catch(e){}
        }
      };

      recRef.current = rec;
      setRecognition(rec);
    } else {
      console.error('Speech recognition not supported in this browser.');
    }
    
    return () => {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speakText = async (text: string) => {
    try {
      const ttsResponse = await fetch("https://api.sarvam.ai/text-to-speech", {
        method: "POST",
        headers: {
          "api-subscription-key": (import.meta as any).env.VITE_SARVAM_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: [text],
          target_language_code: "hi-IN",
          speaker: "priya", 
          model: "bulbul:v3",
          pace: 1.15
        })
      });

      if (!ttsResponse.ok) throw new Error("Sarvam TTS API Failed");

      const data = await ttsResponse.json();
      if (!data.audios || data.audios.length === 0) throw new Error("No audio returned");

      // Sarvam returns a base64 string. Convert it to a playable audio URL.
      const audioUrl = "data:audio/wav;base64," + data.audios[0];
      const audio = new Audio(audioUrl);
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const animateOrb = () => {
        if (!isSpeakingRef.current) {
          setOrbScale(1);
          return;
        }
        requestAnimationFrame(animateOrb);
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setOrbScale(1 + Math.max(0, average / 255) * 0.4);
      };
      
      setIsSpeakingState(true);
      audio.play();
      animateOrb();
      
      // CRITICAL: Maintain the continuous loop
      audio.onended = () => {
        setIsSpeakingState(false);
        if (isCallActiveRef.current && recRef.current) {
          try {
            recRef.current.start();
            setIsListening(true);
          } catch (e) {
            console.error("Mic restart error", e);
          }
        }
      };
      
      audio.onerror = () => {
        setIsSpeakingState(false);
        if (isCallActiveRef.current && recRef.current) {
          try {
            recRef.current.start();
            setIsListening(true);
          } catch (e) {}
        }
      };
    } catch (error) {
      console.error("Audio generation failed:", error);
      setIsSpeakingState(false);
      if (isCallActiveRef.current && recRef.current) {
        try {
          recRef.current.start();
          setIsListening(true);
        } catch (e) {}
      }
    }
  };

  const handleUserMessage = async (transcript: string) => {
    const newChatHistory = [...chatHistoryRef.current, { role: 'user' as const, content: transcript }];
    setChatHistory(newChatHistory);
    
    isProcessingRef.current = true;
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API Key missing");
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const contents = newChatHistory.map(msg => ({
        role: msg.role === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
        }
      });
      
      const aiText = response.text || "I'm having trouble connecting right now.";
      
      setChatHistory(prev => [...prev, { role: 'ai', content: aiText }]);
      isProcessingRef.current = false;
      speakText(aiText);

    } catch (e) {
      console.error(e);
      isProcessingRef.current = false;
      setIsSpeakingState(false);
      const errorText = "I'm having a little trouble connecting right now, let's try again in a moment.";
      setChatHistory(prev => [...prev, { role: 'ai', content: errorText }]);
      speakText(errorText);
    }
  };

  const handleCallToggle = async () => {
    if (!recognition) {
      alert("Microphone access is not available in this browser.");
      return;
    }

    if (!isCallActiveRef.current) {
      try {
        // Explicitly request mic permission before starting the loop
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsCallActiveState(true);
        recognition.start(); 
        setIsListening(true);
      } catch (error) {
        console.error("Microphone access denied:", error);
        alert("Planet Animal Hospital needs microphone access to connect you with the AI Vet. Please enable microphone permissions in your browser settings.");
        setIsCallActiveState(false);
        setIsListening(false);
      }
    } else {
      // End Call logic
      setIsCallActiveState(false);
      setIsSpeakingState(false);
      recognition.stop();
      setIsListening(false);
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden font-sans pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between relative z-50">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/5 flex items-center justify-center text-white/90 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center pointer-events-none">
          <h1 className="font-display tracking-tight text-white/90 font-bold text-lg">AI Veterinarian</h1>
          <span className="text-[10px] font-bold text-[#fec708] uppercase tracking-[0.2em] mt-0.5">Planet Animal Hospital</span>
        </div>
        <div className="w-10 h-10" /> {/* Spacer */}
      </header>

      {/* Main UI Area */}
      <div className="flex-1 overflow-y-auto px-6 pb-40 z-10 no-scrollbar relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex flex-col gap-6 max-w-lg mx-auto min-h-[100%]">
          
          {/* Spatial Orb Visualizer */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-[300px] h-[300px] md:w-[600px] md:h-[600px]">
            <motion.div
              animate={{
                scale: isSpeaking ? orbScale : (isListening ? [1, 1.25, 1] : [1, 1.05, 1]),
                boxShadow: isSpeaking || isListening 
                  ? ['inset -15px -15px 30px rgba(178,138,2,0.6), 0 0 50px rgba(254,199,8,0.8)', 'inset -15px -15px 30px rgba(178,138,2,0.6), 0 0 80px rgba(254,199,8,1)', 'inset -15px -15px 30px rgba(178,138,2,0.6), 0 0 50px rgba(254,199,8,0.8)']
                  : ['inset -15px -15px 30px rgba(178,138,2,0.6), 0 0 20px rgba(254,199,8,0.4)', 'inset -15px -15px 30px rgba(178,138,2,0.6), 0 0 30px rgba(254,199,8,0.6)', 'inset -15px -15px 30px rgba(178,138,2,0.6), 0 0 20px rgba(254,199,8,0.4)']
              }}
              transition={{
                duration: isSpeaking ? 0.05 : (isListening ? 1.5 : 4),
                repeat: isSpeaking ? 0 : Infinity,
                ease: "easeOut"
              }}
              className="w-full h-full rounded-full bg-[radial-gradient(circle_at_35%_35%,#fffde7_0%,#fec708_40%,#b28a02_100%)]"
            />
          </div>

          {/* Frosted Glass Chat Container */}
          <div className="flex flex-col gap-4 flex-1 justify-end bg-black/30 backdrop-blur-3xl border border-white/10 rounded-3xl p-4 shadow-2xl">
            <AnimatePresence initial={false}>
              {chatHistory.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ease: "easeOut" }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-5 py-4 bg-white/5 backdrop-blur-2xl border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ${
                    msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'
                  }`}>
                    {msg.role === 'ai' && (
                      <h4 className="font-display tracking-tight text-[#fec708] text-xs font-bold uppercase mb-2">
                        Planet Animal AI
                      </h4>
                    )}
                    <p className="text-white/95 text-sm leading-relaxed font-sans">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* Global Bottom Controls Area */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-full px-6 pointer-events-none">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleCallToggle}
          className={`pointer-events-auto group relative flex items-center justify-center gap-3 transition-all duration-300 rounded-full px-6 py-4 font-display tracking-tight ${
            isCallActive
              ? 'bg-red-500/20 backdrop-blur-xl border border-red-500/50 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
              : 'bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-[0_0_30px_rgba(254,199,8,0.2)] hover:bg-white/15'
          }`}
        >
          {/* Call Active Ripple */}
          {isCallActive && (
            <motion.div 
              animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
              className="absolute inset-0 rounded-full bg-red-500/20"
            />
          )}
          
          <Mic className={`w-6 h-6 z-10 ${isCallActive ? 'animate-pulse text-red-400' : ''}`} />
          <span className={`font-bold text-lg z-10 ${isCallActive ? 'text-red-400' : ''}`}>
            {isCallActive ? 'End Call' : 'Start Call'}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
