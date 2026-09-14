import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Volume2, Square } from 'lucide-react';
import { claimSpeech, releaseSpeech, selectDeviceVoice, speechChunks } from '../lib/deviceSpeech';

/** Pass only the current server-approved version; parent APIs must omit drafts. */
export default function ApprovedAdviceSpeech({ text, approvalId, language = 'en-IN' }: { text: string; approvalId: string; language?: string }) {
  const location = useLocation(), stopRef = useRef<() => void>(() => {});
  const [available,setAvailable] = useState(false), [playing,setPlaying] = useState(false), [notice,setNotice] = useState('Checking device voices…');
  useEffect(() => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') { setNotice('Audio is unavailable in this browser. Read the approved advice below.'); return; }
    const update = () => { const voice = selectDeviceVoice(synth.getVoices(),language); setAvailable(!!voice); setNotice(voice ? `Device voice: ${voice.name}. No voice API needed.` : 'No on-device voice is available for this language. The approved text remains available.'); };
    update(); synth.addEventListener('voiceschanged',update);
    // Some engines populate voices without consistently firing voiceschanged.
    const retry = window.setTimeout(update,1500);
    return () => { clearTimeout(retry); synth.removeEventListener('voiceschanged',update); };
  },[language]);
  useEffect(() => { setPlaying(false); return () => stopRef.current(); },[approvalId,text,language,location.key]);
  const play = () => {
    if (!approvalId || !text.trim()) return;
    const synth = window.speechSynthesis, voice = selectDeviceVoice(synth?.getVoices() || [],language);
    if (!synth || !voice) { setAvailable(false); setNotice('Device audio is unavailable. Read the approved text below.'); return; }
    let cancelled = false, watchdog: ReturnType<typeof setTimeout> | undefined, utterance: SpeechSynthesisUtterance | undefined;
    const stop = () => { if (cancelled) return; cancelled = true; clearTimeout(watchdog); if(utterance) { utterance.onend = null; utterance.onerror = null; utterance.onstart = null; } synth.cancel(); setPlaying(false); setNotice('Audio stopped. The approved text remains available.'); releaseSpeech(stop); };
    claimSpeech(stop); stopRef.current = stop; synth.cancel();
    const chunks = speechChunks(text);
    const fail = () => { stop(); setNotice('Audio could not play. The approved text is still available; you can try Listen again.'); };
    const next = () => {
      if(cancelled) return;
      const chunk = chunks.shift(); if (!chunk) { stop(); return; }
      utterance = new SpeechSynthesisUtterance(chunk); utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = 1;
      clearTimeout(watchdog); watchdog = setTimeout(fail,10000);
      utterance.onstart = () => { clearTimeout(watchdog); watchdog = setTimeout(fail,60000); setPlaying(true); };
      utterance.onend = () => { clearTimeout(watchdog); next(); }; utterance.onerror = fail;
      try { synth.speak(utterance); } catch { fail(); }
    };
    setPlaying(true); setNotice(`Playing with ${voice.name}.`); next();
  };
  if (!approvalId || !text.trim()) return null;
  return <div className="my-3 text-sm"><button type="button" disabled={!available && !playing} onClick={playing ? () => stopRef.current() : play} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-white disabled:opacity-50">{playing ? <Square size={16}/> : <Volume2 size={16}/>} {playing ? 'Stop reading' : 'Listen to approved advice'}</button><p role="status" className="mt-2 text-xs text-white/65">{notice}</p></div>;
}
