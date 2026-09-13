import { CareError, type Actor, type CareState } from './domain.js';

export type Reading = { value: string | null; confidence: 'high' | 'medium' | 'low'; sourceQuote: string | null };
export type Transcript = { petName: Reading; medications: Reading; instructions: Reading; followUp: Reading };
export type Prescription = {
  id: string; petId: string; hash: string; objectPath: string; mime: string;
  createdAt: number; expiresAt: number; consentAt: number;
  status: 'uploading' | 'review' | 'confirmed' | 'deleted';
  extraction: Transcript | null; provider: string | null; ocrStatus: 'pending' | 'ready' | 'unavailable';
  versions: { version: number; petId: string; transcript: Transcript; actorUid: string; at: number; origin: 'parent-transcription' }[];
  revision: number; deletedAt?: number;
  attempts?: number; lastAttemptAt?: number;
};
export const blankReading = (): Reading => ({ value: null, confidence: 'low', sourceQuote: null });
export const blankTranscript = (): Transcript => ({ petName: blankReading(), medications: blankReading(), instructions: blankReading(), followUp: blankReading() });
function reconcileBooking(s: CareState, m: CareState['milestones'][number], now: number) {
  if(m.booking.status!=='confirmed')return;
  const queueId=`rx-booking-${m.id}`;
  if(!s.queues.some(q=>q.id===queueId))s.queues.push({id:queueId,petId:m.petId,kind:'scheduling',status:'open',owner:null,nextAction:`Source changed. Reconcile existing clinic booking ${m.booking.reference || 'reference unavailable'} before arranging replacement care.`,createdAt:now,updatedAt:now});
}
const keys = ['petName', 'medications', 'instructions', 'followUp'] as const;
function reject(message: string, status = 400): never { throw new CareError(status, message); }
export function normalizeTranscript(input: unknown): Transcript {
  if (!input || typeof input !== 'object') reject('A structured transcription is required.');
  const result = blankTranscript();
  for (const key of keys) {
    const r = (input as any)[key];
    if (!r || !['high','medium','low'].includes(r.confidence)) reject('Every field needs a visible confidence level.');
    for (const value of [r.value,r.sourceQuote]) if (value !== null && (typeof value !== 'string' || value.length > 1600)) reject('Transcription fields must be text or null, up to 1600 characters.');
    const value = r.value?.trim() || null, sourceQuote = r.sourceQuote?.trim() || null;
    // Confidence is a reading estimate, never clinical approval. No date or dose inference.
    result[key] = { value, sourceQuote, confidence: value && sourceQuote ? r.confidence : 'low' };
  }
  return result;
}
export function invalidatePrescription(s: CareState, prescriptionId: string, now: number) {
  let changed = false;
  for (const m of s.milestones) if (m.prescription?.id === prescriptionId && m.status === 'approved') {
    changed = true;
    reconcileBooking(s,m,now);
    m.status = 'exempt'; m.evidence = 'Source changed or deleted; clinical review required.';
  }
  const queue = s.queues.find(q => q.id === `rx-${prescriptionId}`);
  if (queue && changed) { queue.status = 'open'; queue.updatedAt = now; queue.nextAction = 'Review source changes and reconcile any existing clinic booking before replacing care.'; }
}
export function prescriptionQueue(s: CareState, rx: Prescription, now: number) {
  const existing = s.queues.find(q => q.id === `rx-${rx.id}`);
  if (existing) { existing.petId = rx.petId; existing.status = 'open'; existing.updatedAt = now; }
  else s.queues.push({ id: `rx-${rx.id}`, petId: rx.petId, kind: 'clinical', status: 'open', owner: null, nextAction: 'Compare the original prescription, pet association and uncertain transcription. Resolve conflicts before approving recorded follow-up.', createdAt: now, updatedAt: now });
}
export function applyPrescriptionCommand(s: CareState, actor: Actor, c: Record<string, any>, now: number) {
  if (actor.uid !== s.ownerUid) reject('Only the parent can confirm, correct or delete their source.', 403);
  const rx = s.prescriptions?.find(r => r.id === c.prescriptionId);
  if (!rx) reject('Prescription not found in this account.',404);
  if (c.type === 'deletePrescription' && rx.status === 'deleted') return;
  if (rx.revision !== c.expectedRevision) reject('This source changed. Refresh before saving.',409);
  if (rx.status === 'deleted') reject('This source has been deleted.',409);
  if (c.type === 'deletePrescription') {
    invalidatePrescription(s,rx.id,now);
    rx.status = 'deleted'; rx.deletedAt = now; rx.extraction = null; rx.versions = []; rx.revision++;
    return;
  }
  if (rx.status === 'uploading' || rx.expiresAt <= now) reject('The source is unavailable or expired.',409);
  if (c.consent !== true) reject('Confirm the transcription and selected pet before saving.');
  if (!s.pets.some(p => p.id === c.petId)) reject('Select a pet from this account.',404);
  if (rx.versions.length >= 5) reject('Five versions reached; ask the clinic to archive this source.',409);
  const transcript = normalizeTranscript(c.transcript);
  invalidatePrescription(s,rx.id,now);
  rx.petId = c.petId; rx.revision++; rx.status = 'confirmed';
  rx.versions.push({ version: rx.revision, petId: rx.petId, transcript, actorUid: actor.uid, at: now, origin: 'parent-transcription' });
  prescriptionQueue(s,rx,now);
}
export function validatePrescriptionApproval(s: CareState, c: Record<string, any>, now: number) {
  const rx = s.prescriptions?.find(r => r.id === c.prescriptionId);
  if (!rx || rx.petId !== c.petId || rx.status !== 'confirmed' || rx.expiresAt <= now || rx.revision !== c.prescriptionVersion) reject('Use the current confirmed source for this account and pet.',409);
  const latest = rx.versions.at(-1)!;
  if (c.sourceReviewed !== true || c.conflictsReviewed !== true) reject('Review the original source, uncertainty and conflicting prescriptions.');
  if (!latest.transcript.instructions.value) reject('No recorded follow-up instructions. Correct the transcription first.');
  if (c.dueAt != null && !latest.transcript.followUp.value) reject('The source has no follow-up date. Leave clinical dates empty.');
  if (s.milestones.some(m => m.prescription?.id === rx.id && m.prescription.version === rx.revision)) reject('This source version already has a recorded milestone.',409);
  const other = s.milestones.filter(m=>m.petId===rx.petId && m.status==='approved' && m.prescription && m.prescription.id!==rx.id);
  if(other.length && !['complementary','replace'].includes(c.conflictAction)) reject('Choose whether other active prescription steps remain appropriate or are replaced.',409);
  if(c.conflictAction==='replace') for(const m of other) {reconcileBooking(s,m,now);m.status='exempt';m.evidence='Veterinarian replaced this step after reviewing a newer prescription.';}
  return { rx, instructions: latest.transcript.instructions.value, conflictDecision: other.length ? c.conflictAction as 'complementary'|'replace' : 'no-other-active' as const };
}
