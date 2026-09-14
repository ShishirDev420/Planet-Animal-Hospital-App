import { CareError, type Actor } from './domain.js';
export const WALLET_POLICY={version:'clinic-2026-09-13',paisePerPoint:25,maxInvoiceDiscountPaise:25000,maxInvoicePercent:10,maxMonthlyDiscountPaise:100000,reservationMs:15*60*1000};
export const SERVICE_POINTS={general_checkup:1000,grooming:800,vaccinations:750,ear_cleaning:200,haircut:200};
export type Subscription={plan:'free'|'essential'|'advanced'|'prestige';status:'active'|'cancelled';startsAt:number;endsAt:number;paymentReference:string;verifiedBy:string};
export function verifiedMultiplier(s:Subscription|null,now:number) {return s?.status==='active' && s.verifiedBy && s.paymentReference && s.startsAt<=now && s.endsAt>now ? ({free:1,essential:1,advanced:1.5,prestige:2}[s.plan] || 1):1;}
export type Wallet={points:number;reservedPoints:number;monthlyPaise:number;month:string;legacyReconciled:boolean;revision:number;reconciliationRequired?:boolean};
export type Invoice={ownerUid:string;eligiblePaise:number;totalPaise?:number;reference:string;status:'open'|'discounted'|'cancelled';createdBy:string;discountPaise?:number};
export type Reservation={id:string;invoiceId:string;points:number;paise:number;status:'reserved'|'applied'|'released'|'reversed';expiresAt:number;month:string;actorUid:string;basis?:'entire-bill';totalPaise?:number;percent?:number;tierId?:string;policyVersion?:string};
export const emptyWallet=():Wallet=>({points:0,reservedPoints:0,monthlyPaise:0,month:'',legacyReconciled:false,revision:0});
export function normalizeWallet(w:Wallet,now:number):Wallet {const month=new Date(now).toISOString().slice(0,7);return {...w,month,monthlyPaise:w.month===month?w.monthlyPaise:0};}
export function reserveDiscount(w:Wallet,invoice:Invoice,points:unknown,id:string,invoiceId:string,actor:Actor,now:number) {
  const wallet=normalizeWallet(w,now);
  if(invoice.ownerUid!==actor.uid)throw new CareError(403,'This invoice belongs to another account.');
  if(wallet.reconciliationRequired)throw new CareError(409,'The clinic must reconcile a refunded reward before another redemption.');
  if(invoice.status!=='open')throw new CareError(409,'This invoice is not open for a discount.');
  if(!Number.isSafeInteger(points)||Number(points)<=0)throw new CareError(400,'Choose a positive whole number of points.');
  const amount=Number(points),paise=amount*WALLET_POLICY.paisePerPoint;
  const cap=Math.min(Math.floor(invoice.eligiblePaise*WALLET_POLICY.maxInvoicePercent/100),WALLET_POLICY.maxInvoiceDiscountPaise,WALLET_POLICY.maxMonthlyDiscountPaise-wallet.monthlyPaise);
  if(amount>wallet.points-wallet.reservedPoints)throw new CareError(409,'Not enough available points. Pending booking points cannot be spent.');
  if(paise>cap)throw new CareError(409,'Discount exceeds the clinic invoice or monthly limit.');
  wallet.reservedPoints+=amount;wallet.monthlyPaise+=paise;wallet.revision++;
  const reservation:Reservation={id,invoiceId,points:amount,paise,status:'reserved',expiresAt:now+WALLET_POLICY.reservationMs,month:wallet.month,actorUid:actor.uid};
  return {wallet,reservation};
}
export function finishDiscount(w:Wallet,r:Reservation,action:'apply'|'release'|'reverse',actor:Actor,now:number) {
  const wallet=normalizeWallet(w,now),reservation={...r};
  if(action!=='release' && actor.role==='parent')throw new CareError(403,'Billing staff must confirm invoice changes.');
  if(action==='apply') {
    if(r.status==='applied')return {wallet,reservation};
    if(r.status!=='reserved'||r.expiresAt<=now||r.month!==wallet.month)throw new CareError(409,'Reservation expired or closed. Release it and reserve again.');
    wallet.points-=r.points;wallet.reservedPoints-=r.points;reservation.status='applied';
  } else if(action==='release') {
    if(r.status==='released')return {wallet,reservation};
    if(r.status!=='reserved')throw new CareError(409,'Only a pending reservation can be released.');
    wallet.reservedPoints-=r.points;if(r.month===wallet.month)wallet.monthlyPaise-=r.paise;reservation.status='released';
  } else {
    if(r.status==='reversed')return {wallet,reservation};
    if(r.status!=='applied')throw new CareError(409,'Only an applied discount can be reversed.');
    wallet.points+=r.points;if(r.month===wallet.month)wallet.monthlyPaise-=r.paise;reservation.status='reversed';
  }
  if(wallet.points<0||wallet.reservedPoints<0||wallet.monthlyPaise<0)throw new CareError(409,'Wallet reconciliation is required.');
  wallet.revision++;return {wallet,reservation};
}
