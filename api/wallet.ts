import { reserveWholeBill, validateRedemptionPolicy, type RedemptionPolicy } from '../src/lib/care/redemption.js';
import { createHash } from 'node:crypto';
import { database } from './care.js';
import { assertAccess, CareError, roleFromClaims, type Actor, type CareState } from '../src/lib/care/domain.js';
import { emptyWallet, finishDiscount, normalizeWallet, reserveDiscount, WALLET_POLICY, type Invoice, type Reservation, type Subscription, type Wallet } from '../src/lib/care/wallet.js';
const id=(v:unknown)=>{if(typeof v!=='string'||!/^[\w-]{1,128}$/.test(v))throw new CareError(400,'Invalid identifier.');return v;};
const hash=(v:string)=>createHash('sha256').update(v).digest('hex');
const staff=(a:Actor)=>{if(a.role==='parent')throw new CareError(403,'Clinic staff access is required.');};
export function createWalletHandler(getServices=database) {return async(req:any,res:any)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');const send=(code:number,data:unknown)=>{res.statusCode=code;res.end(JSON.stringify(data));};
 try {
  if(!['GET','POST'].includes(req.method))throw new CareError(405,'Method not allowed.');
  const token=/^Bearer (.+)$/.exec(String(req.headers.authorization||''));if(!token)throw new CareError(401,'Sign in to view your wallet.');
  const {auth,db}=getServices();let claims;try{claims=await auth.verifyIdToken(token[1],true);}catch{throw new CareError(401,'Sign in again.');}
  const actor:Actor={uid:claims.uid,role:roleFromClaims(claims)};
  if(typeof req.body==='string'&&Buffer.byteLength(req.body)>6000)throw new CareError(413,'Request too large.');
  const b=typeof req.body==='string'?JSON.parse(req.body):req.body||{},url=new URL(req.url,'http://wallet.local');
  const owner=id(b.ownerUid||url.searchParams.get('ownerUid')||actor.uid);assertAccess(actor,owner);
  const root=db.doc(`careWallets/${owner}`),now=Date.now();
  if(req.method==='GET') {
    // Lazy expiry releases unused reservations without waiting for a daily job.
    await db.runTransaction(async tx=>{
      const [w,active]=await Promise.all([tx.get(root),tx.get(root.collection('reservations').where('status','==','reserved').limit(50))]);
      if(!w.exists)return;
      const expired=active.docs.filter(d=>(d.data() as Reservation).expiresAt<=now);
      const invoices=await Promise.all(expired.map(d=>tx.get(db.doc('careInvoices/'+d.data().invoiceId))));
      let wallet=w.data() as Wallet;
      expired.forEach((d,index)=>{const r=d.data() as Reservation;const invoice=invoices[index];if(!invoice.exists||invoice.data()?.ownerUid!==owner||invoice.data()?.reservationId!==r.id)return;const next=finishDiscount(wallet,r,'release',{uid:'system:expiry',role:'coordinator'},now);wallet=next.wallet;tx.set(d.ref,next.reservation);tx.update(invoice.ref,{reservationId:null,status:'open',discountPaise:0});tx.create(root.collection('entries').doc('expire-'+r.id),{type:'expired',points:r.points,invoiceId:r.invoiceId,actorUid:'system:expiry',at:now});});
      if(expired.length)tx.set(root,wallet);
    });
    const [w,profile,care,entries,reservations,redemption]=await Promise.all([root.get(),db.doc(`users/${owner}`).get(),db.doc(`careAccounts/${owner}`).get(),root.collection('entries').orderBy('at','desc').limit(50).get(),root.collection('reservations').where('status','==','reserved').limit(50).get(),db.doc('careSettings/redemption').get()]);
    const state=care.data() as CareState|undefined;
    return send(200,{role:actor.role,wallet:w.exists?normalizeWallet(w.data() as Wallet,now):null,legacyPoints:profile.data()?.pawPoints??null,pendingPoints:state?.milestones.filter(m=>m.status==='approved'&&m.booking.status==='confirmed').reduce((n,m)=>n+(m.walletReward?.points||0),0)||0,entries:entries.docs.map(d=>({id:d.id,...d.data()})),reservations:reservations.docs.map(d=>d.data()),policy:WALLET_POLICY,redemptionPolicy:redemption.data()||null,scope:'latest 50 ledger entries; clinic credit only'});
  }
  const type=b.type;
  if(type==='configureRedemption') {
    const policy=validateRedemptionPolicy(b.policy,actor,now);
    await db.runTransaction(async tx=>{const ref=db.doc('careRedemptionPolicies/'+policy.version);if((await tx.get(ref)).exists)throw new CareError(409,'Use a new policy version. Approved versions are immutable.');tx.create(ref,policy);tx.set(db.doc('careSettings/redemption'),policy);tx.create(db.collection('careAudit').doc(),{type,actorUid:actor.uid,version:policy.version,at:now});});
    return send(200,{redemptionPolicy:policy});
  }
  if(type==='verifySubscription') {
    if(actor.role!=='manager')throw new CareError(403,'Manager access required.');
    if(!['free','essential','advanced','prestige'].includes(b.plan)||!['active','cancelled'].includes(b.status)||!Number.isSafeInteger(b.startsAt)||!Number.isSafeInteger(b.endsAt)||b.endsAt<=b.startsAt||typeof b.paymentReference!=='string'||b.paymentReference.length<3||b.paymentReference.length>200)throw new CareError(400,'Record a valid verified payment and subscription period.');
    const subscription:Subscription={plan:b.plan,status:b.status,startsAt:b.startsAt,endsAt:b.endsAt,paymentReference:b.paymentReference,verifiedBy:actor.uid};
    await db.runTransaction(async tx=>{const ref=db.doc(`careSubscriptionEvidence/${hash(b.paymentReference)}`),old=await tx.get(ref);if(old.exists&&(old.data()?.ownerUid!==owner||old.data()?.plan!==b.plan||old.data()?.startsAt!==b.startsAt||old.data()?.endsAt!==b.endsAt))throw new CareError(409,'Payment was already recorded with different membership details.');tx.set(ref,{ownerUid:owner,plan:b.plan,startsAt:b.startsAt,endsAt:b.endsAt,at:now});tx.set(db.doc(`careSubscriptions/${owner}`),subscription);tx.create(root.collection('entries').doc(),{type,subscription,actorUid:actor.uid,at:now});});return send(200,{subscription});
  }
  if(type==='registerInvoice') {
    staff(actor);if(typeof b.reference!=='string'||b.reference.length<3||b.reference.length>200||!Number.isSafeInteger(b.eligiblePaise)||b.eligiblePaise<=0||b.eligiblePaise>100000000)throw new CareError(400,'Enter the real invoice reference and eligible net amount.');
    if(b.totalPaise!==undefined&&(!Number.isSafeInteger(b.totalPaise)||b.totalPaise<b.eligiblePaise||b.totalPaise>100000000))throw new CareError(400,'Record the verified entire bill total including all items and taxes.');
    const invoiceId=hash(b.reference),ref=db.doc(`careInvoices/${invoiceId}`),invoice:Invoice={ownerUid:owner,reference:b.reference,eligiblePaise:b.eligiblePaise,...(b.totalPaise!==undefined?{totalPaise:b.totalPaise}:{}),status:'open',createdBy:actor.uid};
    await db.runTransaction(async tx=>{const old=await tx.get(ref);if(old.exists){if(old.data()?.ownerUid!==owner||old.data()?.eligiblePaise!==b.eligiblePaise||old.data()?.totalPaise!==b.totalPaise)throw new CareError(409,'Invoice already recorded with different details.');return;}tx.create(ref,invoice);tx.create(root.collection('entries').doc(),{type,invoiceId,actorUid:actor.uid,at:now});});return send(200,{invoiceId});
  }
  const result=await db.runTransaction(async tx=>{
    const previous=await tx.get(root);let wallet=previous.exists?previous.data() as Wallet:emptyWallet();
    if(type==='reconcileLegacy') {
      if(actor.role!=='manager')throw new CareError(403,'Manager reconciliation required.');
      const profile=await tx.get(db.doc(`users/${owner}`));const points=profile.data()?.pawPoints;
      if(wallet.legacyReconciled)return {wallet};
      if(!Number.isSafeInteger(points)||points<0||points!==b.expectedPoints)throw new CareError(409,'Legacy balance changed or is ambiguous. Review it before importing.');
      wallet={...wallet,points:wallet.points+points,legacyReconciled:true,revision:wallet.revision+1};
      if(!Number.isSafeInteger(wallet.points))throw new CareError(409,'Legacy balance requires manual reconciliation.');
      tx.set(root,wallet);tx.create(root.collection('entries').doc('legacy-import'),{type,points,source:'users.pawPoints',sourceValue:points,actorUid:actor.uid,at:now,policyVersion:WALLET_POLICY.version});return {wallet};
    }
    if(type==='reverseEarn') {
      staff(actor);const entryId=id(b.entryId),entryRef=root.collection('entries').doc(entryId),reversalRef=root.collection('entries').doc('refund-'+entryId);
      if(typeof b.billingReference!=='string'||b.billingReference.length<3||b.billingReference.length>200)throw new CareError(400,'Record the verified service refund reference.');
      const claimRef=db.doc('careBillingEvidence/'+hash('refund:'+b.billingReference));
      const [e,r,claim]=await Promise.all([tx.get(entryRef),tx.get(reversalRef),tx.get(claimRef)]);
      if(r.exists)return {wallet};
      if(claim.exists)throw new CareError(409,'This refund reference is already recorded.');
      const entry=e.data();if(!e.exists||entry?.type!=='earn'||entry.convertible!==true)throw new CareError(409,'This earn entry requires separate reconciliation.');
      // Never silently remove unrelated history or make a negative wallet.
      const canReverse=wallet.points-wallet.reservedPoints>=entry.points;
      if(canReverse)wallet.points-=entry.points;else wallet.reconciliationRequired=true;
      wallet.revision++;tx.set(root,wallet);tx.create(claimRef,{ownerUid:owner,entryId,at:now});
      tx.create(reversalRef,{type:'refund',entryId,points:entry.points,status:canReverse?'reversed':'reconciliation-required',billingReference:b.billingReference,actorUid:actor.uid,at:now});return {wallet};
    }
    if(type==='settleRefund') {
      if(actor.role!=='manager')throw new CareError(403,'Manager reconciliation required.');
      const ref=root.collection('entries').doc(id(b.id)),entry=await tx.get(ref);
      if(!entry.exists||entry.data()?.type!=='refund')throw new CareError(404,'Refund record not found.');
      if(entry.data()?.status==='reversed')return {wallet};
      const pending=await tx.get(root.collection('entries').where('status','==','reconciliation-required'));
      const points=entry.data()!.points;
      if(wallet.points-wallet.reservedPoints<points)throw new CareError(409,'Available points are still insufficient. Resolve the related billing discount first.');
      wallet.points-=points;wallet.reconciliationRequired=pending.size>1;wallet.revision++;
      tx.set(root,wallet);tx.update(ref,{status:'reversed',settledBy:actor.uid,settledAt:now});tx.create(root.collection('entries').doc('settle-'+id(b.id)),{type:'settleRefund',points,refundId:b.id,actorUid:actor.uid,at:now});return {wallet};
    }
    if(type==='reserve'||type==='reserveTier') {
      if(actor.uid!==owner)throw new CareError(403,'Only the parent reserves a discount.');
      const reservationId=id(b.id),invoiceId=id(b.invoiceId),rRef=root.collection('reservations').doc(reservationId),iRef=db.doc(`careInvoices/${invoiceId}`);
      const [r,i,policyDoc]=await Promise.all([tx.get(rRef),tx.get(iRef),tx.get(db.doc('careSettings/redemption'))]);
      if(r.exists){if(r.data()?.invoiceId!==invoiceId||(type==='reserveTier'?r.data()?.tierId!==b.tierId:r.data()?.points!==b.points))throw new CareError(409,'Retry does not match the original reservation.');return {wallet,reservation:r.data()};}
      if(!i.exists)throw new CareError(404,'Ask billing staff to register your invoice.');
      if(i.data()?.reservationId)throw new CareError(409,'This invoice already has a reservation.');
      if(type==='reserve'&&policyDoc.data()?.legacyCreditEnabled!==true)throw new CareError(409,'Use an activated whole-bill discount tier. Historical reservations remain available.');
      const next=type==='reserveTier'?reserveWholeBill(wallet,i.data() as Invoice,(policyDoc.data() as RedemptionPolicy)||null,id(b.tierId),reservationId,invoiceId,actor,now):reserveDiscount(wallet,i.data() as Invoice,b.points,reservationId,invoiceId,actor,now);
      tx.set(root,next.wallet);tx.create(rRef,next.reservation);tx.update(iRef,{reservationId});tx.create(root.collection('entries').doc(`reserve-${reservationId}`),{type,points:next.reservation.points,invoiceId,actorUid:actor.uid,at:now,policyVersion:next.reservation.policyVersion||WALLET_POLICY.version});return next;
    }
    if(['apply','release','reverse'].includes(type)) {
      const reservationId=id(b.id),rRef=root.collection('reservations').doc(reservationId),r=await tx.get(rRef);if(!r.exists)throw new CareError(404,'Reservation not found.');
      const current=r.data() as Reservation,iRef=db.doc(`careInvoices/${current.invoiceId}`),i=await tx.get(iRef);
      if(!i.exists||i.data()?.ownerUid!==owner)throw new CareError(409,'Invoice ownership needs reconciliation.');
      if(type!=='release'&&(typeof b.billingReference!=='string'||b.billingReference.length<3||b.billingReference.length>200))throw new CareError(400,'Record the confirmed billing adjustment reference.');
      const next=finishDiscount(wallet,current,type,actor,now);
      if(next.reservation.status===current.status)return next;
      if(type!=='release') {
        const claimRef=db.doc('careBillingEvidence/'+hash(type+':'+b.billingReference)),claim=await tx.get(claimRef);
        if(claim.exists)throw new CareError(409,'This billing adjustment is already recorded.');
        tx.create(claimRef,{ownerUid:owner,reservationId,at:now});
      }
      tx.set(root,next.wallet);tx.set(rRef,next.reservation);tx.update(iRef,{status:type==='apply'?'discounted':type==='reverse'?'cancelled':'open',reservationId:type==='release'?null:reservationId,discountPaise:type==='apply'?current.paise:0});
      tx.create(root.collection('entries').doc(`${type}-${reservationId}`),{type,points:current.points,paise:current.paise,invoiceId:current.invoiceId,billingReference:b.billingReference||null,actorUid:actor.uid,at:now,policyVersion:current.policyVersion||WALLET_POLICY.version});return next;
    }
    throw new CareError(400,'Unsupported wallet action.');
  });send(200,result);
 }catch(e){send(e instanceof CareError?e.status:503,{error:e instanceof CareError?e.message:'Wallet unavailable. No transaction is confirmed; retry the same request.'});}
};}
export default createWalletHandler();
