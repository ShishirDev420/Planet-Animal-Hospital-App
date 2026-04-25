import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Loader2, Heart } from 'lucide-react';

export default function Welcome({ initialOnboarding = false, onComplete }: { initialOnboarding?: boolean, onComplete?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeBenefit, setActiveBenefit] = useState(0);
  const [headerWord, setHeaderWord] = useState('Love');
  const [needsOnboarding, setNeedsOnboarding] = useState(initialOnboarding);
  const [parentName, setParentName] = useState('');
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [weight, setWeight] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');

  useEffect(() => {
    setNeedsOnboarding(initialOnboarding);
    if (initialOnboarding && auth.currentUser?.displayName && !parentName) {
      setParentName(auth.currentUser.displayName.split(' ')[0]);
    }
  }, [initialOnboarding]);

  const headerWords = ['Love', 'Care', 'Trust', 'Healing'];

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

  // The Heartbeat Header timer
  useEffect(() => {
    const timer = setInterval(() => {
      setHeaderWord((prev) => {
        const nextIndex = (headerWords.indexOf(prev) + 1) % headerWords.length;
        return headerWords[nextIndex];
      });
    }, 2000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsEmailLoading(true);
    setAuthError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e: any) {
      console.error('Auth failed', e);
      if (e.code === 'auth/invalid-credential') {
        setAuthError("Incorrect email/password, or account doesn't exist. Please check your details or Sign Up.");
      } else if (e.code === 'auth/email-already-in-use') {
        setAuthError("An account with this email already exists. Please verify your password and sign in.");
      } else {
        setAuthError(e.message || 'Authentication failed');
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setAuthError('');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // App.tsx uses onAuthStateChanged to intercept into onboarding
    } catch (e: any) {
      console.error('Google Login failed', e);
      setAuthError(e.message || 'Google Auth failed');
    }
  };

  const handleCompleteProfile = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!parentName.trim() || !petName.trim() || !breed.trim() || !age.trim() || !weight.trim()) {
      setAuthError('Please fill in all fields!');
      return;
    }
    try {
      setAuthError('');
      if (auth.currentUser) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName || 'Pet Parent',
          parentName: parentName.trim(),
          petName: petName.trim(),
          petType,
          breed: breed.trim(),
          age: age.trim(),
          gender,
          weight: weight.trim(),
          additionalDetails: additionalDetails.trim(),
          pawPoints: 500,
          createdAt: serverTimestamp()
        });
        if (onComplete) {
          onComplete();
        } else {
          setNeedsOnboarding(false);
        }
      }
    } catch (e: any) {
      console.error('Onboarding failed', e);
      setAuthError('Failed to save profile. Please try again.');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError('Please enter your email to reset password.');
      return;
    }
    try {
      setAuthError('');
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent! Please check your inbox.');
    } catch (e: any) {
      console.error('Password reset failed', e);
      setAuthError(e.message || 'Failed to send password reset email');
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-y-auto overflow-x-hidden z-10 bg-[#071912] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
      <style>{`
        @keyframes fluid-drift {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
      `}</style>
      
      {/* 🔮 THE LOCKED ORB MOAT */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="noise-overlay" />
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#34A853]/30 rounded-full blur-[120px] mix-blend-screen" style={{ animation: 'fluid-drift 11s infinite alternate ease-in-out' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#4285F4]/30 rounded-full blur-[120px] mix-blend-screen" style={{ animation: 'fluid-drift 13s infinite alternate-reverse ease-in-out' }}></div>
        <div className="absolute top-[20%] left-[20%] w-[50%] h-[50%] bg-[#fec708]/20 rounded-full blur-[120px] mix-blend-screen" style={{ animation: 'fluid-drift 17s infinite alternate ease-in-out' }}></div>
      </div>

      <div className="flex flex-col min-h-full w-full pb-8">
        {/* ✨ MAIN UI CONTENT */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-4 pt-12 pb-4 shrink-0">
          
        <div className="flex items-center justify-center mb-1 sm:mb-2 animate-fade-in-up">
          <img src="https://lh3.googleusercontent.com/d/1zldPukvYCnUvn5i2V9gqpDuR8WKhZ1_4" alt="Planet Animal Hospital Logo" className="w-28 sm:w-36 h-auto object-contain drop-shadow-[0_0_20px_rgba(254,199,8,0.8)] animate-pulse-slow z-50" referrerPolicy="no-referrer" />
        </div>

        {/* Cinematic Tagline */}
        <div className="flex flex-col items-center justify-center text-center w-full mb-1 sm:mb-2">
          <h1 className="font-heading font-extrabold tracking-tight drop-shadow-md text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 text-4xl sm:text-5xl mb-0">
            20 Years of
          </h1>
          <div className="relative w-full flex justify-center items-center h-[1.5em] text-[#fec708] font-heading font-extrabold text-4xl sm:text-5xl drop-shadow-[0_0_20px_rgba(254,199,8,0.8)]">
            {headerWords.map((word) => (
              <span
                key={word}
                className={`absolute w-full text-center inset-x-0 transition-opacity duration-1000 ease-in-out ${
                  headerWord === word ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                {word}.
              </span>
            ))}
          </div>
          <div className="flex flex-row items-center justify-center gap-2 mt-4 mb-4 w-full">
            <span className="text-xs sm:text-sm font-bold text-white/50 tracking-[0.15em] uppercase whitespace-nowrap">
              Now Powered by
            </span>
            <svg className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] animate-pulse" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="g-colors" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4285F4">
                    <animate attributeName="stop-color" values="#4285F4; #EA4335; #FBBC05; #34A853; #4285F4" dur="4s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="50%" stopColor="#EA4335">
                    <animate attributeName="stop-color" values="#EA4335; #FBBC05; #34A853; #4285F4; #EA4335" dur="4s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" stopColor="#FBBC05">
                    <animate attributeName="stop-color" values="#FBBC05; #34A853; #4285F4; #EA4335; #FBBC05" dur="4s" repeatCount="indefinite" />
                  </stop>
                </linearGradient>
              </defs>
              <path fill="url(#g-colors)" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
        </div>

        {/* Premium Liquid Glass Flashcard */}
        <div className="w-full max-w-sm my-1 sm:my-2 h-[90px] sm:h-[110px] flex flex-col justify-center items-center text-center bg-white/[0.08] backdrop-blur-3xl border border-white/10 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] rounded-3xl py-2 px-4 sm:px-6 overflow-hidden transition-all duration-500 hover:shadow-[0_0_50px_rgba(254,199,8,0.25)] hover:bg-white/10" style={{ willChange: 'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeBenefit}
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
              style={{ willChange: 'transform, opacity, filter' }}
              className="flex flex-col items-center justify-center text-center w-full"
            >
              <h3 className="font-heading font-extrabold tracking-tight drop-shadow-md text-white text-xl sm:text-2xl mb-1">{benefits[activeBenefit].title}</h3>
              <p className="text-white/70 font-medium text-xs sm:text-sm tracking-tight leading-relaxed max-w-[280px] mx-auto">{benefits[activeBenefit].desc}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

        {/* 🔐 BOTTOM AUTH FORM / ONBOARDING SWAP */}
        <div className="relative z-20 w-full max-w-sm mx-auto px-4 pb-12 shrink-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          
          {needsOnboarding ? (
            <div className="space-y-4">
              <h3 className="font-heading font-bold text-white text-lg text-center mb-4">Welcome! Who are we caring for?</h3>
              {authError && <p className="text-red-400 text-xs text-center mb-2">{authError}</p>}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-heading font-bold tracking-widest uppercase text-white/80 mb-1 ml-1">Your Name (Pet Parent)</label>
                  <input type="text" value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="e.g. John" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 font-body font-medium text-slate-100 placeholder:text-white/40 focus:outline-none focus:border-[#fec708] focus:ring-1 focus:ring-[#fec708] transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-heading font-bold tracking-widest uppercase text-white/80 mb-1 ml-1">Pet's Name</label>
                  <input type="text" value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="e.g. Bella" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 font-body font-medium text-slate-100 placeholder:text-white/40 focus:outline-none focus:border-[#fec708] focus:ring-1 focus:ring-[#fec708] transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-heading font-bold tracking-widest uppercase text-white/80 mb-1 ml-1">Pet Type</label>
                  <select value={petType} onChange={(e) => setPetType(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 font-body font-medium text-slate-100 focus:outline-none focus:border-[#fec708] focus:ring-1 focus:ring-[#fec708] transition-all appearance-none">
                    <option value="Dog" className="text-black">Dog</option>
                    <option value="Cat" className="text-black">Cat</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-heading font-bold tracking-widest uppercase text-white/80 mb-1 ml-1">Breed</label>
                  <input type="text" value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="e.g. Golden Retriever" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 font-body font-medium text-slate-100 placeholder:text-white/40 focus:outline-none focus:border-[#fec708] focus:ring-1 focus:ring-[#fec708] transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-heading font-bold tracking-widest uppercase text-white/80 mb-1 ml-1">Age</label>
                    <input type="text" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 2 yrs" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 font-body font-medium text-slate-100 placeholder:text-white/40 focus:outline-none focus:border-[#fec708] focus:ring-1 focus:ring-[#fec708] transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-heading font-bold tracking-widest uppercase text-white/80 mb-1 ml-1">Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 font-body font-medium text-slate-100 focus:outline-none focus:border-[#fec708] focus:ring-1 focus:ring-[#fec708] transition-all appearance-none">
                      <option value="Male" className="text-black">Male</option>
                      <option value="Female" className="text-black">Female</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-heading font-bold tracking-widest uppercase text-white/80 mb-1 ml-1">Weight (lbs/kg)</label>
                  <input type="text" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 15 lbs" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 font-body font-medium text-slate-100 placeholder:text-white/40 focus:outline-none focus:border-[#fec708] focus:ring-1 focus:ring-[#fec708] transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-heading font-bold tracking-widest uppercase text-white/80 mb-1 ml-1">Additional Details (Unlock Roadmap)</label>
                  <textarea value={additionalDetails} onChange={(e) => setAdditionalDetails(e.target.value)} placeholder="Any special needs, quirks, or roadmap requests?" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 font-body font-medium text-slate-100 placeholder:text-white/40 focus:outline-none focus:border-[#fec708] focus:ring-1 focus:ring-[#fec708] transition-all min-h-[80px]" />
                </div>
              </div>

              <div className="pt-2">
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleCompleteProfile} className="w-full bg-gradient-to-r from-[#fec708] to-yellow-600 text-white font-heading font-bold uppercase tracking-widest py-4 rounded-2xl shadow-[0_4px_20px_rgba(254,199,8,0.4)] hover:shadow-[0_4px_25px_rgba(254,199,8,0.6)] transition-all flex items-center justify-center">
                  Enter the Clinic
                </motion.button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {authError && <p className="text-red-400 font-body font-bold text-sm text-center mb-4 drop-shadow-md">{authError}</p>}
                <div className="relative group">
                  <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" data-lpignore="true" data-form-type="other" className="peer w-full bg-black/20 border border-white/10 rounded-xl px-4 pt-5 pb-2 text-slate-200 font-body font-bold tracking-wide placeholder-transparent focus:outline-none focus:border-[#fec708]/50 focus:ring-1 focus:ring-[#fec708]/30 transition-all duration-300 ease-out" placeholder="Email" />
                  <label htmlFor="email" className="absolute left-4 top-1 text-[10px] font-body font-bold text-slate-200 tracking-wide uppercase transition-all duration-300 ease-out peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:text-white/40 peer-focus:top-1 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-white/80 cursor-text select-none">Email</label>
                </div>
                <div className="relative group">
                  <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" data-lpignore="true" data-form-type="other" className="peer w-full bg-black/20 border border-white/10 rounded-xl px-4 pt-5 pb-2 text-slate-200 font-body font-bold tracking-wide placeholder-transparent focus:outline-none focus:border-[#fec708]/50 focus:ring-1 focus:ring-[#fec708]/30 transition-all duration-300 ease-out" placeholder="Password" />
                  <label htmlFor="password" className="absolute left-4 top-1 text-[10px] font-body font-bold text-slate-200 tracking-wide uppercase transition-all duration-300 ease-out peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-medium peer-placeholder-shown:text-white/40 peer-focus:top-1 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-white/80 cursor-text select-none">Password</label>
                </div>
              </div>

              <div className="space-y-4 pt-3">
                <button 
                  onClick={onSubmit} 
                  disabled={isEmailLoading}
                  className="w-full bg-[#fec708] hover:bg-[#e0b006] text-black font-heading font-bold uppercase tracking-widest py-3.5 px-4 rounded-xl transition-all duration-300 ease-out shadow-[0_0_15px_rgba(254,199,8,0.2)] hover:shadow-[0_0_20px_rgba(254,199,8,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center cursor-pointer"
                >
                  {isSignUp ? 'Create Account' : 'Enter the Clinic'}
                </button>
                <div className="flex justify-between w-full px-1">
                  {isSignUp ? (
                    <div></div>
                  ) : (
                    <button type="button" onClick={handleForgotPassword} className="text-xs font-body font-bold text-white/60 hover:text-white transition-colors duration-300 ease-out cursor-pointer tracking-wide">Forgot Password?</button>
                  )}
                  <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-xs font-body font-bold text-white/60 hover:text-white transition-colors duration-300 ease-out cursor-pointer tracking-wide">
                    {isSignUp ? 'Sign In Instead' : 'Create an Account'}
                  </button>
                </div>
                
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-white/30 text-xs font-heading font-bold uppercase tracking-widest">OR</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <button onClick={handleGoogleAuth} className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-heading font-bold uppercase tracking-widest text-slate-800 bg-white hover:bg-slate-100 transition-all duration-300 active:scale-95 shadow-md">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>
            </>
          )}
        </motion.div>
        </div>
      </div>
    </div>
  );
}