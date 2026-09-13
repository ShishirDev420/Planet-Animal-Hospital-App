/** Server-authoritative pilot state machine. AI output is never a command. */
import { applyPrescriptionCommand, invalidatePrescription, validatePrescriptionApproval, type Prescription } from './prescriptions.js';
export type Role = 'parent' | 'coordinator' | 'veterinarian' | 'manager';
export type Actor = { uid: string; role: Role };
export type Rule = { points: number; creditPaise: number };
export type PilotConfig = { version: string; approvedBy: string; workflowName: string; rules: Record<string, Rule> };
export type Milestone = {
  id: string; petId: string; title: string; instructions: string; sourceRef: string;
  prescription?: { id: string; version: number; conflictDecision?: 'complementary' | 'replace' | 'no-other-active' };
  approvedBy: string; approvedAt: number; windowStart: number | null; dueAt: number | null;
  reminderAt: number | null; ruleId: string; rule: Rule; configVersion: string;
  status: 'approved' | 'completed' | 'exempt'; completedAt?: number; verifiedBy?: string; evidence?: string;
  walletReward?: {points:number;creditPaise:number;multiplier:number;policyVersion:string};
  booking: { status: 'none' | 'requested' | 'confirmed' | 'missed'; requestedAt?: number; requestedFor?: number; scheduledAt?: number; reference?: string };
};
export type QueueItem = { id: string; petId: string; milestoneId?: string; kind: 'scheduling' | 'missed' | 'clinical'; status: 'open' | 'resolved'; owner: string | null; nextAction: string; createdAt: number; updatedAt: number; resolution?: string };
export type CareState = {
  ownerUid: string; revision: number; pets: { id: string; name: string; history?: { breed: string; allergies: string; surgeries: string; conditions: string; origin: 'parent-reported'; updatedAt: number } }[];
  prescriptions?: Prescription[];
  milestones: Milestone[]; queues: QueueItem[];
  updates: { id: string; petId: string; text: string; createdAt: number; consent: true }[];
  ledger: { id: string; milestoneId: string; petId: string; points: number; creditPaise: number; createdAt: number; verifiedBy: string; evidence: string }[];
  entitlements: { id: string; petId: string; label: string }[];
  preferences: { inApp: boolean; external: false; snoozeUntil: number | null };
  reminders: { id: string; milestoneId: string; dueAt: number; status: 'scheduled' | 'available' | 'cancelled' }[];
};
export class CareError extends Error { constructor(public status: number, message: string) { super(message); } }
export const fail = (message: string, status = 400): never => { throw new CareError(status, message); };
export function emptyState(ownerUid: string, petName?: string): CareState {
  return { ownerUid, revision: 0, pets: petName && petName !== 'Pending' ? [{ id: 'primary', name: petName }] : [], milestones: [], queues: [], updates: [], ledger: [], entitlements: [], reminders: [], preferences: { inApp: false, external: false, snoozeUntil: null } };
}
export function roleFromClaims(claims: Record<string, unknown>): Role {
  return claims.clinicId === 'planet-animal' && ['coordinator', 'veterinarian', 'manager'].includes(String(claims.clinicRole)) ? claims.clinicRole as Role : 'parent';
}
export function assertAccess(actor: Actor, ownerUid: string) {
  if (actor.role === 'parent' && actor.uid !== ownerUid) fail('This care record belongs to another account.', 403);
}
function text(value: unknown, name: string, max = 1600): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) fail(`${name} is required (maximum ${max} characters).`);
  return (value as string).trim();
}
function id(value: unknown): string { const s = text(value, 'Identifier', 128); if (!/^[\w-]+$/.test(s) || ['__proto__','constructor','prototype'].includes(s)) fail('Invalid identifier.'); return s; }
function timestamp(value: unknown, nullable = false): number | null {
  if (nullable && value == null) return null;
  if (!Number.isSafeInteger(value) || Number(value) < 0 || Number(value) > 8640000000000000) fail('A valid recorded date is required.');
  return Number(value);
}
function requireRole(actor: Actor, roles: Role[]) { if (!roles.includes(actor.role)) fail('Your staff role cannot perform this action.', 403); }
export function validateConfig(value: unknown, actor: Actor): PilotConfig {
  requireRole(actor, ['manager']);
  const c = value as PilotConfig;
  const version = id(c?.version), workflowName = text(c?.workflowName, 'Workflow name', 160);
  if (!c.rules || !Object.keys(c.rules).length || Object.keys(c.rules).length > 10) fail('Configure 1–10 approved reward rules.');
  const rules: Record<string, Rule> = {};
  for (const [key, rule] of Object.entries(c.rules)) {
    id(key);
    if (![rule.points, rule.creditPaise].every(v => Number.isSafeInteger(v) && v >= 0 && v <= 1000000)) fail('Rewards must be non-negative integer points and paise.');
    rules[key] = { points: rule.points, creditPaise: rule.creditPaise };
  }
  return { version, workflowName, approvedBy: actor.uid, rules };
}
function queue(s: CareState, petId: string, milestoneId: string | undefined, kind: QueueItem['kind'], nextAction: string, now: number) {
  const key = `${petId}-${milestoneId || 'general'}-${kind}`;
  const existing = s.queues.find(q => q.id === key);
  if (existing) { if (existing.status !== 'open' || existing.nextAction !== nextAction) { existing.status = 'open'; existing.nextAction = nextAction; existing.updatedAt = now; } }
  else s.queues.push({ id: key, petId, ...(milestoneId ? { milestoneId } : {}), kind, status: 'open', owner: null, nextAction, createdAt: now, updatedAt: now });
}
function closeQueue(s: CareState, milestoneId: string, kinds: QueueItem['kind'][], now: number) {
  s.queues.filter(q => q.status === 'open' && q.milestoneId === milestoneId && kinds.includes(q.kind)).forEach(q => { q.status = 'resolved'; q.updatedAt = now; q.resolution = 'Care status updated'; });
}
export function reconcile(s: CareState, now: number) {
  for (const rx of s.prescriptions || []) if (rx.expiresAt <= now || rx.status === 'deleted') invalidatePrescription(s, rx.id, now);
  for (const m of s.milestones) {
    if (m.status !== 'approved') {
      s.reminders.filter(r => r.milestoneId === m.id).forEach(r => { r.status = 'cancelled'; });
      closeQueue(s, m.id, ['scheduling', 'missed'], now); continue;
    }
    if (!m.dueAt) queue(s, m.petId, m.id, 'scheduling', 'Obtain the missing approved follow-up date; ask the vet if judgment is needed.', now);
    if (m.booking.status === 'confirmed' && m.booking.scheduledAt! < now) {
      // A past appointment is unresolved attendance, not automatically a missed visit.
      queue(s, m.petId, m.id, 'missed', 'Check attendance and confirm completion or record a missed visit.', now);
    } else if (m.dueAt && now > m.dueAt && m.booking.status !== 'confirmed') queue(s, m.petId, m.id, 'missed', 'Contact the parent about the overdue recorded follow-up; preserve earned rewards.', now);
    const rid = `${m.id}-${m.approvedAt}`;
    let r = s.reminders.find(r => r.id === rid);
    if (m.reminderAt !== null && !r) { r = { id: rid, milestoneId: m.id, dueAt: m.reminderAt, status: 'scheduled' }; s.reminders.push(r); }
    if (r) {
      const enabled = s.preferences.inApp && m.booking.status !== 'confirmed';
      r.status = !enabled ? 'cancelled' : now >= Math.max(r.dueAt, s.preferences.snoozeUntil || 0) ? 'available' : 'scheduled';
    }
  }
}
export function applyCareCommand(original: CareState, actor: Actor, command: Record<string, any>, config: PilotConfig | null, now: number): CareState {
  assertAccess(actor, original.ownerUid);
  const s: CareState = structuredClone(original);
  // Expiry must be applied before a booking/completion can consume the old source.
  reconcile(s, now);
  const type = command.type;
  if (type === 'confirmPrescription' || type === 'deletePrescription') {
    applyPrescriptionCommand(s, actor, command, now);
  } else if (type === 'history') {
    if (actor.uid !== s.ownerUid || command.consent !== true) fail('Parent consent is required.',403);
    const pet = s.pets.find(p => p.id === command.petId); if (!pet) fail('Select a pet from this account.',404);
    pet.history = { breed: text(command.breed,'Breed',100), allergies: '', surgeries: '', conditions: '', origin: 'parent-reported', updatedAt: now };
    for (const field of ['allergies','surgeries','conditions'] as const) {
      if (typeof command[field] !== 'string' || command[field].length > 600) fail('History fields must be text up to 600 characters.');
      pet.history[field] = command[field].trim();
    }
  } else if (type === 'addPet') {
    const petId = id(command.petId);
    if (!s.pets.some(p => p.id === petId)) s.pets.push({ id: petId, name: text(command.name, 'Pet name', 100) });
  } else if (type === 'preferences') {
    if (actor.uid !== s.ownerUid) fail('Only the parent can consent to reminders.', 403);
    if (typeof command.inApp !== 'boolean' || command.external) fail('External messaging is not configured.');
    s.preferences = { inApp: command.inApp, external: false, snoozeUntil: timestamp(command.snoozeUntil, true) };
  } else if (type === 'tick') {
    requireRole(actor, ['coordinator', 'veterinarian', 'manager']);
  } else if (type === 'queue') {
    requireRole(actor, ['coordinator', 'veterinarian', 'manager']);
    const q = s.queues.find(q => q.id === command.queueId); if (!q) fail('Queue item not found.', 404);
    if (q.kind === 'clinical' && command.resolve) requireRole(actor, ['veterinarian']);
    if (q.owner && q.owner !== actor.uid && actor.role !== 'manager' && !(q.kind === 'clinical' && actor.role === 'veterinarian')) fail('This item is assigned to another staff member.', 409);
    q.owner = actor.uid; q.nextAction = text(command.nextAction, 'Next action', 500); q.updatedAt = now;
    if (command.resolve) { q.status = 'resolved'; q.resolution = q.nextAction; }
  } else {
    const petId = id(command.petId);
    if (!s.pets.some(p => p.id === petId)) fail('Select a pet from this account.', 404);
    if (type === 'update' || type === 'requestInstructions') {
      if (command.consent !== true) fail('Parent consent is required before sharing this update.');
      if (actor.uid !== s.ownerUid) fail('Parent updates must come from the parent.', 403);
      const updateId = id(command.id);
      if (!s.updates.some(u => u.id === updateId)) s.updates.push({ id: updateId, petId, text: text(command.text, 'Update'), createdAt: now, consent: true });
      queue(s, petId, undefined, type === 'update' ? 'clinical' : 'scheduling', type === 'update' ? 'Review the parent update. Clinical questions remain unresolved until a veterinarian reviews them.' : 'Find the recorded clinical instructions and approved dates.', now);
    } else if (type === 'approve') {
      requireRole(actor, ['veterinarian']);
      if (!config?.approvedBy) fail('Hospital-approved pilot reward configuration is unavailable.', 409);
      const milestoneId = id(command.id);
      if (s.milestones.some(m => m.id === milestoneId)) return original; // Retry cannot replace approved instructions.
      const ruleKey = id(command.ruleId); if (!Object.hasOwn(config.rules, ruleKey)) fail('Select an approved reward rule.');
      const rule = config.rules[ruleKey];
      const start = timestamp(command.windowStart, true), due = timestamp(command.dueAt, true), reminder = timestamp(command.reminderAt, true);
      if (start !== null && due !== null && start > due) fail('Approved window starts after its due date.');
      if (reminder !== null && (due === null || reminder > due)) fail('Reminder must refer to the recorded approved due date.');
      const source = command.prescriptionId ? validatePrescriptionApproval(s, command, now) : null;
      if (!source && String(command.sourceRef || '').startsWith('rx:')) fail('Prescription references require source and version validation.');
      s.milestones.push({ id: milestoneId, petId, title: text(command.title, 'Milestone title', 160), instructions: source ? source.instructions : text(command.instructions, 'Recorded instructions'), sourceRef: source ? `rx:${source.rx.id}:v${source.rx.revision}` : text(command.sourceRef, 'Clinical record reference', 250), ...(source ? {prescription:{id:source.rx.id,version:source.rx.revision,conflictDecision:source.conflictDecision}} : {}), approvedBy: actor.uid, approvedAt: now, windowStart: start, dueAt: due, reminderAt: reminder, ruleId: command.ruleId, rule: structuredClone(rule), configVersion: config.version, status: 'approved', booking: { status: 'none' } });
      if (source) { const q = s.queues.find(q=>q.id===`rx-${source.rx.id}`); if(q){q.status='resolved';q.updatedAt=now;q.resolution='Veterinarian reviewed original source and conflicts.';} }
    } else {
      const m = s.milestones.find(m => m.id === command.milestoneId && m.petId === petId); if (!m) fail('Approved milestone not found for this pet.', 404);
      if (type === 'complete') requireRole(actor, ['coordinator', 'veterinarian', 'manager']);
      if (type === 'complete' && m.status === 'completed') return original;
      if (m.status !== 'approved') fail('This milestone is already closed.', 409);
      if (type === 'book') {
        const requestedFor = timestamp(command.requestedFor)!;
        if ((m.booking.status === 'requested' && m.booking.requestedFor === requestedFor) || (m.booking.status === 'confirmed' && m.booking.scheduledAt === requestedFor)) return original;
        if (requestedFor <= now) fail('Request a future appointment time.');
        m.booking = { status: 'requested', requestedFor, requestedAt: now };
        closeQueue(s, m.id, ['missed'], now);
        queue(s, petId, m.id, 'scheduling', 'Check booking system availability; confirm only after recording a successful clinic booking reference.', now);
      } else if (type === 'confirmBooking') {
        requireRole(actor, ['coordinator', 'veterinarian', 'manager']);
        if (m.booking.status !== 'requested') fail('There is no pending appointment request.', 409);
        const scheduledAt = timestamp(command.scheduledAt)!; if (scheduledAt <= now) fail('Confirmed booking must be in the future.');
        if (!m.walletReward && command._walletReward) m.walletReward = command._walletReward;
        m.booking = { ...m.booking, status: 'confirmed', scheduledAt, reference: text(command.reference, 'Successful clinic booking reference', 150) };
        closeQueue(s, m.id, ['scheduling', 'missed'], now);
      } else if (type === 'bookingFailed') {
        requireRole(actor, ['coordinator', 'veterinarian', 'manager']);
        m.booking = { status: 'none' }; queue(s, petId, m.id, 'scheduling', text(command.reason, 'Booking failure / next action', 500), now);
      } else if (type === 'missed') {
        requireRole(actor, ['coordinator', 'veterinarian', 'manager']);
        if (m.booking.status !== 'confirmed') fail('No confirmed appointment to mark missed.', 409);
        m.booking.status = 'missed'; queue(s, petId, m.id, 'missed', 'Offer rescheduling without removing earned points.', now);
      } else if (type === 'complete') {
        requireRole(actor, ['coordinator', 'veterinarian', 'manager']);
        if(!m.walletReward && command._walletReward)m.walletReward=command._walletReward;
        const evidence = text(command.evidence, 'Hospital completion evidence', 300);
        const completedAt = timestamp(command.completedAt)!;
        if (completedAt > now || completedAt < m.approvedAt) fail('Completion must be recorded after approval and no later than now.');
        if (s.ledger.some(l => l.evidence === evidence)) fail('This completion evidence has already earned a reward.', 409);
        m.status = 'completed'; m.completedAt = completedAt; m.verifiedBy = actor.uid; m.evidence = evidence;
        if (!s.ledger.some(l => l.id === `care-${m.id}`)) s.ledger.push({ id: `care-${m.id}`, milestoneId: m.id, petId, points: m.walletReward?.points ?? m.rule.points, creditPaise: m.walletReward?.creditPaise ?? m.rule.creditPaise, createdAt: now, verifiedBy: actor.uid, evidence });
      } else if (type === 'exempt') {
        requireRole(actor, ['veterinarian']); m.status = 'exempt'; m.evidence = text(command.reason, 'Exemption reason', 300);
      } else fail('Unsupported care action.');
    }
  }
  reconcile(s, now);
  if (s.pets.length > 20 || s.milestones.length > 150 || s.updates.length > 300 || s.queues.length > 300 || s.ledger.length > 150) fail('Pilot record limit reached; contact the clinic to archive reviewed history.', 409);
  if (new TextEncoder().encode(JSON.stringify(s)).length > 750000) fail('Care record capacity reached; contact the clinic to archive history.',409);
  if (JSON.stringify(s) === JSON.stringify(original)) return original;
  s.revision++;
  return s;
}
export function careSummary(s: CareState, petId: string) {
  const pending = s.milestones.filter(m => m.petId === petId && m.status === 'approved').sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity));
  const next = pending[0];
  return next ? `${next.title}. ${next.instructions} Due: ${next.dueAt ? new Date(next.dueAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST' : 'not recorded'}. Booking: ${next.booking.status}.` : 'No approved next step is recorded. Ask the care team for instructions.';
}
export function metrics(s: CareState, now: number) {
  const due = s.milestones.filter(m => m.dueAt !== null && m.dueAt <= now && m.status !== 'exempt');
  return { scope: 'this account', due: due.length, completedInWindow: due.filter(m => m.status === 'completed' && m.completedAt! <= m.dueAt! && (m.windowStart === null || m.completedAt! >= m.windowStart)).length, pets: s.pets.length, petsWithDatedNextStep: s.pets.filter(p => s.milestones.some(m => m.petId === p.id && m.status === 'approved' && m.dueAt !== null)).length, unresolved: s.queues.filter(q => q.status === 'open').length, awards: s.ledger.length, uniqueAwards: new Set(s.ledger.map(l => l.id)).size };
}
