import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldPath, getFirestore } from 'firebase-admin/firestore';
import { createHash, timingSafeEqual } from 'node:crypto';
import { applyCareCommand, assertAccess, CareError, emptyState, metrics, reconcile, roleFromClaims, validateConfig, type Actor, type CareState, type PilotConfig } from '../src/lib/care/domain';

export function database() {
  if (!process.env.CARE_FIREBASE_PROJECT_ID || !process.env.CARE_FIRESTORE_DATABASE_ID) throw new CareError(503, 'The care service is not configured. Please contact the clinic.');
  const app = getApps().find(a => a.name === 'care-service') || initializeApp({
    projectId: process.env.CARE_FIREBASE_PROJECT_ID,
    credential: process.env.CARE_FIREBASE_SERVICE_ACCOUNT_JSON ? cert(JSON.parse(process.env.CARE_FIREBASE_SERVICE_ACCOUNT_JSON)) : applicationDefault(),
  }, 'care-service');
  return { auth: getAuth(app), db: getFirestore(app, process.env.CARE_FIRESTORE_DATABASE_ID), app };
}
const validId = (value: unknown) => { if (typeof value !== 'string' || !/^[\w-]{1,128}$/.test(value)) throw new CareError(400, 'Invalid record identifier.'); return value; };
const digest = (s: string) => createHash('sha256').update(s).digest('hex');
function jobAuthorized(value: unknown) {
  const expected = process.env.CARE_JOB_TOKEN;
  return typeof value === 'string' && !!expected && timingSafeEqual(Buffer.from(digest(value)), Buffer.from(digest(expected)));
}

/** Same endpoint in Vercel and the local Vite middleware. Never accepts client roles. */
export function createCareHandler(getServices: () => Pick<ReturnType<typeof database>, 'auth' | 'db'> = database) {
return async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  const send = (status: number, data: unknown) => { res.statusCode = status; res.end(JSON.stringify(data)); };
  try {
    if (!['GET', 'POST'].includes(req.method)) return send(405, { error: 'Method not allowed.' });
    const { auth, db } = getServices();
    let body = req.body || {};
    if (typeof body === 'string') { if (Buffer.byteLength(body) > 20000) throw new CareError(413, 'Request too large.'); body = JSON.parse(body); }
    if (!body || Array.isArray(body) || typeof body !== 'object' || Buffer.byteLength(JSON.stringify(body)) > 20000) throw new CareError(400, 'Invalid care request.');
    const job = req.method === 'POST' && body.type === 'runDueJobs' && jobAuthorized(req.headers['x-care-job-token']);
    let actor: Actor;
    if (job) actor = { uid: 'care-job', role: 'coordinator' };
    else {
      const match = /^Bearer (.+)$/.exec(String(req.headers.authorization || ''));
      if (!match) throw new CareError(401, 'Sign in to use the care service.');
      let claims;
      try { claims = await auth.verifyIdToken(match[1], true); } catch { throw new CareError(401, 'Your session could not be verified. Sign in again.'); }
      actor = { uid: claims.uid, role: roleFromClaims(claims) };
    }
    const url = new URL(req.url, 'http://care.local');
    const ownerUid = validId(body.ownerUid || url.searchParams.get('ownerUid') || actor.uid);
    const configDoc = await db.doc('careSettings/pilot').get();
    const config: PilotConfig | null = configDoc.exists ? configDoc.data() as PilotConfig : null;
    if (req.method === 'GET' && url.searchParams.get('view') === 'queue') {
      if (actor.role === 'parent') throw new CareError(403, 'Staff access required.');
      const kind = url.searchParams.get('kind') || 'scheduling';
      if (!['scheduling', 'missed', 'clinical'].includes(kind)) throw new CareError(400, 'Invalid queue.');
      let query = db.collection('careQueue').where('kind', '==', kind).where('status', '==', 'open').orderBy(FieldPath.documentId()).limit(50);
      const cursor = url.searchParams.get('cursor'); if (cursor) query = query.startAfter(validId(cursor));
      const page = await query.get();
      return send(200, { role: actor.role, items: page.docs.map(d => ({ ...d.data(), recordId: d.id })), nextCursor: page.size === 50 ? page.docs.at(-1)!.id : null, scope: '50-item page; use next page for more' });
    }
    if (req.method === 'POST' && body.type === 'configure') {
      const approved = validateConfig(body.config, actor);
      await db.runTransaction(async tx => {
        const ref = db.doc(`careConfigs/${approved.version}`);
        if ((await tx.get(ref)).exists) throw new CareError(409, 'Use a new configuration version; approved versions are immutable.');
        tx.create(ref, { ...approved, approvedAt: Date.now() }); tx.set(db.doc('careSettings/pilot'), approved);
      });
      return send(200, { config: approved });
    }
    const mutate = async (uid: string, command: Record<string, unknown>, effectiveActor: Actor) => db.runTransaction(async tx => {
      const ref = db.doc(`careAccounts/${uid}`);
      const previous = await tx.get(ref);
      const profile = previous.exists ? null : await tx.get(db.doc(`users/${uid}`));
      const state = previous.exists ? previous.data() as CareState : emptyState(uid, profile?.data()?.petName);
      const next = applyCareCommand(state, effectiveActor, command, config, Date.now());
      if (next === state) return state;
      const additions = next.ledger.filter(l => !state.ledger.some(old => old.id === l.id));
      // A reused clinic completion reference cannot earn points in another account either.
      for (const entry of additions) {
        const claim = db.doc(`careEvidence/${digest(entry.evidence)}`);
        if ((await tx.get(claim)).exists) throw new CareError(409, 'That clinic completion reference has already earned a reward.');
      }
      for (const entry of additions) tx.create(db.doc(`careEvidence/${digest(entry.evidence)}`), { ownerUid: uid, milestoneId: entry.milestoneId, createdAt: entry.createdAt });
      tx.set(ref, next);
      for (const q of next.queues) if (JSON.stringify(q) !== JSON.stringify(state.queues.find(old => old.id === q.id))) tx.set(db.doc(`careQueue/${digest(uid + ':' + q.id)}`), { ...q, ownerUid: uid });
      if (next.revision !== state.revision) tx.create(db.collection('careAudit').doc(), { ownerUid: uid, actorUid: effectiveActor.uid, role: effectiveActor.role, type: command.type, revision: next.revision, at: Date.now() });
      return next;
    });
    if (req.method === 'POST' && body.type === 'runDueJobs') {
      if (!job && actor.role !== 'manager') throw new CareError(403, 'Scheduled job or manager access required.');
      let query = db.collection('careAccounts').orderBy(FieldPath.documentId()).limit(100);
      if (body.cursor) query = query.startAfter(validId(body.cursor));
      const page = await query.get();
      for (const record of page.docs) await mutate(record.id, { type: 'tick' }, actor);
      return send(200, { processed: page.size, nextCursor: page.size === 100 ? page.docs.at(-1)!.id : null, delivery: 'in-app only; no external messages sent' });
    }
    assertAccess(actor, ownerUid);
    if (req.method === 'POST') {
      if (body.type === 'deletePrescription') throw new CareError(400, 'Use the private prescription deletion endpoint.');
      const state = await mutate(ownerUid, body, actor);
      return send(200, { state, role: actor.role, config, metrics: metrics(state, Date.now()) });
    }
    const record = await db.doc(`careAccounts/${ownerUid}`).get();
    const profile = record.exists ? null : await db.doc(`users/${ownerUid}`).get();
    const state = record.exists ? record.data() as CareState : emptyState(ownerUid, profile?.data()?.petName);
    reconcile(state, Date.now());
    return send(200, { state, role: actor.role, config, metrics: metrics(state, Date.now()), integrations: { booking: 'staff-recorded clinic booking reference', reminders: 'in-app only', externalMessaging: false } });
  } catch (error) {
    if (error instanceof CareError) return send(error.status, { error: error.message });
    // Never leak clinical payloads, tokens, credentials or raw provider errors.
    return send(503, { error: 'The care service could not complete this request. Nothing is confirmed; please retry or contact the clinic.' });
  }
}
}
export default createCareHandler();
