import { useState, useRef } from 'react';
import { motion, Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Bell, Activity, Utensils, Save, User, Mail, Dog, Stethoscope, LogOut, Moon, Sun } from 'lucide-react';
import DualAvatar from '../components/DualAvatar';
import { useProfileImages } from '../hooks/useProfileImages';
import { usePetProfile } from '../hooks/usePetProfile';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useTheme } from '../context/ThemeContext';

export default function ProfileSettings() {
  const navigate = useNavigate();
  const { profile, updateProfile } = usePetProfile();
  const [name, setName] = useState('Harshal');
  const [email, setEmail] = useState('harshal@example.com');
  const [weight, setWeight] = useState(profile.weight.replace(/[^0-9.]/g, ''));
  const [unit, setUnit] = useState(profile.weight.includes('kg') ? 'kg' : 'lbs');
  const [diet, setDiet] = useState(profile.dietaryPreferences);
  const [surgicalHistory, setSurgicalHistory] = useState(profile.surgicalHistory);
  const [reminders, setReminders] = useState(true);
  const [marketing, setMarketing] = useState(false);

  const { harshalImage, johnnyImage, updateHarshalImage, updateJohnnyImage } = useProfileImages();
  const { theme, setTheme } = useTheme();
  const [draftTheme, setDraftTheme] = useState(theme);

  const harshalFileInputRef = useRef<HTMLInputElement>(null);
  const johnnyFileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTheme(draftTheme);
    updateProfile({ weight: `${weight}${unit}`, dietaryPreferences: diet, surgicalHistory });
    navigate('/');
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
    <div className="h-full w-full overflow-visible overflow-y-auto pb-32 px-5 pt-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-slate-50/50 backdrop-blur-3xl flex flex-col dark:bg-[#071912]">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pt-4">
        <button 
          onClick={() => navigate('/')}
          className="p-3 bg-white/80 rounded-2xl shadow-sm active:scale-90 transition-transform flex items-center gap-2 dark:bg-neutral-900 dark:border dark:border-white/10"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-white/90" />
        </button>
        <h1 className="text-xl font-black tracking-tight text-slate-800 dark:text-white/95">Profile Settings</h1>
        <div className="w-11" /> {/* Spacer */}
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-10"
      >
        <DualAvatar 
          leftImage={harshalImage}
          rightImage={johnnyImage}
          className="w-40 h-40 mb-6"
        />

        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={harshalFileInputRef} 
          onChange={(e) => handleImageUpload(e, updateHarshalImage)} 
        />
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={johnnyFileInputRef} 
          onChange={(e) => handleImageUpload(e, updateJohnnyImage)} 
        />
        
        <div className="flex gap-4 w-full max-w-sm">
          <motion.button 
            onClick={() => harshalFileInputRef.current?.click()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="flex-1 bg-white/80 backdrop-blur-md border border-white shadow-sm py-3 rounded-2xl flex flex-col items-center gap-2 dark:bg-neutral-900 dark:border-white/10"
          >
            <div className="bg-slate-100 p-2 rounded-full text-slate-600 dark:bg-neutral-800 dark:text-white/60"><Camera size={16} /></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40">Edit Harshal's Photo</span>
          </motion.button>
          <motion.button 
            onClick={() => johnnyFileInputRef.current?.click()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="flex-1 bg-white/80 backdrop-blur-md border border-white shadow-sm py-3 rounded-2xl flex flex-col items-center gap-2 dark:bg-neutral-900 dark:border-white/10"
          >
            <div className="bg-planet-yellow/20 p-2 rounded-full text-planet-yellow"><Camera size={16} /></div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40">Edit Johnny's Photo</span>
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
          <h2 className="text-lg font-black tracking-tight text-slate-800 px-2 dark:text-white/95">Account Details</h2>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-3xl shadow-xl space-y-4 dark:bg-neutral-900 dark:border-white/10">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-white/60">
                <User size={16} /> Full Name
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/60 border-2 border-transparent focus:border-planet-yellow/50 focus:ring-2 focus:ring-planet-yellow rounded-2xl py-3 px-4 outline-none transition-all shadow-inner text-slate-800 font-medium dark:bg-neutral-800 dark:text-white/90 dark:border-white/5"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-white/60">
                <Mail size={16} /> Email Address
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/60 border-2 border-transparent focus:border-planet-yellow/50 focus:ring-2 focus:ring-planet-yellow rounded-2xl py-3 px-4 outline-none transition-all shadow-inner text-slate-800 font-medium dark:bg-neutral-800 dark:text-white/90 dark:border-white/5"
              />
            </div>
          </div>
        </motion.section>

        {/* Johnny's Profile */}
        <motion.section variants={itemVariants} className="space-y-4">
          <h2 className="text-lg font-black tracking-tight text-slate-800 px-2 dark:text-white/95">Johnny's Profile</h2>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-3xl shadow-xl space-y-5 dark:bg-neutral-900 dark:border-white/10">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-white/60">
                <Dog size={16} /> Breed
              </label>
              <input 
                type="text" 
                value="American Bully"
                disabled
                className="w-full bg-slate-100/50 border-2 border-transparent rounded-2xl py-3 px-4 outline-none text-slate-500 font-medium cursor-not-allowed shadow-inner dark:bg-neutral-800 dark:text-white/40 dark:border-white/5"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-white/60">
                <Activity size={16} className="text-teal-500" /> Current Weight
              </label>
              <div className="flex gap-4">
                <input 
                  type="number" 
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="flex-1 bg-white/60 border-2 border-transparent focus:border-planet-yellow/50 focus:ring-2 focus:ring-planet-yellow rounded-2xl py-3 px-4 outline-none transition-all shadow-inner text-xl font-black text-slate-800 dark:bg-neutral-800 dark:text-white/95 dark:border-white/5"
                />
                <div className="flex bg-white/60 rounded-2xl p-1 shadow-sm dark:bg-neutral-800">
                  <button 
                    onClick={() => setUnit('lbs')}
                    className={`px-4 rounded-xl font-bold transition-colors ${unit === 'lbs' ? 'bg-white shadow-sm text-slate-800 dark:bg-neutral-700 dark:text-white' : 'text-slate-400'}`}
                  >
                    lbs
                  </button>
                  <button 
                    onClick={() => setUnit('kg')}
                    className={`px-4 rounded-xl font-bold transition-colors ${unit === 'kg' ? 'bg-white shadow-sm text-slate-800 dark:bg-neutral-700 dark:text-white' : 'text-slate-400'}`}
                  >
                    kg
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-white/60">
                <Utensils size={16} className="text-orange-500" /> Dietary Preferences
              </label>
              <select 
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
                className="w-full bg-white/60 border-2 border-transparent focus:border-planet-yellow/50 focus:ring-2 focus:ring-planet-yellow rounded-2xl py-3 px-4 outline-none transition-all shadow-inner text-slate-800 font-medium appearance-none dark:bg-neutral-800 dark:text-white/90 dark:border-white/5"
              >
                <option value="None">None</option>
                <option value="High-Protein Kibble">High-Protein Kibble</option>
                <option value="Raw Diet">Raw Diet</option>
                <option value="Grain-Free">Grain-Free</option>
                <option value="Prescription Diet">Prescription Diet</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-white/60">
                <Stethoscope size={16} className="text-red-500" /> Surgical & Medical History
              </label>
              <textarea 
                value={surgicalHistory}
                onChange={(e) => setSurgicalHistory(e.target.value)}
                placeholder="e.g., ACL repair, allergies, etc."
                rows={3}
                className="w-full bg-white/60 border-2 border-transparent focus:border-planet-yellow/50 focus:ring-2 focus:ring-planet-yellow rounded-2xl py-3 px-4 outline-none transition-all shadow-inner text-slate-800 font-medium resize-none placeholder:text-slate-400 dark:bg-neutral-800 dark:text-white/90 dark:border-white/5"
              />
            </div>
          </div>
        </motion.section>

        {/* App Preferences */}
        <motion.section variants={itemVariants} className="space-y-4">
          <h2 className="text-lg font-black tracking-tight text-slate-800 px-2 dark:text-white/95">App Preferences</h2>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-3xl shadow-xl space-y-6 dark:bg-neutral-900 dark:border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-700 flex items-center gap-2 dark:text-white/95">
                  {draftTheme === 'dark' ? <Moon size={16} className="text-blue-400" /> : <Sun size={16} className="text-planet-yellow" />} Dark Mode
                </h4>
                <p className="text-xs text-slate-500 mt-1 dark:text-white/60">Switch between light and dark themes.</p>
              </div>
              <Toggle isOn={draftTheme === 'dark'} onToggle={() => setDraftTheme(prev => prev === 'light' ? 'dark' : 'light')} />
            </div>
            
            <div className="h-px bg-slate-200/50 w-full dark:bg-white/10" />

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-700 flex items-center gap-2 dark:text-white/95">
                  <Bell size={16} className="text-indigo-500" /> Appointment & Health Reminders
                </h4>
                <p className="text-xs text-slate-500 mt-1 dark:text-white/60">Get notified 24h before visits.</p>
              </div>
              <Toggle isOn={reminders} onToggle={() => setReminders(!reminders)} />
            </div>
            
            <div className="h-px bg-slate-200/50 w-full dark:bg-white/10" />
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-700 dark:text-white/95">Marketing & Promotions</h4>
                <p className="text-xs text-slate-500 mt-1 dark:text-white/60">Promos and new proactive plans.</p>
              </div>
              <Toggle isOn={marketing} onToggle={() => setMarketing(!marketing)} />
            </div>
          </div>
        </motion.section>
      </motion.div>

      {/* Save Button */}
      <div className="flex flex-col gap-4 mt-12 pb-10 px-5">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          className="w-full max-w-md mx-auto bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-[0_0_30px_rgba(250,204,21,0.3)] flex items-center justify-center gap-3 active:scale-95 transition-transform dark:bg-white dark:text-black"
        >
          <Save size={20} className="text-planet-yellow" />
          Save Changes
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
          className="w-full max-w-md mx-auto py-3 rounded-xl border border-red-200 text-red-600 font-bold bg-red-50/50 hover:bg-red-100 transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Log Out
        </button>
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
