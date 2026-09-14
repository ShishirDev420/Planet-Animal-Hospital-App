import '../styles/onboarding.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight } from 'lucide-react';
import Logo from '../components/Logo';
import DualAvatar from '../components/DualAvatar';
import { useProfileImages } from '../hooks/useProfileImages';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { isPreviewDemoMode } from '../lib/demoMode';

export default function ProfileSelection() {
  const navigate = useNavigate();
  const { userImage, petImage } = useProfileImages();
  const [profileName, setProfileName] = useState('Loading...');

  const isDemoMode = typeof window !== 'undefined' && isPreviewDemoMode(window.location.search, window.location.pathname);

  useEffect(() => {
    if (isDemoMode) {
      setProfileName('Shishir & Onyx');
      return;
    }
    const fetchProfile = async () => {
      if (auth.currentUser) {
        try {
          const docRef = doc(db, 'users', auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const userName = data.parentName || auth.currentUser.displayName || data.displayName || 'Pet Parent';
            const petName = data.petName && data.petName !== 'Pending' ? data.petName : 'Profile setup needed';
            setProfileName(`${userName} & ${petName}`);
          } else {
            setProfileName(`${auth.currentUser.displayName || 'Signed-in parent'} & Profile setup needed`);
          }
        } catch (e) {
          console.error("Error fetching profile", e);
          setProfileName(`${auth.currentUser?.displayName || 'Signed-in parent'} & Syncing profile`);
        }
      }
    };
    fetchProfile();
  }, [isDemoMode]);

  const profiles = [
    { id: 'current_user', name: profileName },
  ];

  return <main className="onboarding-shell"><div className="onboarding-wrap">
    <header className="onboarding-brand"><Logo size="sm"/><p><strong>Planet Animal</strong>Hospital &amp; Wellness</p></header>
    <div className="onboarding-intro"><h1>Who’s visiting today?</h1><p>Open your companion’s care space.</p></div>
    <div className="onboarding-card onboarding-form">
      {profiles.map(profile => <button key={profile.id} onClick={() => navigate('/')} className="flex min-w-0 items-center gap-4 rounded-2xl border border-white/15 bg-white/5 p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-planet-yellow"><DualAvatar leftImage={userImage} rightImage={petImage} className="h-20 w-20 shrink-0"/><span className="min-w-0 flex-1 break-words font-semibold text-white">{profile.name}<span className="mt-1 block text-xs font-normal text-white/65">Open care profile</span></span><ChevronRight size={20} className="shrink-0 text-planet-yellow"/></button>)}
      <button className="onboarding-back" onClick={() => navigate('/create-profile')}><Plus size={18}/>Set up a profile</button>
    </div>
    <button className="onboarding-text-button" onClick={async () => { try { await signOut(auth); window.location.href='/'; } catch(e) { console.error('Logout failed',e); } }}>Sign out</button>
  </div></main>;
}
