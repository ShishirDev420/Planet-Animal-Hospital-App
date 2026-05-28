import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useReducedMotion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar, FileText, Award, ChevronRight, Gift, X, Dog,
  Syringe, Sparkles, Stethoscope, LogOut, PawPrint, Clock, Lock, Settings, Bot, Map, Check, Scissors, Ear, ArrowRight, Plus, TrendingUp, Star, Zap, Trophy
} from 'lucide-react';
import { cn } from '../lib/utils';
import Logo from '../components/Logo';
import LogoutModal from '../components/LogoutModal';
import DualAvatar from '../components/DualAvatar';
import PlanetOrbLoader from '../components/PlanetOrbLoader';
import { useProfileImages } from '../hooks/useProfileImages';
import { usePetProfile } from '../hooks/usePetProfile';
import { usePawlMessage } from '../hooks/usePawlMessage';
import { useTimeOfDay, PERIOD_DISPLAY } from '../hooks/useTimeOfDay';
import { useCheckInStatus } from '../hooks/useCheckInStatus';
import { collection, addDoc, onSnapshot, query, where, serverTimestamp, doc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { buildWhatsAppMessage, calculateBookingPoints, getPointsMultiplier } from '../lib/pawPoints';
import { isPreviewDemoMode } from '../lib/demoMode';

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

const BOOKING_SERVICES = [
  { id: 1, name: 'General Checkup', points: 1000, icon: Stethoscope, desc: 'Full health assessment' },
  { id: 2, name: 'Full Grooming', points: 800, icon: Sparkles, desc: 'Bath, trim & nail care' },
  { id: 3, name: 'Vaccinations', points: 750, icon: Syringe, desc: 'Core & booster shots' },
  { id: 4, name: 'Ear Cleaning', points: 200, icon: Ear, desc: 'Deep clean & inspection' },
  { id: 5, name: 'Haircut', points: 200, icon: Scissors, desc: 'Breed-specific styling' }
];

type BookingStep = 'services' | 'date' | 'time' | 'confirm';

const BOOKING_STEPS: { id: BookingStep; label: string }[] = [
  { id: 'services', label: 'Service' },
  { id: 'date', label: 'Date' },
  { id: 'time', label: 'Time' },
  { id: 'confirm', label: 'Confirm' },
];

const BOOKING_TIMES = [
  { label: 'Morning', slots: ['9:00 AM', '10:00 AM', '11:00 AM'] },
  { label: 'Afternoon', slots: ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'] },
  { label: 'Evening', slots: ['6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'] },
];

const HOME_PAW_MILESTONES = [
  {
    points: 500,
    title: 'Health Starter',
    badge: 'Entry',
    subtitle: 'Program entry reward',
    detail: 'Your first care milestone opens the rewards journey.',
    note: 'First milestone',
    icon: TrendingUp,
    surface: 'from-emerald-200/18 via-cyan-100/8 to-transparent',
    ring: 'border-emerald-200/30 bg-emerald-300/10 text-emerald-100',
    fill: 'from-emerald-300 to-cyan-200',
    glow: 'shadow-[0_0_28px_rgba(52,211,153,0.13)]',
  },
  {
    points: 1500,
    title: '15% Bill Rebate',
    badge: 'Savings',
    subtitle: 'Next bill rebate',
    detail: 'Instant 15% off your next Planet Animal bill.',
    note: 'Valid next visit',
    hero: '15%',
    icon: FileText,
    surface: 'from-sky-200/18 via-[#fec708]/8 to-transparent',
    ring: 'border-sky-100/30 bg-sky-200/10 text-sky-100',
    fill: 'from-sky-200 via-[#ffe08a] to-[#fec708]',
    glow: 'shadow-[0_0_30px_rgba(125,211,252,0.13)]',
  },
  {
    points: 2500,
    title: '20% Bill Rebate',
    badge: 'Deep Savings',
    subtitle: 'Deep savings tier',
    detail: 'A stronger bill reward for consistent preventive care.',
    note: 'Care pays back',
    icon: Zap,
    surface: 'from-[#fec708]/20 via-orange-200/10 to-transparent',
    ring: 'border-[#fec708]/35 bg-[#fec708]/10 text-[#fec708]',
    fill: 'from-[#fec708] to-orange-300',
    glow: 'shadow-[0_0_30px_rgba(254,199,8,0.14)]',
  },
  {
    points: 5000,
    title: 'Life-Maxing Consultation',
    badge: 'Signature',
    subtitle: 'Breed-specific longevity plan',
    detail: 'A focused doctor-led roadmap for longer, healthier years.',
    note: 'Doctor guided',
    icon: Award,
    surface: 'from-violet-200/18 via-pink-200/8 to-transparent',
    ring: 'border-violet-200/30 bg-violet-300/10 text-violet-100',
    fill: 'from-violet-300 to-pink-200',
    glow: 'shadow-[0_0_30px_rgba(196,181,253,0.13)]',
  },
  {
    points: 7500,
    title: 'Premium Spa & Therapy',
    badge: 'Comfort',
    subtitle: 'Grooming plus medicated baths',
    detail: 'A restorative comfort reward for coat and skin health.',
    note: 'Full reset',
    icon: Sparkles,
    surface: 'from-rose-200/18 via-orange-200/8 to-transparent',
    ring: 'border-rose-200/30 bg-rose-300/10 text-rose-100',
    fill: 'from-rose-300 to-orange-200',
    glow: 'shadow-[0_0_30px_rgba(251,113,133,0.13)]',
  },
  {
    points: 10000,
    title: 'Full Hematology Panel',
    badge: 'Clinical',
    subtitle: 'Comprehensive blood examination',
    detail: 'A deeper clinical screen for internal health signals.',
    note: 'Internal health',
    icon: Trophy,
    surface: 'from-amber-200/18 via-yellow-100/8 to-transparent',
    ring: 'border-amber-200/30 bg-amber-300/10 text-amber-100',
    fill: 'from-amber-300 to-yellow-100',
    glow: 'shadow-[0_0_30px_rgba(251,191,36,0.13)]',
  },
];



interface PetProfileForIncentives {
  name?: string;
  breed?: string;
  age?: string | number;
  petType?: string;
  weight?: string;
  healthHistory?: string;
  medicalHistory?: string;
  surgicalHistory?: string;
  cachedRoadmap?: string;
}

type CardTheme = 'blue' | 'orange' | 'green' | 'purple' | 'yellow';

interface IncentiveCard {
  id: string;
  title: string;
  subtext: string;
  pointsText: string;
  pointsValue: number;
  highValue?: boolean;
  theme: CardTheme;
  actionText?: string;
}

function getPersonalizedIncentives(pet?: PetProfileForIncentives): IncentiveCard[] {
  if (!pet) return [];
  const cards: IncentiveCard[] = [];
  const petName = pet.name || 'your pet';

  // ─── Determine age-based flags ───
  const ageNum = typeof pet.age === 'number' ? pet.age : parseFloat(String(pet.age || '0'));
  const isSenior = ageNum >= 7;

  // ─── Determine weight-based flags ───
  const weightStr = (pet.weight || '').toLowerCase();
  const weightNum = parseFloat(weightStr.replace(/[^0-9.]/g, ''));
  const isKg = weightStr.includes('kg');
  const weightLbs = isKg ? weightNum * 2.205 : weightNum;
  // Rough overweight heuristic: >30lbs for small breeds, >80lbs for large breeds
  const breedLower = (pet.breed || '').toLowerCase();
  const petTypeLower = (pet.petType || 'dog').toLowerCase();
  const isCat = petTypeLower === 'cat';
  const isOverweight = isCat
    ? weightLbs > 15
    : (breedLower.includes('chihuahua') || breedLower.includes('pomeranian') || breedLower.includes('shih') || breedLower.includes('yorkie'))
      ? weightLbs > 15
      : weightLbs > 80;

  // ─── 1. Condition-Based Cards ───
  if (isOverweight && weightNum > 0) {
    cards.push({
      id: 'cond-weight-mgmt',
      title: 'Weight Management Plan',
      subtext: `Tailored nutrition & exercise for ${petName}'s ideal weight.`,
      pointsText: '+1,500 pts',
      pointsValue: 1500,
      highValue: true,
      theme: 'purple'
    });
  }

  if (isSenior) {
    cards.push({
      id: 'cond-senior-health',
      title: 'Senior Health Screening',
      subtext: 'Comprehensive bloodwork & organ function for the golden years.',
      pointsText: '+1,200 pts',
      pointsValue: 1200,
      highValue: true,
      theme: 'blue'
    });
  }

  // ─── 2. Breed-Specific Cards (12 categories, vet-verified) ───
  if (breedLower) {
    // Labrador Retriever
    if (breedLower.includes('labrador') || breedLower.includes('lab retriever')) {
      cards.push(
        { id: 'lab-hip-elbow', title: 'Hip & Elbow Dysplasia Screen', subtext: 'Early detection for Labs\' #1 joint risk.', pointsText: '+1,200 pts', pointsValue: 1200, highValue: true, theme: 'blue' },
        { id: 'lab-weight', title: 'Weight Management Check', subtext: 'Labs are genetically prone to obesity.', pointsText: '+1,000 pts', pointsValue: 1000, theme: 'green' },
        { id: 'lab-skin', title: 'Skin Allergy Assessment', subtext: 'Environmental & food allergy panel.', pointsText: '+900 pts', pointsValue: 900, theme: 'orange' },
        { id: 'lab-ear', title: 'Ear Health Panel', subtext: 'Floppy ears mean higher infection risk.', pointsText: '+650 pts', pointsValue: 650, theme: 'yellow' }
      );
    }
    // German Shepherd
    else if (breedLower.includes('german shepherd') || breedLower.includes('gsd') || breedLower.includes('alsatian')) {
      cards.push(
        { id: 'gsd-hip-elbow', title: 'Hip & Elbow Dysplasia Screen', subtext: '19-20% breed prevalence — early screen critical.', pointsText: '+1,200 pts', pointsValue: 1200, highValue: true, theme: 'blue' },
        { id: 'gsd-dm', title: 'Degenerative Myelopathy Test', subtext: 'DNA-based screening for spinal cord disease.', pointsText: '+900 pts', pointsValue: 900, theme: 'purple' },
        { id: 'gsd-bloat', title: 'Bloat Prevention Assessment', subtext: 'GDV risk eval & gastropexy counseling.', pointsText: '+850 pts', pointsValue: 850, theme: 'orange' },
        { id: 'gsd-skin', title: 'Skin & Coat Health', subtext: 'Manage allergic dermatitis & hot spots.', pointsText: '+700 pts', pointsValue: 700, theme: 'green' }
      );
    }
    // Golden Retriever
    else if (breedLower.includes('golden retriever')) {
      cards.push(
        { id: 'golden-cancer', title: 'Cancer Screening Panel', subtext: 'Goldens have elevated cancer risk — early detection saves lives.', pointsText: '+1,300 pts', pointsValue: 1300, highValue: true, theme: 'purple' },
        { id: 'golden-joint', title: 'Joint & Mobility Check', subtext: 'Protect against hip dysplasia & cruciate tears.', pointsText: '+1,000 pts', pointsValue: 1000, theme: 'blue' },
        { id: 'golden-groom', title: 'Advanced Grooming Spa', subtext: 'Deep clean for that legendary golden coat.', pointsText: '+900 pts', pointsValue: 900, theme: 'yellow' }
      );
    }
    // Bulldog / Pug / French Bulldog (Brachycephalic)
    else if (breedLower.includes('bulldog') || breedLower.includes('bully') || breedLower.includes('pug') || breedLower.includes('french bull') || breedLower.includes('frenchie') || breedLower.includes('shih tzu') || breedLower.includes('pekingese')) {
      cards.push(
        { id: 'brachy-airway', title: 'Airway Assessment (BOAS)', subtext: 'Brachycephalic airway syndrome screening.', pointsText: '+1,000 pts', pointsValue: 1000, theme: 'blue' },
        { id: 'brachy-eye', title: 'Eye Health Check', subtext: 'Proptosis, cherry eye & corneal ulcer screening.', pointsText: '+750 pts', pointsValue: 750, theme: 'green' },
        { id: 'brachy-dental', title: 'Dental Assessment', subtext: 'Crowded teeth & malocclusion check.', pointsText: '+700 pts', pointsValue: 700, theme: 'yellow' },
        { id: 'brachy-skin', title: 'Skin Fold Care', subtext: 'Prevent intertrigo & fold dermatitis.', pointsText: '+650 pts', pointsValue: 650, theme: 'orange' }
      );
    }
    // Beagle
    else if (breedLower.includes('beagle')) {
      cards.push(
        { id: 'beagle-ear', title: 'Ear Health Panel', subtext: 'Long ears trap moisture — infection prevention.', pointsText: '+650 pts', pointsValue: 650, theme: 'yellow' },
        { id: 'beagle-thyroid', title: 'Thyroid Function Check', subtext: 'Hypothyroidism screening for Beagles.', pointsText: '+750 pts', pointsValue: 750, theme: 'blue' },
        { id: 'beagle-weight', title: 'Weight Control Plan', subtext: 'Beagles are food-driven — proactive weight management.', pointsText: '+800 pts', pointsValue: 800, theme: 'green' }
      );
    }
    // Dachshund
    else if (breedLower.includes('dachshund') || breedLower.includes('doxie') || breedLower.includes('wiener')) {
      cards.push(
        { id: 'dach-spine', title: 'Spine & Back Assessment (IVDD)', subtext: 'Highest breed risk for intervertebral disc disease.', pointsText: '+1,100 pts', pointsValue: 1100, highValue: true, theme: 'purple' },
        { id: 'dach-weight', title: 'Weight Management', subtext: 'Excess weight worsens spinal compression.', pointsText: '+800 pts', pointsValue: 800, theme: 'green' },
        { id: 'dach-dental', title: 'Dental Health Check', subtext: 'Small jaws mean crowded teeth & tartar buildup.', pointsText: '+700 pts', pointsValue: 700, theme: 'yellow' }
      );
    }
    // Chihuahua / Small Breeds
    else if (breedLower.includes('chihuahua') || breedLower.includes('pomeranian') || breedLower.includes('yorkie') || breedLower.includes('yorkshire') || breedLower.includes('maltese') || breedLower.includes('toy')) {
      cards.push(
        { id: 'small-patella', title: 'Patella Luxation Screen', subtext: 'Small breeds are prone to kneecap displacement.', pointsText: '+800 pts', pointsValue: 800, theme: 'blue' },
        { id: 'small-dental', title: 'Dental Care Package', subtext: 'Toy breeds need extra dental attention.', pointsText: '+700 pts', pointsValue: 700, theme: 'yellow' },
        { id: 'small-cardiac', title: 'Cardiac Check', subtext: 'Mitral valve disease screening.', pointsText: '+750 pts', pointsValue: 750, theme: 'purple' }
      );
    }
    // Boxer
    else if (breedLower.includes('boxer')) {
      cards.push(
        { id: 'boxer-cancer', title: 'Cancer Screening Panel', subtext: 'Boxers have one of the highest cancer rates.', pointsText: '+1,300 pts', pointsValue: 1300, highValue: true, theme: 'purple' },
        { id: 'boxer-cardiac', title: 'Cardiac Exam (ARVC)', subtext: 'Arrhythmogenic right ventricular cardiomyopathy screening.', pointsText: '+1,000 pts', pointsValue: 1000, theme: 'blue' }
      );
    }
    // Rottweiler
    else if (breedLower.includes('rottweiler') || breedLower.includes('rottie')) {
      cards.push(
        { id: 'rott-cardiac-hip', title: 'Cardiac & Hip Assessment', subtext: 'Heart disease + hip dysplasia dual screening.', pointsText: '+1,400 pts', pointsValue: 1400, highValue: true, theme: 'blue' },
        { id: 'rott-bone-cancer', title: 'Bone Cancer Awareness Screen', subtext: 'Osteosarcoma early detection protocol.', pointsText: '+1,300 pts', pointsValue: 1300, highValue: true, theme: 'purple' }
      );
    }
    // Husky / Malamute
    else if (breedLower.includes('husky') || breedLower.includes('malamute')) {
      cards.push(
        { id: 'husky-eye', title: 'Ophthalmology Screen', subtext: 'Cataracts & progressive retinal atrophy check.', pointsText: '+900 pts', pointsValue: 900, theme: 'blue' },
        { id: 'husky-skin', title: 'Zinc-Responsive Dermatosis Check', subtext: 'Northern breed-specific skin condition.', pointsText: '+750 pts', pointsValue: 750, theme: 'orange' }
      );
    }
    // ─── Cat Breeds ───
    // Persian
    else if (breedLower.includes('persian') || breedLower.includes('exotic shorthair') || breedLower.includes('himalayan')) {
      cards.push(
        { id: 'persian-pkd', title: 'PKD Screening (Kidney)', subtext: '38% of Persians affected — ultrasound recommended.', pointsText: '+1,000 pts', pointsValue: 1000, theme: 'purple' },
        { id: 'persian-groom', title: 'Grooming & Mat Prevention', subtext: 'Long coat maintenance & skin health.', pointsText: '+900 pts', pointsValue: 900, theme: 'yellow' },
        { id: 'persian-dental', title: 'Dental Assessment', subtext: 'Flat face = dental crowding & disease.', pointsText: '+850 pts', pointsValue: 850, theme: 'orange' },
        { id: 'persian-eye', title: 'Eye & Tear Duct Check', subtext: 'Epiphora & corneal ulcer prevention.', pointsText: '+650 pts', pointsValue: 650, theme: 'green' }
      );
    }
    // Maine Coon
    else if (breedLower.includes('maine coon')) {
      cards.push(
        { id: 'maine-hcm', title: 'HCM Cardiac Screen', subtext: 'Highest breed risk for hypertrophic cardiomyopathy.', pointsText: '+1,200 pts', pointsValue: 1200, highValue: true, theme: 'purple' },
        { id: 'maine-hip', title: 'Hip & Joint Assessment', subtext: '18-24% hip dysplasia prevalence in Maine Coons.', pointsText: '+850 pts', pointsValue: 850, theme: 'blue' },
        { id: 'maine-groom', title: 'Grooming Wellness', subtext: 'Semi-long coat care & hairball prevention.', pointsText: '+850 pts', pointsValue: 850, theme: 'yellow' }
      );
    }
    // Siamese
    else if (breedLower.includes('siamese') || breedLower.includes('oriental') || breedLower.includes('burmese')) {
      cards.push(
        { id: 'siamese-kidney', title: 'Kidney Function Panel', subtext: 'Amyloidosis & early CKD detection.', pointsText: '+800 pts', pointsValue: 800, theme: 'purple' },
        { id: 'siamese-dental', title: 'Dental Health Check', subtext: 'Siamese cats are prone to periodontal disease.', pointsText: '+750 pts', pointsValue: 750, theme: 'yellow' },
        { id: 'siamese-respiratory', title: 'Respiratory Assessment', subtext: 'Asthma & upper respiratory screening.', pointsText: '+700 pts', pointsValue: 700, theme: 'green' }
      );
    }
  }

  // ─── 3. Roadmap & Medical History Keyword Parsing ───
  const historyBlob = [
    pet.healthHistory || '',
    pet.medicalHistory || '',
    pet.surgicalHistory || '',
    pet.cachedRoadmap || ''
  ].join(' ').toLowerCase();

  const keywordCards: Record<string, IncentiveCard> = {
    allergy: { id: 'hist-allergy', title: 'Allergy Management', subtext: 'Comprehensive environmental & food allergy panel.', pointsText: '+900 pts', pointsValue: 900, theme: 'orange' },
    dental: { id: 'hist-dental', title: 'Dental Deep Clean', subtext: 'Follow-up on dental history — scaling & polishing.', pointsText: '+800 pts', pointsValue: 800, theme: 'yellow' },
    heart: { id: 'hist-cardiac', title: 'Cardiac Follow-Up', subtext: 'Echocardiogram & heart health monitoring.', pointsText: '+1,000 pts', pointsValue: 1000, theme: 'purple' },
    cardiac: { id: 'hist-cardiac', title: 'Cardiac Follow-Up', subtext: 'Echocardiogram & heart health monitoring.', pointsText: '+1,000 pts', pointsValue: 1000, theme: 'purple' },
    joint: { id: 'hist-joint', title: 'Joint & Mobility Review', subtext: 'Ongoing joint health monitoring & support.', pointsText: '+850 pts', pointsValue: 850, theme: 'blue' },
    arthritis: { id: 'hist-joint', title: 'Joint & Mobility Review', subtext: 'Ongoing joint health monitoring & support.', pointsText: '+850 pts', pointsValue: 850, theme: 'blue' },
    eye: { id: 'hist-eye', title: 'Ophthalmology Follow-Up', subtext: 'Continued eye health monitoring.', pointsText: '+750 pts', pointsValue: 750, theme: 'green' },
    ear: { id: 'hist-ear', title: 'Ear Health Follow-Up', subtext: 'Otitis prevention & ongoing ear care.', pointsText: '+650 pts', pointsValue: 650, theme: 'yellow' },
    kidney: { id: 'hist-kidney', title: 'Kidney Function Panel', subtext: 'BUN/Creatinine monitoring & renal health.', pointsText: '+900 pts', pointsValue: 900, theme: 'purple' },
    renal: { id: 'hist-kidney', title: 'Kidney Function Panel', subtext: 'BUN/Creatinine monitoring & renal health.', pointsText: '+900 pts', pointsValue: 900, theme: 'purple' },
    thyroid: { id: 'hist-thyroid', title: 'Thyroid Function Test', subtext: 'T4 levels & metabolic health assessment.', pointsText: '+750 pts', pointsValue: 750, theme: 'blue' },
    skin: { id: 'hist-skin', title: 'Dermatology Follow-Up', subtext: 'Skin condition monitoring & treatment plan.', pointsText: '+800 pts', pointsValue: 800, theme: 'orange' },
    spine: { id: 'hist-spine', title: 'Spinal Health Check', subtext: 'Ongoing back & spinal cord monitoring.', pointsText: '+950 pts', pointsValue: 950, theme: 'purple' },
    surgery: { id: 'hist-post-op', title: 'Post-Surgery Follow-Up', subtext: 'Surgical recovery monitoring & wound check.', pointsText: '+800 pts', pointsValue: 800, theme: 'blue' }
  };

  if (historyBlob.length > 0) {
    const addedHistoryIds = new Set<string>();
    for (const [keyword, card] of Object.entries(keywordCards)) {
      if (historyBlob.includes(keyword) && !addedHistoryIds.has(card.id)) {
        cards.push(card);
        addedHistoryIds.add(card.id);
      }
    }
  }
  // ─── 4. Baseline Cards (all pets get these) ───
  cards.push(
    { id: 'base-wellness', title: 'General Wellness Checkup', subtext: `Comprehensive proactive health screening for ${petName}.`, pointsText: '+1,000 pts', pointsValue: 1000, theme: 'yellow', actionText: 'Book Now' },
    { id: 'base-vaccination', title: 'Vaccination Booster', subtext: 'Stay up-to-date on core & lifestyle vaccines.', pointsText: '+750 pts', pointsValue: 750, theme: 'green', actionText: 'Book Now' },
    { id: 'base-dental', title: 'Proactive Dental Exam', subtext: 'Preventative oral care assessment & cleaning.', pointsText: '+800 pts', pointsValue: 800, theme: 'blue', actionText: 'Book Now' },
    { id: 'base-grooming', title: 'Grooming Spa Session', subtext: 'Full grooming, coat care & skin check.', pointsText: '+700 pts', pointsValue: 700, theme: 'yellow', actionText: 'Book Now' }
  );

  // ─── 5. Deduplicate by title ───
  const seen = new Set<string>();
  const unique = cards.filter(card => {
    const key = card.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // ─── 6. Sort ascending (small wins → big rewards) ───
  unique.sort((a, b) => a.pointsValue - b.pointsValue);

  // ─── 7. Cap at 7 cards ───
  const capped = unique.slice(0, 7);

  // ─── 8. Assign unique IDs & highValue badge ───
  return capped.map(card => ({
    ...card,
    id: `${card.id}-${crypto.randomUUID()}`,
    highValue: card.highValue || card.pointsValue >= 1200
  }));
}

function generateWhatsAppPayload(serviceName: string, petProfile: any) {
  const message = buildWhatsAppMessage(
    petProfile?.parentName || 'Pet Parent',
    petProfile?.name || 'Pet',
    [serviceName],
    'TBD',
    'TBD',
  );
  return `https://wa.me/919004290923?text=${encodeURIComponent(message)}`;
}

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
  const [verifiedPoints, setVerifiedPoints] = useState(0);
  const [pendingPoints, setPendingPoints] = useState(0);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [pendingIncentives, setPendingIncentives] = useState<string[]>([]);
  const [incentivesOrder, setIncentivesOrder] = useState<any[]>([]);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const getMultiplier = (plan: string) => getPointsMultiplier(plan);

  useEffect(() => {
    if (petProfile) {
      setIncentivesOrder(getPersonalizedIncentives(petProfile as any));
    }
  }, [petProfile]);

  useEffect(() => {
    if (!isDemoMode) return;
    setVerifiedPoints(Number(petProfile?.pawPoints || 0));
    setCurrentPlan('prestige');
  }, [isDemoMode, petProfile?.name, petProfile?.pawPoints]);

  useEffect(() => {
    if (isDemoMode) {
      return;
    }

    setIsAuthReady(!profileLoading);
    setUserId(petProfile?.uid || auth.currentUser?.uid || null);

    if (petProfile) {
      setVerifiedPoints(Number(petProfile.pawPoints || 0));
      setCurrentPlan(petProfile.currentPlan || petProfile.petProfile?.currentPlan || 'free');
    }
  }, [isDemoMode, profileLoading, petProfile]);

  const handleBookingRequest = async (serviceName: string, pointsValue: number, incentiveId: string) => {
    if (!userId) return;

    const finalPoints = calculateBookingPoints([{ id: 0, name: serviceName, points: pointsValue }], currentPlan);

    // Optimistic UI updates
    setPendingIncentives(prev => [...prev, incentiveId]);
    setPendingPoints(prev => prev + finalPoints);

    try {
      const user = auth.currentUser || (isDemoMode ? { uid: 'demo-user', email: 'demo@planetanimal.com', displayName: 'Demo Parent' } : null);
      if (!user) return;

      const petNameStr = petProfile?.name || 'Pet';

      await addDoc(collection(db, 'requests'), {
        userId: user.uid,
        patient: petNameStr,
        reason: serviceName,
        date: "TBD",
        time: "TBD",
        points: finalPoints,
        status: 'pending',
        actionId: incentiveId,
        createdAt: serverTimestamp()
      });

      const message = buildWhatsAppMessage(petProfile?.parentName || 'Pet Parent', petNameStr, [serviceName], 'TBD', 'TBD');
      const whatsappUrl = `https://wa.me/919004290923?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'requests');
      // Revert optimistic update on failure
      setPendingIncentives(prev => prev.filter(id => id !== incentiveId));
      setPendingPoints(prev => prev - finalPoints);
    }
  };

  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Booking State
  const [isBookVisitOpen, setIsBookVisitOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<{id: number, name: string, points: number, icon: any, desc: string}[]>([]);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingStep, setBookingStep] = useState<BookingStep>('services');
  const [isConnecting, setIsConnecting] = useState(false);

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

    const bodyOverflow = document.body.style.overflow;
    const bodyTouchAction = document.body.style.touchAction;
    const htmlOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.documentElement.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.body.style.touchAction = bodyTouchAction;
      document.documentElement.style.overscrollBehavior = htmlOverscroll;
    };
  }, [isBookVisitOpen]);

  const submitBooking = async () => {
    if (selectedServices.length === 0 || !bookingDate || !bookingTime || !userId) return;

    const finalPoints = calculateBookingPoints(selectedServices, currentPlan);
    const serviceNames = selectedServices.map(s => s.name).join(', ');

    try {
      await addDoc(collection(db, 'requests'), {
        userId: auth.currentUser?.uid || userId,
        patient: petProfile?.name || 'Pet',
        phone: petProfile?.phone || '',
        reason: serviceNames,
        date: bookingDate,
        time: bookingTime,
        points: finalPoints,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'requests');
    }

    setIsBookVisitOpen(false);
    setSelectedServices([]);
    setBookingDate('');
    setBookingTime('');
    setBookingStep('services');
  };

  const closeBookVisit = () => {
    setIsBookVisitOpen(false);
    setSelectedServices([]);
    setBookingDate('');
    setBookingTime('');
    setBookingStep('services');
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
  const parentPhone = petProfile?.phone || '';
  const bookingBasePoints = selectedServices.reduce((acc, service) => acc + service.points, 0);
  const bookingFinalPoints = calculateBookingPoints(selectedServices, currentPlan);
  const bookingMultiplier = getMultiplier(currentPlan);
  const briefingPreview = getBriefingPreview(pawlMessage, pawlLoading, petName);
  const whatsappMessage = `${buildWhatsAppMessage(parentName, petName, selectedServices.map(s => s.name), bookingDate, bookingTime)}${parentPhone ? ` My mobile: ${parentPhone}.` : ''}`;
  const whatsappUrl = `https://wa.me/919004290923?text=${encodeURIComponent(whatsappMessage)}`;
  const briefingNeedsAttention = !isPeriodComplete(currentPeriod);
  const bookingStepIndex = BOOKING_STEPS.findIndex((step) => step.id === bookingStep);
  const bookingReady = selectedServices.length > 0 && Boolean(bookingDate) && Boolean(bookingTime);
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
      if (bookingDate) setBookingStep('time');
      return;
    }

    if (bookingStep === 'time') {
      if (bookingTime) setBookingStep('confirm');
      return;
    }

    if (bookingReady) {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      submitBooking();
    }
  };

  const bookingPrimaryCopy = bookingStep === 'services'
    ? selectedServices.length > 0 ? 'Choose Date' : 'Select Services'
    : bookingStep === 'date'
      ? bookingDate ? 'Choose Time' : 'Select Date'
      : bookingStep === 'time'
        ? bookingTime ? 'Review Visit' : 'Select Time'
        : 'Confirm Appointment';

  const bookingPrimaryDisabled = bookingStep === 'services'
    ? selectedServices.length === 0
    : bookingStep === 'date'
      ? !bookingDate
      : bookingStep === 'time'
        ? !bookingTime
        : !bookingReady;

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
    <div className="relative w-full h-full">
      <div className="relative z-10 p-6 space-y-8 pb-4 dark:text-white/95 mobile-dashboard">
        {/* Header with Logo */}
      <header className="pt-4 mb-2 mobile-header-row">
        <div className="hidden lg:block">
          <div className="grid min-h-[14rem] w-full grid-cols-[13rem_minmax(0,1fr)_13rem] items-center gap-6 py-5 xl:min-h-[15rem] xl:grid-cols-[15rem_minmax(0,1fr)_15rem]">
            <button onClick={() => navigate('/profiles')} className="group flex justify-start" aria-label="Switch profile">
              <div className="relative flex h-40 w-40 items-center justify-center rounded-full drop-shadow-[0_0_42px_rgba(254,199,8,0.38)] transition-all duration-300 group-hover:scale-[1.03] group-active:scale-95 xl:h-44 xl:w-44">
                <Logo className="!h-40 !w-40 xl:!h-44 xl:!w-44" />
              </div>
            </button>

            <div className="flex min-w-0 flex-col items-center text-center">
              <h1 className="font-cinematic text-[4.65rem] font-black uppercase leading-[0.82] tracking-[0.1em] text-white drop-shadow-[0_18px_44px_rgba(0,0,0,0.42)] xl:text-[5.6rem] 2xl:text-[6.15rem]">
                Planet Animal
              </h1>
              <p className="mt-4 font-heading text-[1.05rem] font-black uppercase leading-none tracking-[0.52em] text-[#fec708] drop-shadow-[0_0_20px_rgba(254,199,8,0.28)] xl:text-[1.25rem]">
                Hospital & Wellness
              </p>
            </div>

            <div className="flex items-start justify-end gap-3 self-start pt-3">
              <button
                onClick={() => navigate('/settings')}
                title="Settings"
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] shadow-sm transition-all duration-300 hover:bg-white/[0.14] cursor-pointer group"
              >
                <Settings className="w-4 h-4 text-white/80 group-hover:text-white transition-colors duration-300" />
              </button>
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                title="Logout"
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-red-400/15 bg-red-500/[0.08] shadow-sm transition-all duration-300 hover:bg-red-500/[0.14] cursor-pointer group"
              >
                <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-500 transition-colors duration-300" />
              </button>
            </div>
          </div>

          <div className="mb-7 mt-1">
            <h2 className="cinematic-section-title text-4xl drop-shadow-md xl:text-5xl">Hi, {petProfile?.parentName || 'Pet Parent'}</h2>
            <p className="cinematic-copy mt-2 text-base">Let's keep {petName} healthy today.</p>
          </div>
        </div>

        <div className="lg:hidden">
          <div className="grid w-full grid-cols-[76px_minmax(0,1fr)_76px] items-center py-4 sm:grid-cols-[88px_minmax(0,1fr)_88px]">
            <button onClick={() => navigate('/profiles')} className="group flex justify-start" aria-label="Switch profile">
              <div className="rounded-2xl p-1 drop-shadow-[0_0_18px_rgba(245,158,11,0.28)] transition-all duration-300 group-hover:scale-105 group-active:scale-95">
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

          <div className="mb-5 mt-2 mobile-header-greeting">
            <h2 className="cinematic-section-title text-3xl drop-shadow-md">Hi, {petProfile?.parentName || 'Pet Parent'}</h2>
            <p className="cinematic-copy mt-1 text-sm">Let's keep {petName} healthy today.</p>
          </div>
        </div>
      </header>

      {/* Pawl Daily Briefing Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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

      {/* Quick Actions */}
      <div>
        <h3 className="cinematic-card-title mb-4 text-xl drop-shadow-sm mobile-quick-actions-title">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mobile-quick-actions-grid">
          <ActionCard
            icon={<Calendar className="text-planet-yellow" />}
            title="Book Visit"
            subtitle="Checkups & Grooming"
            onClick={() => setIsBookVisitOpen(true)}
            className="mobile-action-card"
          />
          <ActionCard
            icon={<FileText className="text-planet-yellow" />}
            title="Medical Records"
            subtitle="Vaccines & History"
            onClick={() => navigate('/records')}
            className="mobile-action-card"
          />
          <ActionCard
            icon={<Bot className="text-planet-yellow" />}
            title="AI Vet"
            subtitle="Instant Health Advice"
            onClick={() => navigate('/ai')}
            className="mobile-action-card"
          />
          <ActionCard
            icon={<Map className="text-planet-yellow" />}
            title="Roadmap"
            subtitle="Longevity Plan"
            onClick={() => navigate('/roadmap')}
            className="mobile-action-card"
          />
        </div>
      </div>

      <RewardsCarousel
        verifiedPoints={verifiedPoints}
        pendingPoints={pendingPoints}
        shouldReduceMotion={shouldReduceMotion}
        navigate={navigate}
        locationSearch={location.search}
      />

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

              {activeModal === 'redeem' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="cinematic-card-title text-2xl text-slate-900">Claim Free Consult</h2>
                    <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
                  </div>
                  <div className="bg-[#fec708]/10 border border-[#fec708]/30 rounded-2xl p-6 text-center">
                    <Gift className="w-12 h-12 text-[#fec708] mx-auto mb-4" />
                    <h3 className="cinematic-card-title mb-2 text-xl text-slate-800">You've Unlocked a Free Consultation!</h3>
                    <p className="text-slate-600 mb-6">
                      Show this screen to our staff at checkout to claim your free consultation for {petName}.
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

      {/* Book Visit Full-Screen Flow */}
      <AnimatePresence>
        {isBookVisitOpen && (
          <motion.div
            key="book-visit-flow"
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
                    <p className="cinematic-kicker mb-2 text-[9px] tracking-[0.24em]">Locked Booking Mode</p>
                    <h2 className="cinematic-section-title text-[2.35rem] leading-[0.88] tracking-[-0.065em] sm:text-[2.65rem]">
                      Book <span className="text-planet-yellow">Visit</span>
                    </h2>
                    <p className="mt-1.5 text-xs font-bold leading-5 text-white/54 sm:text-sm">
                      {petProfile?.name ? `Schedule a care slot for ${petProfile.name}.` : 'Schedule a care slot with Planet Animal.'}
                    </p>
                  </div>
                <motion.button
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.06, rotate: 90 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={closeBookVisit}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/12 bg-white/[0.06] text-white/70 shadow-[0_16px_40px_rgba(0,0,0,0.34)] transition-colors hover:border-[#fec708]/24 hover:text-white"
                    aria-label="Close Book Visit"
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

                      <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2.5 overflow-hidden">
                        {BOOKING_SERVICES.map((service) => {
                          const isSelected = selectedServices.some(s => s.id === service.id);
                          const ServiceIcon = service.icon;
                          return (
                            <motion.button
                              key={service.id}
                              whileTap={{ scale: 0.985 }}
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
                              <div className={cn(
                                "grid h-8 w-8 shrink-0 place-items-center rounded-[0.85rem] transition-all duration-300",
                                isSelected ? "bg-[#fec708] text-black shadow-[0_0_18px_rgba(254,199,8,0.28)]" : "bg-white/[0.075] text-white/48"
                              )}>
                                <ServiceIcon size={20} />
                              </div>
                              <div className="min-w-0 pr-7">
                                <p className="cinematic-card-title line-clamp-2 text-[0.94rem] leading-[0.96] text-white">{service.name}</p>
                                <p className="sr-only">{service.desc}</p>
                              </div>
                              <div className="absolute right-2.5 top-2.5 text-right">
                                <div className={cn("mb-1 flex items-center justify-end gap-1", isSelected ? "text-[#fec708]" : "text-white/32")}>
                                  <PawPrint size={11} className={isSelected ? 'fill-[#fec708]' : ''} />
                                  <span className="text-xs font-black">+{service.points}</span>
                                </div>
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
                        <p className="mt-1 text-xs font-bold text-white/42">Choose the earliest comfortable clinic slot.</p>
                      </div>
                      <div className="grid min-h-0 flex-1 grid-cols-4 content-start gap-2.5 overflow-hidden">
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((offset) => {
                          const date = new Date();
                          date.setDate(date.getDate() + offset);
                          const isToday = offset === 0;
                          const dateStr = date.toISOString().split('T')[0];
                          const isSelected = bookingDate === dateStr;

                          return (
                            <motion.button
                              key={offset}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => setBookingDate(dateStr)}
                              className={cn(
                                "flex min-h-[4.8rem] flex-col items-center justify-center rounded-[1.2rem] border px-1 transition-all duration-300",
                                isSelected
                                  ? "border-[#fec708] bg-[#fec708] text-black shadow-[0_16px_34px_rgba(254,199,8,0.16)]"
                                  : "border-white/[0.08] bg-white/[0.045] text-white/58 hover:border-white/16 hover:bg-white/[0.065]"
                              )}
                            >
                              <span className="mb-1 text-[9px] font-black uppercase tracking-[0.12em] opacity-62">
                                {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                              </span>
                              <span className="text-2xl font-black leading-none">{date.getDate()}</span>
                              <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] opacity-45">
                                {date.toLocaleDateString('en-US', { month: 'short' })}
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
                        <p className="mt-1 text-xs font-bold text-white/42">Pick the time window that fits your day.</p>
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
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => setBookingTime(time)}
                                    className={cn(
                                      "rounded-[1rem] border px-1 py-2 text-[11px] font-black transition-all duration-300 sm:px-2 sm:py-2.5 sm:text-sm",
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
                        <p className="mt-1 text-xs font-bold text-white/42">Confirm the details before we open WhatsApp.</p>
                      </div>
                      <div className="grid min-h-0 flex-1 content-start gap-3 overflow-hidden">
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
                        <div className="rounded-[1.6rem] border border-white/[0.08] bg-black/28 p-4">
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/38">Reward Points</p>
                          <p className="mt-1 flex items-end gap-2 font-heading text-[2.55rem] font-black leading-none tracking-[-0.06em] text-[#fec708]">
                            {bookingFinalPoints.toLocaleString()}
                            <span className="pb-1 text-xs font-black uppercase tracking-[0.16em] text-white/44">pts</span>
                          </p>
                          {selectedServices.length > 0 && (
                            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/38">
                              {currentPlan === 'free'
                                ? 'Free plan: General Checkup earns 500 pts'
                                : `${bookingBasePoints.toLocaleString()} base x ${bookingMultiplier.toFixed(1)} multiplier`}
                            </p>
                          )}
                        </div>
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
                  <div className="shrink-0 text-right">
                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/34">Rewards</p>
                    <p className="mt-1 text-xl font-black leading-none text-[#fec708]">{bookingFinalPoints.toLocaleString()} <span className="text-[10px] text-white/44">pts</span></p>
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
      </AnimatePresence>
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
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.03, boxShadow: '0 12px 32px rgba(254,199,8,0.15)' }}
      whileTap={{ scale: 0.95 }}
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

function RewardsCarousel({
  verifiedPoints,
  pendingPoints,
  shouldReduceMotion,
  navigate,
  locationSearch,
}: {
  verifiedPoints: number;
  pendingPoints: number;
  shouldReduceMotion: boolean;
  navigate: ReturnType<typeof useNavigate>;
  locationSearch: string;
}) {
  const rewardsCarouselRef = useRef<HTMLDivElement>(null);
  const rewardSlideRefs = useRef<(HTMLElement | null)[]>([]);
  const { scrollXProgress: rewardsScrollProgress } = useScroll({ container: rewardsCarouselRef });
  const rewardsRailProgress = useSpring(rewardsScrollProgress, {
    stiffness: shouldReduceMotion ? 1000 : 180,
    damping: shouldReduceMotion ? 100 : 28,
    mass: 0.8,
  });

  const premiumEase = [0.22, 1, 0.36, 1] as const;
  const homePawMilestones = HOME_PAW_MILESTONES;
  const activeMilestoneIndex = homePawMilestones.findIndex((milestone) => verifiedPoints < milestone.points);
  const activeJourneyIndex = activeMilestoneIndex === -1 ? homePawMilestones.length - 1 : activeMilestoneIndex;
  const activeJourneyMilestone = homePawMilestones[activeJourneyIndex];
  const previousMilestonePoints = activeJourneyIndex > 0 ? homePawMilestones[activeJourneyIndex - 1].points : 0;
  const activeJourneyRange = Math.max(1, activeJourneyMilestone.points - previousMilestonePoints);
  const activeJourneyProgress = activeMilestoneIndex === -1
    ? 100
    : Math.min(100, Math.max(0, ((verifiedPoints - previousMilestonePoints) / activeJourneyRange) * 100));
  const pointsToActiveMilestone = Math.max(0, activeJourneyMilestone.points - verifiedPoints);
  const unlockedMilestoneCount = homePawMilestones.filter((milestone) => verifiedPoints >= milestone.points).length;
  const journeyProgressTotal = Math.min(100, ((unlockedMilestoneCount + activeJourneyProgress / 100) / homePawMilestones.length) * 100);
  const isNearNextTier = activeJourneyProgress >= 82 && activeJourneyProgress < 100;
  const isVeryNearNextTier = activeJourneyProgress >= 94 && activeJourneyProgress < 100;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: premiumEase }}
      className="pt-2 mobile-paw-points"
    >
      <div className="relative overflow-hidden rounded-[2.6rem] border border-[#fec708]/14 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025)_44%,rgba(254,199,8,0.045))] p-4 shadow-[0_26px_80px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl sm:p-5">
        <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[#fec708]/10 blur-[90px]" />
        <div className="pointer-events-none absolute -left-28 bottom-0 h-64 w-64 rounded-full bg-emerald-200/5 blur-[92px]" />
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#fff0b8]/38 to-transparent" />

        <div className="relative mb-4 flex items-start justify-between gap-4 px-1">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#fec708]/18 bg-[#fec708]/7 px-3 py-1.5">
              <PawPrint className="h-3.5 w-3.5 fill-[#fec708]/20 text-[#fec708]" />
              <span className="cinematic-kicker text-[10px] tracking-[0.2em] text-[#fec708]">Paw Points Program</span>
            </div>
            <h3 className="cinematic-section-title text-3xl leading-[1.02] tracking-[-0.035em]">One reward path</h3>
            <p className="mt-2 max-w-[18rem] text-[0.95rem] font-bold leading-6 text-white/62">
              {pointsToActiveMilestone > 0
                ? `${pointsToActiveMilestone.toLocaleString()} pts to ${activeJourneyMilestone.title}.`
                : 'All homepage rewards shown here are unlocked.'}
            </p>
          </div>
          <div className="shrink-0 rounded-3xl border border-white/10 bg-black/[0.18] px-4 py-3 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/48">Reached</p>
            <p className="mt-1 font-heading text-2xl font-black leading-none tabular-nums text-[#fec708]">
              {unlockedMilestoneCount}/{homePawMilestones.length}
            </p>
          </div>
        </div>

        <div className="relative mb-5 px-1">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white/62">
              Journey progress
            </span>
            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[#fec708]">
              milestone {Math.min(activeJourneyIndex + 1, homePawMilestones.length)} of {homePawMilestones.length}
            </span>
          </div>
          <div
            className="journey-progress-track relative h-3.5 overflow-hidden rounded-full border border-[#fec708]/18 bg-[#130f08] shadow-[inset_0_1px_8px_rgba(0,0,0,0.62),0_1px_0_rgba(254,199,8,0.12)]"
            role="progressbar"
            aria-label="Paw Points journey progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(journeyProgressTotal)}
          >
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(254,199,8,0.08),transparent_34%,rgba(255,255,255,0.04)_52%,transparent_72%)]" />
            <motion.div
              initial={false}
              animate={{ scaleX: journeyProgressTotal / 100 }}
              transition={{ duration: shouldReduceMotion ? 0 : 1.05, ease: premiumEase }}
              className="journey-progress-fill absolute inset-y-0 left-0 w-full origin-left overflow-hidden rounded-full bg-[linear-gradient(90deg,#fec708,#ffe28f_48%,#d89b00)] shadow-[0_0_22px_rgba(254,199,8,0.36)]"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-white/48" />
              {!shouldReduceMotion && journeyProgressTotal > 2 && journeyProgressTotal < 100 && (
                <motion.span
                  className="absolute inset-y-0 w-16 -skew-x-12 bg-white/22 blur-[1px]"
                  initial={{ x: '-140%', opacity: 0 }}
                  animate={{ x: '230%', opacity: [0, 0.72, 0] }}
                  transition={{ duration: 2.3, repeat: Infinity, repeatDelay: 4.2, ease: premiumEase }}
                />
              )}
            </motion.div>
            {journeyProgressTotal > 3 && (
              <motion.span
                className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-[#fff0b8]/70 bg-[#ffe28f] shadow-[0_0_18px_rgba(254,199,8,0.42)]"
                style={{ left: `calc(${journeyProgressTotal}% - 7px)` }}
                initial={{ opacity: 0, scale: 0.72 }}
                animate={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 1, scale: [1, 1.08, 1] }}
                transition={{ duration: shouldReduceMotion ? 0 : 2.8, repeat: shouldReduceMotion ? 0 : Infinity, ease: 'easeInOut' }}
              />
            )}
            <div className="absolute inset-x-0 top-0 h-px bg-white/18" />
          </div>
          <div className="mt-3 grid" style={{ gridTemplateColumns: `repeat(${homePawMilestones.length}, minmax(0, 1fr))` }}>
            {homePawMilestones.map((milestone, index) => {
              const tickUnlocked = verifiedPoints >= milestone.points;
              const tickCurrent = index === activeJourneyIndex;
              return (
                <button
                  key={milestone.title}
                  type="button"
                  onClick={() => {
                    rewardSlideRefs.current[index + 1]?.scrollIntoView({
                      behavior: shouldReduceMotion ? 'auto' : 'smooth',
                      inline: 'center',
                      block: 'nearest',
                    });
                  }}
                  className="group flex min-h-9 flex-col items-center justify-start gap-1"
                  aria-label={`View ${milestone.title}`}
                >
                  <motion.span
                    animate={tickCurrent && !shouldReduceMotion ? {
                      scale: [1, 1.16, 1],
                      boxShadow: ['0 0 12px rgba(254,199,8,0.30)', '0 0 22px rgba(254,199,8,0.46)', '0 0 12px rgba(254,199,8,0.30)'],
                    } : undefined}
                    transition={{ duration: 2.8, repeat: tickCurrent && !shouldReduceMotion ? Infinity : 0, ease: 'easeInOut' }}
                    className={cn(
                      "h-2.5 w-2.5 rounded-full border transition-all duration-300",
                      tickCurrent
                        ? "border-[#fec708] bg-[#fec708] shadow-[0_0_18px_rgba(254,199,8,0.42)]"
                        : tickUnlocked
                          ? "border-[#fec708]/40 bg-[#fec708]/55"
                          : "border-white/14 bg-white/[0.08] group-hover:border-white/28"
                    )} />
                  <span className={cn(
                    "block text-[8px] font-black uppercase tracking-[0.08em] sm:text-[10px] sm:tracking-[0.14em]",
                    tickCurrent ? "text-[#fec708]" : tickUnlocked ? "text-white/42" : "text-white/24"
                  )}>
                    {milestone.points >= 1000 ? `${milestone.points / 1000}k` : milestone.points}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div ref={rewardsCarouselRef} className="relative -mx-4 overflow-x-auto px-4 pb-2 hide-scrollbar [scroll-snap-type:x_mandatory] sm:-mx-5 sm:px-5">
          <div className="flex gap-4">
            <motion.article
              ref={(node) => { rewardSlideRefs.current[0] = node; }}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: premiumEase }}
              className="relative min-h-[248px] w-[84vw] max-w-[360px] shrink-0 overflow-hidden rounded-[2.1rem] border border-[#fec708]/18 bg-[linear-gradient(150deg,rgba(254,199,8,0.10),rgba(255,255,255,0.055)_42%,rgba(255,255,255,0.025))] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.09)] backdrop-blur-xl [scroll-snap-align:start] sm:w-[322px]"
            >
              <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#fec708]/12 blur-[70px]" />
              <div className="relative flex h-full flex-col">
                <div className="mb-5">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#fec708]">Current balance</p>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="cinematic-price text-[3.75rem] tabular-nums text-[#fec708]">{verifiedPoints.toLocaleString()}</span>
                      <span className="pb-2 text-xs font-black uppercase tracking-[0.2em] text-[#fec708]/60">pts</span>
                    </div>
                    {pendingPoints > 0 && (
                      <p className="mt-2 inline-flex rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white/64">
                        +{pendingPoints.toLocaleString()} pending clinic verification
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/52">Next unlock</p>
                      <h4 className="cinematic-card-title mt-1 text-2xl text-white">{activeJourneyMilestone.title}</h4>
                    </div>
                    <span className="shrink-0 text-[11px] font-black uppercase tracking-[0.16em] text-[#fec708]">
                      {Math.round(activeJourneyProgress)}%
                    </span>
                  </div>
                  <div
                    className="journey-progress-track relative h-3 overflow-hidden rounded-full border border-[#fec708]/14 bg-[#130f08] shadow-[inset_0_1px_7px_rgba(0,0,0,0.58),0_1px_0_rgba(254,199,8,0.08)]"
                    role="progressbar"
                    aria-label={`${activeJourneyMilestone.title} progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(activeJourneyProgress)}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(254,199,8,0.07),transparent_36%,rgba(255,255,255,0.035)_55%,transparent_78%)]" />
                    <motion.div
                      initial={false}
                      animate={{
                        scaleX: activeJourneyProgress / 100,
                        ...(isNearNextTier && !shouldReduceMotion ? { boxShadow: ['0 0 14px rgba(254,199,8,0.18)', '0 0 28px rgba(254,199,8,0.34)', '0 0 14px rgba(254,199,8,0.18)'] } : {})
                      }}
                      transition={{
                        scaleX: { duration: shouldReduceMotion ? 0 : 0.95, ease: premiumEase },
                        boxShadow: { duration: 3.2, repeat: isNearNextTier && !shouldReduceMotion ? Infinity : 0, ease: 'easeInOut' },
                      }}
                      className={cn("absolute inset-y-0 left-0 w-full origin-left overflow-hidden rounded-full bg-gradient-to-r shadow-[0_0_18px_rgba(254,199,8,0.23)]", activeJourneyMilestone.fill)}
                    >
                      <div className="absolute inset-x-0 top-0 h-px bg-white/46" />
                      {!shouldReduceMotion && activeJourneyProgress > 3 && activeJourneyProgress < 100 && (
                        <motion.span
                          className="absolute inset-y-0 w-14 -skew-x-12 bg-white/20 blur-[1px]"
                          initial={{ x: '-135%', opacity: 0 }}
                          animate={{ x: '220%', opacity: [0, 0.7, 0] }}
                          transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 4, ease: premiumEase }}
                        />
                      )}
                    </motion.div>
                    {activeJourneyProgress > 4 && (
                      <motion.span
                        className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border border-white/60 bg-[#fff0b8] shadow-[0_0_18px_rgba(254,199,8,0.42)]"
                        style={{ left: `calc(${activeJourneyProgress}% - 7px)` }}
                        initial={{ opacity: 0, scale: 0.72 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        animate={isNearNextTier && !shouldReduceMotion ? { boxShadow: ['0 0 14px rgba(254,199,8,0.30)', '0 0 24px rgba(254,199,8,0.48)', '0 0 14px rgba(254,199,8,0.30)'] } : undefined}
                        transition={{
                          opacity: { duration: shouldReduceMotion ? 0 : 0.38, delay: shouldReduceMotion ? 0 : 0.68, ease: premiumEase },
                          scale: { duration: shouldReduceMotion ? 0 : 0.38, delay: shouldReduceMotion ? 0 : 0.68, ease: premiumEase },
                          boxShadow: { duration: 2.8, repeat: isNearNextTier && !shouldReduceMotion ? Infinity : 0, ease: 'easeInOut' },
                        }}
                      />
                    )}
                    <div className="absolute inset-x-0 top-0 h-px bg-white/18" />
                    {isVeryNearNextTier && !shouldReduceMotion && (
                      <motion.span
                        className="absolute inset-y-0 w-12 rounded-full bg-white/12 blur-sm"
                        initial={{ x: '-120%' }}
                        animate={{ x: '260%' }}
                        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3.5, ease: premiumEase }}
                      />
                    )}
                  </div>
                  <p className={cn("mt-3 text-[0.95rem] font-bold leading-6", isNearNextTier ? "text-[#fec708]" : "text-white/62")}>
                    {pointsToActiveMilestone > 0 ? `${pointsToActiveMilestone.toLocaleString()} pts left. ${isNearNextTier ? 'Almost there.' : activeJourneyMilestone.note}` : 'Ready to claim your unlocked rewards.'}
                  </p>
                  <button
                    onClick={() => navigate({ pathname: '/rewards', search: locationSearch })}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#fec708]/24 bg-[#fec708]/10 px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-[#fec708] transition-colors duration-300 hover:border-[#fec708]/38 hover:bg-[#fec708]/14"
                  >
                    View Rewards Hub
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.article>

            {homePawMilestones.map((milestone, index) => {
              const isUnlocked = verifiedPoints >= milestone.points;
              const isCurrent = index === activeJourneyIndex;
              const isLocked = !isUnlocked;
              const isNearCard = isCurrent && isNearNextTier;
              const cardProgress = isUnlocked
                ? 100
                : isCurrent
                  ? activeJourneyProgress
                  : Math.min(100, Math.max(0, (verifiedPoints / milestone.points) * 100));
              const MilestoneIcon = milestone.icon;

              return (
                <motion.article
                  key={milestone.title}
                  ref={(node) => { rewardSlideRefs.current[index + 1] = node; }}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: shouldReduceMotion ? 0 : index * 0.035, ease: premiumEase }}
                  whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.012, transition: { type: 'spring', stiffness: 260, damping: 30, mass: 0.85 } }}
                  whileTap={{ scale: 0.985 }}
                  className={cn(
                    "relative min-h-[248px] w-[84vw] max-w-[360px] shrink-0 overflow-hidden rounded-[2.1rem] border p-5 shadow-[0_18px_55px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl [scroll-snap-align:start] sm:w-[322px]",
                    isCurrent
                      ? "border-[#fec708]/34 bg-[linear-gradient(150deg,rgba(254,199,8,0.09),rgba(255,255,255,0.055)_45%,rgba(255,255,255,0.025))]"
                      : isUnlocked
                        ? "border-white/12 bg-[linear-gradient(150deg,rgba(255,255,255,0.07),rgba(255,255,255,0.028))]"
                        : "border-white/9 bg-[linear-gradient(150deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))]"
                  )}
                >
                  <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", milestone.surface, isCurrent ? "opacity-[0.82]" : isUnlocked ? "opacity-[0.46]" : "opacity-[0.26] saturate-50")} />
                  <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />

                  <div className="relative flex h-full flex-col">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <motion.div
                        animate={isNearCard && !shouldReduceMotion ? { scale: [1, 1.035, 1] } : undefined}
                        transition={{ duration: 2.8, repeat: isNearCard && !shouldReduceMotion ? Infinity : 0, ease: [0.45, 0, 0.2, 1] }}
                        className={cn(
                          "grid h-14 w-14 place-items-center rounded-2xl border transition-colors duration-500",
                          isUnlocked || isCurrent ? cn(milestone.ring, milestone.glow) : "border-white/10 bg-white/[0.035] text-white/32"
                        )}
                      >
                        <MilestoneIcon className="h-7 w-7" strokeWidth={2.35} />
                      </motion.div>

                      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/[0.16] px-3 py-1.5 backdrop-blur-md">
                        {isUnlocked ? <Check className="h-3.5 w-3.5 text-[#fec708]" /> : <Lock className="h-3.5 w-3.5 text-white/38" />}
                        <span className={cn("text-[10px] font-black uppercase tracking-[0.16em]", isUnlocked ? "text-[#fec708]" : isCurrent ? "text-white/72" : "text-white/42")}>
                          {isUnlocked ? 'Unlocked' : isCurrent ? (isNearCard ? 'Almost' : 'Next') : 'Upcoming'}
                        </span>
                      </div>
                    </div>

                    <div className="min-h-[6.8rem]">
                      {milestone.hero ? (
                        <div className="mb-3 flex items-end gap-3">
                          <span className={cn("font-heading text-[3.2rem] font-black leading-none tracking-[-0.08em]", isLocked && !isCurrent ? "text-white/38" : "text-[#fec708]")}>{milestone.hero}</span>
                          <span className="pb-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-white/52">rebate</span>
                        </div>
                      ) : null}
                      <p className={cn("text-[11px] font-black uppercase tracking-[0.16em]", isCurrent ? "text-[#fec708]" : "text-white/46")}>{milestone.badge}</p>
                      <h4 className={cn("cinematic-card-title mt-2 text-[1.38rem] leading-[1.06]", isLocked && !isCurrent ? "text-white/62" : "text-white")}>{milestone.title}</h4>
                      <p className={cn("mt-2 text-[0.95rem] font-bold leading-6", isLocked && !isCurrent ? "text-white/46" : "text-white/66")}>{milestone.subtitle}</p>
                      <p className={cn("mt-3 text-[0.82rem] font-semibold leading-relaxed", isLocked && !isCurrent ? "text-white/38" : "text-white/54")}>{milestone.detail}</p>
                    </div>

                    <div className="mt-auto pt-5">
                      <div className="mb-2 flex items-end justify-between gap-3">
                        <span className={cn("font-heading text-2xl font-black leading-none tabular-nums tracking-[-0.055em]", isLocked && !isCurrent ? "text-white/34" : "text-[#fec708]")}>{milestone.points.toLocaleString()}</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/44">PTS</span>
                      </div>
                      <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                        <motion.div
                          initial={{ scaleX: 0 }}
                          whileInView={{ scaleX: cardProgress / 100 }}
                          viewport={{ once: true }}
                          transition={{ duration: shouldReduceMotion ? 0 : 0.75, delay: shouldReduceMotion ? 0 : index * 0.035, ease: premiumEase }}
                          className={cn("absolute inset-y-0 left-0 w-full origin-left rounded-full bg-gradient-to-r", isLocked && !isCurrent ? "from-white/22 to-white/10" : milestone.fill)}
                        />
                        {isNearCard && !shouldReduceMotion && (
                          <motion.span
                            className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[#fec708] shadow-[0_0_18px_rgba(254,199,8,0.52)]"
                            animate={{ opacity: [0.72, 1, 0.72], scale: [0.9, 1.08, 0.9] }}
                            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>

        <div className="relative mt-3 px-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-[#130f08] shadow-[inset_0_1px_5px_rgba(0,0,0,0.55)]">
            <motion.div style={{ scaleX: rewardsRailProgress }} className="h-full origin-left rounded-full bg-[#fec708]/80 shadow-[0_0_14px_rgba(254,199,8,0.34)]" />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
