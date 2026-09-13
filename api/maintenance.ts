import { createHash, timingSafeEqual } from 'node:crypto';
import { getStorage } from 'firebase-admin/storage';
import { FieldPath } from 'firebase-admin/firestore';
import { database } from './care';
import { reconcile, type CareState } from '../src/lib/care/domain';
const digest=(v:string)=>createHash('sha256').update(v).digest();
export default async function maintenance(req:any,res:any) {
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
 const send=(code:number,data:unknown)=>{res.statusCode=code;res.end(JSON.stringify(data));};
 const expected=process.env.CRON_SECRET;
 if(req.method!=='GET'||!expected||!timingSafeEqual(digest(String(req.headers.authorization||'')),digest('Bearer '+expected)))return send(401,{error:'Scheduled service authorization required.'});
 try {
  const {db,app}=database();if(!process.env.CARE_PRIVATE_BUCKET)throw Error('Storage unavailable');
  const bucket=getStorage(app).bucket(process.env.CARE_PRIVATE_BUCKET),jobRef=db.doc('careMaintenance/retention'),started=Date.now();
  let cursor=(await jobRef.get()).data()?.cursor||null,processed=0,deleted=0;
  do {
   let query=db.collection('careAccounts').orderBy(FieldPath.documentId()).limit(50);if(cursor)query=query.startAfter(cursor);
   const page=await query.get();
   for(const doc of page.docs) {
    const stale=(doc.data() as CareState).prescriptions?.filter(p=>p.expiresAt<=Date.now()||p.status==='deleted')||[];
    for(const p of stale)await bucket.file(p.objectPath).delete({ignoreNotFound:true});
    if(stale.length)await db.runTransaction(async tx=>{const current=await tx.get(doc.ref),s=current.data() as CareState;let changed=false;for(const p of s.prescriptions||[])if((p.expiresAt<=Date.now()||p.status==='deleted')&&(p.extraction||p.versions.length||p.status!=='deleted')){p.status='deleted';p.deletedAt=Date.now();p.extraction=null;p.versions=[];p.revision++;changed=true;deleted++;}if(changed){s.revision++;reconcile(s,Date.now());tx.set(doc.ref,s);for(const q of s.queues)tx.set(db.doc('careQueue/'+digest(s.ownerUid+':'+q.id).toString('hex')),{...q,ownerUid:s.ownerUid});tx.create(db.collection('careAudit').doc(),{type:'retention',actorUid:'system:retention',ownerUid:s.ownerUid,at:Date.now()});}});
    processed++;cursor=doc.id;
    if(Date.now()-started>40000)break;
   }
   if(page.empty||page.size<50&&cursor===page.docs.at(-1)?.id)cursor=null;
   await jobRef.set({cursor,lastRunAt:Date.now(),processed,deleted,needsContinuation:!!cursor});
  }while(cursor&&Date.now()-started<40000);
  return send(200,{processed,deleted,needsContinuation:!!cursor});
 }catch{return send(503,{error:'Retention maintenance incomplete. Retry is safe; expired source access remains blocked.'});}
}
