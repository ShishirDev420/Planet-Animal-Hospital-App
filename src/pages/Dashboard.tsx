import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useMotionTemplate, animate, Reorder } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, Calendar, FileText, Award, ChevronRight, Gift, X, Dog, 
  CheckCircle2, Syringe, Sparkles, Stethoscope, ChevronDown, ChevronUp, Loader2, LogOut, Info, PawPrint, Clock
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
    <div className="bg-white/40 backdrop-blur-md border border-white/50 text-slate-700 text-sm py-3 px-4 rounded-2xl flex gap-3 items-start shadow-sm mt-4 dark:bg-neutral-900 dark:border-white/10 dark:text-white/80">
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
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
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
  const [isBookVisitOpen, setIsBookVisitOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<{id: number, name: string, points: number} | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [upcomingAppts, setUpcomingAppts] = useState([{ date: '12', title: 'Annual Wellness Exam', time: '10:30 AM' }]);
  const [isConnecting, setIsConnecting] = useState(false);

  const BOOKING_SERVICES = [
    { id: 1, name: 'General Checkup', points: 1000 },
    { id: 2, name: 'Full Grooming', points: 800 },
    { id: 3, name: 'Vaccinations', points: 750 }
  ];

  // Drag-to-Scroll State
  const carouselRef = useRef<any>(null);
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

  const submitBooking = async () => {
    if (!selectedService || !bookingDate || !bookingTime || !userId) return;

    try {
      await addDoc(collection(db, 'requests'), {
        userId: userId,
        patient: 'Johnny',
        reason: selectedService.name,
        points: selectedService.points,
        status: 'pending',
        date: bookingDate,
        time: bookingTime,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'requests');
    }

    const text = encodeURIComponent('Hi Planet Animal Hospital! I would like to book a ' + selectedService.name + ' on ' + bookingDate + ' at ' + bookingTime + '.');
    window.open('https://wa.me/919999999999?text=' + text, '_blank');

    setIsBookVisitOpen(false);
    setSelectedService(null);
    setBookingDate('');
    setBookingTime('');
  };

  const closeModal = () => {
    setActiveModal(null);
    setTimeout(() => {
      setBookingDate('');
      setBookingTime('');
      setIsConnecting(false);
    }, 300); // reset after close animation
  };

  return (
    <div className="p-6 space-y-8 pb-32 dark:text-white/95">
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
            <span className="text-lg font-black text-slate-800 tracking-tight uppercase block leading-none dark:text-white/95">PLANET ANIMAL</span>
            <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-[0.25em] mt-0.5 dark:text-yellow-400">HOSPITAL & WELLNESS</span>
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
          <h1 className="text-2xl font-bold tracking-tight dark:text-white/95">Hi, Harshal 👋</h1>
          <p className="text-slate-500 text-sm dark:text-white/60">Let's keep Johnny healthy today.</p>
          <DailyTip pet={petProfile} />
        </div>
      </header>

      {/* Points Wallet - Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
        className="bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] rounded-[2rem] p-6 relative overflow-hidden dark:bg-neutral-900 dark:border-white/10"
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
            onClick={() => setIsBookVisitOpen(true)}
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

      {/* Book Visit Master Modal (Liquid Glass) */}
      <AnimatePresence>
        {isBookVisitOpen && (
          <motion.div
            key="book-visit-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-3xl z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              key="book-visit-modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white/30 backdrop-blur-3xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-3xl p-6 w-full max-w-md h-full max-h-[85vh] flex flex-col relative"
            >
              <div className="sticky top-0 bg-transparent z-10 pb-4 mb-4 border-b border-white/20 flex justify-between items-center shrink-0">
                <h2 className="text-2xl font-bold text-yellow-500">Book an Appointment</h2>
                <button 
                  onClick={() => setIsBookVisitOpen(false)} 
                  className="p-2 bg-white/40 hover:bg-white/60 rounded-full text-slate-600 transition-colors"
                >
                  <X size={20}/>
                </button>
              </div>

              <div className="space-y-6 flex-1 overflow-y-auto pb-6 pr-2">
                {/* Step 1: Services */}
                <div>
                  <h3 className="text-gray-400 font-semibold tracking-widest text-xs uppercase mb-3">Step 1: Select Service</h3>
                  <div className="space-y-3">
                    {BOOKING_SERVICES.map((service) => {
                      const isSelected = selectedService?.id === service.id;
                      return (
                        <motion.button 
                          key={service.id}
                          whileTap={{ scale: 0.92 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          onClick={() => setSelectedService(service)}
                          className={`w-full text-left cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.6)] border border-yellow-400 rounded-2xl p-4' 
                              : 'bg-white/40 border border-white/30 backdrop-blur-md rounded-2xl p-4 hover:bg-white/60'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className={`font-bold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                              {service.name}
                            </span>
                            <span className={`text-sm font-bold flex items-center gap-1 ${isSelected ? 'text-white/90' : 'text-slate-500'}`}>
                              <PawPrint size={14} /> {service.points} pts
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Date & Time */}
                <div>
                  <h3 className="text-gray-400 font-semibold tracking-widest text-xs uppercase mb-3">Step 2: Date & Time</h3>
                  <div className="space-y-4">
                    {/* Custom Inline Calendar Grid */}
                    <div className="bg-white/40 border border-white/30 rounded-2xl shadow-sm backdrop-blur-xl p-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-900 font-bold text-lg">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        <Calendar className="text-slate-500 w-5 h-5" />
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                          <div key={i} className="text-center text-xs font-semibold text-gray-400">{day}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1 place-items-center">
                        {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }).map((_, i) => (
                          <div key={`blank-${i}`} className="h-10 w-10"></div>
                        ))}
                        {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }).map((_, i) => {
                          const day = i + 1;
                          const dateObj = new Date(new Date().getFullYear(), new Date().getMonth(), day);
                          const year = dateObj.getFullYear();
                          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                          const dayStr = String(dateObj.getDate()).padStart(2, '0');
                          const dateString = `${year}-${month}-${dayStr}`;
                          
                          const todayObj = new Date();
                          todayObj.setHours(0, 0, 0, 0);
                          const isPast = dateObj < todayObj;
                          const isSelected = bookingDate === dateString;

                          return (
                            <motion.button
                              key={day}
                              whileTap={isPast ? undefined : { scale: 0.85 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              onClick={() => !isPast && setBookingDate(dateString)}
                              disabled={isPast}
                              className={`h-10 w-10 flex items-center justify-center rounded-full text-[15px] transition-colors ${
                                isPast 
                                  ? 'text-gray-300 pointer-events-none dark:text-white/20' 
                                  : isSelected 
                                    ? 'bg-yellow-500 text-white font-bold shadow-[0_0_15px_rgba(234,179,8,0.6)] border border-yellow-400' 
                                    : 'text-gray-900 font-bold hover:bg-white/50 dark:text-white/90 dark:hover:bg-white/10'
                              }`}
                            >
                              {day}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Apple-Grade 'Time Pill' Grid */}
                    <div className="grid grid-cols-3 gap-3 p-2">
                      {['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'].map((time) => {
                        const isSelected = bookingTime === time;
                        return (
                          <motion.button
                            key={time}
                            whileTap={{ scale: 0.92 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            onClick={() => setBookingTime(time)}
                            className={`py-3 rounded-2xl text-[15px] transition-all ${
                              isSelected
                                ? 'font-bold bg-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.6)] border border-yellow-400'
                                : 'font-medium bg-white/30 border border-white/20 text-gray-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-md hover:bg-white/50 dark:bg-neutral-800 dark:border-white/10 dark:text-white/90 dark:hover:bg-neutral-700'
                            }`}
                          >
                            {time}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-4 pt-4 border-t border-white/20 shrink-0">
                <button
                  onClick={submitBooking}
                  disabled={!selectedService || !bookingDate || !bookingTime}
                  className={`transition-all w-full py-4 rounded-[20px] font-bold text-[17px] flex justify-center items-center gap-2 ${
                    !selectedService || !bookingDate || !bookingTime
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50 dark:bg-neutral-800 dark:text-white/20'
                      : 'bg-black text-white shadow-xl dark:bg-white dark:text-black'
                  }`}
                >
                  Confirm Booking
                </button>
              </div>
            </motion.div>
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
      className="glass rounded-2xl p-4 flex flex-col items-start gap-3 active:scale-95 transition-transform cursor-pointer hover:bg-white/50 dark:bg-neutral-900 dark:border-white/10 dark:hover:bg-neutral-800"
    >
      <div className="bg-white/80 p-2 rounded-xl shadow-sm dark:bg-neutral-800">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-slate-800 text-sm dark:text-white/95">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-white/60">{subtitle}</p>
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
      className={`snap-start relative min-w-[240px] shrink-0 flex flex-col cursor-grab active:cursor-grabbing w-full h-[260px] bg-white/20 backdrop-blur-3xl border-t border-l border-white/70 border-b border-r border-white/20 shadow-[0_8px_32px_rgba(20,20,20,0.04)] rounded-3xl p-6 overflow-hidden transition-all duration-300 hover:shadow-[0_16px_48px_rgba(245,158,11,0.15)] group dark:bg-neutral-900 dark:border-white/10`}
    >
      {/* Dynamic Gradient Background */}
      <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${themeGradients[theme]} via-transparent to-transparent pointer-events-none`} />
      
      {/* Shimmer Effect for High Value */}
      {highValue && (
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-[shimmer_3s_infinite] pointer-events-none z-0 dark:via-white/10" />
      )}

      {/* Absolute High Value Badge */}
      {highValue && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white/60 backdrop-blur-md border border-white/50 text-yellow-700 text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:bg-neutral-800 dark:border-white/10 dark:text-yellow-400">
          <Sparkles className="w-3 h-3" />
          High Value
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full">
        <div className="mt-8 flex flex-col items-start gap-2">
          <h4 className="font-bold text-slate-800 text-base leading-tight transition-all duration-500 group-hover:tracking-wide dark:text-white/95">{title}</h4>
          {subtext && <p className="text-sm text-gray-600/90 leading-relaxed font-medium dark:text-white/60">{subtext}</p>}
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
