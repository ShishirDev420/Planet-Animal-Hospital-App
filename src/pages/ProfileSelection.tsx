import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, User, Sparkles, ChevronRight } from 'lucide-react';
import Logo from '../components/Logo';
import DualAvatar from '../components/DualAvatar';
import { useProfileImages } from '../hooks/useProfileImages';
import { signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ProfileSelection() {
  const navigate = useNavigate();
  const { userImage, petImage } = useProfileImages();
  const [profileName, setProfileName] = useState('Loading...');

  useEffect(() => {
    const fetchProfile = async () => {
      if (auth.currentUser) {
        try {
          const docRef = doc(db, 'users', auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const userName = auth.currentUser.displayName || data.parentName || data.displayName || 'User';
            const petName = data.petName || 'Onyx';
            setProfileName(`${userName} & ${petName}`);
          } else {
            setProfileName(`${auth.currentUser.displayName || 'User'} & Onyx`);
          }
        } catch (e) {
          console.error("Error fetching profile", e);
          setProfileName(`${auth.currentUser?.displayName || 'User'} & Onyx`);
        }
      }
    };
    fetchProfile();
  }, []);

  const profiles = [
    { id: 'current_user', name: profileName },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden dark:bg-[#071912] dark:text-white/95">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-planet-yellow/20 rounded-full blur-3xl animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-teal-300/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10 flex flex-col items-center"
      >
        <div className="flex flex-col items-center mb-12">
          <Logo size="lg" className="mb-6" />
          <h1 className="text-3xl font-display font-black tracking-tighter text-slate-900 uppercase dark:text-white/95">
            Who's visiting today?
          </h1>
          <p className="text-slate-500 text-sm mt-2 dark:text-white/60">Select a profile to continue</p>
        </div>

        <div className="grid grid-cols-2 gap-6 w-full">
          {profiles.map((profile) => (
            <motion.button
              key={profile.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              onClick={() => navigate('/')}
              className="flex flex-col items-center gap-4 group"
            >
              <div className="relative p-4 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl group-hover:shadow-[0_0_40px_rgba(250,204,21,0.4)] transition-all duration-300 dark:bg-neutral-900 dark:border-white/10">
                <DualAvatar 
                  leftImage={userImage}
                  rightImage={petImage}
                  className="w-32 h-32"
                />
              </div>
              <span className="font-bold text-slate-800 tracking-tight group-hover:text-planet-yellow transition-colors dark:text-white/90">{profile.name}</span>
            </motion.button>
          ))}

          {/* Add New Profile Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            onClick={() => navigate('/create-profile')}
            className="flex flex-col items-center gap-4 group"
          >
            <div className="relative p-4 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl group-hover:shadow-[0_0_40px_rgba(250,204,21,0.4)] transition-all duration-300 dark:bg-neutral-900 dark:border-white/10">
              <div className="w-32 h-32 rounded-full bg-white/40 border-4 border-dashed border-white/60 flex items-center justify-center shadow-inner group-hover:border-planet-yellow group-hover:bg-planet-yellow/20 transition-all duration-300 relative overflow-hidden dark:bg-neutral-800 dark:border-white/20">
                {/* Glowing Effect */}
                <div className="absolute inset-0 bg-planet-yellow/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <Plus size={40} className="text-slate-500 group-hover:text-planet-yellow transition-colors relative z-10 dark:text-white/40" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-planet-yellow p-2 rounded-full shadow-lg text-black animate-pulse">
                <Sparkles size={20} />
              </div>
            </div>
            <span className="font-bold text-slate-500 group-hover:text-planet-yellow transition-colors tracking-tight dark:text-white/40">Add New Member</span>
          </motion.button>
        </div>

        <div className="flex justify-center mt-12 mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              try {
                await signOut(auth);
                navigate('/');
              } catch (e) {
                console.error('Logout failed', e);
              }
            }}
            className="px-8 py-3 rounded-full border border-slate-200 text-slate-500 font-bold text-sm tracking-wide hover:bg-slate-100 transition-colors"
          >
            Sign Out
          </motion.button>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="font-display text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
            Planet Animal Hospital & Wellness
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
