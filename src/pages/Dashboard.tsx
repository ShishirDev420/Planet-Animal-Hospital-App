import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useMotionTemplate, animate, useScroll, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, Calendar, FileText, Award, ChevronRight, Gift, X, Dog, 
  CheckCircle2, Syringe, Sparkles, Stethoscope, ChevronDown, ChevronUp, Loader2, LogOut, Info, PawPrint, Clock, Lock, Settings, Bot, Map
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
  const [currentPlan, setCurrentPlan] = useState('free');
  const [pendingIncentives, setPendingIncentives] = useState<string[]>([]);
  const [incentivesOrder, setIncentivesOrder] = useState<any[]>([]);

  const getMultiplier = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'essential': return 0.5;
      case 'advanced': return 1.5;
      case 'prestige': return 2;
      default: return 1;
    }
  };

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
            const data = docSnap.data();
            setVerifiedPoints(data.pawPoints || 0);
            setCurrentPlan(data.currentPlan || 'free');
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
    
    const finalPoints = pointsValue * getMultiplier(currentPlan);

    // Optimistic UI updates
    setPendingIncentives(prev => [...prev, incentiveId]);
    setPendingPoints(prev => prev + finalPoints);
    
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
        points: finalPoints,
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
      setPendingPoints(prev => prev - finalPoints);
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

    const finalPoints = selectedService.points * getMultiplier(currentPlan);

    try {
      await addDoc(collection(db, 'requests'), {
        userId: auth.currentUser?.uid || userId,
        patient: petProfile?.name || 'Pet',
        reason: selectedService.name,
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
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex justify-center isolate">
        <div className="relative w-full max-w-5xl h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-planet-yellow/40 rounded-full blur-3xl opacity-60 animate-blob transform-gpu"></div>
          <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-teal-300/40 rounded-full blur-3xl opacity-60 animate-blob animation-delay-2000 transform-gpu"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-amber-200/40 rounded-full blur-3xl opacity-60 animate-blob animation-delay-4000 transform-gpu"></div>
        </div>
      </div>

      <div className="relative z-10 p-6 space-y-8 pb-4 dark:text-white/95">
        {/* Header with Logo */}
      <header className="pt-4 mb-2">
        <div className="flex items-center justify-between w-full py-4 relative gap-2">
          {/* Logo Container (Left) - Fixed width for centering */}
          <div className="flex items-center shrink-0 w-12 sm:w-16">
            <button onClick={() => navigate('/profiles')} className="group">
              <div className="drop-shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-opacity duration-300 hover:opacity-90 active:scale-95">
                <Logo className="!w-12 !h-12 sm:!w-16 sm:!h-16" />
              </div>
            </button>
          </div>
            
          {/* Branding Text (Center) - Truly centered via symmetric side widths */}
          <div className="flex flex-col items-center flex-1 min-w-0 text-center pointer-events-none">
            <h1 className="text-sm sm:text-lg font-heading font-black text-slate-800 tracking-tight uppercase block leading-none dark:text-white/95 whitespace-nowrap">
              PLANET ANIMAL
            </h1>
            <p className="text-[7px] sm:text-[10px] font-bold text-[#fec708] uppercase tracking-[0.1em] sm:tracking-[0.25em] mt-0.5 dark:text-[#fec708] whitespace-nowrap">
              HOSPITAL & WELLNESS
            </p>
          </div>

          {/* Profile Container (Right) - Matching width of Logo Container */}
          <div className="flex items-center justify-end shrink-0 w-12 sm:w-16">
             <button onClick={() => navigate('/settings')} className="relative flex items-center justify-center p-2 rounded-full bg-gradient-to-br from-white/10 to-white/0 hover:from-white/20 hover:to-white/5 transition-all duration-300 border border-white/5 shadow-sm cursor-pointer group">
               <Settings className="w-5 h-5 text-white/80 group-hover:text-white transition-colors duration-300" />
             </button>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-3xl font-extrabold font-heading tracking-tight text-white drop-shadow-md">Hi, {petProfile?.parentName || 'Pet Parent'}</h2>
          <p className="text-sm font-medium font-body text-slate-200 mt-1 leading-relaxed">Let's keep {petProfile?.petName || 'your pet'} healthy today.</p>
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
          <h2 className="text-white/60 text-xs uppercase tracking-widest font-medium">Paw Points Balance</h2>
          <div className="flex items-baseline gap-2">
             <span className="font-heading tracking-tighter text-6xl tabular-nums font-extrabold text-[#fec708] animate-pulsate-synchronized-glow">{verifiedPoints.toLocaleString()}</span>
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

          <div className="mt-8 w-full">
            <p className="text-[10px] text-white/60 font-medium mb-3 uppercase tracking-widest">
              {Math.max(0, 5000 - verifiedPoints).toLocaleString()} PTS TO NEXT UNLOCK
            </p>
            <div className="relative h-2 w-full bg-slate-900/50 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (verifiedPoints / 5000) * 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="h-full bg-gradient-to-r from-planet-yellow to-yellow-300 shadow-[0_0_15px_rgba(254,199,8,0.7)] animate-pulsate-synchronized-glow rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xl font-bold font-heading tracking-tight text-white mb-4 drop-shadow-sm">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <ActionCard 
            icon={<Bot className="text-planet-yellow" />} 
            title="AI Vet" 
            subtitle="Instant Health Advice" 
            onClick={() => navigate('/ai')}
          />
          <ActionCard 
            icon={<Map className="text-planet-yellow" />} 
            title="Roadmap" 
            subtitle="Longevity Plan" 
            onClick={() => navigate('/roadmap')}
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
            className="flex overflow-x-auto hide-scrollbar gap-4 md:gap-6 py-40 -my-40 px-6 md:px-8 relative z-10 [&::-webkit-scrollbar]:hidden snap-x snap-mandatory transform-gpu will-change-transform md:max-w-6xl md:mx-auto"
            style={{ scrollbarWidth: 'none' }}
          >
            {incentivesOrder.map((incentive) => (
              <div 
                key={incentive.id} 
                className="flex-none min-w-[280px] max-w-[320px] w-[80vw] md:w-[320px] group snap-center"
              >
                <EarnCard 
                  id={incentive.id}
                  title={incentive.title}
                  subtext={incentive.subtext}
                  pointsText={incentive.pointsText}
                  pointsValue={incentive.pointsValue}
                  highValue={incentive.highValue}
                  theme={incentive.theme}
                  actionText={(incentive as any).actionText}
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
    <motion.div 
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.03, boxShadow: '0 12px 32px rgba(254,199,8,0.15)' }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl dark:backdrop-blur-[24px] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] rounded-[2rem] p-6 flex flex-col items-start gap-3 cursor-pointer hover:bg-white/90 dark:hover:bg-white/[0.08]"
    >
      <div className="bg-white p-2 rounded-xl shadow-sm dark:bg-white/10 dark:border dark:border-white/10">
        {icon}
      </div>
      <div>
        <h4 className="font-heading font-bold text-slate-800 dark:text-white text-lg tracking-tight">{title}</h4>
        <p className="font-body font-medium text-slate-500 dark:text-slate-300 text-sm leading-relaxed">{subtitle}</p>
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

function EarnCard({ id, title, subtext, pointsText, pointsValue, highValue, isPending, theme = 'yellow', actionText = 'Book Now', onBook, carouselRef }: { id: string, title: string, subtext?: string, pointsText: string, pointsValue: number, highValue?: boolean, isPending: boolean, theme?: 'blue' | 'orange' | 'green' | 'purple' | 'yellow', actionText?: string, onBook: (id: string, points: number, title: string) => void, carouselRef?: React.RefObject<HTMLElement> }) {
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
    <motion.div ref={cardRef} style={{ scale, opacity }} className="relative min-w-[280px] shrink-0 w-full h-[260px] group origin-center transform-gpu will-change-transform">
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
                {isPending ? 'Pending Confirmation' : actionText}
              </button>
            </MagneticWrapper>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
