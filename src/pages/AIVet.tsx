import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AIVet() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center dark:bg-neutral-950">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/')}
        className="absolute top-8 left-6 p-3 rounded-full bg-white shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors dark:bg-neutral-900 dark:border-white/10 dark:text-white/70"
      >
        <ArrowLeft size={20} />
      </motion.button>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md"
      >
        <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner dark:bg-amber-900/30">
          <Sparkles size={40} className="text-amber-600 dark:text-amber-400" />
        </div>

        <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight dark:text-white">
          AI Vet - Coming Soon!
        </h1>
        
        <p className="text-slate-600 leading-relaxed dark:text-white/60">
          We are currently rebuilding our AI Veterinarian architecture to serve you and your pets better. 
          Please check back later for a more robust and reliable experience.
        </p>

        <div className="mt-12 flex flex-col gap-4">
          <div className="h-1 w-24 bg-amber-500 mx-auto rounded-full opacity-50" />
          <p className="font-display text-xs font-bold text-slate-400 uppercase tracking-widest">
            Planet Animal Hospital
          </p>
        </div>
      </motion.div>
    </div>
  );
}
