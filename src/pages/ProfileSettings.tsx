import LinkedSignInMethods from '../components/LinkedSignInMethods';
import { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Activity, Utensils, Save, User, Mail, Dog, Stethoscope, LogOut, Phone, PawPrint } from 'lucide-react';
import { usePetProfile } from '../hooks/usePetProfile';
import { signOut } from 'firebase/auth';
import { useCare } from '../lib/care/client';
import { auth } from '../lib/firebase';

export default function ProfileSettings() {
  const navigate = useNavigate();
  const care = useCare();
  const { profile, loading: profileLoading, updateProfile } = usePetProfile();
  const [name, setName] = useState(profile?.parentName || '');
  const [weight, setWeight] = useState(profile?.weight?.replace(/[^0-9.]/g, '') || '');
  const [unit, setUnit] = useState(profile?.weight?.includes('kg') ? 'kg' : 'lbs');
  const [diet, setDiet] = useState(profile?.dietaryPreferences || '');
  const [surgicalHistory, setSurgicalHistory] = useState(profile?.surgicalHistory || '');
  const [medicalHistory, setMedicalHistory] = useState(profile?.medicalHistory || '');
  const [age, setAge] = useState(profile?.age || '');
  const [gender, setGender] = useState(profile?.gender || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [reminderBusy, setReminderBusy] = useState(false);
  const [reminderNotice, setReminderNotice] = useState('');
  const isPrimaryPet = care.petId === 'primary';

  useEffect(() => {
    setName(profile?.parentName || '');
    setWeight(profile?.weight?.replace(/[^0-9.]/g, '') || '');
    setUnit(profile?.weight?.includes('kg') ? 'kg' : 'lbs');
    setDiet(profile?.dietaryPreferences || '');
    setSurgicalHistory(profile?.surgicalHistory || '');
    setMedicalHistory(profile?.medicalHistory || '');
    setAge(profile?.age || '');
    setGender(profile?.gender || '');
    setPhone(profile?.phone || '');
  }, [profile]);

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (profileLoading || care.loading || !profile) { setSaveError(true); return; }
    if (isPrimaryPet && weight.trim() && (!Number.isFinite(Number(weight)) || Number(weight) <= 0)) { setSaveError(true); return; }
    setIsSaving(true);
    setSaveError(false);
    try {
      await updateProfile(isPrimaryPet ? { parentName: name.trim(), ...(weight.trim() ? { weight: `${weight}${unit}` } : {}), dietaryPreferences: diet, surgicalHistory, medicalHistory, age, gender, phone: phone.trim() } : { parentName: name.trim(), phone: phone.trim() });
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

  const handleReminderChange = async () => {
    if (!care.state || reminderBusy) return;
    setReminderBusy(true);
    setReminderNotice('');
    try {
      await care.command({ type: 'preferences', inApp: !care.state.preferences.inApp, snoozeUntil: null });
      setReminderNotice('In-app reminder preference saved.');
    } catch (cause) {
      setReminderNotice((cause as Error).message || 'Reminder preference could not be saved.');
    } finally {
      setReminderBusy(false);
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
        <div className="relative w-full max-w-5xl h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-planet-yellow/40 rounded-full blur-3xl opacity-60 animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-teal-300/40 rounded-full blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-amber-200/40 rounded-full blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col h-full w-full max-w-3xl mx-auto">
        {/* Header */}
      <header className="flex items-center justify-between mb-8 pt-4">
        <button 
          onClick={() => navigate('/')}
          aria-label="Back to home"
          className="p-3 bg-white/80 rounded-2xl shadow-sm active:scale-90 transition-transform flex items-center gap-2 dark:bg-neutral-900 dark:border dark:border-white/10"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-white/90" />
        </button>
        <h1 className="cinematic-section-title text-3xl drop-shadow-md">Profile Settings</h1>
        {care.role !== "parent" && <button className="mt-3 text-[#fec708]" onClick={() => navigate("/staff")}>Open care team workspace</button>}
        <div className="w-11" /> {/* Spacer */}
      </header><LinkedSignInMethods />

      <div className="mb-8 flex items-center justify-center gap-3" aria-hidden="true">
        <span className="grid h-16 w-16 place-items-center rounded-2xl border border-white/15 bg-white/5 text-white/70"><User size={28}/></span>
        <span className="grid h-16 w-16 place-items-center rounded-2xl border border-[#fec708]/25 bg-[#fec708]/10 text-[#fec708]"><PawPrint size={28}/></span>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* Account Details */}
        <motion.section variants={itemVariants} className="space-y-4">
          <h2 className="cinematic-card-title mb-4 border-b border-white/10 px-2 pb-2 text-xl drop-shadow-sm">Account Details</h2>
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/10 p-5 rounded-3xl shadow-xl space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold font-body text-slate-300 mb-1">
                <User size={16} /> Full Name
              </label>
              <input 
                type="text" 
                aria-label="Full Name"
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
                aria-label="Email Address"
                value={auth.currentUser?.email || profile?.email || ''}
                readOnly
                aria-describedby="account-email-note"
                className="w-full bg-white/60 dark:bg-white/10 border border-transparent dark:border-white/5 focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 rounded-2xl py-3 px-4 outline-none transition-all shadow-inner text-slate-800 dark:text-slate-100 font-body font-medium placeholder-gray-400"
              />
              <p id="account-email-note" className="text-xs text-white/60">Your sign-in email is managed by your authentication provider.</p>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold font-body text-slate-300 mb-1">
                <Phone size={16} /> Mobile Number
              </label>
              <input 
                type="tel" 
                aria-label="Mobile Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white/60 dark:bg-white/10 border border-transparent dark:border-white/5 focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 rounded-2xl py-3 px-4 outline-none transition-all shadow-inner text-slate-800 dark:text-slate-100 font-body font-medium placeholder-gray-400"
                placeholder="e.g. 9876543210"
              />
            </div>
          </div>
        </motion.section>

        {/* The legacy profile stores details for the first pet only. */}
        {isPrimaryPet ? <motion.section variants={itemVariants} className="space-y-4">
          <h2 className="cinematic-card-title mb-4 border-b border-white/10 px-2 pb-2 text-xl drop-shadow-sm">{profile?.name || "Pet"}'s Profile</h2>
          <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg border border-white/20 dark:border-white/10 p-5 rounded-3xl shadow-xl space-y-5">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold font-body text-slate-300 mb-1">
                <Dog size={16} /> Breed
              </label>
              <input 
                type="text" 
                aria-label="Breed"
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
                  aria-label="Age"
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
                  aria-label="Gender"
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
                aria-label="Current Weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="flex-1 min-w-0 bg-white/60 dark:bg-white/10 border border-transparent dark:border-white/5 focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 rounded-2xl py-3 px-4 outline-none transition-all shadow-inner text-xl font-heading font-bold text-slate-800 dark:text-slate-100 placeholder-gray-400"
                />
                <div className="flex shrink-0 bg-white/60 dark:bg-white/10 border border-transparent dark:border-white/5 rounded-2xl p-1 shadow-sm">
                  <button 
                    type="button"
                    aria-pressed={unit === 'lbs'}
                    onClick={() => setUnit('lbs')}
                    className={`px-4 rounded-xl font-bold transition-colors ${unit === 'lbs' ? 'bg-white shadow-sm text-slate-800 dark:bg-white/20 dark:text-white' : 'text-slate-400 dark:text-white/40'}`}
                  >
                    lbs
                  </button>
                  <button 
                    type="button"
                    aria-pressed={unit === 'kg'}
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
                aria-label="Dietary Preferences"
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
                aria-label="Medical History"
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
                aria-label="Surgical History"
                value={surgicalHistory}
                onChange={(e) => setSurgicalHistory(e.target.value)}
                placeholder="e.g., ACL repair, spay/neuter..."
                rows={3}
                className="w-full bg-white/60 dark:bg-white/10 border border-transparent dark:border-white/5 focus:ring-1 focus:ring-emerald-500 dark:focus:ring-emerald-500 rounded-2xl py-3 px-4 outline-none transition-all shadow-inner text-slate-800 dark:text-slate-100 font-body font-medium resize-none placeholder-gray-400"
              />
            </div>
          </div>
        </motion.section> : <motion.section variants={itemVariants} className="rounded-3xl border border-white/15 bg-white/5 p-5 text-sm leading-6 text-white/75"><h2 className="cinematic-card-title mb-2 text-xl text-white">This pet's care details</h2><p>Use the selected pet's care space to share history and prescriptions. Your first pet's profile details are kept separate.</p><button type="button" className="mt-4 min-h-11 rounded-xl bg-[#fec708] px-4 font-bold text-[#071912]" onClick={() => navigate('/roadmap')}>Open care space</button></motion.section>}

        {/* In-app reminders use the server-backed care preference. */}
        <motion.section variants={itemVariants} className="space-y-4">
          <h2 className="cinematic-card-title mb-4 border-b border-white/10 px-2 pb-2 text-xl drop-shadow-sm">App Preferences</h2>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="flex items-center gap-2 font-heading font-bold text-white">
                  <Bell size={16} className="text-[#fec708]" /> In-app care reminders
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-white/65">Show reminders in this app when a veterinarian-approved follow-up date is recorded. External messages are not connected.</p>
              </div>
              <button type="button" role="switch" aria-label="In-app care reminders" aria-checked={care.state?.preferences.inApp || false} disabled={!care.state || reminderBusy} onClick={() => void handleReminderChange()} className={`relative h-8 w-14 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fec708] disabled:opacity-45 ${care.state?.preferences.inApp ? 'bg-[#fec708]' : 'bg-white/25'}`}><span className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${care.state?.preferences.inApp ? 'translate-x-6' : 'translate-x-0'}`}/></button>
            </div>
            {reminderNotice && <p role="status" className="mt-3 text-xs text-[#fec708]">{reminderNotice}</p>}
            <p className="mt-3 text-xs text-white/50">This preference saves immediately.</p>
          </div>
        </motion.section>
      </motion.div>

      {/* Save Button */}
      <div className="flex flex-col gap-4 mt-12 pb-10 px-5">
        <motion.button
          disabled={isSaving || profileLoading || care.loading || !profile}
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
              window.location.href = '/';
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
