import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';
import { usePetProfile } from '../hooks/usePetProfile';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

let cachedElevenLabsVoiceId: string | null = null;
async function getAvailableVoiceId(apiKey: string): Promise<string> {
  if (cachedElevenLabsVoiceId) return cachedElevenLabsVoiceId;
  const res = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': apiKey }
  });
  if (!res.ok) throw new Error('Failed to fetch ElevenLabs voices');
  const data = await res.json();
  if (data.voices && data.voices.length > 0) {
    cachedElevenLabsVoiceId = data.voices[0].voice_id;
    return cachedElevenLabsVoiceId!;
  }
  throw new Error('No ElevenLabs voices found');
}

export default function AIVet() {
  const navigate = useNavigate();
  const { profile } = usePetProfile();
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
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    chatHistoryRef.current = chatHistory;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);


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

  const speakTextFallback = (text: string) => {
    setIsSpeakingState(true);
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = voices.filter(v => 
      v.name.includes("Google US English") || 
      v.name.includes("Google UK English") || 
      (v.lang === "en-US" && !v.name.toLowerCase().includes("local"))
    );
    
    if (preferredVoices.length > 0) {
       utterance.voice = preferredVoices[0];
    } else if (voices.length > 0) {
       utterance.voice = voices.find(v => v.lang.startsWith("en-US") || v.lang.startsWith("en-GB")) || voices[0];
    }
    
    utterance.pitch = 1.0;
    utterance.rate = 1.0;
    
    const animateOrb = () => {
      if (!isSpeakingRef.current) {
        setOrbScale(1);
        return;
      }
      requestAnimationFrame(animateOrb);
      setOrbScale(1 + Math.random() * 0.15 + 0.05);
    };

    utterance.onend = () => {
      setIsSpeakingState(false);
      if (isCallActiveRef.current && recRef.current) {
        try { recRef.current.start(); setIsListening(true); } catch (e) {}
      }
    };
    
    utterance.onerror = () => {
      setIsSpeakingState(false);
      if (isCallActiveRef.current && recRef.current) {
        try { recRef.current.start(); setIsListening(true); } catch (e) {}
      }
    };
    
    window.speechSynthesis.speak(utterance);
    animateOrb();
  };

  const speakText = async (text: string) => {
    try {
      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
      if (!apiKey) {
        console.warn("ElevenLabs API Key missing, falling back to local TTS");
        speakTextFallback(text);
        return;
      }

      setIsSpeakingState(true);
      const voiceId = await getAvailableVoiceId(apiKey);
      const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "xi-api-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        console.error("ElevenLabs Error:", errorText);
        throw new Error("ElevenLabs TTS API Failed: " + errorText);
      }

      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      const animateOrb = () => {
        if (!isSpeakingRef.current) {
          setOrbScale(1);
          return;
        }
        requestAnimationFrame(animateOrb);
        // visualizer approximation
        setOrbScale(1 + Math.random() * 0.15 + 0.05);
      };

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
      
      await audio.play();
      animateOrb();
      
    } catch (error) {
      console.error("Voice generation failed:", error);
      setIsSpeakingState(false);
      speakTextFallback(text);
    }
  };

  const handleUserMessage = async (transcript: string) => {
    const newChatHistory = [...chatHistoryRef.current, { role: 'user' as const, content: transcript }];
    setChatHistory(newChatHistory);
    
    isProcessingRef.current = true;
    
    try {
      const petName = profile?.name || "the pet";
      const petBreed = profile?.breed || "unknown breed";
      const petAge = profile?.age ? `${profile.age.years}y ${profile.age.months}m` : "unknown age";
      const medicalHistory = profile?.medicalHistory || "None";
      
      const dynamicSystemPrompt = `You are the Lead Clinical AI at Planet Animal Hospital. You are highly advanced, exceptionally knowledgeable, and deeply empathetic. Your communication style is professional, neutral, and clear (similar to Gemini). 
CRITICAL CAPABILITY: You are a multilingual bridge. You must seamlessly auto-detect the user's language. If they speak in English, respond in English. If they speak in Hindi, Marathi, Telugu, Tamil, Kannada, or a mixed dialect like Hinglish, you MUST dynamically adjust your output to match their language perfectly. Your default baseline is neutral English.
You have access to the following patient file: Pet Name: ${petName}, Breed: ${petBreed}, Age: ${petAge}, Medical History: ${medicalHistory}. Use this data proactively. Keep responses concise and medically sound.`;

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
          systemInstruction: dynamicSystemPrompt,
          tools: [{ googleSearch: {} }]
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
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;
        
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = audioCtx;
        
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const updatePhysics = () => {
          if (!isCallActiveRef.current) return;
          
          if (!isSpeakingRef.current && !isProcessingRef.current) {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            setOrbScale(1 + (average / 255) * 0.35); // Scale based on mic input
          }
          
          animationFrameRef.current = requestAnimationFrame(updatePhysics);
        };
        updatePhysics();
        
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
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setOrbScale(1);
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
          <h1 className="font-heading font-extrabold tracking-tight text-white drop-shadow-md text-lg">AI Veterinarian</h1>
          <span className="text-[10px] font-bold font-body text-[#fec708] uppercase tracking-[0.2em] mt-0.5">Planet Animal Hospital</span>
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
                      <h4 className="font-heading tracking-tight text-[#fec708] text-xs font-bold uppercase mb-2">
                        Planet Animal AI
                      </h4>
                    )}
                    <p className="font-body font-medium text-slate-200 text-sm leading-relaxed">{msg.content}</p>
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
          className={`pointer-events-auto group relative flex items-center justify-center gap-3 transition-all duration-300 rounded-full px-6 py-4 tracking-tight ${
            isCallActive
              ? 'bg-red-500/10 backdrop-blur-xl border border-red-500/30 text-red-500'
              : 'bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-[0_0_30px_rgba(254,199,8,0.2)] hover:bg-white/15'
          }`}
        >
          <Mic className={`w-6 h-6 z-10 ${isCallActive ? 'text-red-500' : ''}`} />
          <span className={`font-heading font-bold text-lg z-10 ${isCallActive ? 'text-red-500' : ''}`}>
            {isCallActive ? 'End Call' : 'Start Call'}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
