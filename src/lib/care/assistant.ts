import { CareError, type CareState } from './domain';

export const ASSISTANT_LIMITS = { daily: 5, monthly: 20, cooldownMs: 10000, leaseMs: 60000, attempts: 2 } as const;
export const EDUCATION = [{ id: 'aaha-skin-2023', title: 'AAHA: managing allergic skin disease', url: 'https://www.aaha.org/trends-magazine/december-2023/2023-aaha-management-of-allergic-skin-diseases-in-dogs-and-cats-guidelines/', note: 'Skin care can require ongoing assessment and communication with the veterinary team. This general guidance does not diagnose a pet or set its treatment or follow-up date.' }];
export type AssistantDraft = { summary: string; discussionTopics: { question: string; sourceId: string | null }[]; uncertainty: string[] };
export type Usage = { day: string; month: string; daily: number; monthly: number; lastAt: number; activeUntil: number };
export function usageAt(value: Usage | undefined, now: number): Usage {
  const iso = new Date(now).toISOString();
  return { day: iso.slice(0,10), month: iso.slice(0,7), daily: value?.day === iso.slice(0,10) ? value.daily : 0, monthly: value?.month === iso.slice(0,7) ? value.monthly : 0, lastAt: value?.lastAt || 0, activeUntil: value?.activeUntil || 0 };
}
export function reserveUsage(value: Usage | undefined, now: number, retry = false): Usage {
  const u = usageAt(value, now);
  if (u.activeUntil > now) throw new CareError(409, 'An answer is already being prepared. Retry shortly.');
  if (now - u.lastAt < ASSISTANT_LIMITS.cooldownMs) throw new CareError(429, 'Please wait ten seconds before another request.');
  if (!retry && (u.daily >= ASSISTANT_LIMITS.daily || u.monthly >= ASSISTANT_LIMITS.monthly)) throw new CareError(429, 'Your free allowance is used. Recorded care and wallet access remain available.');
  return {...u, daily:u.daily+(retry?0:1), monthly:u.monthly+(retry?0:1), lastAt:now, activeUntil:now+ASSISTANT_LIMITS.leaseMs};
}
export function allowance(u: Usage) { return { dailyRemaining:Math.max(0,ASSISTANT_LIMITS.daily-u.daily), monthlyRemaining:Math.max(0,ASSISTANT_LIMITS.monthly-u.monthly), dailyLimit:ASSISTANT_LIMITS.daily, monthlyLimit:ASSISTANT_LIMITS.monthly }; }
export function assistantContext(state: CareState, petId: string, now: number) {
  const pet = state.pets.find(p=>p.id===petId);
  if (!pet) throw new CareError(404,'Select a pet in this account.');
  return { pet: {name:pet.name, parentReportedHistory:pet.history || null},
    recordedInstructions:state.milestones.filter(m=>m.petId===petId && m.status!=='exempt').map(m=>({id:m.id,instructions:m.instructions,sourceRef:m.sourceRef,dueAt:m.dueAt,status:m.status})),
    unverifiedTranscriptions:state.prescriptions?.filter(p=>p.petId===petId && p.status!=='deleted' && p.expiresAt>now).map(p=>({id:p.id,version:p.revision,origin:'unverified transcription',transcript:p.versions.at(-1)?.transcript || p.extraction})) || [],
    education:EDUCATION,
  };
}
export function validateDraft(value: any): AssistantDraft {
  const bounded = (s:any,max:number) => typeof s==='string' && s.trim().length>0 && s.length<=max;
  if (!value || Object.keys(value).some(k=>!['summary','discussionTopics','uncertainty'].includes(k)) || !bounded(value.summary,1800) || !Array.isArray(value.discussionTopics) || value.discussionTopics.length>4 || !Array.isArray(value.uncertainty) || value.uncertainty.length>6) throw new CareError(502,'The assistant returned an incomplete answer. Retry without changing your care record.');
  for (const t of value.discussionTopics) if (!t || !bounded(t.question,600) || (t.sourceId!==null && !EDUCATION.some(s=>s.id===t.sourceId)) || Object.keys(t).some(k=>!['question','sourceId'].includes(k))) throw new CareError(502,'The assistant response could not be verified.');
  if (!value.uncertainty.every((s:any)=>bounded(s,500))) throw new CareError(502,'The assistant response could not be verified.');
  return value;
}
