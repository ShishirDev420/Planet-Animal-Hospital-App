import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, User, ArrowLeft, Sparkles, Heart, Weight, ClipboardList } from 'lucide-react';
import Logo from '../components/Logo';
import { cn } from '../lib/utils';

export default function CreateProfile() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userName: '',
    petName: '',
    petWeight: '',
    medicalHistory: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we'd save this to Firebase. For now, we simulate success.
    navigate('/profiles');
  };

  return (
    <div className="min-h-screen bg-white/40 backdrop-blur-3xl p-6 flex flex-col dark:bg-[#071912] dark:text-white/95">
      {/* Header */}
      <header className="flex items-center justify-between mb-12 pt-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 bg-white/80 rounded-2xl shadow-sm active:scale-90 transition-transform dark:bg-neutral-900 dark:border dark:border-white/10"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-white/90" />
        </button>
        <Logo size="sm" />
        <div className="w-10" /> {/* Spacer */}
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2 dark:text-white/95">
            Welcome to the <br/>
            <span className="text-planet-yellow">Planet Family</span>
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed dark:text-white/60">
            Let's create a personalized health roadmap for your furry companion.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Your Name */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 dark:text-white/40">Your Name</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-planet-yellow transition-colors dark:text-white/40">
                <User size={18} />
              </div>
              <input
                required
                type="text"
                placeholder="e.g. Sarah Jenkins"
                className="w-full bg-white/60 border-2 border-transparent focus:border-planet-yellow/30 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all shadow-sm focus:shadow-planet-yellow/10 dark:bg-neutral-900 dark:border-white/10 dark:text-white/90"
                value={formData.userName}
                onChange={(e) => setFormData({...formData, userName: e.target.value})}
              />
            </div>
          </div>

          {/* Pet's Name */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 dark:text-white/40">Pet's Name</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-planet-yellow transition-colors dark:text-white/40">
                <Heart size={18} />
              </div>
              <input
                required
                type="text"
                placeholder="e.g. Max"
                className="w-full bg-white/60 border-2 border-transparent focus:border-planet-yellow/30 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all shadow-sm focus:shadow-planet-yellow/10 dark:bg-neutral-900 dark:border-white/10 dark:text-white/90"
                value={formData.petName}
                onChange={(e) => setFormData({...formData, petName: e.target.value})}
              />
            </div>
          </div>

          {/* Pet's Weight */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 dark:text-white/40">Pet's Weight</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-planet-yellow transition-colors dark:text-white/40">
                <Weight size={18} />
              </div>
              <input
                required
                type="text"
                placeholder="Approximate is perfectly fine!"
                className="w-full bg-white/60 border-2 border-transparent focus:border-planet-yellow/30 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all shadow-sm focus:shadow-planet-yellow/10 dark:bg-neutral-900 dark:border-white/10 dark:text-white/90"
                value={formData.petWeight}
                onChange={(e) => setFormData({...formData, petWeight: e.target.value})}
              />
            </div>
          </div>

          {/* Medical History */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1 dark:text-white/40">Medical History / Notes</label>
            <div className="relative group">
              <div className="absolute top-4 left-4 pointer-events-none text-slate-400 group-focus-within:text-planet-yellow transition-colors dark:text-white/40">
                <ClipboardList size={18} />
              </div>
              <textarea
                placeholder="Any allergies, past surgeries, or special mentions..."
                rows={4}
                className="w-full bg-white/60 border-2 border-transparent focus:border-planet-yellow/30 focus:bg-white rounded-2xl py-4 pl-12 pr-4 outline-none transition-all shadow-sm focus:shadow-planet-yellow/10 resize-none dark:bg-neutral-900 dark:border-white/10 dark:text-white/90"
                value={formData.medicalHistory}
                onChange={(e) => setFormData({...formData, medicalHistory: e.target.value})}
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 mt-8"
          >
            <Sparkles size={20} className="text-planet-yellow" />
            Create Profile
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
