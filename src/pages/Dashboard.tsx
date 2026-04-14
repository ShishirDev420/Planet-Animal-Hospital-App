import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useMotionTemplate, animate, Reorder } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, Calendar, FileText, Award, ChevronRight, Gift, X, Dog, 
  CheckCircle2, Syringe, Sparkles, Stethoscope, ChevronDown, ChevronUp, Loader2, LogOut, Info, PawPrint
} from 'lucide-react';
import Logo from '../components/Logo';
import DualAvatar from '../components/DualAvatar';
import { useProfileImages } from '../hooks/useProfileImages';
import { collection, addDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../lib/firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo?: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const SERVICE_MENU = [
  {
    category: "Grooming Spa",
    icon: <Sparkles size={18} />,
    items: [
      { name: "Standard Spa Session", price: "₹1,199" },
      { name: "Medicated Bath (Tick/Flea/Fungal)", price: "₹1,499" }
    ]
  },
  {
    category: "General Checkup",
    icon: <Stethoscope size={18} />,
    items: [
      { name: "Standard Wellness Check", price: "₹500" },
      { name: "Emergency Checkup (Skip the line)", price: "₹1,200" }
    ]
  },
  {
    category: "Dental Scaling",
    icon: <Dog size={18} />,
    items: [
      { name: "Dental Scaling Consultation", price: "₹450" },
      { name: "Full Dental Scaling", price: "₹2,500" }
    ]
  },
  {
    category: "Vaccinations (Dog Specific)",
    icon: <Syringe size={18} />,
    items: [
      { name: "Anti-Rabies", price: "₹400" },
      { name: "7-in-1 Combo (DHPPiL)", price: "₹950" },
      { name: "Bordetella (Kennel Cough)", price: "₹800" }
    ]
  },
  {
    category: "Skin Checkup",
    icon: <FileText size={18} />,
    items: [
      { name: "Skin Issues Consultation", price: "₹650" }
    ]
  }
];

const petProfile = { name: 'Johnny', breed: 'American Bully', age: 8, isSenior: true, isOverweight: true };

function getPersonalizedIncentives(pet: { name: string, breed: string, age: number, isSenior: boolean, isOverweight?: boolean }) {
  const incentives = [];

  if (pet.isOverweight) {
    incentives.push({
      id: "weight-management",
      title: "Weight Management Plan",
      subtext: `Tailored cardio and nutrition for ${pet.name}’s frame.`,
      pointsText: "+1,500 pts",
      pointsValue: 1500,
      highValue: true,
      theme: "purple" as const
    });
  }

  if (pet.isSenior) {
    incentives.push({
      id: "senior-health",
      title: "Senior Health Screening",
      subtext: "Specialized care for the golden years.",
      pointsText: "+1,200 pts",
      pointsValue: 1200,
      highValue: true,
      theme: "blue" as const
    });
  }

  const breedLower = pet.breed.toLowerCase();
  if (breedLower.includes('bully') || breedLower.includes('pug')) {
    incentives.push({
      id: "joint-mobility",
      title: "Joint & Mobility Check",
      subtext: "Keep those joints healthy.",
      pointsText: "+800 pts",
      pointsValue: 800,
      highValue: true,
      theme: "blue" as const
    });
    incentives.push({
      id: "respiratory-wellness",
      title: "Respiratory Wellness",
      subtext: "Breathe easy and stay active.",
      pointsText: "+700 pts",
      pointsValue: 700,
      theme: "green" as const
    });
  } else if (breedLower.includes('golden retriever')) {
    incentives.push({
      id: "advanced-grooming",
      title: "Advanced Grooming Spa",
      subtext: "Deep clean for that golden coat.",
      pointsText: "+900 pts",
      pointsValue: 900,
      highValue: true,
      theme: "yellow" as const
    });
  }

  // Standard baseline options
  incentives.push({
    id: "general-checkup",
    title: "General Checkup",
    subtext: "Standard wellness check.",
    pointsText: "+1,000 pts",
    pointsValue: 1000,
    highValue: true,
    theme: "yellow" as const
  });
  
  incentives.push({
    id: "vaccinations",
    title: "Vaccinations",
    subtext: "Keep them protected.",
    pointsText: "+750 pts",
    pointsValue: 750,
    theme: "yellow" as const
  });

  incentives.push({
    id: "social-spotlight",
    title: "Social Spotlight",
    subtext: "Tag us in a pic of your pet!",
    pointsText: "+300 pts",
    pointsValue: 300,
    theme: "purple" as const
  });

  return incentives.map((incentive, index) => ({
    ...incentive,
    id: `${incentive.id}-${crypto.randomUUID()}`
  }));
}

function getDailyTip(pet: { name: string, breed: string, age: number, isSenior: boolean }) {
  const currentSeason = 'Summer';
  const breedLower = pet.breed.toLowerCase();

  if ((breedLower.includes('bully') || breedLower.includes('retriever')) && currentSeason === 'Summer') {
    return `Summer is here! ☀️ Keep ${pet.name} hydrated and avoid walking on hot pavements during peak afternoon heat.`;
  }
  if (pet.isSenior) {
    return `${pet.name} is in their golden years! Regular checkups are key to catching issues early.`;
  }
  return `Keep ${pet.name} hydrated and active today!`;
}

function DailyTip({ pet }: { pet: typeof petProfile }) {
  const tip = getDailyTip(pet);
  return (
    <div className="bg-white/40 backdrop-blur-md border border-white/50 text-slate-700 text-sm py-3 px-4 rounded-2xl flex gap-3 items-start shadow-sm mt-4">
      <Info size={20} className="text-planet-yellow shrink-0 mt-0.5" />
      <p className="font-medium leading-snug">{tip}</p>
    </div>
  );
}

function generateWhatsAppPayload(serviceName: string) {
  const message = `Hi Planet Animal Hospital! 👋\nI would like to book a visit.\n👤 Parent: Harshal\n🐾 Pet: ${petProfile.name} (Dog - ${petProfile.breed}, Age ${petProfile.age})\n🏥 Requested Service: ${serviceName}`;
  return 'https://wa.me/919004290923?text=' + encodeURIComponent(message);
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState('harshal@planetanimal.com');
  const [loginPassword, setLoginPassword] = useState('Harshal@2026!');
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { harshalImage, johnnyImage } = useProfileImages();
  
  // Firebase State
  const [verifiedPoints, setVerifiedPoints] = useState(4450);
  const [pendingPoints, setPendingPoints] = useState(0);
  const [pendingIncentives, setPendingIncentives] = useState<string[]>([]);
  const [incentivesOrder, setIncentivesOrder] = useState(getPersonalizedIncentives(petProfile));

  const handleBookAppointment = async (incentive: any) => {
    if (!userId) return;
    
    // Optimistic UI updates
    setPendingIncentives(prev => [...prev, incentive.id]);
    setPendingPoints(prev => prev + incentive.pointsValue);
    
    try {
      await addDoc(collection(db, 'pointsQueue'), {
        patient: 'Johnny',
        reason: incentive.title,
        points: incentive.pointsValue,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'pointsQueue');
      // Revert optimistic update on failure
      setPendingIncentives(prev => prev.filter(id => id !== incentive.id));
      setPendingPoints(prev => prev - incentive.pointsValue);
    }
  };

  // Mouse tracking for Paw Points Card
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const glareBackground = useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.4), transparent 80%)`;

  const handleCardMouseMove = ({ currentTarget, clientX, clientY }: React.MouseEvent) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  const handleCardMouseLeave = ({ currentTarget }: React.MouseEvent) => {
    const { width, height } = currentTarget.getBoundingClientRect();
    animate(mouseX, width / 2, { type: 'spring', stiffness: 150, damping: 15 });
    animate(mouseY, height / 2, { type: 'spring', stiffness: 150, damping: 15 });
  };

  const handleEmailSignIn = async () => {
    setIsEmailLoading(true);
    setLoginError(null);
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
        setLoginError(error.message);
      }
    } finally {
      setIsEmailLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        setUserId(user.uid);
      } else {
        setIsAuthenticated(false);
        setUserId(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !userId) return;

    const q = query(collection(db, 'pointsQueue'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let newPending = 0;
      let newVerified = 0;
      const newPendingActions: string[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'pending') {
          newPending += data.points || 0;
          if (data.actionId) newPendingActions.push(data.actionId);
        } else if (data.status === 'verified') {
          newVerified += data.points || 0;
        }
      });

      setPendingPoints(newPending);
      setVerifiedPoints(4450 + newVerified);
      setPendingIncentives(newPendingActions);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'pointsQueue');
    });

    return () => unsubscribe();
  }, [isAuthReady, userId]);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Booking State
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [upcomingAppts, setUpcomingAppts] = useState([{ date: '12', title: 'Annual Wellness Exam', time: '10:30 AM' }]);
  const [isConnecting, setIsConnecting] = useState(false);

  // Drag-to-Scroll State
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  // Wheel-to-Horizontal-Scroll Logic
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    let isThrottled = false;

    const handleWheel = (e: WheelEvent) => {
      // Prevent vertical scrolling of the page
      e.preventDefault();
      
      if (isThrottled) return;
      isThrottled = true;
      
      // Translate vertical wheel movement to horizontal scrolling
      carousel.scrollBy({ left: e.deltaY > 0 ? 400 : -400, behavior: 'smooth' });
      
      setTimeout(() => {
        isThrottled = false;
      }, 400);
    };

    // Attach non-passive event listener to allow preventDefault()
    carousel.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      carousel.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const closeModal = () => {
    setActiveModal(null);
    setTimeout(() => {
      setBookingDate('');
      setBookingTime('');
      setIsConnecting(false);
    }, 300); // reset after close animation
  };

  const handleConfirmBooking = async () => {
    if (!bookingDate || !bookingTime || !userId) return;
    setIsConnecting(true);
    
    try {
      await addDoc(collection(db, 'pointsQueue'), {
        patient: 'Johnny',
        reason: 'General Grooming & Checkup',
        points: 500,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'pointsQueue');
    }

    // Add to upcoming appointments
    const dateObj = new Date(bookingDate);
    const day = dateObj.getDate().toString();
    
    // Format time (e.g., 14:30 -> 2:30 PM)
    const [hours, minutes] = bookingTime.split(':');
    const hourInt = parseInt(hours, 10);
    const ampm = hourInt >= 12 ? 'PM' : 'AM';
    const formattedHour = hourInt % 12 || 12;
    const formattedTime = `${formattedHour}:${minutes} ${ampm}`;

    setUpcomingAppts(prev => [...prev, {
      date: day,
      title: 'General Grooming & Checkup',
      time: formattedTime
    }]);

    setTimeout(() => {
      const waUrl = `https://wa.me/919876543210?text=Hi! I would like to confirm my Grooming & Checkup appointment booked via the app for ${bookingDate} at ${formattedTime}.`;
      window.open(waUrl, '_blank');
      
      setIsConnecting(false);
      closeModal();
    }, 1500);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Ambient Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-green-400/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-planet-yellow/30 rounded-full blur-[100px]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/10 backdrop-blur-[50px] border border-white/20 p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] relative z-10"
        >
          <div className="flex justify-center mb-8">
             <Logo className="!w-20 !h-20" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 text-center mb-2 tracking-tight">Welcome Back</h2>
          <p className="text-slate-500 text-center mb-8 font-medium">Sign in to manage your pet's health.</p>
          
          <div className="space-y-4 mb-8">
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-600 text-sm p-3 rounded-xl font-medium">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 ml-1 uppercase tracking-wider">Email</label>
              <input 
                type="email" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-white/50 border border-white/40 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-planet-yellow/50 transition-all" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 ml-1 uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-white/50 border border-white/40 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-planet-yellow/50 transition-all" 
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={handleEmailSignIn}
              disabled={isEmailLoading}
              className="w-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-800 font-bold py-4 rounded-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:bg-white/50 transition-all flex items-center justify-center gap-2"
            >
              {isEmailLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In with Email'}
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
              className="w-full bg-white/40 backdrop-blur-md border border-white/50 text-slate-800 font-bold py-4 rounded-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] hover:bg-white/50 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign In with Google
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 pb-32">
      {/* Header with Logo */}
      <header className="pt-4 mb-2">
        <div className="relative flex items-center justify-between w-full py-4">
          {/* Logo Container (Left) */}
          <div className="relative z-10">
            <button onClick={() => navigate('/profiles')} className="shrink-0 group">
              <div className="animate-sync-heartbeat origin-left drop-shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-transform active:scale-95">
                <Logo className="!w-16 !h-16" />
              </div>
            </button>
          </div>
            
          {/* Center Text Container */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-0 w-max pointer-events-none whitespace-nowrap">
            <span className="text-lg font-black text-slate-800 tracking-tight uppercase block leading-none">PLANET ANIMAL</span>
            <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-[0.25em] mt-0.5">HOSPITAL & WELLNESS</span>
          </div>

          {/* Profile Container (Right) */}
          <div className="relative z-10">
            <MagneticWrapper className="rounded-full">
              <button onClick={() => navigate('/settings')} className="shrink-0 block">
                <div className="animate-sync-heartbeat origin-center">
                  <DualAvatar 
                    leftImage={harshalImage}
                    rightImage={johnnyImage}
                    className="w-16 h-16 ring-2 ring-yellow-500/30 ring-offset-2 ring-offset-white/50 hover:ring-yellow-500/70 transition-all duration-300 shadow-sm active:scale-95 rounded-full"
                  />
                </div>
              </button>
            </MagneticWrapper>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hi, Harshal 👋</h1>
          <p className="text-slate-500 text-sm">Let's keep Johnny healthy today.</p>
          <DailyTip pet={petProfile} />
        </div>
      </header>

      {/* Points Wallet - Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
        className="bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] rounded-[2rem] p-6 relative overflow-hidden"
      >
        <motion.div 
          className="absolute inset-0 z-0 pointer-events-none"
          style={{ background: glareBackground }}
        />
        <div className="absolute top-0 right-0 w-32 h-32 bg-planet-yellow/20 rounded-full blur-2xl -mr-10 -mt-10 z-0"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full backdrop-blur-md border border-white/60 shadow-sm">
              <Award className="text-planet-yellow" size={16} />
              <span className="text-xs font-bold text-slate-800">Proactive Member</span>
            </div>
            <div className="bg-planet-yellow text-black text-[10px] uppercase tracking-wider font-black px-2 py-1 rounded-lg shadow-sm">
              2x Multiplier
            </div>
          </div>
          <h2 className="text-slate-600 text-sm font-medium mb-2">Paw Points Balance</h2>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-6xl tracking-tighter tabular-nums font-black text-slate-900">{verifiedPoints.toLocaleString()}</span>
            <span className="text-slate-400 font-bold uppercase tracking-widest text-sm ml-1 mb-2">pts</span>
          </div>
          
          {pendingPoints > 0 && (
            <div className="mt-3 mb-2 flex items-center gap-2">
              <div className="bg-yellow-100 text-yellow-700 font-bold tracking-tight px-2.5 py-1 rounded-full text-sm border border-yellow-200/50 shadow-sm">
                + {pendingPoints.toLocaleString()} Pending
              </div>
              <span className="text-[10px] text-slate-400 font-medium max-w-[150px] leading-tight">
                Points are verified after clinic confirmation via WhatsApp.
              </span>
            </div>
          )}

          <div className="mt-8">
            <div className="h-2.5 w-full bg-slate-900/10 rounded-full overflow-hidden shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (verifiedPoints / 5000) * 100)}%` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                className="h-full bg-gradient-to-r from-planet-yellow to-yellow-400 rounded-full"
              />
            </div>
            <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-wider">
              {Math.max(0, 5000 - verifiedPoints).toLocaleString()} POINTS UNTIL YOUR NEXT FREE CONSULTATION!
            </p>
          </div>
          
          <div className="flex gap-3 mt-6">
            <MagneticWrapper className="flex-1 rounded-xl">
              <button 
                onClick={() => verifiedPoints >= 5000 && setActiveModal('redeem')}
                disabled={verifiedPoints < 5000}
                className={`w-full h-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
                  verifiedPoints < 5000
                    ? 'bg-white/40 text-gray-400 border border-gray-200 cursor-not-allowed backdrop-blur-sm'
                    : 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-[0_4px_20px_rgba(234,179,8,0.4)] hover:shadow-[0_4px_25px_rgba(234,179,8,0.6)] font-bold animate-pulse'
                }`}
              >
                <Gift size={16} className={verifiedPoints < 5000 ? "text-gray-400" : "text-white"} />
                Claim Free Consult
              </button>
            </MagneticWrapper>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <ActionCard 
            icon={<Calendar className="text-teal-500" />} 
            title="Book Visit" 
            subtitle="Checkups & Grooming" 
            onClick={() => setActiveModal('book')}
          />
          <ActionCard 
            icon={<FileText className="text-indigo-500" />} 
            title="Medical Records" 
            subtitle="Vaccines & History" 
            onClick={() => setActiveModal('records')}
          />
        </div>
      </div>

      {/* Upcoming */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Upcoming for Johnny</h3>
          <button className="text-planet-yellow text-sm font-bold flex items-center">View All <ChevronRight size={16}/></button>
        </div>
        <div className="space-y-3">
          {upcomingAppts.map((appt, idx) => (
            <div key={idx} className="glass rounded-2xl p-4 flex items-center gap-4">
              <div className="bg-teal-100 w-12 h-12 rounded-xl flex items-center justify-center text-teal-600 font-bold text-xl shrink-0">
                {appt.date}
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{appt.title}</h4>
                <p className="text-sm text-slate-500">Dr. Naveen • {appt.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ways to Earn Points */}
      <div className="pt-2 relative">
        <div className="flex items-center gap-2 mb-4 relative z-10">
          <h3 className="text-lg font-bold">Ways to Earn Paw Points</h3>
          <PawPrint className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
        </div>
        
        {/* The Shelf Effect */}
        <div className="absolute bottom-8 left-0 right-0 h-24 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none z-0" />

        <div className="relative w-full [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
          <Reorder.Group 
            ref={carouselRef}
            axis="x" 
            values={incentivesOrder} 
            onReorder={setIncentivesOrder} 
            className="flex overflow-x-scroll hide-scrollbar gap-4 py-10 -my-10 relative z-10 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none' }}
          >
            {incentivesOrder.map((incentive) => (
              <Reorder.Item value={incentive} key={incentive.id} className="flex-none w-[320px] group">
                <EarnCard 
                  id={incentive.id}
                  title={incentive.title}
                  subtext={incentive.subtext}
                  pointsText={incentive.pointsText}
                  pointsValue={incentive.pointsValue}
                  highValue={incentive.highValue}
                  theme={incentive.theme}
                  isPending={pendingIncentives.includes(incentive.id)}
                  onBook={() => handleBookAppointment(incentive)} 
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      </div>

      {/* Modals / Bottom Sheets */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
          />
        )}
        {activeModal && (
          <motion.div
            key="modal-content"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-2xl rounded-t-3xl z-[70] p-6 pb-12 border-t border-white/50 shadow-2xl max-h-[85vh] overflow-y-auto hide-scrollbar flex flex-col"
          >
              <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-6 shrink-0" />
              
              {activeModal === 'book' && (
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-6 shrink-0">
                    <h2 className="text-2xl font-bold">Book a Visit</h2>
                    <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
                  </div>
                  
                  <div className="space-y-4 overflow-y-auto hide-scrollbar pb-4 flex-1">
                    {SERVICE_MENU.map((category) => (
                      <div key={category.category} className="bg-white/60 rounded-2xl border border-white overflow-hidden shadow-sm">
                        <button 
                          onClick={() => setExpandedCategory(expandedCategory === category.category ? null : category.category)}
                          className="w-full flex items-center justify-between p-4 bg-white/40 active:bg-white/60 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-slate-500">{category.icon}</div>
                            <span className="font-bold text-slate-800">{category.category}</span>
                          </div>
                          {expandedCategory === category.category ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                        </button>
                        
                        <AnimatePresence>
                          {expandedCategory === category.category && (
                            <motion.div
                              key={`expanded-${category.category}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-2 space-y-2 bg-slate-50/50">
                                {category.items.map((item) => {
                                  const isSelected = selectedServices.includes(item.name);
                                  return (
                                    <div 
                                      key={item.name}
                                      onClick={() => toggleService(item.name)}
                                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                                        isSelected 
                                          ? 'bg-planet-yellow/10 border-planet-yellow shadow-sm' 
                                          : 'bg-white border-transparent hover:border-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                          isSelected ? 'border-planet-yellow bg-planet-yellow text-black' : 'border-slate-300'
                                        }`}>
                                          {isSelected && <CheckCircle2 size={14} />}
                                        </div>
                                        <span className={`text-sm ${isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                          {item.name}
                                        </span>
                                      </div>
                                      <span className="text-xs font-bold text-slate-500">{item.price}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 mt-auto shrink-0 bg-white/90 backdrop-blur-md border-t border-slate-100">
                    <button 
                      onClick={handleConfirmBooking}
                      disabled={selectedServices.length === 0 || isConnecting}
                      className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                        selectedServices.length === 0
                          ? 'bg-slate-200 text-slate-400 shadow-none'
                          : 'bg-planet-yellow text-black shadow-planet-yellow/20 active:scale-95'
                      }`}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Connecting to WhatsApp...
                        </>
                      ) : (
                        `Confirm Booking (${selectedServices.length})`
                      )}
                    </button>
                  </div>
                </div>
              )}

              {activeModal === 'records' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Medical Records</h2>
                    <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
                  </div>
                  <div className="text-center py-12 px-4">
                    <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText size={40} className="text-indigo-300" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Awaiting First Visit</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Your pet's medical records, vaccination history, and test results will automatically populate here as you keep visiting us.
                    </p>
                  </div>
                </div>
              )}

              {activeModal === 'redeem' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Claim Free Consult</h2>
                    <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
                    <Gift className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">You've Unlocked a Free Consultation!</h3>
                    <p className="text-slate-600 mb-6">
                      Show this screen to our staff at checkout to claim your free consultation for Johnny.
                    </p>
                    <div className="bg-white rounded-xl p-4 shadow-sm inline-block">
                      <p className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-1">Current Balance</p>
                      <p className="text-3xl font-black text-slate-900">{verifiedPoints.toLocaleString()} <span className="text-base text-slate-400">pts</span></p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionCard({ icon, title, subtitle, onClick }: { icon: React.ReactNode, title: string, subtitle: string, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="glass rounded-2xl p-4 flex flex-col items-start gap-3 active:scale-95 transition-transform cursor-pointer hover:bg-white/50"
    >
      <div className="bg-white/80 p-2 rounded-xl shadow-sm">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function MagneticWrapper({ children, className }: { children: React.ReactNode, className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { width, height, left, top } = ref.current.getBoundingClientRect();
    const x = clientX - (left + width / 2);
    const y = clientY - (top + height / 2);
    
    const cappedX = Math.max(-15, Math.min(15, x * 0.3));
    const cappedY = Math.max(-15, Math.min(15, y * 0.3));

    setPosition({ x: cappedX, y: cappedY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      whileTap={{ scale: 0.92, transition: { type: "spring", stiffness: 400, damping: 17 } }}
      className={`relative group ${className || ''}`}
    >
      <div className="absolute inset-0 rounded-[inherit] bg-white/0 group-hover:bg-white/20 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 pointer-events-none z-0" />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </motion.div>
  );
}

function EarnCard({ id, title, subtext, pointsText, pointsValue, highValue, isPending, theme = 'yellow', onBook }: { id: string, title: string, subtext?: string, pointsText: string, pointsValue: number, highValue?: boolean, isPending: boolean, theme?: 'blue' | 'orange' | 'green' | 'purple' | 'yellow', onBook: (id: string, points: number, title: string) => void }) {
  const themeGradients = {
    blue: 'from-blue-400/20',
    orange: 'from-orange-400/20',
    green: 'from-emerald-400/20',
    purple: 'from-purple-400/20',
    yellow: 'from-yellow-400/20'
  };

  const textGradients = {
    blue: 'from-blue-500 to-blue-700',
    orange: 'from-orange-500 to-orange-700',
    green: 'from-emerald-500 to-emerald-700',
    purple: 'from-purple-500 to-purple-700',
    yellow: 'from-yellow-500 to-yellow-700'
  };

  const glowShadows = {
    blue: 'hover:shadow-[inset_1px_1px_2px_rgba(255,255,255,0.6),0_12px_40px_rgba(0,0,0,0.1),0_0_30px_rgba(59,130,246,0.3)]',
    orange: 'hover:shadow-[inset_1px_1px_2px_rgba(255,255,255,0.6),0_12px_40px_rgba(0,0,0,0.1),0_0_30px_rgba(249,115,22,0.3)]',
    green: 'hover:shadow-[inset_1px_1px_2px_rgba(255,255,255,0.6),0_12px_40px_rgba(0,0,0,0.1),0_0_30px_rgba(16,185,129,0.3)]',
    purple: 'hover:shadow-[inset_1px_1px_2px_rgba(255,255,255,0.6),0_12px_40px_rgba(0,0,0,0.1),0_0_30px_rgba(168,85,247,0.3)]',
    yellow: 'hover:shadow-[inset_1px_1px_2px_rgba(255,255,255,0.6),0_12px_40px_rgba(0,0,0,0.1),0_0_30px_rgba(234,179,8,0.3)]'
  };

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className={`snap-start relative min-w-[240px] shrink-0 flex flex-col cursor-grab active:cursor-grabbing w-full h-[260px] bg-white/20 backdrop-blur-3xl border-t border-l border-white/70 border-b border-r border-white/20 shadow-[0_8px_32px_rgba(20,20,20,0.04)] rounded-3xl p-6 overflow-hidden transition-all duration-300 hover:shadow-[0_16px_48px_rgba(245,158,11,0.15)] group`}
    >
      {/* Dynamic Gradient Background */}
      <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${themeGradients[theme]} via-transparent to-transparent pointer-events-none`} />
      
      {/* Shimmer Effect for High Value */}
      {highValue && (
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-[shimmer_3s_infinite] pointer-events-none z-0" />
      )}

      {/* Absolute High Value Badge */}
      {highValue && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white/60 backdrop-blur-md border border-white/50 text-yellow-700 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <Sparkles className="w-3 h-3" />
          High Value
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full">
        <div className="mt-8 flex flex-col items-start gap-2">
          <h4 className="font-bold text-slate-800 text-base leading-tight transition-all duration-500 group-hover:tracking-wide">{title}</h4>
          {subtext && <p className="text-sm text-gray-600/90 leading-relaxed font-medium">{subtext}</p>}
        </div>
        
        <div className="mt-auto flex flex-col">
          <div className="mb-4 flex items-center gap-1.5">
            <PawPrint className="w-6 h-6 text-yellow-500 fill-yellow-500/40 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)] animate-pulse" />
            <p className="font-black text-2xl tracking-tight drop-shadow-sm bg-clip-text text-transparent bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600">
              {pointsText}
            </p>
          </div>
          
          <MagneticWrapper className="w-full rounded-xl">
            <button 
              onClick={() => onBook(id, pointsValue, title)}
              disabled={isPending}
              className={`text-xs font-bold py-3 rounded-xl w-full transition-all shadow-xl ${
                isPending 
                  ? 'bg-gray-100/50 text-gray-500 cursor-not-allowed border border-white/40' 
                  : 'bg-yellow-500 backdrop-blur-xl border border-yellow-400 text-white hover:bg-yellow-600'
              }`}
            >
              {isPending ? 'Pending Confirmation' : 'Book Now'}
            </button>
          </MagneticWrapper>
        </div>
      </div>
    </motion.div>
  );
}
