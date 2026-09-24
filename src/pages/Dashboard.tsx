import { createPortal } from 'react-dom';
import { useCare } from '../lib/care/client';
import HomeRewardProgress from '../components/HomeRewardProgress';
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useReducedMotion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar, FileText, Award, ChevronRight, Gift, X, Dog,
  Syringe, Sparkles, Stethoscope, LogOut, PawPrint, Clock, Lock, Settings, Bot, Map, Check, ArrowRight, Plus, TrendingUp, Star, Zap, Trophy
} from 'lucide-react';
import { cn } from '../lib/utils';
import Logo from '../components/Logo';
import LogoutModal from '../components/LogoutModal';
import DualAvatar from '../components/DualAvatar';
import PlanetOrbLoader from '../components/PlanetOrbLoader';
import PlanetSoul from '../components/PlanetSoul';
import { useProfileImages } from '../hooks/useProfileImages';
import { usePetProfile } from '../hooks/usePetProfile';
import { usePawlMessage } from '../hooks/usePawlMessage';
import { useTimeOfDay, PERIOD_DISPLAY } from '../hooks/useTimeOfDay';
import { useCheckInStatus } from '../hooks/useCheckInStatus';
import { collection, addDoc, onSnapshot, query, where, serverTimestamp, doc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { buildWhatsAppUrl, buildWhatsAppMessage, calculateBookingPoints } from '../lib/pawPoints';
import { isPreviewDemoMode } from '../lib/demoMode';
import { bookingQuickDate, indiaCalendarDate } from '../lib/bookingDates';

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

function DogEarIcon({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M10 7c-2.6-2.3-5.2-1.6-6 1.2-.7 2.5-.2 6.8 1 9.3.9 1.9 2.3 2.6 4 2.2M22 7c2.6-2.3 5.2-1.6 6 1.2.7 2.5.2 6.8-1 9.3-.9 1.9-2.3 2.6-4 2.2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 7c1.5-1 3.5-1.5 6-1.5S20.5 6 22 7c2 4.3 2.1 9.5 1.1 13.4-.7 2.7-3.3 5-7.1 5s-6.4-2.3-7.1-5C7.9 16.5 8 11.3 10 7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M13 16h.01M19 16h.01" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"/><path d="M14 20c1.2 1.4 2.8 1.4 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

function CheckupIcon({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 5v7a6 6 0 0 0 12 0V5M5 5h4m8 0h4M13 18v2a6 6 0 0 0 12 0v-2"/><circle cx="25" cy="15" r="3"/><path d="m11 11 2 2 3-3"/></svg>;
}

function GroomingIcon({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 16h22l-2 9H7l-2-9ZM9 25v2m14-2v2M7 16v-4c0-2 1-3 3-3h3"/><path d="m18 4 .7 2.3L21 7l-2.3.7L18 10l-.7-2.3L14 7l3.3-.7L18 4ZM25 8l.4 1.6L27 10l-1.6.4L25 12l-.4-1.6L23 10l1.6-.4L25 8Z"/></svg>;
}

function VaccinationIcon({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 23 12-12 4 4-12 12-4-4ZM18 9l5 5m-2-8 6 6M5 26l-2 3m7-12 5 5m-4-8 5 5"/><path d="m23 4 5 5"/></svg>;
}

function HaircutIcon({ size = 20 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="23" r="3"/><circle cx="14" cy="25" r="3"/><path d="M9.5 21 25 7m-9 15L7 8m8 15L26 9M21 5c2-1 4 0 5 2"/><path d="m24 19 1.2 1.8L27 22l-1.8 1.2L24 25l-1.2-1.8L21 22l1.8-1.2L24 19Z"/></svg>;
}

const BOOKING_SERVICES = [
  { id: 1, name: 'General Checkup', points: 1000, icon: CheckupIcon, desc: 'Full health assessment' },
  { id: 2, name: 'Full Grooming', points: 800, icon: GroomingIcon, desc: 'Bath, trim & nail care' },
  { id: 3, name: 'Vaccinations', points: 750, icon: VaccinationIcon, desc: 'Core & booster shots' },
  { id: 4, name: 'Ear Cleaning', points: 200, icon: DogEarIcon, desc: 'Dog ear care & inspection' },
  { id: 5, name: 'Haircut', points: 200, icon: HaircutIcon, desc: 'Breed-specific styling' },
  { id: 6, name: 'Follow-up appointment', points: 0, icon: Stethoscope, desc: 'Review with your veterinarian' }
];

type BookingStep = 'services' | 'date' | 'time' | 'confirm';

const BOOKING_STEPS: { id: BookingStep; label: string }[] = [
  { id: 'services', label: 'Service' },
  { id: 'date', label: 'Date' },
  { id: 'time', label: 'Time' },
  { id: 'confirm', label: 'Review' },
];

const BOOKING_TIMES = [
  { label: 'Morning', slots: ['10:00 AM', '11:00 AM'] },
  { label: 'Afternoon', slots: ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'] },
  { label: 'Evening', slots: ['6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'] },
];

function getBriefingPreview(message: string, loading: boolean, petName: string) {
  if (loading) {
    return `Preparing a brief update for ${petName}.`;
  }

  const fallback = `${petName}'s daily care summary is ready.`;
  const firstLine = (message || fallback)
    .split('\n')
    .find((line) => line.trim())
    ?.trim() || fallback;

  const compact = firstLine.replace(/\s+/g, ' ');
  return compact.length > 116 ? `${compact.slice(0, 113).trimEnd()}...` : compact;
}

export default function Dashboard() {
  const location = useLocation();
  const isDemoMode = isPreviewDemoMode(location.search, location.pathname);
  const { profile: realPetProfile, loading: realProfileLoading, error: profileError } = usePetProfile();

  const petProfile = useMemo(() => realPetProfile, [realPetProfile]);

  const profileLoading = useMemo(() => isDemoMode ? false : realProfileLoading, [isDemoMode, realProfileLoading]);

  const { message: pawlMessage, loading: pawlLoading, error: pawlError } = usePawlMessage(petProfile, profileLoading);
  const { currentPeriod } = useTimeOfDay();
  const { completedCount, totalPeriods, isPeriodComplete } = useCheckInStatus(
    realPetProfile?.uid || realPetProfile?.parentName || 'demo',
    currentPeriod
  );
  const [isAuthReady, setIsAuthReady] = useState(isDemoMode);
  const [userId, setUserId] = useState<string | null>(isDemoMode ? 'demo-user' : null);
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { userImage: harshalImage, petImage: johnnyImage } = useProfileImages();
  const care = useCare();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);



  useEffect(() => {
    if (isDemoMode) {
      return;
    }

    setIsAuthReady(!profileLoading);
    setUserId(petProfile?.uid || auth.currentUser?.uid || null);

  }, [isDemoMode, profileLoading, petProfile]);

  const handleBookingRequest = async (_serviceName: string, _pointsValue: number, _incentiveId: string) => { navigate('/roadmap'); };


  // Booking State
  const [isBookVisitOpen, setIsBookVisitOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<{id: number, name: string, points: number, icon: any, desc: string}[]>([]);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingStep, setBookingStep] = useState<BookingStep>('services');
  const [isConnecting, setIsConnecting] = useState(false);
  const [trackBooking, setTrackBooking] = useState(false);
  const [bookingPetId, setBookingPetId] = useState('');
  const [bookingNotice, setBookingNotice] = useState('');
  const bookingRequestRef = useRef({ fingerprint: '', id: '' });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('openBooking') !== 'true') return;

    setIsBookVisitOpen(true);
    setBookingStep('services');

    const serviceQuery = params.get('service')?.toLowerCase();
    if (serviceQuery) {
      const suggestedService = BOOKING_SERVICES.find((service) => service.name.toLowerCase().includes(serviceQuery));
      if (suggestedService) {
        setSelectedServices([suggestedService]);
        setBookingStep('date');
      }
    }

    const date = params.get('date');
    const time = params.get('time');
    if (date) {
      setBookingDate(date);
      setBookingStep('time');
    }
    if (time) {
      setBookingTime(time);
      setBookingStep('confirm');
    }
  }, [location.search]);

  useEffect(() => {
    if (!isBookVisitOpen) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const appRoot = document.getElementById('root');
    const previousInert = appRoot?.inert ?? false;
    if (appRoot) appRoot.inert = true;
    document.getElementById('booking-close')?.focus();
    const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') closeBookVisit(); };
    document.addEventListener('keydown', handleEscape);
    const bodyOverflow = document.body.style.overflow;
    const bodyTouchAction = document.body.style.touchAction;
    const htmlOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'pan-y';
    document.documentElement.style.overscrollBehavior = 'none';

    return () => {
      if (appRoot) appRoot.inert = previousInert;
      document.removeEventListener('keydown', handleEscape);
      previousFocus?.focus();
      document.body.style.overflow = bodyOverflow;
      document.body.style.touchAction = bodyTouchAction;
      document.documentElement.style.overscrollBehavior = htmlOverscroll;
    };
  }, [isBookVisitOpen]);

  const closeBookVisit = () => {
    setIsBookVisitOpen(false);
    setTrackBooking(false);
    setBookingPetId('');
    setSelectedServices([]);
    setBookingDate('');
    setBookingTime('');
    setBookingStep('services');
  };

  const parentName = petProfile?.parentName || "Pet Parent";
  const petName = care.state?.pets.find(pet => pet.id === bookingPetId)?.name || petProfile?.name || 'Pet';
  const parentPhone = petProfile?.phone || '';
  const briefingPreview = getBriefingPreview(pawlMessage, pawlLoading, petName);
  const whatsappMessage = `Hello Planet Animal Hospital, I am ${parentName}, ${petName}'s parent.\n\nI would like to request: ${selectedServices.map(s => s.name).join(', ')}.\nPreferred date: ${bookingDate}\nPreferred time: ${bookingTime} (India time)\n\nPlease confirm availability, charges and any preparation needed. Thank you!`;
  const bookingToday = new Date();
  const todayLocal = indiaCalendarDate(bookingToday);
  const isFutureBookingTime = (time: string) => {
    const match = time.match(/^(\d+):(\d+) (AM|PM)$/);
    if (!match || !bookingDate) return false;
    const hour = Number(match[1]) % 12 + (match[3] === 'PM' ? 12 : 0);
    return new Date(`${bookingDate}T${String(hour).padStart(2, '0')}:${match[2]}:00+05:30`).getTime() > Date.now();
  };
  const whatsappUrl = `https://wa.me/919004290923?text=${encodeURIComponent(whatsappMessage)}`;
  const briefingNeedsAttention = !isPeriodComplete(currentPeriod);
  const bookingStepIndex = BOOKING_STEPS.findIndex((step) => step.id === bookingStep);
  const bookingReady = selectedServices.length > 0 && bookingDate >= todayLocal && isFutureBookingTime(bookingTime);
  const bookingStepAllowed: Record<BookingStep, boolean> = {
    services: true,
    date: selectedServices.length > 0,
    time: selectedServices.length > 0 && Boolean(bookingDate),
    confirm: bookingReady,
  };
  const selectedServiceNames = selectedServices.map((service) => service.name).join(', ');

  const goToBookingStep = (step: BookingStep) => {
    if (bookingStepAllowed[step]) setBookingStep(step);
  };

  const handleBookingPrimaryAction = () => {
    if (bookingStep === 'services') {
      if (selectedServices.length > 0) setBookingStep('date');
      return;
    }

    if (bookingStep === 'date') {
      if (bookingDate >= todayLocal) setBookingStep('time');
      return;
    }

    if (bookingStep === 'time') {
      if (isFutureBookingTime(bookingTime)) setBookingStep('confirm');
      return;
    }

    if (bookingReady && (!trackBooking || Boolean(bookingPetId))) {
      if (trackBooking && !isDemoMode) {
        const fingerprint = bookingPetId + ':' + whatsappMessage;
        if (bookingRequestRef.current.fingerprint !== fingerprint) bookingRequestRef.current = { fingerprint, id: crypto.randomUUID() };
        void care.command({ type: 'requestCheckup', petId: bookingPetId, id: bookingRequestRef.current.id, text: whatsappMessage, consent: true })
          .then(() => setBookingNotice('Your appointment request is saved for the care team. The clinic still needs to confirm it.'))
          .catch(() => setBookingNotice('The app could not save your request for tracking. You can still send it in WhatsApp.'));
      }
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      closeBookVisit();
    }
  };

  const bookingPrimaryCopy = bookingStep === 'services'
    ? selectedServices.length > 0 ? 'Choose Date' : 'Select Services'
    : bookingStep === 'date'
      ? bookingDate ? 'Choose Time' : 'Select Date'
      : bookingStep === 'time'
        ? bookingTime ? 'Review Visit' : 'Select Time'
        : 'Open WhatsApp to send';

  const bookingPrimaryDisabled = bookingStep === 'services'
    ? selectedServices.length === 0
    : bookingStep === 'date'
      ? !bookingDate || bookingDate < todayLocal
      : bookingStep === 'time'
        ? !isFutureBookingTime(bookingTime)
        : !bookingReady || (trackBooking && !bookingPetId);

  if (profileLoading || !isAuthReady || (!isDemoMode && !petProfile)) {
    return (
      <PlanetOrbLoader
        label="Planet Animal Hospital"
        detail={profileError ? "Reconnecting to your saved pet profile" : "Loading your saved pet profile"}
        className="h-full pb-32"
      />
    );
  }

  return (
    <>
    <div className="relative w-full h-full"><div className="planet-orbital-background" aria-hidden="true"><i /><i /><span /></div>
      <div className="relative z-10 p-6 space-y-8 pb-4 dark:text-white/95 mobile-dashboard">
        {/* Header with Logo */}
      <header className="pt-4 mb-2 mobile-header-row">
        <div className="hidden lg:block desktop-dashboard-heading">
          <div><p className="desktop-eyebrow">A good day starts with care</p><h1>Hi, {petProfile?.parentName || 'Pet Parent'}<span className="desktop-greeting-dot">.</span></h1><p>Let's keep {petName} healthy, happy and a little more loved.</p></div>
          <button onClick={() => setIsLogoutModalOpen(true)} className="desktop-quiet-button" aria-label="Logout"><LogOut size={16}/> Sign out</button>
        </div>

        <div className="lg:hidden">
          <div className="grid w-full grid-cols-[76px_minmax(0,1fr)_76px] items-center py-4 sm:grid-cols-[88px_minmax(0,1fr)_88px]">
            <button onClick={() => navigate('/profiles')} className="group flex justify-start" aria-label="Switch profile">
              <div className="rounded-2xl p-1 transition-all duration-300 group-hover:scale-105 group-active:scale-95">
                <Logo className="!w-14 !h-14 sm:!w-16 sm:!h-16" />
              </div>
            </button>

            <div className="flex min-w-0 flex-col items-center text-center">
              <h1 className="font-heading text-[15px] font-black uppercase leading-none tracking-[-0.035em] text-white sm:text-lg">
                Planet Animal
              </h1>
              <p className="cinematic-kicker mt-1 text-[7px] sm:text-[9px]">
                Hospital & Wellness
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
               <button
                 onClick={() => navigate('/settings')}
                 title="Settings"
                 className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] shadow-sm transition-all duration-300 hover:bg-white/[0.14] cursor-pointer group"
                >
                  <Settings className="w-4 h-4 text-white/80 group-hover:text-white transition-colors duration-300" />
               </button>
               <button
                 onClick={() => setIsLogoutModalOpen(true)}
                 title="Logout"
                 className="relative flex h-10 w-10 items-center justify-center rounded-full border border-red-400/15 bg-red-500/[0.08] shadow-sm transition-all duration-300 hover:bg-red-500/[0.14] cursor-pointer group"
                >
                  <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-500 transition-colors duration-300" />
               </button>
            </div>
          </div>

          <div className="mobile-greeting-with-soul">
            <div className="mb-5 mt-2 mobile-header-greeting">
              <h2 className="cinematic-section-title text-3xl drop-shadow-md">Hi, {petProfile?.parentName || 'Pet Parent'}</h2>
              <p className="cinematic-copy mt-1 text-sm">Let's keep {petName} healthy today.</p>
            </div>
            <PlanetSoul compact className="mobile-dashboard-soul" />
          </div>
        </div>
      </header>

      <section className="hidden lg:block desktop-pet-overview" aria-label="Pet care overview">
        <div className="desktop-pet-overview-main"><h2>{petName}’s<span>care space</span></h2><p>Your next step in care, all in one place.</p><button className="desktop-primary-button" onClick={() => navigate({pathname:'/roadmap',search:location.search})}>View health roadmap <ArrowRight size={17}/></button></div>
        <PlanetSoul compact className="desktop-care-soul" />
        <button className="desktop-profile-link" onClick={() => navigate({pathname:'/profiles',search:location.search})}>View pet profile <ArrowRight size={15}/></button>
      </section>

      <HomeRewardProgress demo={isDemoMode} onBook={() => { setBookingStep('services'); setIsBookVisitOpen(true); }} onWallet={() => navigate({ pathname: '/rewards', search: location.search })} />

      {/* Pawl Daily Briefing Card */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { delay: 0.2 }}
        role="button" tabIndex={0} aria-label="Open daily briefing"
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); navigate({ pathname: '/briefing', search: location.search }); } }}
        onClick={() => navigate({ pathname: '/briefing', search: location.search })}
        className={cn(
          "group relative mb-7 min-h-[112px] cursor-pointer overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-black/72 via-black/60 to-black/46 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl transition-all duration-300 hover:border-[#fec708]/25 hover:from-black/78 hover:to-black/52 mobile-briefing-card",
          briefingNeedsAttention && "briefing-attention-card border-[#fec708]/24 shadow-[0_18px_62px_rgba(254,199,8,0.10),0_18px_60px_rgba(0,0,0,0.25)]"
        )}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#fec708]/55 to-transparent" />
        <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[#fec708]/8 blur-3xl transition-opacity duration-300 group-hover:opacity-70" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <p className="cinematic-kicker text-[9px] tracking-[0.2em]">Daily Briefing</p>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-white/42">
                {completedCount >= totalPeriods ? 'Done' : `${completedCount}/${totalPeriods}`}
              </span>
              {briefingNeedsAttention && (
                <span className="inline-flex items-center gap-1 rounded-full border border-[#fec708]/20 bg-[#fec708]/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-[#fec708]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#fec708] shadow-[0_0_10px_rgba(254,199,8,0.8)]" />
                  Due
                </span>
              )}
            </div>
            <p className="line-clamp-2 text-sm font-medium leading-6 text-white/72">
              {briefingPreview}
            </p>
          </div>
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] transition-all duration-300 group-hover:border-[#fec708]/30 group-hover:bg-[#fec708]/15 mobile-briefing-chevron">
            <ChevronRight className="h-5 w-5 text-white/44 transition-colors duration-300 group-hover:text-[#fec708]" />
          </div>
        </div>
      </motion.div>

      {bookingNotice && <p role="status" className="rounded-2xl border border-planet-yellow/20 bg-white/5 p-4 text-sm text-planet-yellow">{bookingNotice}</p>}
      {/* Quick Actions */}
      <div className="desktop-actions-section">
        <h3 className="cinematic-card-title mb-4 text-xl drop-shadow-sm mobile-quick-actions-title">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mobile-quick-actions-grid">
          <ActionCard
            icon={<FileText className="text-planet-yellow" />}
            title="Medical Records"
            subtitle="Vaccines & History"
            onClick={() => navigate({ pathname: '/records', search: location.search })}
            className="mobile-action-card"
          />
          <ActionCard
            icon={<Bot className="text-planet-yellow" />}
            title="AI Vet"
            subtitle="AI Care Assistant"
            onClick={() => navigate({ pathname: '/ai', search: location.search })}
            className="mobile-action-card"
          />
          <ActionCard
            icon={<Map className="text-planet-yellow" />}
            title="Roadmap"
            subtitle="Longevity Plan"
            onClick={() => navigate({ pathname: '/roadmap', search: location.search })}
            className="mobile-action-card"
          />
        </div>
      </div>

      {/* Book Visit Full-Screen Flow */}
      {createPortal(<AnimatePresence>
        {isBookVisitOpen && (
          <motion.div
            key="book-visit-flow" role="dialog" aria-modal="true" aria-labelledby="booking-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[120] h-[100dvh] w-full overflow-hidden bg-[#050b07] text-white"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(254,199,8,0.14),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(45,212,191,0.09),transparent_30%),linear-gradient(180deg,#071912_0%,#050b07_52%,#020403_100%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.045] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 220 220%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%221.05%22 numOctaves=%222%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 opacity=%220.78%22/%3E%3C/svg%3E")' }} />

            <motion.div
              initial={{ y: 22, opacity: 0, scale: 0.985 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 18, opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-2xl flex-col overflow-hidden px-4 pb-[calc(env(safe-area-inset-bottom)+var(--preview-safe-area-bottom,0px)+0.7rem)] pt-[calc(var(--preview-safe-area-top,0px)+0.75rem)] sm:px-6 sm:py-6"
            >
              <header className="shrink-0 pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="cinematic-kicker mb-2 text-[9px] tracking-[0.24em]">Plan your visit</p>
                    <h2 id="booking-title" className="cinematic-section-title text-[2.35rem] leading-[0.88] tracking-[-0.065em] sm:text-[2.65rem]">
                      Book <span className="text-planet-yellow">Visit</span>
                    </h2>
                    <p className="mt-1.5 text-xs font-bold leading-5 text-white/54 sm:text-sm">
                      {petProfile?.name ? `Choose your preferred visit for ${petProfile.name}.` : 'Schedule a care slot with Planet Animal.'}
                    </p>
                  </div>
                <motion.button
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.06, rotate: 90 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={closeBookVisit}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/12 bg-white/[0.06] text-white/70 shadow-[0_16px_40px_rgba(0,0,0,0.34)] transition-colors hover:border-[#fec708]/24 hover:text-white"
                    id="booking-close" aria-label="Close Book Visit"
                >
                  <X size={20}/>
                </motion.button>
              </div>
              </header>

              <div className="shrink-0 rounded-[1.6rem] border border-white/[0.08] bg-black/24 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-2.5">
                <div className="grid grid-cols-4 gap-1.5">
                  {BOOKING_STEPS.map((step, index) => {
                    const complete = step.id === 'services'
                      ? selectedServices.length > 0
                      : step.id === 'date'
                        ? Boolean(bookingDate)
                        : step.id === 'time'
                          ? Boolean(bookingTime)
                          : bookingReady;
                    const active = bookingStep === step.id;
                    const allowed = bookingStepAllowed[step.id];
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => goToBookingStep(step.id)}
                        disabled={!allowed}
                        className={cn(
                          "relative flex min-w-0 flex-col items-center gap-1 rounded-[1.1rem] px-1 py-1.5 text-center transition-all duration-300 sm:px-1.5 sm:py-2",
                          active ? "bg-[#fec708] text-black shadow-[0_12px_28px_rgba(254,199,8,0.18)]" : allowed ? "text-white/60 hover:bg-white/[0.055]" : "text-white/24"
                        )}
                      >
                        <span className={cn(
                          "grid h-5 w-5 place-items-center rounded-full border text-[9px] font-black transition-all sm:h-6 sm:w-6 sm:text-[10px]",
                          active ? "border-black/12 bg-black/10" : complete ? "border-[#fec708]/36 bg-[#fec708]/15 text-[#fec708]" : "border-white/12 bg-white/[0.04]"
                        )}>
                          {complete && !active ? <Check size={12} strokeWidth={4} /> : index + 1}
                        </span>
                        <span className="truncate text-[8px] font-black uppercase tracking-[0.12em]">{step.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden py-3">
                <AnimatePresence mode="wait">
                  {bookingStep === 'services' && (
                    <motion.section
                      key="booking-services"
                      initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -16 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="flex h-full min-h-0 flex-col"
                    >
                      <div className="mb-3 flex items-end justify-between gap-3">
                        <div>
                          <p className="cinematic-kicker text-[9px] tracking-[0.22em]">Select Services</p>
                          <p className="mt-1 text-xs font-bold text-white/42">Pick one or more care items.</p>
                        </div>
                        {selectedServices.length > 0 && (
                          <button
                            onClick={() => setSelectedServices([])}
                            className="rounded-full border border-[#fec708]/18 bg-[#fec708]/8 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#fec708]"
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2.5 overflow-y-auto overscroll-contain hide-scrollbar">
                        {BOOKING_SERVICES.map((service) => {
                          const isSelected = selectedServices.some(s => s.id === service.id);
                          const ServiceIcon = service.icon;
                          return (
                            <motion.button
                              key={service.id}
                              aria-pressed={isSelected}
                              whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.012 }}
                              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                              onClick={() => {
                                setSelectedServices(prev =>
                                  prev.some(s => s.id === service.id)
                                    ? prev.filter(s => s.id !== service.id)
                                    : [...prev, service]
                                );
                              }}
                              className={cn(
                                "relative flex min-h-[4.75rem] w-full flex-col items-start gap-1.5 rounded-[1.35rem] border p-3 text-left transition-all duration-300",
                                isSelected
                                  ? "border-[#fec708]/62 bg-[#fec708]/14 shadow-[0_16px_36px_rgba(254,199,8,0.10)]"
                                  : "border-white/[0.08] bg-white/[0.045] hover:border-white/16 hover:bg-white/[0.065]"
                              )}
                            >
                              <motion.div animate={shouldReduceMotion ? undefined : isSelected ? { scale: 1.08, rotate: -4 } : { scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 350, damping: 20 }} className={cn(
                                "grid h-8 w-8 shrink-0 place-items-center rounded-[0.85rem] transition-all duration-300",
                                isSelected ? "bg-[#fec708] text-black shadow-[0_0_18px_rgba(254,199,8,0.28)]" : "bg-white/[0.09] text-white/75"
                              )}>
                                <ServiceIcon size={20} />
                              </motion.div>
                              <div className="min-w-0 pr-7">
                                <p className="cinematic-card-title line-clamp-2 text-[0.94rem] leading-[0.96] text-white">{service.name}</p>
                                <p className="sr-only">{service.desc}</p>
                              </div>
                              <div className="absolute right-2.5 top-2.5 text-right">
                                <div className={cn(
                                  "ml-auto grid h-6 w-6 place-items-center rounded-full border transition-all duration-300",
                                  isSelected ? "border-[#fec708] bg-[#fec708] text-black" : "border-white/12 text-transparent"
                                )}>
                                  <Check size={13} strokeWidth={4} />
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.section>
                  )}

                  {bookingStep === 'date' && (
                    <motion.section
                      key="booking-date"
                      initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -16 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="flex h-full min-h-0 flex-col"
                    >
                      <div className="mb-3">
                        <p className="cinematic-kicker text-[9px] tracking-[0.22em]">Preferred Date</p>
                        <p className="mt-1 text-xs font-bold text-white/42">Choose a preferred date. The clinic will confirm availability.</p>
                      </div>
                      <label className="mb-4 block text-sm text-white/80">Choose any future date<input aria-label="Preferred appointment date" type="date" min={todayLocal} value={bookingDate} onInput={event => { setBookingDate(event.currentTarget.value); setBookingTime(''); }} onChange={event => { setBookingDate(event.target.value); setBookingTime(''); }} className="mt-2 w-full rounded-2xl border border-white/20 bg-white/10 p-3 text-white [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-[#fec708]" /></label>
                      <div className="grid min-h-0 flex-1 grid-cols-4 content-start gap-2.5 overflow-hidden">
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((offset) => {
                          const date = bookingQuickDate(offset, bookingToday);
                          const isToday = offset === 0;
                          const dateStr = date.value;
                          const isSelected = bookingDate === dateStr;

                          return (
                            <motion.button
                              key={offset}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => { setBookingDate(dateStr); setBookingTime(''); }}
                              className={cn(
                                "flex min-h-[4.8rem] flex-col items-center justify-center rounded-[1.2rem] border px-1 transition-all duration-300",
                                isSelected
                                  ? "border-[#fec708] bg-[#fec708] text-black shadow-[0_16px_34px_rgba(254,199,8,0.16)]"
                                  : "border-white/[0.08] bg-white/[0.045] text-white/58 hover:border-white/16 hover:bg-white/[0.065]"
                              )}
                            >
                              <span className="mb-1 text-[9px] font-black uppercase tracking-[0.12em] opacity-62">
                                {isToday ? 'Today' : date.weekday}
                              </span>
                              <span className="text-2xl font-black leading-none">{date.day}</span>
                              <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] opacity-45">
                                {date.month}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.section>
                  )}

                  {bookingStep === 'time' && (
                    <motion.section
                      key="booking-time"
                      initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -16 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="flex h-full min-h-0 flex-col"
                    >
                      <div className="mb-3">
                        <p className="cinematic-kicker text-[9px] tracking-[0.22em]">Preferred Time</p>
                        <p className="mt-1 text-xs font-bold text-white/42">Clinic hours: daily, 10 AM–10 PM (India time), per Google. Holiday hours may differ. The clinic confirms your requested time.</p>
                      </div>
                      <div className="grid min-h-0 flex-1 content-start gap-2.5 overflow-hidden">
                        {BOOKING_TIMES.map((group) => (
                          <div key={group.label}>
                            <div className="mb-2 flex items-center gap-2">
                              <Clock size={12} className="text-[#fec708]/72" />
                              <span className="text-[9px] font-black uppercase tracking-[0.17em] text-white/42">{group.label}</span>
                              <div className="h-px flex-1 bg-white/[0.08]" />
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {group.slots.map((time) => {
                                const isSelected = bookingTime === time;
                                return (
                                  <motion.button
                                    key={time}
                                    disabled={!isFutureBookingTime(time)}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => setBookingTime(time)}
                                    className={cn(
                                      "disabled:opacity-30 disabled:cursor-not-allowed rounded-[1rem] border px-1 py-2 text-[11px] font-black transition-all duration-300 sm:px-2 sm:py-2.5 sm:text-sm",
                                      isSelected
                                        ? "border-[#fec708] bg-[#fec708] text-black shadow-[0_14px_30px_rgba(254,199,8,0.16)]"
                                        : "border-white/[0.08] bg-white/[0.045] text-white/58 hover:border-white/16 hover:bg-white/[0.065]"
                                    )}
                                  >
                                    {time}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.section>
                  )}

                  {bookingStep === 'confirm' && (
                    <motion.section
                      key="booking-confirm"
                      initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: shouldReduceMotion ? 0 : -16 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="flex h-full min-h-0 flex-col"
                    >
                      <div className="mb-3">
                        <p className="cinematic-kicker text-[9px] tracking-[0.22em]">Review Visit</p>
                        <p className="mt-1 text-xs font-bold text-white/42">Review your request, then send it in WhatsApp.</p>
                      </div>
                      <div className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto overscroll-contain hide-scrollbar">
                        {!isDemoMode && Boolean(care.state?.pets.length) && <div className="rounded-2xl border border-white/15 bg-white/5 p-4"><label className="flex gap-3 text-sm"><input type="checkbox" checked={trackBooking} onChange={e => setTrackBooking(e.target.checked)} className="accent-[#fec708]"/>Save this request for my care team to follow up.</label>{trackBooking && <label className="mt-3 block text-sm">Pet for this request<select value={bookingPetId} onChange={e => setBookingPetId(e.target.value)} className="mt-2 w-full rounded-xl bg-[#10251a] p-3"><option value="">Choose your pet</option>{care.state?.pets.map(pet => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select></label>}</div>}
                        <div className="rounded-[1.6rem] border border-[#fec708]/18 bg-[#fec708]/8 p-4">
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#fec708]">Services</p>
                          <p className="mt-2 text-lg font-black leading-tight text-white">{selectedServiceNames || 'No service selected'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-[1.4rem] border border-white/[0.08] bg-white/[0.045] p-4">
                            <Calendar className="mb-3 h-5 w-5 text-[#fec708]" />
                            <p className="text-[9px] font-black uppercase tracking-[0.17em] text-white/38">Date</p>
                            <p className="mt-1 text-sm font-black text-white">
                              {bookingDate ? new Date(`${bookingDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Not set'}
                            </p>
                          </div>
                          <div className="rounded-[1.4rem] border border-white/[0.08] bg-white/[0.045] p-4">
                            <Clock className="mb-3 h-5 w-5 text-[#fec708]" />
                            <p className="text-[9px] font-black uppercase tracking-[0.17em] text-white/38">Time</p>
                            <p className="mt-1 text-sm font-black text-white">{bookingTime || 'Not set'}</p>
                          </div>
                        </div>
                        <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-4"><p className="text-sm font-semibold text-[#fec708]">Your WhatsApp message</p><p className="mt-2 text-sm leading-relaxed text-white/80 whitespace-pre-wrap">{whatsappMessage}</p><p className="mt-3 text-xs text-white/65">This is a request. Your appointment is confirmed only when the hospital replies.</p></div>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>
              </div>

              <footer className="shrink-0 rounded-[1.65rem] border border-white/[0.08] bg-[#08110c]/95 p-2.5 shadow-[0_-18px_50px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-3">
                <div className="mb-2 flex items-center justify-between gap-3 sm:mb-3">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/34">Step {Math.max(bookingStepIndex + 1, 1)} of {BOOKING_STEPS.length}</p>
                    <p className="mt-1 truncate text-sm font-black text-white/80">
                      {selectedServices.length > 0 ? selectedServiceNames : 'Start with a service'}
                    </p>
                  </div>

                </div>
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingStep(BOOKING_STEPS[Math.max(bookingStepIndex - 1, 0)]?.id || 'services')}
                    disabled={bookingStep === 'services'}
                    className="grid h-11 w-11 place-items-center rounded-[1.15rem] border border-white/[0.08] bg-white/[0.045] text-white/58 transition-all disabled:opacity-30 sm:h-12 sm:w-12"
                    aria-label="Previous booking step"
                  >
                    <ArrowRight size={17} className="rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={handleBookingPrimaryAction}
                    disabled={bookingPrimaryDisabled}
                    className={cn(
                      "group relative flex h-11 items-center justify-between overflow-hidden rounded-[1.15rem] px-4 text-xs font-black uppercase tracking-[0.12em] transition-all duration-300 sm:h-12 sm:text-sm",
                      bookingPrimaryDisabled
                        ? "border border-white/[0.08] bg-white/[0.055] text-white/34"
                        : "bg-[#fec708] text-black shadow-[0_18px_42px_rgba(254,199,8,0.2)]"
                    )}
                  >
                    {!bookingPrimaryDisabled && !shouldReduceMotion && (
                      <span className="absolute inset-y-0 left-[-40%] w-1/2 -skew-x-12 bg-white/28 transition-transform duration-700 group-hover:translate-x-[280%]" />
                    )}
                    <span className="relative z-10 truncate">{bookingPrimaryCopy}</span>
                    <ArrowRight size={17} className="relative z-10 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </div>
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </div>
    </div>

    <LogoutModal
      isOpen={isLogoutModalOpen}
      onClose={() => setIsLogoutModalOpen(false)}
      onConfirm={async () => {
        try {
          await signOut(auth);
          navigate('/');
        } catch (e) {
          console.error('Logout failed', e);
        }
      }}
    />
    </>
  );
}

function ActionCard({ icon, title, subtitle, onClick, className }: { icon: React.ReactNode, title: string, subtitle: string, onClick: () => void, className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={title}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick(); } }}
      onClick={onClick}
      whileHover={reduce ? undefined : { y: -4, scale: 1.03, boxShadow: '0 12px 32px rgba(254,199,8,0.15)' }}
      whileTap={reduce ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        "bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl dark:backdrop-blur-[24px] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] rounded-[2rem] p-6 flex flex-col items-start gap-3 cursor-pointer hover:bg-white/90 dark:hover:bg-white/[0.08] mobile-action-card",
        className
      )}
    >
      <div className="bg-white p-2 rounded-xl shadow-sm dark:bg-white/10 dark:border dark:border-white/10 card-icon-container">
        {icon}
      </div>
      <div>
        <h4 className="cinematic-card-title text-xl text-slate-800 dark:text-white card-title">{title}</h4>
        <p className="font-body font-medium text-slate-500 dark:text-slate-300 text-base leading-relaxed card-subtitle">{subtitle}</p>
      </div>
    </motion.div>
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
