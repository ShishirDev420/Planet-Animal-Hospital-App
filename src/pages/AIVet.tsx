import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic, Camera, Settings, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { usePetProfile } from '../hooks/usePetProfile';
import { useAPIKeys } from '../hooks/useAPIKeys';
import { buildKnowledgeContext } from '../lib/vet-knowledge';
import PrescriptionScanner from '../components/PrescriptionScanner';
import APISettings from '../components/APISettings';
import Logo from '../components/Logo';
import { CLINIC_TEL_URL } from '../lib/pawPoints';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const SARVAM_LANGUAGES = ['hi-IN', 'ta-IN', 'te-IN', 'kn-IN', 'ml-IN', 'bn-IN', 'en-IN'];

const SARVAM_MALE_VOICE = 'shubh';
const BARGE_IN_THRESHOLD = 62;
const BARGE_IN_FRAMES_REQUIRED = 6;
const THANE_EMERGENCY_DESTINATION = 'the configured 24/7 emergency veterinary line near Thane';

const SEVERE_EMERGENCY_PATTERN = /\b(difficulty breathing|can't breathe|cannot breathe|not breathing|collapse|collapsed|unconscious|seizure|seizing|severe bleeding|bleeding a lot|bloated|bloat|gdv|can't pee|cannot pee|unable to urinate|rat poison|poison|xylitol|grapes?|raisins?|lily|lilies|hit by car|accident|trauma)\b/i;
const CHOCOLATE_PATTERN = /\b(chocolate|cocoa|cacao|brownie|brownies|theobromine|methylxanthine)\b/i;
const HIGH_RISK_CHOCOLATE_PATTERN = /\b(dark|baker'?s|baking|cocoa powder|unsweetened|cacao|whole|entire|bar|box|packet|pack|a lot|lots|large|big|many|vomit|vomiting|diarrhea|panting|restless|tremor|trembling|shaking|seizure|heart|hyper|weak|collapse|xylitol|raisin|macadamia|coffee|espresso)\b/i;

function shouldAutoCallEmergency(transcript: string) {
  if (SEVERE_EMERGENCY_PATTERN.test(transcript)) return true;
  return CHOCOLATE_PATTERN.test(transcript) && HIGH_RISK_CHOCOLATE_PATTERN.test(transcript);
}

function isChocolateConcern(transcript: string) {
  return CHOCOLATE_PATTERN.test(transcript);
}

function buildChocolateTriageResponse(petName: string) {
  return `I have ${petName}'s profile ready. Please tell me the chocolate type, approximate amount, ${petName}'s weight, when it was eaten, and any symptoms; I will estimate the risk from veterinary toxicology thresholds, but ${petName} still needs veterinarian review. Do not induce vomiting or give home remedies unless a vet tells you to.`;
}

function buildEmergencyResponse(transcript: string, petName: string) {
  if (isChocolateConcern(transcript)) {
    return `This sounds potentially urgent for ${petName}, especially with dark chocolate, cocoa, a large amount, symptoms, or added toxins. I am calling the nearest configured 24/7 emergency veterinary line from Thane now; keep the wrapper and do not induce vomiting unless the vet instructs you.`;
  }

  return `This sounds like an emergency for ${petName}. I am calling the nearest configured 24/7 emergency veterinary line from Thane now; please keep ${petName} safely positioned and do not give medicines unless a veterinarian instructs you.`;
}

function isUsableAPIKey(value: string) {
  const trimmed = value.trim();
  return Boolean(trimmed) && !trimmed.toLowerCase().includes('your_') && !trimmed.toLowerCase().includes('paste_');
}

function getSarvamLanguageCode(text: string) {
  return /[\u0900-\u097F]/.test(text) ? 'hi-IN' : 'en-IN';
}

function resolvePetSpecies(profile: any) {
  const source = `${profile?.petType || ''} ${profile?.species || ''} ${profile?.breed || ''} ${profile?.additionalDetails || ''} ${profile?.medicalHistory || ''}`.toLowerCase();
  if (source.includes('cat') || source.includes('feline')) return 'Cat';
  if (source.includes('dog') || source.includes('canine')) return 'Dog';
  return profile?.petType || profile?.species || 'pet';
}

function valueOrFallback(value: unknown, fallback: string) {
  const text = value === undefined || value === null ? '' : String(value).trim();
  return text || fallback;
}

function buildOnboardingContext(profile: any) {
  const petName = valueOrFallback(profile?.petName || profile?.name, 'your pet');
  const petType = resolvePetSpecies(profile);
  const rawRoadmap = valueOrFallback(profile?.cachedRoadmap, '');
  const roadmapSummary = rawRoadmap && rawRoadmap !== 'No roadmap generated yet'
    ? rawRoadmap.replace(/###\s*Verifiable Sources[\s\S]*$/i, '').trim()
    : '';

  return {
    petName,
    petType,
    parentName: valueOrFallback(profile?.parentName || profile?.displayName, 'pet parent'),
    petBreed: valueOrFallback(profile?.breed, 'breed not provided'),
    petAge: valueOrFallback(profile?.age, 'age not provided'),
    petGender: valueOrFallback(profile?.gender, 'gender not provided'),
    petWeight: valueOrFallback(profile?.weight || profile?.petWeight, 'weight not provided'),
    diet: valueOrFallback(profile?.dietaryPreferences || profile?.diet, 'diet not provided'),
    medicalHistory: valueOrFallback(profile?.medicalHistory, 'no medical history provided'),
    surgicalHistory: valueOrFallback(profile?.surgicalHistory, 'no surgical history provided'),
    additionalDetails: valueOrFallback(profile?.additionalDetails, 'no additional details provided'),
    roadmap: roadmapSummary,
  };
}

async function transcribeWithSarvam(audioBlob: Blob, apiKey?: string): Promise<string> {
  const formData = new FormData();
  const extension = audioBlob.type.includes('webm') ? 'webm' : audioBlob.type.includes('wav') ? 'wav' : 'audio';
  formData.append('file', audioBlob, `audio.${extension}`);
  formData.append('model', 'saaras:v3');
  formData.append('mode', 'transcribe');
  formData.append('language_code', 'en-IN');

  const headers: Record<string, string> = {};
  if (apiKey) headers['x-sarvam-api-key'] = apiKey;

  const res = await fetch('/api/sarvam/speech-to-text', {
    method: 'POST',
    headers,
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
  const { keys, status } = useAPIKeys();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', content: string}[]>([
    { role: 'ai', content: `Namaste. I'm Pawl, your AI veterinarian here at Planet Animal Hospital. I have ${profile?.petName || 'your pet'}'s profile ready. What can I help with today?` }
  ]);
  const [showScanner, setShowScanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [volume, setVolume] = useState(0);
  const [currentProvider, setCurrentProvider] = useState<string>('');
  const [streamingText, setStreamingText] = useState('');
  const [voiceIssue, setVoiceIssue] = useState('');
  const [serverSarvamConfigured, setServerSarvamConfigured] = useState<boolean | null>(null);

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
  const currentAudioUrlRef = useRef<string | null>(null);
  const currentAudioResolveRef = useRef<(() => void) | null>(null);
  const speechPlaybackIdRef = useRef(0);
  const smoothedVolumeRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const ttsAbortControllerRef = useRef<AbortController | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vadAnalyserRef = useRef<AnalyserNode | null>(null);
  const lastVoiceActivityRef = useRef<number>(0);
  const bargeInFramesRef = useRef(0);

  useEffect(() => {
    chatHistoryRef.current = chatHistory;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  }, [chatHistory]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/sarvam/status')
      .then(res => res.json())
      .then(data => {
        if (!cancelled) setServerSarvamConfigured(Boolean(data.configured));
      })
      .catch(() => {
        if (!cancelled) setServerSarvamConfigured(false);
      });

    return () => { cancelled = true; };
  }, []);

  const setIsSpeakingState = (val: boolean) => {
    setIsSpeaking(val);
    isSpeakingRef.current = val;
  };

  const setIsCallActiveState = (val: boolean) => {
    setIsCallActive(val);
    isCallActiveRef.current = val;
  };

  const getActiveSarvamKey = () => {
    if (isUsableAPIKey(keys.sarvam)) return keys.sarvam.trim();
    return '';
  };

  const stopCurrentSpeech = () => {
    speechPlaybackIdRef.current += 1;
    setIsSpeakingState(false);
    setVolume(0);
    smoothedVolumeRef.current = 0;
    bargeInFramesRef.current = 0;

    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = '';
        currentAudioRef.current.load();
      } catch(e) {}
      currentAudioRef.current = null;
    }

    if (currentAudioResolveRef.current) {
      currentAudioResolveRef.current();
      currentAudioResolveRef.current = null;
    }

    if (currentAudioUrlRef.current) {
      URL.revokeObjectURL(currentAudioUrlRef.current);
      currentAudioUrlRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (ttsAbortControllerRef.current) {
      ttsAbortControllerRef.current.abort();
      ttsAbortControllerRef.current = null;
    }
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

    stopCurrentSpeech();

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

    if (ttsAbortControllerRef.current) {
      ttsAbortControllerRef.current.abort();
      ttsAbortControllerRef.current = null;
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
        transcript = await transcribeWithSarvam(blob, getActiveSarvamKey());
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

  const playAudioFromBlob = async (audioBlob: Blob, allowWithoutCall = false) => {
    if (!allowWithoutCall && !isCallActiveRef.current) return;
    stopCurrentSpeech();

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    const playbackId = speechPlaybackIdRef.current;
    currentAudioRef.current = audio;
    currentAudioUrlRef.current = audioUrl;
    setIsSpeakingState(true);

    const animateSpeak = () => {
      if (playbackId !== speechPlaybackIdRef.current) return;
      if (!isSpeakingRef.current) { setVolume(0); return; }
      const analyser = analyserRef.current;
      let raw = Math.random() * 0.35;

      if (analyser && isCallActiveRef.current) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const micAvg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        raw = Math.max(raw, micAvg / 255);

        if (micAvg > BARGE_IN_THRESHOLD) {
          bargeInFramesRef.current += 1;
        } else {
          bargeInFramesRef.current = Math.max(0, bargeInFramesRef.current - 1);
        }

        if (bargeInFramesRef.current >= BARGE_IN_FRAMES_REQUIRED) {
          stopCurrentSpeech();
          if (isCallActiveRef.current) startVADListening();
          return;
        }
      }

      smoothedVolumeRef.current = smoothedVolumeRef.current * 0.85 + raw * 0.15;
      setVolume(smoothedVolumeRef.current);
      animationFrameRef.current = requestAnimationFrame(animateSpeak);
    };

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;

        if (playbackId !== speechPlaybackIdRef.current) {
          resolve();
          return;
        }

        currentAudioRef.current = null;
        currentAudioUrlRef.current = null;
        currentAudioResolveRef.current = null;
        setIsSpeakingState(false);
        setVolume(0);
        bargeInFramesRef.current = 0;
        URL.revokeObjectURL(audioUrl);
        if (isCallActiveRef.current) startVADListening();
        if (error) {
          reject(error);
          return;
        }
        resolve();
      };

      currentAudioResolveRef.current = () => finish();

      audio.onended = () => finish();
      audio.onerror = () => finish(new Error('Audio playback failed'));

      audio.play().then(() => {
        if (playbackId === speechPlaybackIdRef.current) animateSpeak();
      }).catch(error => finish(error));
    });
  };

  const speakTextSarvam = async (text: string, allowWithoutCall = false): Promise<boolean> => {
    const sarvamKey = getActiveSarvamKey();
    try {
      if (ttsAbortControllerRef.current) ttsAbortControllerRef.current.abort();
      ttsAbortControllerRef.current = new AbortController();

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sarvamKey) headers['x-sarvam-api-key'] = sarvamKey;

      const ttsResponse = await fetch('/api/sarvam/text-to-speech', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          target_language_code: getSarvamLanguageCode(text),
          model: 'bulbul:v3',
          speaker: SARVAM_MALE_VOICE,
          pace: 0.88,
          temperature: 0.35,
          speech_sample_rate: '24000',
          output_audio_codec: 'wav'
        }),
        signal: ttsAbortControllerRef.current.signal
      });

      if (!ttsResponse.ok) {
        ttsAbortControllerRef.current = null;
        const detail = await ttsResponse.text().catch(() => '');
        setVoiceIssue(`Sarvam voice request failed with status ${ttsResponse.status}. Check the local .env key and credits.${detail ? ` ${detail.slice(0, 120)}` : ''}`);
        return false;
      }
      const ttsData = await ttsResponse.json();
      if (!ttsData.audios || ttsData.audios.length === 0) {
        ttsAbortControllerRef.current = null;
        setVoiceIssue('Sarvam returned no voice audio for this response.');
        return false;
      }

      const audioBase64 = ttsData.audios[0];
      const audioByteArray = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
      const audioBlob = new Blob([audioByteArray], { type: 'audio/wav' });
      await playAudioFromBlob(audioBlob, allowWithoutCall);
      ttsAbortControllerRef.current = null;
      setVoiceIssue('');
      return true;
    } catch (e: any) {
      ttsAbortControllerRef.current = null;
      if (e?.name === 'AbortError') return false;
      setVoiceIssue('Sarvam voice could not play. Check network access and restart the dev server after editing .env.local.');
      return false;
    }
  };

  const speakText = async (text: string, allowWithoutCall = false) => {
    try {
      const sarvamSuccess = await speakTextSarvam(text, allowWithoutCall);
      if (sarvamSuccess) return;
      setIsSpeakingState(false);
      setVolume(0);
      if (!allowWithoutCall && isCallActiveRef.current) startVADListening();
    } catch {
      if (!allowWithoutCall && !isCallActiveRef.current) return;
      setIsSpeakingState(false);
      setVolume(0);
      if (!allowWithoutCall) startVADListening();
    }
  };

  const handleTestVoice = () => {
    stopCurrentSpeech();
    speakText('Hi, I am Pawl. I can hear you, and I will use Onyx\'s correct pet profile before I respond.', true);
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

  const getActiveLLMKey = (): { provider: 'gemini' | 'openai' | null; key: string } => {
    if (keys.gemini) return { provider: 'gemini', key: keys.gemini };
    if (keys.openai) return { provider: 'openai', key: keys.openai };
    return { provider: null, key: '' };
  };

  const buildDemoVetResponse = (transcript: string) => {
    const { petName } = buildOnboardingContext(profile);
    const lowerTranscript = transcript.toLowerCase();
    const emergencyKeywords = ['breathing', 'collapse', 'collapsed', 'seizure', 'bleeding', 'poison', 'bloated', 'bloat', 'urinate', 'unconscious'];
    const mayBeEmergency = emergencyKeywords.some(keyword => lowerTranscript.includes(keyword));

    if (mayBeEmergency) {
      return buildEmergencyResponse(transcript, petName);
    }

    if (isChocolateConcern(transcript)) {
      return buildChocolateTriageResponse(petName);
    }

    return `I hear you. I have ${petName}'s profile ready, so let's focus on what's changed. What is the biggest concern right now: appetite, energy, breathing, stool, vomiting, pain, or behavior? This does not replace an in-person veterinary exam.`;
  };

  const callEmergencyVetNearThane = () => {
    window.location.href = CLINIC_TEL_URL;
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
      const {
        petName,
        parentName,
        petType,
        petBreed,
        petAge,
        petGender,
        petWeight,
        diet,
        medicalHistory,
        surgicalHistory,
        additionalDetails,
        roadmap,
      } = buildOnboardingContext(profile);

      if (shouldAutoCallEmergency(transcript)) {
        const emergencyText = buildEmergencyResponse(transcript, petName);
        setCurrentProvider('emergency');
        setChatHistory(prev => [...prev, { role: 'ai', content: emergencyText }]);
        isProcessingRef.current = false;
        setIsProcessing(false);
        setStreamingText('');
        if (isCallActiveRef.current) await speakText(emergencyText);
        callEmergencyVetNearThane();
        return;
      }

      const knowledgeContext = buildKnowledgeContext(petType, petBreed, transcript);

      const systemPrompt = `You are Pawl, the Primary AI Veterinarian at Planet Animal Hospital.
You are the heart of this hospital and a trusted partner to every pet parent.

SOURCE OF TRUTH:
- The onboarding profile below is the trusted source for ${petName}'s species, breed, age, weight, medical history, surgical history, diet, and parent-provided notes.
- Never override, reinterpret, or guess a different species or breed when onboarding data is present.
- If a field is missing, say it is not provided and ask one focused follow-up question.

VOICE & PERSONALITY:
- Tone: Genuinely warm, deeply empathetic, approachable. Like a close friend who is a world-class vet.
- Style: Professional yet kind. Use gentle Indian English cadence ("ji", "Namaste") naturally.
- Always speak in first person as Pawl. Never refer to yourself as "Pawl" in third person.
- Sound present in the conversation. Acknowledge interruptions, corrections, and new details naturally.
- Engagement: Be PROACTIVE. Ask follow-up questions about ${petName}'s appetite, energy, or behavior.
- Empathy first: Acknowledge feelings before giving advice ("I understand how worrying this can be, ji").
- Conciseness: Keep responses very short (1-3 sentences) for natural conversation flow and low voice latency.
- Dynamic verbosity: read the room. Use one direct sentence in emergencies, 2-3 sentences for triage, and only go longer when the parent asks for a calculation or explanation.
- Do not recap ${petName}'s full profile, age, weight, medical history, surgical history, or roadmap unless that specific detail directly changes the guidance.
- Acknowledge that the profile is available in one short phrase, then focus on the pet parent's current concern.

LANGUAGE ADAPTATION:
- Mirror the pet parent's communication style.
- If they use English, reply in clear English.
- If they use Hindi, reply in natural Hindi.
- If they mix Hindi and English, reply in natural Hinglish without sounding gimmicky.
- Keep medical terms clear and explain them simply in the same language mix.
- Do not force Hindi words into an English message unless the parent is already using that style.

CRITICAL RULES (NON-NEGOTIABLE):
1. NEVER diagnose conditions — always recommend in-person veterinary examination for confirmation.
2. NEVER prescribe medications or dosages — only suggest discussing options with a vet.
3. For emergency symptoms (difficulty breathing, collapse, severe bleeding, bloating, inability to urinate, seizures, high-risk poisoning): be directive and tell the parent to seek emergency veterinary care now. The app may already be calling ${THANE_EMERGENCY_DESTINATION}; do not claim you alerted the team unless the app explicitly confirms it.
4. Always include a gentle disclaimer that this is not a substitute for professional veterinary care.
5. Only provide information supported by established veterinary science and the reference knowledge provided.
6. If uncertain, say so honestly and recommend consulting a veterinarian.
7. Never change the pet's species. If the profile says Cat or feline, always treat ${petName} as a cat. If the profile says Dog or canine, always treat ${petName} as a dog.

CHOCOLATE INGESTION PROTOCOL:
- If the parent mentions chocolate, immediately ask for or use: chocolate type, approximate amount, ${petName}'s weight, time since ingestion, symptoms, and whether the product contained xylitol, raisins, macadamia nuts, coffee/espresso beans, caffeine, or wrappers.
- Do not hallucinate an exposure estimate. If type, amount, or weight is missing, say what is missing and ask for it.
- Ground any estimate in the reference knowledge: darker/bitter chocolate has more methylxanthines; Merck reports mild signs in dogs around 20 mg/kg methylxanthines, cardiotoxic effects around 40-50 mg/kg, and seizures at 60 mg/kg or higher.
- Give a rough risk category only when enough data exists, and say a veterinarian or veterinary poison-control service should confirm the calculation.
- Remind the parent that ${petName} should be shown to a veterinarian regardless of amount, while the AI vet can help triage in the meantime.
- Never tell the parent to induce vomiting, give activated charcoal, or try home remedies unless a veterinarian specifically instructs it.

PET CONTEXT:
- Pet: ${petName} (${petType}, ${petBreed})
- Stats: ${petAge}, ${petWeight}, ${petGender}
- Diet: ${diet}
- Medical History: ${medicalHistory}
- Surgical History: ${surgicalHistory}
- Parent Notes: ${additionalDetails}
${roadmap ? `\nLONGEVITY ROADMAP (current care plan for ${petName}):\n${roadmap}` : '\nNo longevity roadmap generated yet.'}

REFERENCE VETERINARY KNOWLEDGE (use this to ground your responses):
${knowledgeContext}`;

      const activeLLM = getActiveLLMKey();
      if (!activeLLM.provider) {
        const demoText = buildDemoVetResponse(transcript);
        setCurrentProvider('demo');
        setChatHistory(prev => [...prev, { role: 'ai', content: demoText }]);
        isProcessingRef.current = false;
        setIsProcessing(false);
        setStreamingText('');
        if (isCallActiveRef.current) speakText(demoText);
        return;
      }

      setCurrentProvider(activeLLM.provider);

      let aiText = "";

      if (activeLLM.provider === 'gemini') {
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
    if (isCallActiveRef.current && isSpeakingRef.current) {
      stopCurrentSpeech();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      isProcessingRef.current = false;
      setIsProcessing(false);
      setStreamingText('');
      startVADListening();
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
        if (!keys.gemini && !keys.openai) {
          setCurrentProvider('demo');
          speakText('I am ready. Tell me what is going on with your pet. You can interrupt me any time.');
        } else {
          speakText("I'm ready. Tell me what is going on with your pet.");
        }
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
  const hasSarvamVoice = Boolean(getActiveSarvamKey()) || serverSarvamConfigured === true;

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
              title="AI Settings / Connect AI key"
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
          <h1 className="cinematic-section-title text-3xl">
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
          <p className="cinematic-kicker text-[10px] tracking-[0.22em]">
            Pawl, Primary Vet
          </p>
        </div>

        {!keys.gemini && !keys.openai && (
          <div className="mt-3 max-w-sm rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-center shadow-[0_12px_34px_rgba(254,199,8,0.08)]">
            <p className="cinematic-kicker text-[10px] tracking-[0.18em] text-amber-200">
              Preview Demo
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-50/75">
              Pawl can show a safe sample response now. Connect your own OpenAI or Gemini API key in settings for full live AI Vet answers.
            </p>
          </div>
        )}

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
                Using {currentProvider === 'demo' ? 'Preview Demo' : currentProvider}
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
                <span className="cinematic-kicker text-[10px] text-white/50">Consultation</span>
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
                        Pawl
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
                      {currentProvider ? `Thinking with ${currentProvider === 'demo' ? 'Preview Demo' : currentProvider}...` : 'Thinking...'}
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
        {/* Call Button + Status */}
        <div className="flex flex-col items-center gap-1.5">
          {!keys.gemini && !keys.openai && (
            <p className="max-w-xs text-center text-[10px] leading-relaxed text-white/35">
              {hasSarvamVoice ? 'Voice is powered by Sarvam through the local server. Full live AI answers need OpenAI or Gemini in settings.' : 'Sarvam voice key is not loaded on the local server yet. Add SARVAM_API_KEY or VITE_SARVAM_API_KEY to .env.local, then restart.'}
            </p>
          )}
          {voiceIssue && (
            <p className="max-w-xs text-center text-[10px] leading-relaxed text-amber-200/70">
              {voiceIssue}
            </p>
          )}
          <button
            type="button"
            onClick={handleTestVoice}
            className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-[10px] font-heading font-bold uppercase tracking-[0.16em] text-white/55 transition-colors hover:bg-white/[0.1] hover:text-white/80"
          >
            Test Sarvam Voice
          </button>
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
              {isSpeaking ? 'Interrupt' : isCallActive ? 'End Call' : 'Start Call'}
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
