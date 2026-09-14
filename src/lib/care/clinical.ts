import { CareError, type Actor, type CareState } from './domain.js';
import type { Subscription } from './wallet.js';

export const ANALYSIS_DEPTH = {
  essential: { name: 'Essential Paws', label: 'Brief care roadmap', maxSections: 3, maxTokens: 2200, instruction: 'Give a brief prioritized roadmap and the most relevant profile and prescription observations.' },
  advanced: { name: 'Advanced Paws', label: 'Detailed care analysis', maxSections: 5, maxTokens: 3800, instruction: 'Connect breed, life stage, history and recorded prescriptions; explain uncertainties and follow-up questions in greater detail.' },
  prestige: { name: 'Premium Paws', label: 'Comprehensive care analysis', maxSections: 8, maxTokens: 5500, instruction: 'Provide a comprehensive synthesis, alternative interpretations for veterinarian assessment, and an evidence review using only supplied sources. Clearly separate inference from facts.' },
} as const;
export type ClinicalTier = keyof typeof ANALYSIS_DEPTH;
export type ClinicalEvidence = { id: string; title: string; excerpt: string; retrievedAt: number; citations: { url: string; title: string }[] };
export type PetDetails = { species: string; breed: string; age: string; weight: string; sex: string; diet: string; allergies: string; conditions: string; surgeries: string };
export const EMPTY_DETAILS: PetDetails = { species: '', breed: '', age: '', weight: '', sex: '', diet: '', allergies: '', conditions: '', surgeries: '' };
export type ClinicalContent = { summary: string; sections: { title: string; observation: string; basis: 'recorded' | 'inference'; sourceIds: string[] }[]; suggestedCheckups: { title: string; rationale: string; sourceIds: string[] }[]; uncertainties: string[] };
export type ClinicalAnalysis = { id: string; petId: string; tier: ClinicalTier; revision: number; status: 'pending' | 'draft' | 'approved' | 'rejected' | 'failed'; sourceHash: string; requestedAt: number; requestedBy: string; provider: string; model: string; content?: ClinicalContent; evidence?: ClinicalEvidence[]; approvedBy?: string; approvedAt?: number; reviewNote?: string; reviewedBy?: string; reviewedAt?: number };

export function clinicalTier(s: Subscription | null | undefined, now: number): ClinicalTier | null {
  if (!s || s.status !== 'active' || !s.verifiedBy || !s.paymentReference || !Number.isFinite(s.startsAt) || !Number.isFinite(s.endsAt) || s.startsAt > now || s.endsAt <= now) return null;
  return Object.hasOwn(ANALYSIS_DEPTH, s.plan) ? s.plan as ClinicalTier : null;
}
export function validateDetails(value: unknown): PetDetails {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new CareError(400, 'Enter the selected pet’s profile.');
  const out = { ...EMPTY_DETAILS };
  for (const key of Object.keys(out) as (keyof PetDetails)[]) {
    const v = (value as any)[key];
    if (typeof v !== 'string' || v.length > 1200) throw new CareError(400, 'Each profile field must be text under 1,200 characters.');
    out[key] = v.trim();
  }
  return out;
}
export function clinicalContext(state: CareState, petId: string, details: PetDetails, now: number) {
  const pet = state.pets.find(p => p.id === petId);
  if (!pet) throw new CareError(404, 'Select a pet belonging to this account.');
  return {
    pet: { id: pet.id, name: pet.name, profile: details, profileOrigin: 'parent-reported, not clinically verified', history: pet.history || null },
    recordedCare: state.milestones.filter(m => m.petId === petId && m.status !== 'exempt' && (!m.prescription || state.prescriptions?.some(p => p.id === m.prescription!.id && p.petId === petId && p.status === 'confirmed' && p.expiresAt > now && p.revision === m.prescription!.version))).map(m => ({ id: 'care:' + m.id, title: m.title, instructions: m.instructions, sourceRef: m.sourceRef, approvedBy: m.approvedBy, approvedAt: m.approvedAt, dueAt: m.dueAt, status: m.status })),
    prescriptions: (state.prescriptions || []).filter(p => p.petId === petId && p.status !== 'deleted' && p.expiresAt > now).map(p => ({ id: 'rx:' + p.id, revision: p.revision, origin: 'unverified transcription; confirm against the clinical record', text: p.versions.at(-1)?.transcript || p.extraction })),
    parentUpdates: state.updates.filter(u => u.petId === petId).map(u => ({ id: 'update:' + u.id, text: u.text, at: u.createdAt, origin: 'parent-reported' })),
    evidence: [] as ClinicalEvidence[],
  };
}
export type ClinicalContext = ReturnType<typeof clinicalContext>;
export function sourceIds(context: ClinicalContext) { return ['profile', ...context.recordedCare.map(x => x.id), ...context.prescriptions.map(x => x.id), ...context.parentUpdates.map(x => x.id), ...context.evidence.map(x => x.id)]; }
export function validateClinicalContent(value: any, tier: ClinicalTier, ids: string[]): ClinicalContent {
  const fail = (): never => { throw new CareError(502, 'The care analysis is incomplete or cites unavailable evidence. It has not been published.'); };
  const text = (s: unknown, max: number) => typeof s === 'string' && s.trim().length > 0 && s.length <= max;
  const keys = (o: any, allowed: string[]) => o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).every(k => allowed.includes(k));
  const sources = (v: any) => Array.isArray(v) && v.length > 0 && v.length <= 12 && v.every((id: any) => typeof id === 'string' && ids.includes(id));
  if (!keys(value, ['summary','sections','suggestedCheckups','uncertainties']) || !text(value.summary, 2400) || !Array.isArray(value.sections) || !value.sections.length || value.sections.length > ANALYSIS_DEPTH[tier].maxSections || !Array.isArray(value.suggestedCheckups) || value.suggestedCheckups.length > 5 || !Array.isArray(value.uncertainties) || value.uncertainties.length > 10) fail();
  for (const s of value.sections) if (!keys(s, ['title','observation','basis','sourceIds']) || !text(s.title,160) || !text(s.observation,1800) || !['recorded','inference'].includes(s.basis) || !sources(s.sourceIds)) fail();
  for (const s of value.suggestedCheckups) if (!keys(s,['title','rationale','sourceIds']) || !text(s.title,160) || !text(s.rationale,1200) || !sources(s.sourceIds)) fail();
  if (!value.uncertainties.every((s:any) => text(s,600))) fail();
  return structuredClone(value);
}
export function reviewAnalysis(analysis: ClinicalAnalysis, actor: Actor, action: 'edit' | 'approve' | 'reject', expectedRevision: number, currentHash: string, content: unknown, note: unknown, ids: string[], now: number): ClinicalAnalysis {
  if (actor.role !== 'veterinarian') throw new CareError(403, 'Only a verified veterinarian can review clinical analysis.');
  if (analysis.revision !== expectedRevision) throw new CareError(409, 'Another review changed this analysis. Reload before reviewing.');
  if (!['draft','approved'].includes(analysis.status)) throw new CareError(409, 'This analysis is not available for review.');
  if (action !== 'reject' && analysis.sourceHash !== currentHash) throw new CareError(409, 'The pet’s sources changed. Request a fresh analysis before approval.');
  if (typeof note !== 'string' || !note.trim() || note.length > 1600) throw new CareError(400, 'Record your review note.');
  const next: ClinicalAnalysis = { ...analysis, revision: analysis.revision + 1, reviewNote: note.trim(), reviewedBy: actor.uid, reviewedAt: now };
  delete next.approvedBy; delete next.approvedAt;
  if (action === 'reject') next.status = 'rejected';
  else {
    next.content = validateClinicalContent(content, analysis.tier, [...ids,...(analysis.evidence || []).map(e=>e.id)]);
    next.status = action === 'approve' ? 'approved' : 'draft';
    if (action === 'approve') { next.approvedBy = actor.uid; next.approvedAt = now; }
  }
  return next;
}
/** Parent and non-vet payloads never contain draft text, internal review notes or rejected advice. */
export function visibleAnalysis(a: ClinicalAnalysis, role: Actor['role'], currentHash: string) {
  const stale = a.sourceHash !== currentHash;
  if (role === 'veterinarian') return { ...a, stale };
  const approved = a.status === 'approved' && !stale && !!a.approvedBy && !!a.approvedAt;
  return { id: a.id, petId: a.petId, tier: a.tier, revision: a.revision, requestedAt: a.requestedAt, status: stale ? 'needs-refresh' : a.status, ...(approved ? { content: a.content, evidence: a.evidence || [], approvedBy: a.approvedBy, approvedAt: a.approvedAt } : {}) };
}
export function approvedAnalysisText(value: ReturnType<typeof visibleAnalysis>): string | null {
  if (value.status !== 'approved' || !value.approvedBy || !value.approvedAt || !value.content || ('stale' in value && value.stale)) return null;
  return [value.content.summary, ...value.content.sections.map(s => `${s.title}. ${s.observation}`), ...value.content.suggestedCheckups.map(s => `${s.title}. ${s.rationale}`), ...value.content.uncertainties].join('\n\n');
}
