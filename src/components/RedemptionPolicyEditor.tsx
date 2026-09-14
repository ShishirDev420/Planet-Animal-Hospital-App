import { useState } from 'react';
type TierRow = {id:string;points:string;percent:string};
export default function RedemptionPolicyEditor({ onSave, busy }: { onSave: (policy: unknown) => void; busy: boolean }) {
  const [version,setVersion]=useState(''),[tiers,setTiers]=useState<TierRow[]>([]),[approved,setApproved]=useState(false);
  const field='mt-1 w-full min-w-0 rounded-xl border border-white/20 bg-black/20 p-3';
  const change=(id:string,key:'points'|'percent',value:string)=>{setTiers(rows=>rows.map(r=>r.id===id?{...r,[key]:value}:r));setApproved(false);};
  const save=(status:'draft'|'active')=>onSave({version,basis:'entire-bill',status,tiers:tiers.map(t=>({id:t.id,points:Number(t.points),percent:Number(t.percent)})),confirmCommercialApproval:approved});
  const valid=tiers.every(t=>Number.isSafeInteger(Number(t.points))&&Number(t.points)>0&&Number.isInteger(Number(t.percent))&&Number(t.percent)>0&&Number(t.percent)<=100);
  return <details className="mt-5 border-t border-white/15 pt-4"><summary className="font-semibold cursor-pointer">Manager · whole-bill redemption policy</summary>
    <p className="text-sm text-white/70 mt-3">Set the points needed for each discount. Each use consumes those points and discounts the entire recorded invoice, including all items and taxes. Earlier reservations keep their original terms.</p>
    <label className="block mt-3 text-sm">New policy version<input className={field} value={version} maxLength={100} onChange={e=>{setVersion(e.target.value);setApproved(false);}} placeholder="A unique name for this policy"/></label>
    <div className="space-y-3 mt-4">{tiers.map((tier,index)=><fieldset key={tier.id} className="rounded-xl border border-white/15 p-3"><legend className="px-2 text-sm">Discount tier {index+1}</legend><div className="grid grid-cols-2 gap-3"><label className="text-sm">Points needed<input type="number" min="1" step="1" className={field} value={tier.points} onChange={e=>change(tier.id,'points',e.target.value)}/></label><label className="text-sm">Entire bill discount %<input type="number" min="1" max="100" step="1" className={field} value={tier.percent} onChange={e=>change(tier.id,'percent',e.target.value)}/></label></div><button type="button" className="mt-3 text-xs underline" disabled={busy} onClick={()=>{setTiers(rows=>rows.filter(r=>r.id!==tier.id));setApproved(false);}}>Remove tier {index+1}</button></fieldset>)}</div>
    <button type="button" disabled={busy||tiers.length>=12} className="mt-3 rounded-xl border border-white/20 px-4 py-3 text-sm disabled:opacity-40" onClick={()=>{setTiers(rows=>[...rows,{id:crypto.randomUUID(),points:'',percent:''}]);setApproved(false);}}>Add discount tier</button>
    <p className="mt-2 text-xs text-white/65">List tiers from lowest to highest points and percentage. No rates are approved by default.</p>
    <label className="flex gap-3 text-sm mt-4"><input type="checkbox" className="mt-1" checked={approved} onChange={e=>setApproved(e.target.checked)}/>I confirm these thresholds and percentages are approved by the clinic for the entire bill.</label>
    <div className="flex flex-wrap gap-3 mt-3"><button disabled={busy||!version||!valid} className="border border-white/20 rounded-xl px-4 py-3 disabled:opacity-40" onClick={()=>save('draft')}>Save inactive draft</button><button disabled={busy||!version||!approved||!tiers.length||!valid} className="border border-planet-yellow/40 rounded-xl px-4 py-3 text-planet-yellow disabled:opacity-40" onClick={()=>save('active')}>Activate approved policy</button></div>
  </details>;
}
