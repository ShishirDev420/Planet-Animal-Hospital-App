import { useState, useRef, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Bell, Activity, Utensils, Save, User, Mail, Dog, Stethoscope, LogOut } from 'lucide-react';
import DualAvatar from '../components/DualAvatar';
import { useProfileImages } from '../hooks/useProfileImages';
import { usePetProfile } from '../hooks/usePetProfile';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function ProfileSettings() {
  const navigate = useNavigate();
  const { profile, updateProfile } = usePetProfile();
  const [name, setName] = useState(profile?.parentName || '');
  const [email, setEmail] = useState('');
  const [weight, setWeight] = useState(profile?.weight?.replace(/[^0-9.]/g, '') || '');
  const [unit, setUnit] = useState(profile?.weight?.includes('kg') ? 'kg' : 'lbs');
  const [diet, setDiet] = useState(profile?.dietaryPreferences || '');
  const [surgicalHistory, setSurgicalHistory] = useState(profile?.surgicalHistory || '');
  const [medicalHistory, setMedicalHistory] = useState(profile?.medicalHistory || '');
  const [age, setAge] = useState(profile?.age || '');
  const [gender, setGender] = useState(profile?.gender || '');
  const [reminders, setReminders] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.parentName) setName(profile.parentName);
      if (profile.weight) {
        setWeight(profile.weight.replace(/[^0-9.]/g, ''));
        setUnit(profile.weight.includes('kg') ? 'kg' : 'lbs');
      }
      if (profile.dietaryPreferences) setDiet(profile.dietaryPreferences);
      if (profile.surgicalHistory) setSurgicalHistory(profile.surgicalHistory);
      if (profile.medicalHistory) setMedicalHistory(profile.medicalHistory);
      if (profile.age) setAge(profile.age);
      if (profile.gender) setGender(profile.gender);
    }
  }, [profile]);

  const { userImage, petImage, updateUserImage, updatePetImage } = useProfileImages();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const userFileInputRef = useRef<HTMLInputElement>(null);
  const petFileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveError(false);
    try {
      await updateProfile({ parentName: name, weight: `${weight}${unit}`, dietaryPreferences: diet, surgicalHistory, medicalHistory, age, gender });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setSaveError(true);
      setTimeout(() => setSaveError(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="h-[100dvh] w-full overflow-y-auto overflow-x-hidden relative pb-32 px-5 pt-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-slate-50 flex flex-col dark:bg-[#071912] dark:text-white/95">
      {/* Background Ambient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex justify-center">
        <div className="relative w-full max-w-md h-full">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-planet-yellow/40 rounded-full blur-3xl opacity-60 animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-teal-300/40 rounded-full blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-amber-200/40 rounded-full blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col h-full w-full">
        {/* Header */}
      <header className="flex items-center justify-between mb-8 pt-4">
        <button 
          onClick={() => navigate('/')}
          className="p-3 bg-white/80 rounded-2xl shadow-sm active:scale-90 transition-transform flex items-center gap-2 dark:bg-neutral-900 dark:border dark:border-white/10"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-white/90" />
        </button>
        <h1 className="text-3xl font-extrabold font-heading tracking-tight text-white drop-shadow-md">Profile Settings</h1>
        <div className="w-11" /> {/* Spacer */}
      </header>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center mb-10"
      >
        <div className="animate-[pulse_4s_ease-in-out_infinite]">
          <DualAvatar 
            leftImage={userImage}
            rightImage={petImage}
            className="w-40 h-40 mb-6"
          />
        </div>

        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={userFileInputRef} 
          onChange={(e) => handleImageUpload(e, updateUserImage)} 
        />
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={petFileInputRef} 
          onChange={(e) => handleImageUpload(e, updatePetImage)} 
        />
        
        <div className="flex gap-4 w-full max-w-sm">
          <motion.button 
            onClick={() => userFileInputRef.current?.click()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="flex-1 bg-white/80 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/10 shadow-xl py-3 rounded-2xl flex flex-col items-center gap-2"
          >
            <div className="bg-slate-100 dark:bg-white/10 p-2 rounded-full text-slate-600 dark:text-white/90 border border-transparent dark:border-white/5"><Camera size={16} /></div>
            <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">Edit {profile?.parentName || "Parent"}'s Photo</span>
          </motion.button>
          <motion.button 
            onClick={() => petFileInputRef.current?.click()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="flex-1 bg-white/80 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/10 shadow-xl py-3 rounded-2xl flex flex-col items-center gap-2"
          >
            <div className="bg-planet-yellow/20 p-2 rounded-full text-planet-yellow"><Camera size={16} /></div>
            <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">Edit {profile?.name || "Pet"}'s Photo</span>
          </motion.button>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Account Details */}
        <motion.section variants={itemVariants} className="space-y-4">
          <h2 className="text-xl font-bold font-heading tracking-tight text-white mb-4 drop-shadow-sm border-b border-white/10 pb-2 px-2">Account Details</h2>
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/10 p-5 rounded-3xl shadow-xl space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold font-body text-slate-300 mb-1">
                <User size={16} /> Full Name
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/60 dark:bg-white/10 border border-transparent dark:border-white/5 focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 rounded-2xl py-3 px-4 outline-none transition-all shadow-inner text-slate-800 dark:text-slate-100 font-body font-medium placeholder-gray-400"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold font-body text-slate-300 mb-1">
                <Mail size={16} /> Email Address
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/60 dark:bg-white/10 border border-transparent dark:border-white/5 focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 rounded-2xl py-3 px-4 outline-none transition-all shadow-inner text-slate-800 dark:text-slate-100 font-body font-medium placeholder-gray-400"
              />
            </div>
          </div>
        </motion.section>

        {/* Pet's Profile */}
        <motion.section variants={itemVariants} className="space-y-4">
          <h2 className="text-xl font-bold font-heading tracking-tight text-white mb-4 drop-shadow-sm border-b border-white/10 pb-2 px-2">{profile?.name || "Pet"}'s Profile</h2>
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/10 p-5 rounded-3xl shadow-xl space-y-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold font-body text-slate-300 mb-1">
                <Dog size={16} /> Breed
              </label>
              <input 
                type="text" 
                value={profile?.breed || "Unknown"}
                disabled
                className="w-full bg-slate-100/50 dark:bg-white/5 border border-transparent dark:border-white/5 rounded-2xl py-3 px-4 outline-none text-slate-500 dark:text-slate-300 font-body font-medium cursor-not-allowed shadow-inner"
              />
            </div>
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <label className="flex items-center gap-2 text-sm font-semibold font-body text-slate-300 mb-1">
                  Age
                </label>
                <input 
                  type="text" 
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-white/60 dark:bg-white/10 border border-transparent dark:border-white/5 focus:ring-1 focus:ring-emerald-500 rounded-2xl py-3 px-4 outline-none transition-all shadow-inner text-slate-800 dark:text-slate-100 font-body font-medium placeholder-gray-400"
                />
              </div>
              <div className="space-y-2 flex-1">
                <label className="flex items-center gap-2 text-sm font-semibold font-body text-slate-300 mb-1">
                  Gender
                </label>
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-white/60 dark:bg-white/10 border border-transparent dark:border-white/5 focus:ring-1 focus:ring-emerald-500 rounded-2xl py-3 px-4 outline-none transition-all shadow-inner text-slate-800 dark:text-slate-100 font-body font-medium appearance-none placeholder-gray-400"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold font-body text-slate-300 mb-1">
                <Activity size={16} className="text-teal-500" /> Current Weight
              </label>
              <div className="flex w-full items-center gap-3">
                <input 
                  type="number" 
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="flex-1 min-w-0 bg-white/60 dark:bg-white/10 border border-transparent dark:border-white/5 focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 rounded-2xl py-3 px-4 outline-none transition-all shadow-inner text-xl font-heading font-bold text-slate-800 dark:text-slate-100 placeholder-gray-400"
                />
                <div className="flex shrink-0 bg-white/60 dark:bg-white/10 border border-transparent dark:border-white/5 rounded-2xl p-1 shadow-sm">
                  <button 
                    onClick={() => setUnit('lbs')}
                    className={`px-4 rounded-xl font-bold transition-colors ${unit === 'lbs' ? 'bg-white shadow-sm text-slate-800 dark:bg-white/20 dark:text-white' : 'text-slate-400 dark:text-white/40'}`}
                  >
                    lbs
                  </button>
                  <button 
                    onClick={() => setUnit('kg')}
                    className={`px-4 rounded-xl font-bold transition-colors ${unit === 'kg' ? 'bg-white shadow-sm text-slate-800 dark:bg-white/20 dark:text-white' : 'text-slate-400 dark:text-white/40'}`}
                  >
                    kg
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold font-body text-slate-300 mb-1">
                <Utensils size={16} className="text-orange-500" /> Dietary Preferences
              </label>
              <select 
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
                className="w-full bg-white/60 dark:bg-white/10 border border-transparent dark:border-white/5 focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 rounded-2xl py-3 px-4 outline-none transition-all shadow-inner text-slate-800 dark:text-slate-100 font-body font-medium appearance-none placeholder-gray-400"
              >
                <option value="None">None</option>
                <option value="High-Protein Kibble">High-Protein Kibble</option>
                <option value="Raw Diet">Raw Diet</option>
                <option value="Grain-Free">Grain-Free</option>
                <option value="Prescription Diet">Prescription Diet</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold font-body text-slate-300 mb-1">
                <Stethoscope size={16} className="text-red-500" /> Medical History
              </label>
              <textarea 
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                placeholder="e.g., allergies, chronic conditions..."
                rows={3}
                className="w-full bg-white/60 dark:bg-white/10 border border-transparent dark:border-white/5 focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 rounded-2xl py-3 px-4 outline-none transition-all shadow-inner text-slate-800 dark:text-slate-100 font-body font-medium resize-none placeholder-gray-400"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold font-body text-slate-300 mb-1">
                <Stethoscope size={16} className="text-blue-500" /> Surgical History
              </label>
              <textarea 
                value={surgicalHistory}
                onChange={(e) => setSurgicalHistory(e.target.value)}
                placeholder="e.g., ACL repair, spay/neuter..."
                rows={3}
                className="w-full bg-white/60 dark:bg-white/10 border border-transparent dark:border-white/5 focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 rounded-2xl py-3 px-4 outline-none transition-all shadow-inner text-slate-800 dark:text-slate-100 font-body font-medium resize-none placeholder-gray-400"
              />
            </div>
          </div>
        </motion.section>

        {/* App Preferences */}
        <motion.section variants={itemVariants} className="space-y-4">
          <h2 className="text-xl font-bold font-heading tracking-tight text-white mb-4 drop-shadow-sm border-b border-white/10 pb-2 px-2">App Preferences</h2>
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/10 p-5 rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading font-bold text-slate-800 flex items-center gap-2 dark:text-white">
                  <Bell size={16} className="text-indigo-500" /> Appointment & Health Reminders
                </h4>
                <p className="font-body font-medium text-slate-500 dark:text-slate-300 text-xs mt-1 leading-relaxed">Get notified 24h before visits.</p>
              </div>
              <Toggle isOn={reminders} onToggle={() => setReminders(!reminders)} />
            </div>
            
            <div className="h-px bg-slate-200/50 w-full dark:bg-white/10" />
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-heading font-bold text-slate-800 dark:text-white">Marketing & Promotions</h4>
                <p className="font-body font-medium text-slate-500 dark:text-slate-300 text-xs mt-1 leading-relaxed">Promos and new proactive plans.</p>
              </div>
              <Toggle isOn={marketing} onToggle={() => setMarketing(!marketing)} />
            </div>
          </div>
        </motion.section>
      </motion.div>

      {/* Save Button */}
      <div className="flex flex-col gap-4 mt-12 pb-10 px-5">
        <motion.button
          disabled={isSaving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          className={`w-full max-w-md mx-auto py-5 rounded-2xl font-heading font-bold tracking-wide text-lg shadow-[0_0_30px_rgba(250,204,21,0.3)] flex items-center justify-center gap-3 active:scale-95 transition-all ${isSaved ? 'bg-emerald-500 text-white dark:bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : saveError ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'bg-slate-900 text-white dark:bg-white dark:text-black'} ${isSaving ? 'opacity-80' : ''}`}
        >
          {isSaving ? (
             <>
               <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white dark:border-black"></div>
               Saving...
             </>
          ) : isSaved ? (
             <>
               Saved!
             </>
          ) : saveError ? (
             <>
               Failed to Save!
             </>
          ) : (
             <>
               <Save size={20} className="text-planet-yellow" />
               Save Changes
             </>
          )}
        </motion.button>

        <button
          onClick={async () => {
            try {
              await signOut(auth);
              navigate('/');
            } catch (e) {
              console.error('Logout failed', e);
            }
          }}
          className="w-full max-w-md mx-auto py-3 rounded-xl border border-red-200 text-red-600 font-heading font-bold tracking-wide bg-red-50/50 hover:bg-red-100 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
      </div>
    </div>
  );
}

function Toggle({ isOn, onToggle }: { isOn: boolean, onToggle: () => void }) {
  return (
    <motion.div 
      className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 shrink-0 ${isOn ? 'bg-planet-yellow' : 'bg-slate-300'}`}
      onClick={onToggle}
    >
      <motion.div 
        className="bg-white w-6 h-6 rounded-full shadow-md"
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        animate={{ x: isOn ? 24 : 0 }}
      />
    </motion.div>
  );
}
