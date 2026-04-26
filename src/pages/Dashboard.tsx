import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useMotionTemplate, animate, useScroll, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, Calendar, FileText, Award, ChevronRight, Gift, X, Dog, 
  CheckCircle2, Syringe, Sparkles, Stethoscope, ChevronDown, ChevronUp, Loader2, LogOut, Info, PawPrint, Clock, Lock, Settings
} from 'lucide-react';
import Logo from '../components/Logo';
import DualAvatar from '../components/DualAvatar';
import { useProfileImages } from '../hooks/useProfileImages';
import { collection, addDoc, onSnapshot, query, where, serverTimestamp, doc } from 'firebase/firestore';
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

import { usePetProfile } from '../hooks/usePetProfile';

function getPersonalizedIncentives(pet?: { name?: string, breed?: string, age?: string | number, isSenior?: boolean, isOverweight?: boolean }) {
  if (!pet || !pet.breed) return [];
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

function generateWhatsAppPayload(serviceName: string, petProfile: any) {
  const message = `Hi Planet Animal Hospital!\nI would like to book a visit.\n👤 Parent: ${petProfile?.parentName || 'Pet Parent'}\n🐾 Pet: ${petProfile?.name || 'Pet'} (Dog - ${petProfile?.breed || 'Unknown'}, Age ${petProfile?.age || 'Unknown'})\n🏥 Requested Service: ${serviceName}`;
  return 'https://wa.me/919004290923?text=' + encodeURIComponent(message);
}

export default function Dashboard() {
  const { profile: petProfile, loading: profileLoading } = usePetProfile();
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { userImage: harshalImage, petImage: johnnyImage } = useProfileImages();
  
  const [verifiedPoints, setVerifiedPoints] = useState(0);
  const [pendingPoints, setPendingPoints] = useState(0);
  const [pendingIncentives, setPendingIncentives] = useState<string[]>([]);
  const [incentivesOrder, setIncentivesOrder] = useState<any[]>([]);

  useEffect(() => {
    if (petProfile) {
      setIncentivesOrder(getPersonalizedIncentives(petProfile as any));
    }
  }, [petProfile]);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }
      if (user) {
        setUserId(user.uid);
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setVerifiedPoints(docSnap.data().pawPoints || 0);
          }
        }, (err) => {
           console.error('onSnapshot error in Dashboard:', err);
        });
        setIsAuthReady(true);
      } else {
        setUserId(null);
        setIsAuthReady(true);
      }
    });
    return () => {
      unsubscribe();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const handleBookingRequest = async (serviceName: string, pointsValue: number, incentiveId: string) => {
    if (!userId) return;
    
    // Optimistic UI updates
    setPendingIncentives(prev => [...prev, incentiveId]);
    setPendingPoints(prev => prev + pointsValue);
    
    try {
      const user = auth.currentUser;
      if (!user) return;

      const petNameStr = petProfile?.name || 'Pet';

      await addDoc(collection(db, 'requests'), {
        userId: user.uid,
        patient: petNameStr,
        reason: serviceName,
        date: "TBD",
        time: "TBD",
        points: pointsValue,
        status: 'pending',
        actionId: incentiveId,
        createdAt: serverTimestamp()
      });

      const message = `Hi Planet Animal Hospital! I'd like to book a ${serviceName} for ${petNameStr}.`;
      const whatsappUrl = `https://wa.me/919004290923?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'requests');
      // Revert optimistic update on failure
      setPendingIncentives(prev => prev.filter(id => id !== incentiveId));
      setPendingPoints(prev => prev - pointsValue);
    }
  };

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
        userId: auth.currentUser?.uid || userId,
        patient: petProfile?.name || 'Pet',
        reason: selectedService.name,
        date: bookingDate,
        time: bookingTime,
        points: selectedService.points,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'requests');
    }

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

  const parentName = petProfile?.parentName || "Pet Parent";
  const petName = petProfile?.name || 'Pet';
  const whatsappMessage = `Hey, Planet Animal Hospital team, I am ${parentName}; ${petName}, pet's parent, and I'm here to inquire about the possibility of a ${selectedService?.name || selectedService} Appointment at ${bookingDate}, at ${bookingTime}. Please get back to me as soon as you see this message. Thank you.`;
  const whatsappUrl = `https://wa.me/919004290923?text=${encodeURIComponent(whatsappMessage)}`;


  return (
    <div className="relative w-full h-full">
      {/* Background Ambient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex justify-center">
        <div className="relative w-full max-w-md h-full">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-planet-yellow/40 rounded-full blur-3xl opacity-60 animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-teal-300/40 rounded-full blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-amber-200/40 rounded-full blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      <div className="relative z-10 p-6 space-y-8 pb-4 dark:text-white/95">
        {/* Header with Logo */}
      <header className="pt-4 mb-2">
        <div className="relative flex items-center justify-between w-full py-4">
          {/* Logo Container (Left) */}
          <div className="relative z-10">
            <button onClick={() => navigate('/profiles')} className="shrink-0 group">
              <div className="origin-left drop-shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-opacity duration-300 hover:opacity-90 active:scale-95">
                <Logo className="!w-16 !h-16" />
              </div>
            </button>
          </div>
            
          {/* Center Text Container */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-0 w-max pointer-events-none whitespace-nowrap">
            <span className="text-lg font-heading font-black text-slate-800 tracking-tight uppercase block leading-none dark:text-white/95">PLANET ANIMAL</span>
            <span className="text-[10px] font-bold text-[#fec708] uppercase tracking-[0.25em] mt-0.5 dark:text-[#fec708]">HOSPITAL & WELLNESS</span>
          </div>

          {/* Profile Container (Right) */}
          <div className="relative z-10">
             <button onClick={() => navigate('/settings')} className="relative flex items-center justify-center p-2 rounded-full bg-gradient-to-br from-white/10 to-white/0 hover:from-white/20 hover:to-white/5 transition-all duration-300 border border-white/5 shadow-sm cursor-pointer group">
               <Settings className="w-5 h-5 text-white/80 group-hover:text-white transition-colors duration-300" />
             </button>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-3xl font-extrabold font-heading tracking-tight text-white drop-shadow-md">Hi, {petProfile?.parentName || 'Shishir'}</h2>
          <p className="text-sm font-medium font-body text-slate-200 mt-1 leading-relaxed">Let's keep {petProfile?.name || 'your pet'} healthy today.</p>
        </div>
      </header>

      {/* Points Wallet - Typographic Layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: "easeOut", duration: 0.5 }}
        className="mt-8 mb-4 relative"
      >
        {/* Asymmetric Floating Layout */}
        <div className="flex flex-col items-start gap-1 pt-4">
          <h2 className="text-white/60 text-xs uppercase tracking-widest font-medium">Paw Points Balance</h2>
          <div className="flex items-baseline gap-2">
             <span className="font-heading tracking-tighter text-6xl tabular-nums font-extrabold text-[#fec708] drop-shadow-[0_0_20px_rgba(254,199,8,0.8)] animate-pulse">{verifiedPoints.toLocaleString()}</span>
            <span className="font-heading text-[#fec708] font-extrabold uppercase tracking-widest text-sm mb-2 drop-shadow-[0_0_10px_rgba(254,199,8,0.6)]">pts</span>
          </div>
          
          {pendingPoints > 0 && (
            <div className="mt-1 mb-2 flex items-center gap-2">
              <span className="text-white/70 font-bold tracking-wide text-xs">
                + {pendingPoints.toLocaleString()} Pending
              </span>
              <span className="text-[10px] text-white/60 font-medium max-w-[150px] leading-tight">
                Verified after clinic confirmation.
              </span>
            </div>
          )}

          <div className="mt-6 w-full">
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: Math.min(1, verifiedPoints / 5000) }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="h-full bg-gradient-to-r from-[#fec708] to-yellow-200 rounded-full origin-left"
              />
            </div>
            <p className="text-[10px] text-white/60 font-medium mt-3 uppercase tracking-widest">
              {Math.max(0, 5000 - verifiedPoints).toLocaleString()} POINTS UNTIL YOUR NEXT FREE CONSULTATION
            </p>
          </div>
          
          <div className="flex gap-3 mt-8 w-full">
            <button 
              onClick={() => verifiedPoints >= 5000 && setActiveModal('redeem')}
              disabled={verifiedPoints < 5000}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
                verifiedPoints < 5000
                  ? 'bg-white/10 text-white/50 border border-white/10 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#fec708] to-[#fec708] text-zinc-900 border border-transparent shadow-[0_4px_20px_rgba(254,199,8,0.4)] hover:shadow-[0_4px_25px_rgba(254,199,8,0.6)] font-bold'
              }`}
            >
              {verifiedPoints < 5000 ? <Lock size={16} className="text-white/50" /> : <Gift size={16} className="text-zinc-900" />}
              {verifiedPoints < 5000 ? 'Claim Free Consult' : 'Claim Free Consult'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-bold font-heading tracking-tight text-white mb-4 drop-shadow-sm">Quick Actions</h3>
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
          <h3 className="text-xl font-bold font-heading tracking-tight text-white drop-shadow-sm">Upcoming for {petProfile?.name || 'your pet'}</h3>
          <button className="text-planet-yellow text-sm font-bold flex items-center font-body">View All <ChevronRight size={16}/></button>
        </div>
        <div className="space-y-3">
          {upcomingAppts.map((appt, idx) => (
            <div key={idx} className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl dark:backdrop-blur-[24px] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] rounded-[2rem] p-6 flex items-center gap-4">
              <div className="bg-teal-100 dark:bg-teal-500/20 w-12 h-12 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-xl shrink-0">
                {appt.date}
              </div>
              <div>
                 <h4 className="font-heading font-bold text-white text-lg tracking-tight">{appt.title}</h4>
                <p className="font-body font-medium text-slate-300 text-sm leading-relaxed">Dr. Naveen • {appt.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ways to Earn Points */}
      <div className="pt-2 relative -mx-6">
        <div className="flex items-center gap-2 mb-4 px-6 relative z-10">
          <h3 className="text-xl font-bold font-heading tracking-tight text-white drop-shadow-sm">Ways to Earn Paw Points</h3>
          <PawPrint className="w-5 h-5 text-[#fec708] fill-[#fec708]/20" />
        </div>
        
        {/* The Shelf Effect */}
        <div className="absolute bottom-8 left-0 right-0 h-24 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none z-0" />

        <div className="relative w-full mt-12">
          <div 
            ref={carouselRef}
            className="flex overflow-x-auto hide-scrollbar gap-4 py-40 -my-40 px-[calc(50%-160px)] relative z-10 [&::-webkit-scrollbar]:hidden snap-x snap-mandatory transform-gpu will-change-transform"
            style={{ scrollbarWidth: 'none' }}
          >
            {incentivesOrder.map((incentive) => (
              <div 
                key={incentive.id} 
                className="flex-none w-[320px] group snap-center"
              >
                <EarnCard 
                  id={incentive.id}
                  title={incentive.title}
                  subtext={incentive.subtext}
                  pointsText={incentive.pointsText}
                  pointsValue={incentive.pointsValue}
                  highValue={incentive.highValue}
                  theme={incentive.theme}
                  isPending={pendingIncentives.includes(incentive.id)}
                  onBook={() => handleBookingRequest(incentive.title, incentive.pointsValue, incentive.id)} 
                  carouselRef={carouselRef}
                />
              </div>
            ))}
          </div>
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
                  <div className="bg-[#fec708]/10 border border-[#fec708]/30 rounded-2xl p-6 text-center">
                    <Gift className="w-12 h-12 text-[#fec708] mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">You've Unlocked a Free Consultation!</h3>
                    <p className="text-slate-600 mb-6">
                      Show this screen to our staff at checkout to claim your free consultation for {petProfile?.name || 'your pet'}.
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
                <h2 className="text-2xl font-bold text-[#fec708]">Book an Appointment</h2>
                <button 
                  onClick={() => setIsBookVisitOpen(false)} 
                  className="p-2 bg-white/40 hover:bg-white/60 rounded-full text-slate-600 transition-colors"
                >
                  <X size={20}/>
                </button>
              </div>

              <div className="space-y-6 flex-1 overflow-y-auto pb-6 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {/* Step 1: Services */}
                <div>
                  <h3 className="text-slate-200 font-semibold tracking-widest text-xs uppercase mb-3">Step 1: Select Service</h3>
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
                              ? 'bg-[#fec708] text-white shadow-[0_0_15px_rgba(254,199,8,0.6)] border border-[#fec708] rounded-2xl p-4' 
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
                  <h3 className="text-slate-200 font-semibold tracking-widest text-xs uppercase mb-3">Step 2: Date & Time</h3>
                  <div className="space-y-4">
                    {/* Custom Inline Calendar Grid */}
                    <div className="bg-white/40 border border-white/30 rounded-2xl shadow-sm backdrop-blur-xl p-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-white font-bold text-lg">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                        <Calendar className="text-slate-500 w-5 h-5" />
                      </div>
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                          <div key={i} className="text-center text-xs font-semibold text-slate-300">{day}</div>
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
                                    ? 'bg-[#fec708] text-white font-bold shadow-[0_0_15px_rgba(254,199,8,0.6)] border border-[#fec708]' 
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
                      {['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'].map((time) => {
                        const isSelected = bookingTime === time;
                        return (
                          <motion.button
                            key={time}
                            whileTap={{ scale: 0.92 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            onClick={() => setBookingTime(time)}
                            className={`py-3 rounded-2xl text-[15px] transition-all ${
                              isSelected
                                ? 'font-bold bg-[#fec708] text-white shadow-[0_0_15px_rgba(254,199,8,0.6)] border border-[#fec708]'
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
                <a
                  href={(!selectedService || !bookingDate || !bookingTime) ? undefined : whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!selectedService || !bookingDate || !bookingTime) {
                      e.preventDefault();
                    } else {
                      submitBooking();
                    }
                  }}
                  className={`transition-all w-full py-4 rounded-[20px] font-bold text-[17px] flex justify-center items-center gap-2 ${
                    !selectedService || !bookingDate || !bookingTime
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50 dark:bg-neutral-800 dark:text-white/20 pointer-events-none'
                      : 'bg-black text-white shadow-xl dark:bg-white dark:text-black'
                  }`}
                >
                  Confirm Booking
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}

function ActionCard({ icon, title, subtitle, onClick }: { icon: React.ReactNode, title: string, subtitle: string, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl dark:backdrop-blur-[24px] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] rounded-[2rem] p-6 flex flex-col items-start gap-3 active:scale-95 transition-all cursor-pointer hover:bg-white/90 dark:hover:bg-white/[0.08]"
    >
      <div className="bg-white p-2 rounded-xl shadow-sm dark:bg-white/10 dark:border dark:border-white/10">
        {icon}
      </div>
      <div>
        <h4 className="font-heading font-bold text-slate-800 dark:text-white text-lg tracking-tight">{title}</h4>
        <p className="font-body font-medium text-slate-500 dark:text-slate-300 text-sm leading-relaxed">{subtitle}</p>
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

function EarnCard({ id, title, subtext, pointsText, pointsValue, highValue, isPending, theme = 'yellow', onBook, carouselRef }: { id: string, title: string, subtext?: string, pointsText: string, pointsValue: number, highValue?: boolean, isPending: boolean, theme?: 'blue' | 'orange' | 'green' | 'purple' | 'yellow', onBook: (id: string, points: number, title: string) => void, carouselRef?: React.RefObject<HTMLElement> }) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const { scrollXProgress } = useScroll({
    container: carouselRef,
    target: cardRef,
    axis: "x",
    offset: ["center end", "center start"]
  });

  const rawScale = useTransform(scrollXProgress, [0, 0.5, 1], [0.9, 1.15, 0.9]);
  const rawOpacity = useTransform(scrollXProgress, [0, 0.5, 1], [0.5, 1, 0.5]);

  const springConfig = { stiffness: 400, damping: 40, mass: 1 };
  const scale = useSpring(rawScale, springConfig);
  const opacity = useSpring(rawOpacity, springConfig);

  const themeGradients = {
    blue: 'from-blue-400/20',
    orange: 'from-orange-400/20',
    green: 'from-emerald-400/20',
    purple: 'from-purple-400/20',
    yellow: 'from-[#fec708]/20'
  };

  return (
    <motion.div ref={cardRef} style={{ scale, opacity }} className="relative min-w-[240px] shrink-0 w-full h-[260px] group origin-center transform-gpu will-change-transform">
      {/* Background Glow - Broad and Soft Dissipation */}
      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${themeGradients[theme]} to-transparent blur-[90px] scale-[1.5] opacity-40 pointer-events-none z-0 transition-all duration-700 group-hover:opacity-70 group-hover:scale-[1.8]`} />
      
      <motion.div 
        whileHover={{ y: -5, scale: 1.02 }}
        className="relative flex flex-col cursor-grab active:cursor-grabbing w-full h-full bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl dark:backdrop-blur-[24px] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] rounded-[2rem] transition-all duration-300 hover:shadow-[0_16px_48px_rgba(245,158,11,0.15)]"
      >
        {/* Shimmer Effect Wrapper - Clipped to card shape */}
        <div className="absolute inset-0 rounded-[2rem] overflow-hidden pointer-events-none">
          {highValue && (
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-200/5 to-transparent skew-x-12 animate-[shimmer_15s_linear_infinite] pointer-events-none z-0 mix-blend-overlay" />
          )}
        </div>

        <div className="relative z-10 flex flex-col h-full p-6">
          {/* Absolute High Value Badge */}
          {highValue && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white/60 backdrop-blur-md border border-white/50 text-[#fec708] text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:bg-white/10 dark:border-white/20 dark:text-[#fec708]">
              <Sparkles className="w-3 h-3" />
              High Value
            </div>
          )}

          <div className="mt-8 flex flex-col items-start gap-2">
            <h4 className="font-heading font-bold text-slate-800 dark:text-white text-lg tracking-tight transition-all duration-500 group-hover:tracking-normal">{title}</h4>
            {subtext && <p className="font-body font-medium text-slate-500 dark:text-slate-300 text-sm leading-relaxed">{subtext}</p>}
          </div>
          
          <div className="mt-auto flex flex-col">
            <div className="mb-4 flex items-center gap-1.5">
              <PawPrint className="w-6 h-6 text-[#fec708] fill-[#fec708]/40 drop-shadow-[0_0_8px_rgba(254,199,8,0.6)] animate-pulse" />
              <p className="font-heading font-black text-2xl tracking-tighter drop-shadow-sm bg-clip-text text-transparent bg-gradient-to-br from-[#fec708] via-[#fec708] to-[#fec708]">
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
                    : 'bg-[#fec708] backdrop-blur-xl border border-[#fec708] text-white hover:bg-[#fec708]/90'
                }`}
              >
                {isPending ? 'Pending Confirmation' : 'Book Now'}
              </button>
            </MagneticWrapper>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
