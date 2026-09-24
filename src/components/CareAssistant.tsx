import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, MessageCircleMore, Send, Sparkles } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useCare } from '../lib/care/client';
import { requestCareJson } from '../lib/care/request';
import { EDUCATION, type AssistantDraft } from '../lib/care/assistant';

type Allowance = { dailyRemaining: number; dailyLimit: number; monthlyRemaining: number; monthlyLimit: number };
export async function assistantRequest(body?: Record<string, unknown>) {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in to use your free requests.');
  const data = await requestCareJson('/api/assistant', { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${await user.getIdToken()}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) }, { timeoutMs: 35000 });
  if (auth.currentUser?.uid !== user.uid) throw new Error('Account changed. Reopen the assistant.');
  return data;
}

export default function CareAssistant({ agent = 'pritpawl', requestService = assistantRequest }: { agent?: 'pawl' | 'pawlina' | 'pritpawl'; requestService?: typeof assistantRequest }) {
  const care = useCare();
  return <AssistantSession key={`${care.state?.ownerUid}:${care.petId}:${agent}`} agent={agent} requestService={requestService}/>;
}

function AssistantSession({ agent, requestService }: { agent: string; requestService: typeof assistantRequest }) {
  const care = useCare();
  const pet = care.state?.pets.find(item => item.id === care.petId);
  const [prompt, setPrompt] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState<AssistantDraft | null>(null);
  const [allowance, setAllowance] = useState<Allowance | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [availability, setAvailability] = useState('Checking availability…');
  const request = useRef({ prompt: '', id: '' });
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    void requestService().then(result => { if (mounted.current) { setAllowance(result.allowance); setConfigured(result.configured); setAvailability(result.configured ? '' : 'The clinic is setting up AI chat. Your care record is still available.'); } }).catch(error => { if (mounted.current) { setConfigured(false); setAvailability((error as Error).message); } });
    return () => { mounted.current = false; };
  }, [requestService]);
  const ask = async () => {
    if (busy || !configured || !consent || !prompt.trim() || !pet) return;
    setBusy(true); setError(''); setAnswer(null);
    if (request.current.prompt !== prompt) request.current = { prompt, id: crypto.randomUUID() };
    try { const result = await requestService({ agent, petId: care.petId, prompt, requestId: request.current.id, consent, adult: true }); if (mounted.current) { setAnswer(result.draft); setAllowance(result.allowance); } }
    catch (error) { if (mounted.current) setError((error as Error).message); }
    finally { if (mounted.current) setBusy(false); }
  };
  return <section className="ai-chat" aria-label="AI care conversation">
    <div className="ai-chat-context"><span className="ai-vet-eyebrow">Your conversation</span><h2>{pet ? `Let’s talk about ${pet.name}.` : 'Select your pet to begin.'}</h2><p>{pet ? 'We’ll use this pet’s recorded history and instructions to help you prepare better questions.' : 'Your saved pet details will appear here once your care record loads.'}</p>
      {care.state && care.state.pets.length > 1 && <label className="ai-pet-select">Pet in this conversation<select value={care.petId} onChange={event => care.setPetId(event.target.value)}>{care.state.pets.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>}
    </div>
      <div className="ai-chat-body"><div className="ai-allowance"><span className="ai-allowance-icon"><Sparkles size={19}/></span><div><strong>Your free requests</strong>{allowance ? <p><b>{allowance.dailyRemaining} of {allowance.dailyLimit}</b> left today <span>·</span> <b>{allowance.monthlyRemaining} of {allowance.monthlyLimit}</b> left this month</p> : <p>{availability}</p>}<small>Daily reset: 5:30 AM IST. Monthly reset: 5:30 AM IST on the 1st.</small></div></div>
      {configured === false && allowance && <p className="ai-unavailable" role="status">{availability}</p>}
      <div className="ai-chat-starter"><MessageCircleMore size={22}/><p>Ask about something in {pet?.name || 'your pet'}’s record, or prepare for the next visit.</p></div>
      <label className="ai-question-label" htmlFor="care-question">Your question</label><textarea id="care-question" rows={4} maxLength={2000} placeholder="For example: What should I ask at our next visit?" value={prompt} onChange={event => setPrompt(event.target.value)}/><p className="ai-question-count">{prompt.length} / 2,000</p>
      <div className="ai-question-chips" aria-label="Example questions"><button type="button" onClick={() => setPrompt('What details are missing from my pet’s recorded care?')}>What’s missing from the record?</button><button type="button" onClick={() => setPrompt('What questions should I ask the veterinarian about the recorded instructions?')}>Questions for my vet</button></div>
      <label className="ai-consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)}/><span>I’m 18 or older and agree to send this question and {pet?.name || 'my pet'}’s recorded care text to the clinic’s AI service. Images are not sent. Drafts are kept for seven days and do not count as veterinary approval.</span></label>
      <button type="button" className="ai-send" onClick={() => void ask()} disabled={!care.state || !pet || busy || !configured || !consent || !prompt.trim() || allowance?.dailyRemaining === 0 || allowance?.monthlyRemaining === 0}>{busy ? 'Preparing your answer…' : 'Ask about my pet'}<Send size={18}/></button>
      {error && <div role="alert" className="ai-error"><p>{error}</p><button type="button" onClick={() => { request.current = { prompt: '', id: '' }; void ask(); }} disabled={busy}>Start a new request <ArrowRight size={15}/></button></div>}
      {answer && <article className="ai-answer" aria-live="polite"><span className="ai-vet-eyebrow">A starting point for your visit</span><h3>Here’s what we found</h3><p>{answer.summary}</p>{answer.discussionTopics.length > 0 && <><h4>Questions to bring to your veterinarian</h4><ul>{answer.discussionTopics.map((topic, index) => <li key={index}><Check size={17}/><div>{topic.question}{topic.sourceId && <a href={EDUCATION.find(source => source.id === topic.sourceId)?.url} target="_blank" rel="noopener noreferrer">Read general veterinary guidance <ArrowRight size={13}/></a>}</div></li>)}</ul></>}{answer.uncertainty.map((item, index) => <p className="ai-uncertainty" key={index}>{item}</p>)}<small>No treatment, appointment, reward or care record has been changed by this answer. Follow your veterinarian’s instructions.</small></article>}
    </div>
  </section>;
}
