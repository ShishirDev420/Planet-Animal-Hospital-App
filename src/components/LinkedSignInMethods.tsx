import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { linkSocialAccount, socialAuthError, type SocialProvider } from '../lib/socialAuth';
export default function LinkedSignInMethods() {
 const [user,setUser]=useState(auth.currentUser),[linked,setLinked]=useState<string[]>([]),[busy,setBusy]=useState(false),[consent,setConsent]=useState(false),[notice,setNotice]=useState('');
 useEffect(()=>onAuthStateChanged(auth,u=>{setUser(u);setLinked(u?.providerData.map(p=>p.providerId)||[]);setConsent(false);setNotice('');}),[]);
 const link=async(name:SocialProvider)=>{if(!user||!consent)return;setBusy(true);setNotice('');try{const result=await linkSocialAccount(user,name);setLinked(result.user.providerData.map(p=>p.providerId));setConsent(false);setNotice('Sign-in method linked. Your pet records stay on this account.');}catch(e){setNotice(socialAuthError(e));}finally{setBusy(false);}};
 if(!user)return null;
 return <section aria-label="Linked sign-in methods" className="my-6 rounded-2xl border border-white/15 bg-black/20 p-5 text-white"><h2 className="text-lg font-bold">Your sign-in methods</h2><p className="mt-2 text-sm text-white/70">Link Google or Apple to this account to keep the same pet records. This does not connect a paid AI subscription.</p><label className="mt-4 flex items-start gap-3 text-sm"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1"/>I agree to associate my chosen Google or Apple identity with this hospital account, including if Apple hides my email.</label><div className="mt-4 flex flex-wrap gap-3">{(['google','apple'] as const).map(name=>{const exists=linked.includes(name==='google'?'google.com':'apple.com');return <button key={name} disabled={busy||exists||!consent} onClick={()=>void link(name)} className="min-h-11 rounded-xl border border-white/25 px-4 py-2 disabled:opacity-50">{name==='google'?'Google':'Apple'} · {exists?'Linked':'Link account'}</button>;})}</div>{notice&&<p role="status" className="mt-3 text-sm">{notice}</p>}</section>;
}
