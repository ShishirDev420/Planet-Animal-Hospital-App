import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { usePetProfile } from '../hooks/usePetProfile';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Sarvam AI STT — supports Indian languages + English
const SARVAM_LANGUAGES = ['hi-IN', 'ta-IN', 'te-IN', 'kn-IN', 'ml-IN', 'bn-IN', 'en-IN'];

async function transcribeWithSarvam(audioBlob: Blob): Promise<string> {
  const apiKey = import.meta.env.VITE_SARVAM_API_KEY || 'sk_is9hzfwk_EuLpgNMcBQ7XC9LzKhfcYsHl';
  const wavBlob = new Blob([audioBlob], { type: 'audio/wav' });
  const res = await fetch('https://api.sarvam.ai/v1/speech-to-text', {
    method: 'POST',
    headers: { 'API-Key': apiKey, 'Content-Type': 'audio/wav' },
    body: wavBlob,
  });
  if (!res.ok) throw new Error(`Sarvam STT error: ${res.status}`);
  const data = await res.json();
  const transcript = data.transcript || data.text || '';
  if (!transcript.trim()) throw new Error('Empty transcript');
  return transcript;
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
    { role: 'ai', content: "Namaste! I am your Planet Animal Hospital AI Vet. How can I help you today? I have your pet's latest records on file." }
  ]);
  const [recognition, setRecognition] = useState<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [volume, setVolume] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const isCallActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const recRef = useRef<any>(null);
  const chatHistoryRef = useRef(chatHistory);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number>(0);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const smoothedVolumeRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const stopAllActivity = () => {
    setIsCallActiveState(false);
    setIsSpeakingState(false);
    setIsListening(false);
    isProcessingRef.current = false;
    setVolume(0);
    smoothedVolumeRef.current = 0;

    if (recRef.current) {
      try {
        recRef.current.onresult = null;
        recRef.current.onend = null;
        recRef.current.onerror = null;
        recRef.current.stop();
        recRef.current.abort();
      } catch(e){}
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
      window.speechSynthesis.cancel();
    }

    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = "";
        currentAudioRef.current.load();
        currentAudioRef.current = null;
      } catch(e){}
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      micStreamRef.current = null;
    }

    if (audioCtxRef.current) {
      try {
        if (audioCtxRef.current.state !== 'closed') {
          audioCtxRef.current.close();
        }
      } catch(e) {}
      audioCtxRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  // Sarvam STT: record audio chunk → POST → transcribe
  const startSarvamListening = () => {
    if (!micStreamRef.current || !isCallActiveRef.current || isSpeakingRef.current) return;
    try {
      audioChunksRef.current = [];
      const mr = new MediaRecorder(micStreamRef.current, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };

      mr.onstop = async () => {
        if (!isCallActiveRef.current || isProcessingRef.current) return;
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        setIsListening(false);
        if (blob.size < 5000) {
          // Too short — restart listening
          if (isCallActiveRef.current && !isSpeakingRef.current) startSarvamListening();
          return;
        }
        try {
          const transcript = await transcribeWithSarvam(blob);
          await handleUserMessage(transcript);
        } catch {
          // Fallback to Web Speech API
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (SpeechRecognition && isCallActiveRef.current) {
            const rec = new SpeechRecognition();
            rec.lang = 'en-IN';
            rec.onresult = async (event: any) => {
              const t = event.results[0][0].transcript;
              setIsListening(false);
              await handleUserMessage(t);
            };
            rec.onerror = () => { setIsListening(false); };
            rec.onend = () => {
              if (isCallActiveRef.current && !isSpeakingRef.current && !isProcessingRef.current)
                startSarvamListening();
            };
            try { setIsListening(true); rec.start(); } catch(e) {}
          } else if (isCallActiveRef.current && !isSpeakingRef.current) {
            startSarvamListening();
          }
        }
      };

      // Record for 4 seconds then process
      mr.start();
      setIsListening(true);
      setTimeout(() => {
        if (mr.state === 'recording') mr.stop();
      }, 4000);
    } catch (e) {
      console.error('MediaRecorder error:', e);
      // Fallback: use Web Speech API
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-IN';
        rec.onresult = async (event: any) => {
          if (!isCallActiveRef.current || isProcessingRef.current) return;
          const t = event.results[0][0].transcript;
          setIsListening(false);
          await handleUserMessage(t);
        };
        rec.onerror = (event: any) => {
          if (event.error === 'aborted') return;
          setIsListening(false);
          if (event.error === 'no-speech' && isCallActiveRef.current)
            try { rec.start(); setIsListening(true); } catch(e2){}
        };
        rec.onend = () => {
          setIsListening(false);
          if (isCallActiveRef.current && !isSpeakingRef.current && !isProcessingRef.current)
            try { rec.start(); setIsListening(true); } catch(e2){}
        };
        recRef.current = rec;
        setRecognition(rec);
        try { rec.start(); setIsListening(true); } catch(e2){}
      }
    }
  };

  useEffect(() => {
    // Pre-initialise Web Speech as last-resort fallback
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN';
      recRef.current = rec;
      setRecognition(rec);
    }
    return () => { stopAllActivity(); };
  }, []);

  const speakTextFallback = (text: string) => {
    if (!isCallActiveRef.current) return;
    setIsSpeakingState(true);
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => v.name.includes("Google US English") || (v.lang === "en-US"));
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => {
      setIsSpeakingState(false);
      setVolume(0);
      if (isCallActiveRef.current) startSarvamListening();
    };
    utterance.onerror = () => {
      setIsSpeakingState(false);
      setVolume(0);
    };
    window.speechSynthesis.speak(utterance);
  };

  const speakText = async (text: string) => {
    try {
      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
      if (!apiKey) { speakTextFallback(text); return; }

      setIsSpeakingState(true);
      const voiceId = await getAvailableVoiceId(apiKey);
      const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: { "Accept": "audio/mpeg", "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
      });

      if (!ttsResponse.ok) throw new Error("ElevenLabs TTS failed");
      if (!isCallActiveRef.current) { setIsSpeakingState(false); return; }

      const audioBlob = await ttsResponse.blob();
      if (!isCallActiveRef.current) return;

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      const animateSpeak = () => {
        if (!isSpeakingRef.current) { setVolume(0); return; }
        const raw = Math.random();
        smoothedVolumeRef.current = smoothedVolumeRef.current * 0.85 + raw * 0.15;
        setVolume(smoothedVolumeRef.current);
        animationFrameRef.current = requestAnimationFrame(animateSpeak);
      };

      audio.onended = () => {
        currentAudioRef.current = null;
        setIsSpeakingState(false);
        setVolume(0);
        if (isCallActiveRef.current) startSarvamListening();
      };
      audio.onerror = () => {
        currentAudioRef.current = null;
        setIsSpeakingState(false);
        setVolume(0);
      };

      if (!isCallActiveRef.current) { audio.pause(); audio.src = ""; setIsSpeakingState(false); return; }

      await audio.play();
      animateSpeak();
    } catch (error) {
      if (!isCallActiveRef.current) return;
      setIsSpeakingState(false);
      speakTextFallback(text);
    }
  };

  const handleUserMessage = async (transcript: string) => {
    if (!isCallActiveRef.current) return;
    const newChatHistory = [...chatHistoryRef.current, { role: 'user' as const, content: transcript }];
    setChatHistory(newChatHistory);
    isProcessingRef.current = true;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const petName = profile?.petName || "the pet";
      const parentName = profile?.parentName || "a pet parent";
      const petType = profile?.petType || "pet";
      const petBreed = profile?.breed || "unknown breed";
      const petAge = profile?.age || "unknown age";
      const petGender = profile?.gender || "unknown gender";
      const petWeight = profile?.weight || "unknown weight";
      const medicalHistory = profile?.additionalDetails || "None provided";

      const systemPrompt = `You are the Lead Clinical AI at Planet Animal Hospital, a prestigious veterinary facility with 20 years of excellence. 

You are currently in a consultation with ${parentName} regarding their ${petType}, ${petName}.

PET PROFILE:
- Name: ${petName}
- Species: ${petType}
- Breed: ${petBreed}
- Age: ${petAge}
- Gender: ${petGender}
- Weight: ${petWeight}
- Medical/Surgical History & Notes: ${medicalHistory}

YOUR ROLE:
1. Provide professional, empathetic, and personalized veterinary guidance.
2. Use the pet's specific details to tailor your advice (e.g., breed-specific health predispositions, age-appropriate care).
3. Maintain a prestigious, expert tone.
4. If the user mentions bugs or technical issues with the app, politely redirect them to technical support.
5. Keep your spoken responses concise and conversational (max 2-3 sentences per turn), as they are being read aloud.
6. ALWAYS prioritize the safety and well-being of the pet. If a situation sounds like an emergency, advise immediate physical clinical intervention at Planet Animal Hospital.

Namaste and welcome to the future of pet care.`;

      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      
      if (!geminiApiKey && !groqApiKey) throw new Error("No AI API Key missing");

      let aiText = "";

      if (geminiApiKey) {
        const ai = new GoogleGenerativeAI(geminiApiKey);
        const contents = newChatHistory.map(msg => ({
          role: msg.role === 'ai' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        }));

        const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
        const response = await model.generateContent({
          contents,
          systemInstruction: systemPrompt,
          generationConfig: { maxOutputTokens: 200, temperature: 0.7 }
        });
        aiText = response.response.text();
      } else {
        // Fallback to Groq if Gemini key is missing
        const messages = [
          { role: 'system', content: systemPrompt },
          ...newChatHistory.map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : 'user',
            content: msg.content
          }))
        ];

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqApiKey}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: messages,
            max_tokens: 200,
            temperature: 0.7
          })
        });

        if (!res.ok) throw new Error("Groq API error");
        const data = await res.json();
        aiText = data.choices[0].message.content;
      }

      if (!isCallActiveRef.current) return;

      setChatHistory(prev => [...prev, { role: 'ai', content: aiText }]);
      isProcessingRef.current = false;

      if (isCallActiveRef.current) speakText(aiText);
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      isProcessingRef.current = false;
      setIsSpeakingState(false);
      if (isCallActiveRef.current) {
        const errorText = "I'm having a little trouble connecting right now, let's try again in a moment.";
        setChatHistory(prev => [...prev, { role: 'ai', content: errorText }]);
        speakText(errorText);
      }
    }
  };

  const handleCallToggle = async () => {
    if (!recognition) { alert("Microphone access is not available in this browser."); return; }

    if (!isCallActiveRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateViz = () => {
          if (!isCallActiveRef.current) return;
          if (!isSpeakingRef.current && !isProcessingRef.current) {
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
            smoothedVolumeRef.current = smoothedVolumeRef.current * 0.85 + (avg / 255) * 0.15;
            setVolume(smoothedVolumeRef.current);
          }
          animationFrameRef.current = requestAnimationFrame(updateViz);
        };
        updateViz();

        setIsCallActiveState(true);
        // Use Sarvam STT as primary; startSarvamListening handles Web Speech fallback
        setTimeout(() => startSarvamListening(), 100);
      } catch (error) {
        alert("Planet Animal Hospital needs microphone access to connect you with the AI Vet.");
        setIsCallActiveState(false);
        setIsListening(false);
      }
    } else {
      stopAllActivity();
    }
  };

  // Derived visualizer values
  const innerScale = 1 + volume * 0.35;
  const middleScale = 1 + volume * 0.55;
  const outerOpacity = volume > 0.05 ? 0.3 + volume * 0.5 : 0.15;
  const isActive = isSpeaking || isListening;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden font-sans pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] bg-[#0d0d0d]">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#fec708]/5 rounded-full blur-[100px]" />
        <div className="noise-overlay" />
      </div>

      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between relative z-50">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:bg-white/20 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center pointer-events-none">
          <h1 className="font-heading font-extrabold tracking-tight text-white text-lg">AI Veterinarian</h1>
          <span className="text-[10px] font-bold font-body text-[#fec708] uppercase tracking-[0.2em] mt-0.5">Planet Animal Hospital</span>
        </div>
        <div className="w-10 h-10" />
      </header>

      {/* Neural Liquid Visualizer */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 flex items-center justify-center w-[340px] h-[340px] md:w-[500px] md:h-[500px]">
        {/* Outer glow ring - expands on activity */}
        <motion.div
          animate={{
            scale: isActive ? [1, 1.15, 1] : 1,
            opacity: outerOpacity,
          }}
          transition={{ duration: 2, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full border border-[#fec708]/30"
          style={{ boxShadow: `0 0 ${40 + volume * 80}px rgba(254,199,8,${0.1 + volume * 0.3})` }}
        />

        {/* Expanding pulse rings when active */}
        <AnimatePresence>
          {isActive && [0, 0.5, 1].map((delay) => (
            <motion.div
              key={delay}
              initial={{ scale: 0.6, opacity: 0.5 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 2.5, repeat: Infinity, delay, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border border-[#fec708]/20"
            />
          ))}
        </AnimatePresence>

        {/* Middle layer - slow pulse */}
        <motion.div
          animate={{
            scale: middleScale,
            opacity: isActive ? 0.5 : 0.25,
          }}
          transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
          className="absolute w-[65%] h-[65%] rounded-full"
          style={{
            background: "radial-gradient(circle at 40% 40%, rgba(254,199,8,0.25), rgba(178,138,2,0.1) 60%, transparent)",
            boxShadow: `0 0 ${30 + volume * 60}px rgba(254,199,8,0.15)`,
          }}
        />

        {/* Inner core - highly reactive */}
        <motion.div
          animate={{
            scale: innerScale,
            boxShadow: isActive
              ? [
                  `inset -15px -15px 30px rgba(178,138,2,0.7), 0 0 ${40 + volume * 60}px rgba(254,199,8,0.9)`,
                  `inset -15px -15px 30px rgba(178,138,2,0.7), 0 0 ${60 + volume * 80}px rgba(254,199,8,1)`,
                  `inset -15px -15px 30px rgba(178,138,2,0.7), 0 0 ${40 + volume * 60}px rgba(254,199,8,0.9)`,
                ]
              : `inset -15px -15px 30px rgba(178,138,2,0.6), 0 0 20px rgba(254,199,8,0.4)`,
          }}
          transition={{
            scale: { type: "tween", ease: "easeOut", duration: 0.15 },
            boxShadow: isActive ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.5 },
          }}
          className="w-[45%] h-[45%] rounded-full"
          style={{
            background: "radial-gradient(circle at 35% 35%, #fffde7 0%, #fec708 40%, #b28a02 100%)",
          }}
        />
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 pb-40 z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex flex-col gap-4 max-w-lg md:max-w-3xl mx-auto min-h-full justify-end">
          <div className="flex flex-col gap-4 flex-1 justify-end bg-black/30 backdrop-blur-3xl border border-white/8 rounded-3xl p-4 shadow-2xl">
            <AnimatePresence initial={false}>
              {chatHistory.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ease: "easeOut" }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-5 py-4 backdrop-blur-2xl border shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] ${
                    msg.role === 'user'
                      ? 'bg-[#fec708]/10 border-[#fec708]/20 rounded-br-sm'
                      : 'bg-white/5 border-white/10 rounded-bl-sm'
                  }`}>
                    {msg.role === 'ai' && (
                      <h4 className="font-heading tracking-tight text-[#fec708] text-xs font-bold uppercase mb-2">Planet Animal AI</h4>
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

      {/* Status label */}
      <AnimatePresence>
        {isCallActive && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40 text-center pointer-events-none"
          >
            <span className="text-xs font-body font-semibold tracking-widest uppercase text-white/50">
              {isSpeaking ? "AI Speaking…" : isListening ? "Listening…" : "Processing…"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call Toggle Button */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <motion.button
          whileTap={{ scale: 0.93 }}
          onClick={handleCallToggle}
          className={`pointer-events-auto relative flex items-center justify-center gap-3 transition-all duration-300 rounded-full px-8 py-4 ${
            isCallActive
              ? 'bg-red-500/10 backdrop-blur-xl border border-red-500/30 text-red-400'
              : 'bg-white/8 backdrop-blur-xl border border-white/15 text-white shadow-[0_0_30px_rgba(254,199,8,0.15)] hover:bg-white/15'
          }`}
        >
          <Mic className={`w-5 h-5 ${isCallActive ? 'text-red-400' : ''}`} />
          <span className="font-heading font-bold text-base">
            {isCallActive ? 'End Call' : 'Start Call'}
          </span>
          {isCallActive && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
            />
          )}
        </motion.button>
      </div>
    </div>
  );
}
