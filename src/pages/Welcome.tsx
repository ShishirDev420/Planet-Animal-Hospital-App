import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Loader2 } from 'lucide-react';

export default function Welcome() {
  const [loginEmail, setLoginEmail] = useState('harshal@planetanimal.com');
  const [loginPassword, setLoginPassword] = useState('Harshal@2026!');
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [activeBenefit, setActiveBenefit] = useState(0);

  const benefits = [
    { title: "✨ Proactive Healthcare", desc: "Automated updates to keep your pet thriving." },
    { title: "📅 1-Tap Booking", desc: "Schedule clinic visits instantly." },
    { title: "🏆 Earn Paw Points", desc: "Get rewarded for proactive preventative care." }
  ];

  // The rotating flashcard timer
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBenefit((prev) => (prev + 1) % benefits.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [benefits.length]);

  const handleEmailSignIn = async () => {
    setIsEmailLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (e) {
      console.error('Login failed', e);
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col justify-between bg-[#071912] relative overflow-x-hidden overflow-y-auto">
      
      {/* 🔮 THE LOCKED ORB MOAT */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/30 rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-blob"></div>
        <div className="absolute top-[10%] right-[-5%] w-96 h-96 bg-[#fec708]/20 rounded-full mix-blend-screen filter blur-[100px] opacity-60 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[40rem] h-[40rem] bg-teal-600/20 rounded-full mix-blend-screen filter blur-[120px] opacity-50 animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* ✨ MAIN UI CONTENT */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full px-4 pt-16 flex-1">
        
        {/* Cinematic Tagline */}
        <div className="text-center mb-6">
          <h1 className="text-white font-black text-4xl lg:text-5xl mb-2 tracking-tight">
            20 Years of Love.
          </h1>
          <h2 className="text-2xl font-semibold text-white/90">
            Now Powered by{' '}
            <span className="font-bold tracking-wide">
              <span className="text-[#4285F4]">G</span>
              <span className="text-[#EA4335]">o</span>
              <span className="text-[#FBBC05]">o</span>
              <span className="text-[#4285F4]">g</span>
              <span className="text-[#34A853]">l</span>
              <span className="text-[#EA4335]">e</span>
            </span>
            .
          </h2>
        </div>

        {/* Premium Liquid Glass Flashcard */}
        <div className="w-full max-w-sm my-4 min-h-[140px] flex flex-col justify-center items-center text-center bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-3xl p-6 overflow-hidden">
          <div key={activeBenefit} className="animate-[pulse_1s_ease-in-out]">
            <h3 className="text-white font-bold text-xl mb-2">{benefits[activeBenefit].title}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{benefits[activeBenefit].desc}</p>
          </div>
        </div>
      </div>

      {/* 🔐 BOTTOM AUTH FORM */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-4 pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1 ml-1 uppercase tracking-wider">Email</label>
              <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#fec708] focus:ring-1 focus:ring-[#fec708] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/80 mb-1 ml-1 uppercase tracking-wider">Password</label>
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#fec708] focus:ring-1 focus:ring-[#fec708] transition-all" />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleEmailSignIn} disabled={isEmailLoading} className="w-full bg-gradient-to-r from-[#fec708] to-yellow-600 text-white font-bold py-4 rounded-2xl shadow-[0_4px_20px_rgba(254,199,8,0.4)] hover:shadow-[0_4px_25px_rgba(254,199,8,0.6)] transition-all flex items-center justify-center gap-2">
              {isEmailLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
            </motion.button>
            
            <motion.button whileTap={{ scale: 0.95 }} onClick={async () => { try { const provider = new GoogleAuthProvider(); await signInWithPopup(auth, provider); } catch (e) { console.error('Login failed', e); } }} className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold py-4 rounded-2xl hover:bg-white/20 transition-all flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </motion.button>
          </div>
        </motion.div>
      </div>

    </div>
  );
}