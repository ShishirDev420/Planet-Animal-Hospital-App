import { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Loader2 } from 'lucide-react';
import Logo from '../components/Logo';

export default function Welcome() {
  const [loginEmail, setLoginEmail] = useState('harshal@planetanimal.com');
  const [loginPassword, setLoginPassword] = useState('Harshal@2026!');
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleEmailSignIn = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both email and password.');
      return;
    }
    setIsEmailLoading(true);
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
        try {
          await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
        } catch (createError: any) {
          console.error('Failed to create user', createError);
          if (createError.code === 'auth/operation-not-allowed') {
            setLoginError('Email/Password sign-in is not enabled. Please enable it in the Firebase Console under Authentication > Sign-in method.');
          } else {
            setLoginError(createError.message);
          }
        }
      } else if (error.code === 'auth/operation-not-allowed') {
        setLoginError('Email/Password sign-in is not enabled. Please enable it in the Firebase Console under Authentication > Sign-in method.');
      } else {
        console.error('Login failed', error);
        setLoginError(error.message || 'Failed to sign in. Please check your credentials.');
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#071912] backdrop-blur-3xl flex items-center justify-center p-6 relative overflow-hidden dark:bg-[#071912]">
      {/* Ambient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-green-400/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-planet-yellow/20 rounded-full blur-[100px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-10 shadow-[0_8px_32px_rgba(0,0,0,0.1)] relative z-10 dark:bg-neutral-900/80 dark:border-white/10"
      >
        <div className="flex justify-center mb-8">
           <Logo className="!w-24 !h-24" />
        </div>
        <h2 className="text-3xl font-black text-white text-center mb-2 tracking-tight">Sign In</h2>
        <p className="text-white/70 text-center mb-8 font-medium">Sign in to manage your pet's health.</p>
        
        <div className="space-y-4 mb-8">
          {loginError && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-sm p-3 rounded-xl font-medium">
              {loginError}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-white/80 mb-1 ml-1 uppercase tracking-wider">Email</label>
            <input 
              type="email" 
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-planet-yellow focus:ring-1 focus:ring-planet-yellow transition-all" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-white/80 mb-1 ml-1 uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-planet-yellow focus:ring-1 focus:ring-planet-yellow transition-all" 
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={handleEmailSignIn}
            disabled={isEmailLoading}
            className="w-full bg-gradient-to-r from-planet-yellow to-yellow-600 text-white font-bold py-4 rounded-2xl shadow-[0_4px_20px_rgba(234,179,8,0.4)] hover:shadow-[0_4px_25px_rgba(234,179,8,0.6)] transition-all flex items-center justify-center gap-2"
          >
            {isEmailLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
          </motion.button>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              try {
                const provider = new GoogleAuthProvider();
                await signInWithPopup(auth, provider);
              } catch (e) {
                console.error('Login failed', e);
              }
            }}
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold py-4 rounded-2xl hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
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
  );
}
