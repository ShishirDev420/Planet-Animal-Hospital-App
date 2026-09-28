import '../styles/onboarding.css';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, PawPrint, Plus } from 'lucide-react';
import { signOut } from 'firebase/auth';
import Logo from '../components/Logo';
import DualAvatar from '../components/DualAvatar';
import { useProfileImages } from '../hooks/useProfileImages';
import { usePetProfile } from '../hooks/usePetProfile';
import { useCare } from '../lib/care/client';
import { auth } from '../lib/firebase';
import { isPreviewDemoMode } from '../lib/demoMode';

export default function ProfileSelection() {
  const navigate = useNavigate();
  const { userImage, petImage } = useProfileImages();
  const { profile } = usePetProfile();
  const care = useCare();
  const demo = isPreviewDemoMode();
  const parentName = profile?.parentName || auth.currentUser?.displayName || 'Pet Parent';
  const pets = care.state?.pets.length ? care.state.pets : (profile?.petName ? [{ id: 'primary', name: profile.petName }] : []);

  return <main className="onboarding-shell"><div className="onboarding-wrap">
    <header className="onboarding-brand"><Logo size="sm"/><p><strong>Planet Animal</strong>Hospital &amp; Wellness</p></header>
    <div className="onboarding-intro"><h1>Who needs care today?</h1><p>Choose a pet to see their recorded next step. Your clinic wallet stays shared.</p></div>
    <div className="onboarding-card onboarding-form">
      <p className="text-xs font-bold uppercase tracking-widest text-[#fec708]">{parentName}'s pets</p>
      {pets.map(pet => <button key={pet.id} type="button" aria-pressed={care.petId === pet.id} onClick={() => { care.setPetId(pet.id); navigate('/'); }} className="flex min-w-0 items-center gap-4 rounded-2xl border border-white/15 bg-white/5 p-4 text-left transition-colors hover:border-[#fec708]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-planet-yellow">
        {pet.id === 'primary' ? <DualAvatar leftImage={userImage} rightImage={petImage} className="h-16 w-16 shrink-0"/> : <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#fec708]/12 text-[#fec708]"><PawPrint size={27}/></span>}
        <span className="min-w-0 flex-1 break-words font-semibold text-white">{pet.name}<span className="mt-1 block text-xs font-normal text-white/65">{care.petId === pet.id ? 'Selected pet' : 'Open care space'}</span></span><ChevronRight size={20} className="shrink-0 text-planet-yellow"/>
      </button>)}
      {care.loading && !care.state && <p role="status" className="text-sm text-white/70">Loading your pets…</p>}
      {care.error && !demo && <div role="status" className="rounded-xl border border-[#fec708]/25 bg-[#fec708]/8 p-3 text-sm text-white/80"><p>We could not refresh your recorded pets. Your saved profile is still available.</p><button type="button" className="mt-2 font-bold text-[#fec708]" onClick={() => void care.refresh()}>Try again</button></div>}
      <button type="button" className="onboarding-back" disabled={!care.state} onClick={() => navigate('/create-profile')}><Plus size={18}/>Add another pet</button>
      {!care.state && <p className="text-xs text-white/60">{demo ? 'Visual preview only. Sign in to manage your pets.' : 'Adding a pet becomes available when recorded care is connected.'}</p>}
    </div>
    <button className="onboarding-text-button" onClick={async () => { try { await signOut(auth); window.location.href='/'; } catch(e) { console.error('Logout failed',e); } }}>Sign out</button>
  </div></main>;
}
