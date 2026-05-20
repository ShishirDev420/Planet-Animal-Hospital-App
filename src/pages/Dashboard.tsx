import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useMotionTemplate, animate, useScroll, useSpring } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  QrCode, Calendar, FileText, Award, ChevronRight, Gift, X, Dog, 
  CheckCircle2, Syringe, Sparkles, Stethoscope, ChevronDown, ChevronUp, LogOut, Info, PawPrint, Clock, Lock, Settings, Bot, Map, Check, Scissors, Ear, ChevronLeft, ArrowRight, Plus, TrendingUp, Star, Zap, Trophy
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
  const isDemoMode = window.location.search.includes('demo_mode=true');
  const { profile: realPetProfile, loading: realProfileLoading } = usePetProfile();
  
  const petProfile = useMemo(() => realPetProfile, [realPetProfile]);
  
  const profileLoading = useMemo(() => isDemoMode ? false : realProfileLoading, [isDemoMode, realProfileLoading]);

  const { message: pawlMessage, loading: pawlLoading, error: pawlError } = usePawlMessage();
  const { currentPeriod } = useTimeOfDay();
  const { completedCount, totalPeriods, isPeriodComplete } = useCheckInStatus(
    realPetProfile?.uid || realPetProfile?.parentName || 'demo',
    currentPeriod
  );
  const [isAuthReady, setIsAuthReady] = useState(isDemoMode);
  const [userId, setUserId] = useState<string | null>(isDemoMode ? 'demo-user' : null);
  const navigate = useNavigate();
  const location = useLocation();
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
            const data = docSnap.data();
            setVerifiedPoints(data.pawPoints || 0);
            setCurrentPlan(data.currentPlan || data.petProfile?.currentPlan || 'free');
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
  }, [isDemoMode]);

  const handleBookingRequest = async (serviceName: string, pointsValue: number, incentiveId: string) => {
    if (!userId) return;
    
    const finalPoints = calculateBookingPoints([{ id: 0, name: serviceName, points: pointsValue }], currentPlan);

    // Optimistic UI updates
    setPendingIncentives(prev => [...prev, incentiveId]);
    setPendingPoints(prev => prev + finalPoints);
    
    try {
      const user = auth.currentUser || (window.location.search.includes('demo_mode=true') ? { uid: 'demo-user', email: 'demo@planetanimal.com', displayName: 'Demo Parent' } : null);
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
  const [isConnecting, setIsConnecting] = useState(false);

  const BOOKING_SERVICES = [
    { id: 1, name: 'General Checkup', points: 1000, icon: Stethoscope, desc: 'Full health assessment' },
    { id: 2, name: 'Full Grooming', points: 800, icon: Sparkles, desc: 'Bath, trim & nail care' },
    { id: 3, name: 'Vaccinations', points: 750, icon: Syringe, desc: 'Core & booster shots' },
    { id: 4, name: 'Ear Cleaning', points: 200, icon: Ear, desc: 'Deep clean & inspection' },
    { id: 5, name: 'Haircut', points: 200, icon: Scissors, desc: 'Breed-specific styling' }
  ];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('openBooking') !== 'true') return;

    setIsBookVisitOpen(true);

    const serviceQuery = params.get('service')?.toLowerCase();
    if (serviceQuery) {
      const suggestedService = BOOKING_SERVICES.find((service) => service.name.toLowerCase().includes(serviceQuery));
      if (suggestedService) setSelectedServices([suggestedService]);
    }

    const date = params.get('date');
    const time = params.get('time');
    if (date) setBookingDate(date);
    if (time) setBookingTime(time);
  }, [location.search]);

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
    if (selectedServices.length === 0 || !bookingDate || !bookingTime || !userId) return;

    const finalPoints = calculateBookingPoints(selectedServices, currentPlan);
    const serviceNames = selectedServices.map(s => s.name).join(', ');

    try {
      await addDoc(collection(db, 'requests'), {
        userId: auth.currentUser?.uid || userId,
        patient: petProfile?.name || 'Pet',
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
  const bookingBasePoints = selectedServices.reduce((acc, service) => acc + service.points, 0);
  const bookingFinalPoints = calculateBookingPoints(selectedServices, currentPlan);
  const bookingMultiplier = getMultiplier(currentPlan);
  const briefingPreview = getBriefingPreview(pawlMessage, pawlLoading, petName);
  const whatsappMessage = buildWhatsAppMessage(parentName, petName, selectedServices.map(s => s.name), bookingDate, bookingTime);
  const whatsappUrl = `https://wa.me/919004290923?text=${encodeURIComponent(whatsappMessage)}`;

  if (profileLoading || !isAuthReady) {
    return (
      <PlanetOrbLoader
        label="Planet Animal Hospital"
        detail="Loading the main care dashboard"
        className="h-full pb-32"
      />
    );
  }

  return (
    <>
    <div className="relative w-full h-full">
      {/* Background Ambient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex justify-center isolate">
        <div className="relative w-full max-w-5xl h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-planet-yellow/40 rounded-full blur-3xl opacity-60 animate-blob transform-gpu"></div>
          <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-teal-300/40 rounded-full blur-3xl opacity-60 animate-blob animation-delay-2000 transform-gpu"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-amber-200/40 rounded-full blur-3xl opacity-60 animate-blob animation-delay-4000 transform-gpu"></div>
        </div>
      </div>

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
        className="group relative mb-7 min-h-[112px] cursor-pointer overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-black/72 via-black/60 to-black/46 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl transition-all duration-300 hover:border-[#fec708]/25 hover:from-black/78 hover:to-black/52 mobile-briefing-card"
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

      {/* Points Wallet - Typographic Layout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ease: "easeOut", duration: 0.5 }}
        className="mt-8 mb-4 relative mobile-paw-points"
      >
        {/* Asymmetric Floating Layout */}
        <div className="flex flex-col items-start gap-1 pt-4 points-section">
          <style>{`
            @keyframes pulsate-synchronized-glow {
              0%, 100% { filter: drop-shadow(0 0 15px rgba(254,199,8,0.7)); opacity: 1; }
              33% { filter: drop-shadow(0 0 25px rgba(254,199,8,0.9)); opacity: 0.8; }
              66% { filter: drop-shadow(0 0 10px rgba(254,199,8,0.5)); opacity: 0.9; }
            }
            .animate-pulsate-synchronized-glow {
              animation: pulsate-synchronized-glow 7s infinite ease-in-out;
            }
          `}</style>
          <h2 className="cinematic-kicker text-[10px] text-white/50">Paw Points Balance</h2>
          <div className="flex items-baseline gap-2">
              <span className="cinematic-price text-6xl tabular-nums text-[#fec708] animate-pulsate-synchronized-glow points-number">{verifiedPoints.toLocaleString()}</span>
            <span className="font-heading text-[#fec708] font-black uppercase tracking-widest text-sm mb-2 drop-shadow-[0_0_10px_rgba(254,199,8,0.6)]">pts</span>
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

          <div className="mt-8 w-full progress-section">
            <div className="flex items-center justify-between mb-2 progress-label-row">
              <p className="text-[10px] text-white/60 font-medium uppercase tracking-widest">
                {Math.max(0, 5000 - verifiedPoints).toLocaleString()} PTS TO LIFE-MAXING
              </p>
              <p className="text-[10px] text-[#fec708] font-black uppercase tracking-widest">
                ₹{(verifiedPoints * 0.25).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="relative h-2 w-full bg-slate-900/50 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm mb-3 progress-bar-container">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (verifiedPoints / 5000) * 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="h-full bg-gradient-to-r from-planet-yellow to-yellow-300 shadow-[0_0_15px_rgba(254,199,8,0.7)] animate-pulsate-synchronized-glow rounded-full"
              />
            </div>
            {/* Premium Nudge — TAP FOR REWARD DETAILS */}
            <motion.button
              onClick={() => {
                navigate({ pathname: '/rewards', search: location.search });
                setTimeout(() => {
                  document.getElementById('roadmap-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="group relative flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl overflow-hidden border border-[#fec708]/30 bg-[#fec708]/5 hover:bg-[#fec708]/10 transition-all duration-300 reward-btn"
              style={{ boxShadow: '0 0 20px rgba(254,199,8,0.15), inset 0 1px 0 rgba(255,255,255,0.05)' }}
            >
              <motion.div
                className="absolute inset-0 rounded-2xl bg-[#fec708]/8 pointer-events-none"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.span animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
                <Sparkles className="w-3 h-3 text-[#fec708]" />
              </motion.span>
              <span className="relative text-[10px] font-black uppercase tracking-[0.2em] text-[#fec708]">
                TAP FOR REWARD DETAILS
              </span>
              <motion.span animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
                <ChevronRight className="w-3.5 h-3.5 text-[#fec708] group-hover:translate-x-0.5 transition-transform" />
              </motion.span>
            </motion.button>
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

{/* Paw Points Program */}
       <div className="pt-2">
         <div className="flex items-center gap-2 mb-6 px-2">
            <h3 className="cinematic-card-title text-xl drop-shadow-sm">Paw Points Program</h3>
           <PawPrint className="w-5 h-5 text-[#fec708] fill-[#fec708]/20" />
         </div>
         
         {/* Tier Progress Bar */}
         <div className="glass-card bg-white/5 dark:bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 mb-8">
           <div className="flex items-center justify-between mb-4">
             <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Current Tier</span>
             <span className="text-xs font-bold text-white/40">{verifiedPoints.toLocaleString()} / 5,000 PTS</span>
           </div>
           
           {/* Tier Indicators */}
           <div className="flex items-center justify-between mb-3 px-2">
             {['Bronze', 'Silver', 'Gold', 'Platinum', 'Founder'].map((tier, idx) => {
               const tierThresholds = [500, 1500, 3000, 5000, 100000];
               const isActive = verifiedPoints >= tierThresholds[idx];
               const isCurrent = verifiedPoints >= tierThresholds[idx] && (idx === tierThresholds.length - 1 || verifiedPoints < tierThresholds[idx + 1]);
               
               return (
                 <div key={tier} className="flex flex-col items-center gap-1">
                   <div className={cn(
                     "w-3 h-3 rounded-full transition-all duration-500",
                     isCurrent ? "bg-[#fec708] shadow-[0_0_20px_rgba(254,199,8,0.6)] animate-pulse" : 
                     isActive ? "bg-[#fec708]/60" : "bg-white/20"
                   )} />
                   <span className={cn(
                     "text-[9px] font-bold uppercase tracking-wider",
                     isCurrent ? "text-[#fec708]" : isActive ? "text-white/60" : "text-white/30"
                   )}>
                     {tier}
                   </span>
                 </div>
               );
             })}
           </div>
           
           {/* Progress Bar */}
           <div className="h-2 w-full bg-slate-900/50 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${Math.min(100, (verifiedPoints / 5000) * 100)}%` }}
               transition={{ duration: 0.8, ease: "easeOut" }}
               className="h-full bg-gradient-to-r from-[#fec708] to-amber-300 rounded-full shadow-[0_0_15px_rgba(254,199,8,0.5)]"
             />
           </div>
           
           {/* View My Journey Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                navigate({ pathname: '/rewards', search: location.search });
                setTimeout(() => {
                  document.getElementById('roadmap-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="mt-5 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 font-bold text-xs uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
            >
             View My Journey
             <ChevronDown className="w-4 h-4" />
           </motion.button>
         </div>

         {/* Milestone Grid — synced with Rewards roadmap */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {[
             { points: 500,   title: 'Health Starter',         subtitle: 'Program entry reward', icon: <TrendingUp className="w-5 h-5" />, unlocked: verifiedPoints >= 500 },
             { points: 1500,  title: '15% Bill Rebate',         subtitle: 'Instant discount unlock', icon: <Star className="w-5 h-5" />, unlocked: verifiedPoints >= 1500 },
             { points: 2500,  title: '20% Bill Rebate',         subtitle: 'Deep savings tier', icon: <Zap className="w-5 h-5" />, unlocked: verifiedPoints >= 2500 },
             { points: 5000,  title: 'Life-Maxing Consultation', subtitle: 'Breed-specific longevity plan', icon: <Award className="w-5 h-5" />, unlocked: verifiedPoints >= 5000 },
             { points: 7500,  title: 'Premium Spa & Therapy',   subtitle: 'Full grooming & medicated baths', icon: <Sparkles className="w-5 h-5" />, unlocked: verifiedPoints >= 7500 },
             { points: 10000, title: 'Full Hematology Panel',   subtitle: 'Comprehensive blood examination', icon: <Trophy className="w-5 h-5" />, unlocked: verifiedPoints >= 10000 },
           ].map((milestone) => (
             <motion.div
               key={milestone.title}
               whileHover={{ y: -2 }}
               className={cn(
                 "relative rounded-[1.5rem] p-5 flex items-center gap-4 transition-all duration-500 overflow-hidden",
                 milestone.unlocked 
                   ? "bg-gradient-to-br from-[#fec708]/20 to-amber-500/10 border border-[#fec708]/40 shadow-[0_0_30px_rgba(254,199,8,0.2)]" 
                   : "bg-white/5 border border-white/10 opacity-60"
               )}
             >
               {milestone.unlocked && (
                 <div className="absolute inset-0 overflow-hidden pointer-events-none">
                   <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#fec708]/30 rounded-full blur-3xl animate-pulse" />
                 </div>
               )}
               
               <div className={cn(
                 "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 shrink-0",
                 milestone.unlocked 
                   ? "bg-gradient-to-br from-[#fec708] to-amber-500 text-black shadow-[0_0_20px_rgba(254,199,8,0.4)]" 
                   : "bg-white/10 text-white/30 border border-white/10"
               )}>
                 {milestone.icon}
               </div>
               
               <div className="flex-1 min-w-0">
                 <h4 className={cn(
                   "font-bold text-sm tracking-tight leading-tight",
                   milestone.unlocked ? "text-white" : "text-white/50"
                 )}>{milestone.title}</h4>
                 <p className="text-[10px] text-white/35 font-medium mt-0.5">{milestone.subtitle}</p>
                 <p className="text-[10px] text-white/25 font-medium">{milestone.points.toLocaleString()} PTS</p>
               </div>
               
               {milestone.unlocked ? (
                 <Check className="w-5 h-5 text-[#fec708] shrink-0" />
               ) : (
                 <Lock className="w-5 h-5 text-white/30 shrink-0" />
               )}
             </motion.div>
           ))}
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

      {/* Book Visit Master Modal (Classy & Glassy Overhaul) */}
      <AnimatePresence>
        {isBookVisitOpen && (
          <motion.div
            key="book-visit-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsBookVisitOpen(false)}
            className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 pb-24 sm:p-4 sm:pb-4"
          >
            <motion.div
              key="book-visit-modal"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                // Subtle tilt effect for premium feel
                e.currentTarget.style.transform = `perspective(1200px) rotateX(${-y / 80}deg) rotateY(${x / 80}deg)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg)`;
              }}
              style={{ perspective: '1200px', transition: 'transform 0.2s ease-out' }}
              className="relative w-full max-w-2xl liquid-glass-modal rounded-t-[2.5rem] sm:rounded-[3rem] h-[calc(100dvh-6.75rem)] sm:h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Premium Glass Highlights */}
              <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[50%] bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              <div className="absolute top-0 left-1/4 w-32 h-32 bg-planet-yellow/20 rounded-full blur-[80px] pointer-events-none" />

              {/* Drag Handle (mobile) */}
              <div className="flex justify-center pt-4 pb-2 sm:hidden shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="px-8 pt-6 pb-4 flex justify-between items-start shrink-0 z-10">
                <div>
                  <h2 className="cinematic-section-title text-3xl">
                    Book <span className="text-planet-yellow">Visit</span>
                  </h2>
                  <p className="cinematic-kicker mt-2 flex items-center gap-2 text-xs text-white/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-planet-yellow shadow-[0_0_8px_rgba(254,199,8,0.6)] animate-pulse" />
                    {petProfile?.name ? `Schedule for ${petProfile.name}` : 'Pet Health Scheduler'}
                  </p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }} 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsBookVisitOpen(false)} 
                  className="p-2.5 rounded-[1.25rem] bg-white/10 border border-white/20 text-white/60 hover:text-white transition-all shadow-xl backdrop-blur-md"
                >
                  <X size={20}/>
                </motion.button>
              </div>

              {/* Progress Stepper - Refined */}
              <div className="px-10 pb-6 flex items-center justify-between shrink-0 z-10">
                {[
                  { n: 1, label: 'Service', done: selectedServices.length > 0 },
                  { n: 2, label: 'Date', done: !!bookingDate },
                  { n: 3, label: 'Time', done: !!bookingTime },
                ].map((step, i) => (
                  <div key={step.n} className="flex flex-col items-center gap-2 flex-1 relative">
                    {i < 2 && (
                      <div className="absolute left-[calc(50%+16px)] right-[calc(-50%+16px)] top-[12px] h-[2px] bg-white/10 overflow-hidden">
                         <motion.div 
                          initial={{ x: '-100%' }}
                          animate={{ x: step.done ? '0%' : '-100%' }}
                          className="h-full bg-planet-yellow/50"
                         />
                      </div>
                    )}
                      <motion.div 
                      animate={{ 
                        backgroundColor: step.done ? '#fec708' : 'transparent',
                        borderColor: step.done ? '#fec708' : 'rgba(255,255,255,0.2)',
                        boxShadow: step.done ? '0 0 15px rgba(254,199,8,0.4)' : 'none'
                      }}
                      className="w-7 h-7 rounded-full flex items-center justify-center border z-10 transition-colors"
                    >
                      {step.done ? <Check size={14} className="text-black" strokeWidth={4} /> : <div className="w-1.5 h-1.5 rounded-full bg-white/40" />}
                    </motion.div>
                    <span className={`text-sm font-black uppercase tracking-widest ${step.done ? 'text-planet-yellow' : 'text-white/40'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Scrollable Body */}
              <div className="min-h-0 flex-1 overflow-y-auto px-5 sm:px-8 pb-6 sm:pb-8 hide-scrollbar scroll-smooth">
                
                {/* 1. Services Section */}
                <section id="services-section" className="mb-10">
                  <div className="flex justify-between items-end mb-4 px-1">
                    <h3 className="cinematic-kicker text-xs text-white/50">Select Services</h3>
                    {selectedServices.length > 0 && (
                      <button 
                        onClick={() => setSelectedServices([])} 
                        className="text-sm font-bold text-planet-yellow/60 hover:text-planet-yellow transition-colors uppercase tracking-widest"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {BOOKING_SERVICES.map((service) => {
                      const isSelected = selectedServices.some(s => s.id === service.id);
                      const ServiceIcon = service.icon;
                      return (
                        <motion.button 
                          key={service.id}
                          whileHover={{ scale: 1.01, x: 4 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => {
                            setSelectedServices(prev => 
                              prev.some(s => s.id === service.id)
                                ? prev.filter(s => s.id !== service.id)
                                : [...prev, service]
                            );
                          }}
                          className={cn(
                            "relative w-full text-left rounded-[2rem] p-4 flex items-center gap-4 border transition-all duration-300",
                            isSelected 
                              ? 'bg-planet-yellow/20 border-planet-yellow shadow-[0_10px_30px_rgba(254,199,8,0.2)]' 
                              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30'
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all duration-500",
                            isSelected 
                              ? 'bg-planet-yellow text-black shadow-[0_0_20px_rgba(254,199,8,0.4)]' 
                              : 'bg-white/10 text-white/50'
                          )}>
                            <ServiceIcon size={24} />
                          </div>
  
                          <div className="flex-1">
                            <p className={cn("cinematic-card-title text-xl", isSelected ? 'text-white' : 'text-white/90')}>{service.name}</p>
                            <p className="text-white/50 text-sm font-medium mt-0.5 leading-tight">{service.desc}</p>
                          </div>
  
                          <div className="text-right">
                            <div className={cn("flex items-center gap-1 mb-1 justify-end", isSelected ? 'text-planet-yellow' : 'text-white/30')}>
                               <PawPrint size={12} className={isSelected ? 'fill-planet-yellow' : ''} />
                               <span className="text-base font-black">+{service.points}</span>
                            </div>
                            <div className={cn(
                              "w-6 h-6 rounded-full border-2 ml-auto flex items-center justify-center transition-all duration-300",
                              isSelected ? 'border-planet-yellow bg-planet-yellow' : 'border-white/10'
                            )}>
                              {isSelected && <Check size={14} className="text-black" strokeWidth={4} />}
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>
 
                {/* 2. Calendar Section */}
                <section id="date-section" className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-[1rem] bg-planet-yellow flex items-center justify-center text-black font-black text-sm">2</div>
                    <h3 className="cinematic-card-title text-2xl">Preferred Date</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((offset) => {
                      const date = new Date();
                      date.setDate(date.getDate() + offset);
                      const isToday = offset === 0;
                      const dateStr = date.toISOString().split('T')[0];
                      const isSelected = bookingDate === dateStr;
                      
                      return (
                        <motion.button
                          key={offset}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setBookingDate(dateStr)}
                          className={cn(
                            "flex flex-col items-center justify-center py-4 rounded-[1.25rem] border transition-all duration-300",
                            isSelected
                              ? 'bg-planet-yellow text-black border-planet-yellow shadow-lg'
                              : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30 hover:bg-white/10'
                          )}
                        >
                          <span className="text-sm font-black uppercase tracking-widest opacity-60 mb-1">
                            {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                          <span className="text-xl font-black">{date.getDate()}</span>
                          <span className="text-xs font-bold uppercase tracking-tighter opacity-40">
                            {date.toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </section>

                {/* 3. Time Selection */}
                <section id="time-section" className="pb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-[1rem] bg-planet-yellow flex items-center justify-center text-black font-black text-sm">3</div>
                    <h3 className="cinematic-card-title text-2xl">Preferred Time</h3>
                  </div>
                  <div className="space-y-6">
                    {[
                      { label: 'Morning', icon: <Clock size={14}/>, slots: ['9:00 AM', '10:00 AM', '11:00 AM'] },
                      { label: 'Afternoon', icon: <Sparkles size={14}/>, slots: ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'] },
                      { label: 'Evening', icon: <PawPrint size={14}/>, slots: ['6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'] },
                    ].map((group) => (
                      <div key={group.label}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="text-planet-yellow/60">
                            {group.icon}
                          </div>
                          <span className="text-xs font-black uppercase tracking-[0.15em] text-white/40">{group.label}</span>
                          <div className="h-px flex-1 bg-white/10 ml-2" />
                        </div>
                        <div className="grid grid-cols-3 gap-2.5">
                          {group.slots.map((time) => {
                            const isSelected = bookingTime === time;
                            return (
                              <motion.button
                                key={time}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setBookingTime(time)}
                                className={cn(
                                  "py-3.5 rounded-2xl text-base font-black transition-all border",
                                  isSelected
                                    ? 'bg-planet-yellow text-black border-planet-yellow shadow-[0_10px_20px_rgba(254,199,8,0.2)]'
                                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30 hover:bg-white/10'
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
                </section>
              </div>

              {/* Confirmation Footer - Premium & Always Visible */}
              <div className="shrink-0 bg-white/[0.08] backdrop-blur-[40px] border-t border-white/10 px-5 sm:px-8 py-4 sm:py-7 z-20 shadow-[0_-30px_60px_rgba(0,0,0,0.4)]">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <a
                    href={(selectedServices.length === 0 || !bookingDate || !bookingTime) ? undefined : whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (selectedServices.length === 0 || !bookingDate || !bookingTime) {
                        e.preventDefault();
                        if (selectedServices.length === 0) {
                          document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
                        } else if (!bookingDate) {
                          document.getElementById('date-section')?.scrollIntoView({ behavior: 'smooth' });
                        } else if (!bookingTime) {
                          document.getElementById('time-section')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      } else {
                        submitBooking();
                      }
                    }}
                    className={cn(
                      "flex items-center justify-center gap-3 w-full py-4 sm:py-5 rounded-[1.25rem] font-black text-lg uppercase tracking-[0.04em] sm:tracking-[0.2em] transition-all duration-500 relative overflow-hidden group",
                      (selectedServices.length === 0 || !bookingDate || !bookingTime)
                        ? "bg-white/[0.14] text-white/90 border border-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] hover:bg-white/[0.18]"
                        : "bg-planet-yellow text-black ring-1 ring-planet-yellow/40 shadow-[0_0_36px_rgba(254,199,8,0.38)] hover:shadow-[0_0_48px_rgba(254,199,8,0.55)] active:scale-[0.98]"
                    )}
                  >
                    {(selectedServices.length > 0 && bookingDate && bookingTime) && (
                      <div className="absolute inset-[-2px] rounded-[1.25rem] bg-planet-yellow/30 blur-xl opacity-70" />
                    )}

                    {/* Glossy Button Shine */}
                    {(selectedServices.length > 0 && bookingDate && bookingTime) && (
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    )}

                    <span className="relative z-10 flex w-full items-center justify-between gap-3">
                      {selectedServices.length === 0
                        ? 'Select Services'
                        : !bookingDate
                          ? 'Select Date'
                          : !bookingTime
                            ? 'Select Time'
                            : 'Confirm Appointment'
                      }
                      <ArrowRight size={18} className="shrink-0 group-hover:translate-x-1.5 transition-transform duration-300" />
                    </span>
                  </a>
                </motion.div>

                <div className="flex justify-between items-center mt-3 sm:mt-6">
                  <div className="flex -space-x-3">
                    {selectedServices.length > 0 ? (
                      selectedServices.slice(0, 3).map((s, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ scale: 0, x: -20, rotate: -15 }}
                          animate={{ scale: 1, x: 0, rotate: 0 }}
                          className="w-9 h-9 sm:w-11 sm:h-11 rounded-[1rem] sm:rounded-[1.25rem] bg-white/10 border border-white/20 backdrop-blur-2xl flex items-center justify-center text-planet-yellow shadow-2xl"
                        >
                          <s.icon size={18} />
                        </motion.div>
                      ))
                    ) : (
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-[1rem] sm:rounded-[1.25rem] bg-white/5 border border-white/10 border-dashed flex items-center justify-center text-white/20">
                        <Plus size={18} />
                      </div>
                    )}
                    {selectedServices.length > 3 && (
                      <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-[1rem] sm:rounded-[1.25rem] bg-planet-yellow border border-black/10 flex items-center justify-center text-xs font-black text-black shadow-xl ring-2 ring-black/20">
                        +{selectedServices.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white/40 uppercase tracking-[0.25em]">Reward Points</p>
                    <motion.p 
                      key={selectedServices.length}
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-3xl font-black text-planet-yellow leading-none flex items-center justify-end gap-1.5 mt-2 drop-shadow-[0_0_15px_rgba(254,199,8,0.8)]"
                    >
                      {bookingFinalPoints.toLocaleString()}
                      <span className="text-sm uppercase tracking-widest text-white/50 font-bold">pts</span>
                    </motion.p>
                    {selectedServices.length > 0 && (
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/40">
                        {currentPlan === 'free'
                          ? 'Free plan: General Checkup earns 500 pts'
                          : `${bookingBasePoints.toLocaleString()} base x ${bookingMultiplier.toFixed(1)} multiplier`}
                      </p>
                    )}
                  </div>
                </div>

              </div>
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
