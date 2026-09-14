import test from 'node:test';
import assert from 'node:assert/strict';
import { reserveWholeBill, validateRedemptionPolicy } from '../src/lib/care/redemption';
import { emptyWallet, finishDiscount } from '../src/lib/care/wallet';
import { emptyState, applyCareCommand } from '../src/lib/care/domain';
const now=Date.now(),manager={uid:'manager',role:'manager'} as const,parent={uid:'parent',role:'parent'} as const;
const config={version:'synthetic-only',basis:'entire-bill',status:'active',tiers:[{id:'fixture',points:300,percent:10}],confirmCommercialApproval:true};
test('whole-bill tiers require explicit manager approval; draft rates cannot redeem',()=>{
 assert.throws(()=>validateRedemptionPolicy(config,parent,now));
 assert.throws(()=>validateRedemptionPolicy({...config,confirmCommercialApproval:false},manager,now));
 const draft=validateRedemptionPolicy({...config,status:'draft'},manager,now);
 assert.throws(()=>reserveWholeBill({...emptyWallet(),points:500},{ownerUid:'parent',reference:'fixture',eligiblePaise:10000,totalPaise:200000,status:'open',createdBy:'staff'},draft,'fixture','r','i',parent,now));
});
test('threshold consumes exact points for percent of ENTIRE bill, snapshots policy, and reverses once',()=>{
 const policy=validateRedemptionPolicy(config,manager,now);
 const r=reserveWholeBill({...emptyWallet(),points:500},{ownerUid:'parent',reference:'fixture',eligiblePaise:10000,totalPaise:200000,status:'open',createdBy:'staff'},policy,'fixture','r','i',parent,now);
 assert.equal(r.reservation.paise,20000);assert.equal(r.wallet.reservedPoints,300);assert.equal(r.reservation.policyVersion,policy.version);
 const applied=finishDiscount(r.wallet,r.reservation,'apply',manager,now);assert.equal(applied.wallet.points,200);
 assert.deepEqual(finishDiscount(applied.wallet,applied.reservation,'apply',manager,now),applied);
 const reversed=finishDiscount(applied.wallet,applied.reservation,'reverse',manager,now);assert.equal(reversed.wallet.points,500);
 assert.deepEqual(finishDiscount(reversed.wallet,reversed.reservation,'reverse',manager,now),reversed);
});
test('missing entire total, cross-owner and insufficient points cannot reserve',()=>{
 const policy=validateRedemptionPolicy(config,manager,now),invoice={ownerUid:'parent',reference:'fixture',eligiblePaise:10000,status:'open' as const,createdBy:'staff'};
 assert.throws(()=>reserveWholeBill({...emptyWallet(),points:500},invoice,policy,'fixture','r','i',parent,now));
 assert.throws(()=>reserveWholeBill({...emptyWallet(),points:500},{...invoice,totalPaise:200000,ownerUid:'other'},policy,'fixture','r','i',parent,now));
 assert.throws(()=>reserveWholeBill({...emptyWallet(),points:299},{...invoice,totalPaise:200000},policy,'fixture','r','i',parent,now));
});
test('proactive checkup request is idempotent, queues coordination and never awards points',()=>{
 const s=emptyState('parent','Synthetic Pet'),command={type:'requestCheckup',id:'request-fixture',petId:'primary',text:'Please arrange a checkup.',consent:true};
 const next=applyCareCommand(s,parent,command,null,now),again=applyCareCommand(next,parent,command,null,now);
 assert.equal(again.updates.length,1);assert.equal(again.queues.length,1);assert.equal(again.ledger.length,0);assert.equal(again.milestones.length,0);assert.equal(again.queues[0].kind,'scheduling');
});
