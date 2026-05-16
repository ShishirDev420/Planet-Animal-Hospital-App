import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic, Camera, Settings, AlertCircle, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { usePetProfile } from '../hooks/usePetProfile';
import { useAPIKeys } from '../hooks/useAPIKeys';
import { buildKnowledgeContext } from '../lib/vet-knowledge';
import PrescriptionScanner from '../components/PrescriptionScanner';
import APISettings from '../components/APISettings';
import Logo from '../components/Logo';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const SARVAM_LANGUAGES = ['hi-IN', 'ta-IN', 'te-IN', 'kn-IN', 'ml-IN', 'bn-IN', 'en-IN'];

const FREE_TIER_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

async function transcribeWithSarvam(audioBlob: Blob, apiKey: string): Promise<string> {
  const formData = new FormData();
  const fileToUpload = new Blob([audioBlob], { type: 'audio/wav' });
  formData.append('file', fileToUpload, 'audio.wav');
  formData.append('model', 'saaras:v3');
  formData.append('mode', 'transcribe');
  formData.append('language_code', 'en-IN');

  const res = await fetch('https://api.sarvam.ai/v1/speech-to-text', {
    method: 'POST',
    headers: { 'api-subscription-key': apiKey },
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Sarvam STT API Error:', res.status, errorText);
    throw new Error(`Sarvam STT error: ${res.status}`);
  }

  const data = await res.json();
  const transcript = data.transcript || '';

  if (!transcript.trim()) {
    throw new Error('Empty transcript');
  }

  return transcript;
}

export default function AIVet() {
  const navigate = useNavigate();
  const { profile } = usePetProfile();
  const { keys, status, hasAnyLLMKey, consumeFreeTier, freeTierCount, freeTierLimit } = useAPIKeys();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', content: string}[]>([
    { role: 'ai', content: `Namaste! I'm Sankpawl, your primary veterinarian here at Planet Animal Hospital. I've been looking over ${profile?.petName || 'your pet'}'s health records. How is ${profile?.petName || 'your pet'} feeling today? Please share whatever is on your mind—I'm here as your friend and partner in ${profile?.petName || 'their'} care.` }
  ]);
  const [showScanner, setShowScanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [volume, setVolume] = useState(0);
  const [currentProvider, setCurrentProvider] = useState<string>('');
  const [streamingText, setStreamingText] = useState('');
  const [freeTierExhausted, setFreeTierExhausted] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const isCallActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isProcessingRef = useRef(false);
  const recRef = useRef<any>(null);
  const chatHistoryRef = useRef(chatHistory);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const smoothedVolumeRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vadAnalyserRef = useRef<AnalyserNode | null>(null);
  const lastVoiceActivityRef = useRef<number>(0);

  useEffect(() => {
    chatHistoryRef.current = chatHistory;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, [chatHistory]);

  useEffect(() => {
    if (freeTierCount >= freeTierLimit && !keys.gemini && !keys.openai) {
      setFreeTierExhausted(true);
    }
  }, [freeTierCount, freeTierLimit, keys.gemini, keys.openai]);

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
    setVolume(0);
    smoothedVolumeRef.current = 0;
    setIsProcessing(false);
    setStreamingText('');

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

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

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch(e){}
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    if (audioCtxRef.current) {
      try {
        if (audioCtxRef.current.state !== 'closed') audioCtxRef.current.close();
      } catch(e) {}
      audioCtxRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
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

  const detectSilence = useCallback((analyser: AnalyserNode, threshold: number = 30) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

    if (avg > threshold) {
      lastVoiceActivityRef.current = Date.now();
    }

    const timeSinceVoice = Date.now() - lastVoiceActivityRef.current;
    return timeSinceVoice > 1500;
  }, []);

  const startVADListening = useCallback(() => {
    if (!micStreamRef.current || !isCallActiveRef.current || isSpeakingRef.current) return;

    const audioCtx = audioCtxRef.current;
    if (!audioCtx) return;

    if (!vadAnalyserRef.current) {
      const vadAnalyser = audioCtx.createAnalyser();
      vadAnalyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(micStreamRef.current);
      source.connect(vadAnalyser);
      vadAnalyserRef.current = vadAnalyser;
    }

    const analyser = vadAnalyserRef.current;
    audioChunksRef.current = [];
    lastVoiceActivityRef.current = Date.now();

    const mr = new MediaRecorder(micStreamRef.current, { mimeType: 'audio/webm' });
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };

    mr.onstop = async () => {
      if (!isCallActiveRef.current || isProcessingRef.current) return;
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      audioChunksRef.current = [];
      setIsListening(false);

      if (blob.size < 5000) {
        if (isCallActiveRef.current && !isSpeakingRef.current) startVADListening();
        return;
      }

      try {
        let transcript = '';
        if (keys.sarvam) {
          transcript = await transcribeWithSarvam(blob, keys.sarvam);
        } else {
          throw new Error('No Sarvam key');
        }
        setIsProcessing(true);
        await handleUserMessage(transcript);
      } catch {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition && isCallActiveRef.current) {
          const rec = new SpeechRecognition();
          rec.lang = 'en-IN';
          rec.onresult = async (event: any) => {
            const t = event.results[0][0].transcript;
            setIsListening(false);
            setIsProcessing(true);
            await handleUserMessage(t);
          };
          rec.onerror = () => { setIsListening(false); };
          rec.onend = () => {
            if (isCallActiveRef.current && !isSpeakingRef.current && !isProcessingRef.current)
              startVADListening();
          };
          try { setIsListening(true); rec.start(); } catch(e) {}
        } else if (isCallActiveRef.current && !isSpeakingRef.current) {
          startVADListening();
        }
      }
    };

    mr.start();
    setIsListening(true);

    const checkSilence = () => {
      if (!isCallActiveRef.current || mr.state !== 'recording') return;
      if (detectSilence(analyser)) {
        mr.stop();
        return;
      }
      setTimeout(checkSilence, 200);
    };
    setTimeout(checkSilence, 1000);

    const maxTimeout = setTimeout(() => {
      if (mr.state === 'recording') mr.stop();
    }, 10000);
    (mr as any)._maxTimeout = maxTimeout;
  }, [keys.sarvam, detectSilence]);

  const speakTextFallback = (text: string) => {
    if (!isCallActiveRef.current) return;
    setIsSpeakingState(true);

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferred = ['Google UK English Male', 'Microsoft Ravi', 'en-IN', 'en-GB', 'en-US'];
    for (const pref of preferred) {
      const voice = voices.find(v => v.name.toLowerCase().includes(pref.toLowerCase()) || v.lang.toLowerCase().startsWith(pref.toLowerCase().substring(0, 2)));
      if (voice) { utterance.voice = voice; break; }
    }

    utterance.pitch = 0.85;
    utterance.rate = 0.95;
    utterance.volume = 1.0;

    utterance.onend = () => {
      setIsSpeakingState(false);
      setVolume(0);
      if (isCallActiveRef.current) startVADListening();
    };
    utterance.onerror = () => {
      setIsSpeakingState(false);
      setVolume(0);
      if (isCallActiveRef.current) startVADListening();
    };

    window.speechSynthesis.speak(utterance);
  };

  const playAudioFromBlob = async (audioBlob: Blob) => {
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
      if (isCallActiveRef.current) startVADListening();
    };
    audio.onerror = () => {
      currentAudioRef.current = null;
      setIsSpeakingState(false);
      setVolume(0);
      if (isCallActiveRef.current) startVADListening();
    };

    await audio.play();
    animateSpeak();
  };

  const speakTextSarvam = async (text: string): Promise<boolean> => {
    if (!keys.sarvam) return false;
    try {
      const ttsResponse = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'api-subscription-key': keys.sarvam,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: [text],
          target_language_code: 'en-IN',
          model: 'bulbul:v3',
          speaker: 'shubh',
          speech_sample_rate: 24000
        })
      });

      if (!ttsResponse.ok) return false;
      const ttsData = await ttsResponse.json();
      if (!ttsData.audios || ttsData.audios.length === 0) return false;

      const audioBase64 = ttsData.audios[0];
      const audioByteArray = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
      const audioBlob = new Blob([audioByteArray], { type: 'audio/wav' });
      await playAudioFromBlob(audioBlob);
      return true;
    } catch {
      return false;
    }
  };

  const speakTextElevenLabs = async (text: string): Promise<boolean> => {
    if (!keys.elevenlabs) return false;
    try {
      const ttsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB', {
        method: 'POST',
        headers: {
          'xi-api-key': keys.elevenlabs,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        })
      });

      if (!ttsResponse.ok) return false;
      const audioBlob = await ttsResponse.blob();
      await playAudioFromBlob(audioBlob);
      return true;
    } catch {
      return false;
    }
  };

  const speakText = async (text: string) => {
    try {
      setIsSpeakingState(true);
      const sarvamSuccess = await speakTextSarvam(text);
      if (sarvamSuccess) return;
      const elevenLabsSuccess = await speakTextElevenLabs(text);
      if (elevenLabsSuccess) return;
      speakTextFallback(text);
    } catch {
      if (!isCallActiveRef.current) return;
      setIsSpeakingState(false);
      speakTextFallback(text);
    }
  };

  const speakTextStreaming = async (textStream: AsyncIterable<string>) => {
    let fullText = '';
    let sentenceBuffer = '';

    for await (const chunk of textStream) {
      if (!isCallActiveRef.current) return;
      fullText += chunk;
      sentenceBuffer += chunk;

      const sentenceEnd = sentenceBuffer.search(/[.!?]+\s/);
      if (sentenceEnd !== -1) {
        const sentence = sentenceBuffer.substring(0, sentenceEnd + 1).trim();
        sentenceBuffer = sentenceBuffer.substring(sentenceEnd + 1);
        if (sentence.length > 5) {
          setStreamingText(fullText);
          await speakText(sentence);
          if (!isCallActiveRef.current) return;
        }
      } else {
        setStreamingText(fullText);
      }
    }

    if (sentenceBuffer.trim().length > 5 && isCallActiveRef.current) {
      setStreamingText(fullText);
      await speakText(sentenceBuffer.trim());
    }

    setStreamingText('');
    return fullText;
  };

  const getActiveLLMKey = (): { provider: 'gemini' | 'openai' | 'free' | null; key: string } => {
    if (keys.gemini) return { provider: 'gemini', key: keys.gemini };
    if (keys.openai) return { provider: 'openai', key: keys.openai };
    if (FREE_TIER_GEMINI_KEY && consumeFreeTier()) return { provider: 'free', key: FREE_TIER_GEMINI_KEY };
    return { provider: null, key: '' };
  };

  const handleUserMessage = async (transcript: string) => {
    if (!isCallActiveRef.current) return;
    const newChatHistory = [...chatHistoryRef.current, { role: 'user' as const, content: transcript }];
    setChatHistory(newChatHistory);
    isProcessingRef.current = true;
    setIsProcessing(true);
    setStreamingText('');

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

      const knowledgeContext = buildKnowledgeContext(petType, petBreed, transcript);

      const systemPrompt = `You are Sankpawl, the Primary AI Veterinarian at Planet Animal Hospital.
You are the heart of this hospital and a trusted partner to every pet parent.

VOICE & PERSONALITY:
- Tone: Genuinely warm, deeply empathetic, approachable. Like a close friend who is a world-class vet.
- Style: Professional yet kind. Use gentle Indian English cadence ("ji", "Namaste") naturally.
- Engagement: Be PROACTIVE. Ask follow-up questions about ${petName}'s appetite, energy, or behavior.
- Empathy first: Acknowledge feelings before giving advice ("I understand how worrying this can be, ji").
- Conciseness: Keep responses short (2-3 sentences) for natural conversation flow.

CRITICAL RULES (NON-NEGOTIABLE):
1. NEVER diagnose conditions — always recommend in-person veterinary examination for confirmation.
2. NEVER prescribe medications or dosages — only suggest discussing options with a vet.
3. For emergency symptoms (difficulty breathing, collapse, severe bleeding, bloating, inability to urinate, seizures): ALWAYS say "Please come in to the hospital immediately, ji—I'll alert the team."
4. Always include a gentle disclaimer that this is not a substitute for professional veterinary care.
5. Only provide information supported by established veterinary science and the reference knowledge provided.
6. If uncertain, say so honestly and recommend consulting a veterinarian.

PET CONTEXT:
- Pet: ${petName} (${petType}, ${petBreed})
- Stats: ${petAge}, ${petWeight}, ${petGender}
- Medical History: ${medicalHistory}

REFERENCE VETERINARY KNOWLEDGE (use this to ground your responses):
${knowledgeContext}`;

      const activeLLM = getActiveLLMKey();
      if (!activeLLM.provider) {
        throw new Error("I'm unable to connect to my brain right now. Please connect an API key in settings, ji.");
      }

      setCurrentProvider(activeLLM.provider === 'free' ? 'gemini' : activeLLM.provider);

      let aiText = "";

      if (activeLLM.provider === 'gemini' || activeLLM.provider === 'free') {
        const ai = new GoogleGenerativeAI(activeLLM.key);
        let chatContents: any[] = [];
        let firstUserFound = false;

        for (const msg of newChatHistory) {
          if (msg.role === 'user') firstUserFound = true;
          if (firstUserFound) {
            chatContents.push({
              role: msg.role === 'ai' ? 'model' : 'user',
              parts: [{ text: msg.content }]
            });
          }
        }

        const model = ai.getGenerativeModel({
          model: "gemini-1.5-flash",
          systemInstruction: systemPrompt
        });

        const result = await model.generateContent({
          contents: chatContents,
          generationConfig: { maxOutputTokens: 200, temperature: 0.7 }
        });
        aiText = result.response.text();
      } else if (activeLLM.provider === 'openai') {
        const messages = [
          { role: 'system' as const, content: systemPrompt },
          ...newChatHistory.slice(1).map(msg => ({
            role: msg.role === 'ai' ? 'assistant' as const : 'user' as const,
            content: msg.content
          }))
        ];

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${activeLLM.key}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages,
            max_tokens: 200,
            temperature: 0.7
          }),
          signal: abortControllerRef.current.signal
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`OpenAI API error: ${res.status}`);
        }

        const data = await res.json();
        aiText = data.choices[0].message.content;
      }

      if (!isCallActiveRef.current) return;

      setChatHistory(prev => [...prev, { role: 'ai', content: aiText }]);
      isProcessingRef.current = false;
      setIsProcessing(false);
      setStreamingText('');

      if (isCallActiveRef.current) speakText(aiText);
    } catch (e: any) {
      console.error('HandleUserMessage Error:', e);
      if (e.name === 'AbortError') return;
      isProcessingRef.current = false;
      setIsProcessing(false);
      setIsSpeakingState(false);
      setStreamingText('');

      if (isCallActiveRef.current) {
        const errorMsg = e.message || "I'm having trouble connecting right now. Let me try again, ji.";
        setChatHistory(prev => [...prev, { role: 'ai', content: errorMsg }]);
      }
    }
  };

  const handleCallToggle = async () => {
    if (!recognition) {
      alert("Microphone access is not available in this browser.");
      return;
    }

    if (!hasAnyLLMKey && !FREE_TIER_GEMINI_KEY) {
      setShowSettings(true);
      return;
    }

    if (freeTierExhausted && !keys.gemini && !keys.openai) {
      setShowSettings(true);
      return;
    }

    if (!isCallActiveRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRef.current = audioCtx;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
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
        setTimeout(() => startVADListening(), 100);
      } catch {
        alert("Planet Animal Hospital needs microphone access to connect you with the AI Vet.");
        setIsCallActiveState(false);
        setIsListening(false);
      }
    } else {
      stopAllActivity();
    }
  };

  const innerScale = 1 + volume * 0.35;
  const middleScale = 1 + volume * 0.55;
  const outerOpacity = volume > 0.05 ? 0.3 + volume * 0.5 : 0.15;
  const isActive = isSpeaking || isListening;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Background Ambient Orbs — Matching Dashboard/Plans */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex justify-center isolate">
        <div className="relative w-full max-w-5xl h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-planet-yellow/40 rounded-full blur-3xl opacity-60 animate-blob transform-gpu" />
          <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-teal-300/40 rounded-full blur-3xl opacity-60 animate-blob animation-delay-2000 transform-gpu" />
          <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-amber-200/40 rounded-full blur-3xl opacity-60 animate-blob animation-delay-4000 transform-gpu" />
        </div>
      </div>

      {/* Header Row — Under Notch */}
      <header className="lg:hidden px-5 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] relative z-20 shrink-0">
        <div className="flex items-center justify-between w-full py-2">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] transition-all duration-300 hover:bg-white/[0.14] cursor-pointer group"
          >
            <ArrowLeft className="w-5 h-5 text-white/80 group-hover:text-white transition-colors duration-300" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScanner(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] transition-all duration-300 hover:bg-amber-500/20 hover:border-amber-500/30 cursor-pointer group"
              title="Scan Prescription"
            >
              <Camera className="w-4 h-4 text-white/80 group-hover:text-amber-300 transition-colors duration-300" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] transition-all duration-300 hover:bg-amber-500/20 hover:border-amber-500/30 cursor-pointer group"
              title="API Settings"
            >
              <Settings className="w-4 h-4 text-white/80 group-hover:text-amber-300 transition-colors duration-300" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section — Title + Orb with Logo Core */}
      <div className="relative z-10 flex flex-col items-center justify-center shrink-0 px-4 pb-2">
        {/* Large Title */}
        <div className="text-center mb-4">
          <h1 className="font-heading font-extrabold text-white text-2xl tracking-tight leading-none">
            AI Veterinarian
          </h1>
        </div>

        {/* Orb with Logo Core */}
        <div className="relative w-[200px] h-[200px] md:w-[240px] md:h-[240px] flex items-center justify-center">
          {/* Outer ring — audio reactive */}
          <motion.div
            animate={{ scale: isActive ? [1, 1.15, 1] : 1, opacity: outerOpacity }}
            transition={{ duration: 2, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full border border-[#fec708]/25"
            style={{ boxShadow: `0 0 ${35 + volume * 70}px rgba(254,199,8,${0.08 + volume * 0.25})` }}
          />

          {/* Pulse rings during active call */}
          <AnimatePresence>
            {isActive && [0, 0.5, 1].map((delay) => (
              <motion.div
                key={delay}
                initial={{ scale: 0.6, opacity: 0.5 }}
                animate={{ scale: 2.4, opacity: 0 }}
                transition={{ duration: 2.5, repeat: Infinity, delay, ease: "easeOut" }}
                className="absolute inset-0 rounded-full border border-[#fec708]/15"
              />
            ))}
          </AnimatePresence>

          {/* Middle glow ring */}
          <motion.div
            animate={{ scale: middleScale, opacity: isActive ? 0.5 : 0.2 }}
            transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
            className="absolute w-[75%] h-[75%] rounded-full"
            style={{
              background: `radial-gradient(circle at 40% 40%, rgba(254,199,8,0.25) 0%, rgba(254,199,8,0.15) 30%, rgba(178,138,2,0.08) 60%, transparent 100%)`,
              boxShadow: `0 0 ${25 + volume * 55}px rgba(254,199,8,0.15)`,
            }}
          />

          {/* Inner glow ring */}
          <motion.div
            animate={{ scale: innerScale, opacity: isActive ? 0.7 : 0.3 }}
            transition={{ type: "tween", ease: "easeOut", duration: 0.15 }}
            className="absolute w-[58%] h-[58%] rounded-full"
            style={{
              background: `radial-gradient(circle at 40% 40%, rgba(254,199,8,0.35) 0%, rgba(254,199,8,0.2) 40%, transparent 70%)`,
              boxShadow: `0 0 ${20 + volume * 45}px rgba(254,199,8,0.2)`,
            }}
          />

          {/* Logo Core — perfectly centered */}
          <motion.div
            animate={{
              scale: innerScale,
              boxShadow: isActive
                ? [`0 0 ${30 + volume * 50}px rgba(254,199,8,0.7)`, `0 0 ${50 + volume * 70}px rgba(254,199,8,0.9)`, `0 0 ${30 + volume * 50}px rgba(254,199,8,0.7)`]
                : `0 0 15px rgba(254,199,8,0.3)`,
            }}
            transition={{
              scale: { type: "tween", ease: "easeOut", duration: 0.15 },
              boxShadow: isActive ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.5 },
            }}
            className="relative w-[48%] h-[48%] rounded-full overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#fec708]/30 flex items-center justify-center"
            style={{
              background: `radial-gradient(circle at 35% 35%, rgba(255,253,231,0.15) 0%, rgba(254,199,8,0.08) 30%, rgba(26,26,26,0.95) 70%)`,
            }}
          >
            <Logo size="sm" className="!w-full !h-full object-contain" />
          </motion.div>
        </div>

        {/* Subtitle */}
        <div className="text-center mt-4">
          <p className="font-heading font-bold text-planet-yellow text-sm tracking-wide">
            Pawl, Primary Vet
          </p>
        </div>

        {/* Provider Badges */}
        {isCallActive && (
          <div className="flex items-center justify-center gap-2 mt-3">
            {(keys.gemini || status.gemini === 'connected') && (
              <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/20">Gemini</span>
            )}
            {(keys.openai || status.openai === 'connected') && (
              <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/20">OpenAI</span>
            )}
            {currentProvider && (
              <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                Using {currentProvider === 'free' ? 'Gemini (Free)' : currentProvider}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Chat Console — Premium Glass Card */}
      <div className="relative z-10 flex-1 px-4 pb-2 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] rounded-[1.75rem] bg-gradient-to-br from-black/72 via-black/60 to-black/46 backdrop-blur-2xl border border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
          {/* Console Header */}
          <div className="sticky top-0 z-10 px-4 py-2.5 border-b border-white/5 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-planet-yellow" />
                <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-white/50">Consultation</span>
              </div>
              {isCallActive && (
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  isSpeaking ? 'text-planet-yellow' : isListening ? 'text-emerald-400' : isProcessing ? 'text-blue-400' : 'text-white/30'
                }`}>
                  {isSpeaking ? "Speaking" : isListening ? "Listening" : isProcessing ? "Processing" : "Idle"}
                </span>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex flex-col gap-3 p-4 min-h-full justify-end">
            <AnimatePresence initial={false}>
              {chatHistory.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ease: "easeOut" }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[88%] rounded-2xl px-4 py-3 backdrop-blur-2xl border shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] ${
                    msg.role === 'user'
                      ? 'bg-[#fec708]/10 border-[#fec708]/20 rounded-br-md'
                      : 'bg-white/5 border-white/10 rounded-bl-md'
                  }`}>
                    {msg.role === 'ai' && (
                      <h4 className="font-heading tracking-tight text-[#fec708] text-[10px] font-bold uppercase mb-1.5 flex items-center gap-1.5">
                        <Stethoscope className="w-3 h-3" />
                        Sankpawl
                      </h4>
                    )}
                    <p className="font-body font-medium text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-[#fec708] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-[#fec708] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-[#fec708] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      {currentProvider ? `Thinking with ${currentProvider === 'free' ? 'Gemini' : currentProvider}...` : 'Thinking...'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={chatEndRef} />
          </div>
        </div>
      </div>

      {/* Bottom Call Dock — Anchored Above Nav */}
      <div className="relative z-30 px-4 pb-2 shrink-0">
        {/* Free Tier Warning — Stacked Above Button */}
        <AnimatePresence>
          {freeTierExhausted && !keys.gemini && !keys.openai && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-2"
            >
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-2.5 flex items-center gap-3">
                <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-amber-200">Free tier exhausted</p>
                  <p className="text-[10px] text-amber-200/60">Connect your own API key for unlimited access</p>
                </div>
                <button
                  onClick={() => setShowSettings(true)}
                  className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-3 py-1.5 rounded-full hover:bg-amber-500/30 transition-colors shrink-0"
                >
                  Settings
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Call Button + Status */}
        <div className="flex flex-col items-center gap-1.5">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={handleCallToggle}
            className={`relative flex items-center justify-center gap-3 transition-all duration-300 rounded-full px-8 py-3.5 w-full max-w-xs ${
              isCallActive
                ? 'bg-red-500/10 backdrop-blur-xl border border-red-500/30 text-red-400'
                : 'bg-white/8 backdrop-blur-xl border border-white/15 text-white shadow-[0_0_30px_rgba(254,199,8,0.15)] hover:bg-white/15'
            }`}
          >
            <Mic className={`w-5 h-5 ${isCallActive ? 'text-red-400' : ''}`} />
            <span className="font-heading font-bold text-sm">
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

      {/* Modals */}
      <AnimatePresence>
        {showScanner && (
          <PrescriptionScanner
            petName={profile?.petName}
            onScanComplete={(medications) => {
              const medList = medications.map(m => `${m.name} — ${m.dosage} at ${m.time}`).join('\n');
              const medMessage = `📋 Prescription detected:\n${medList}\n\nI've noted these medications. Make sure to verify with your vet!`;
              setChatHistory(prev => [...prev, { role: 'ai', content: medMessage }]);
              setShowScanner(false);
            }}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>

      <APISettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
