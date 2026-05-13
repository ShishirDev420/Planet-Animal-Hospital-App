import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useLocation } from 'react-router-dom';

const DEMO_PROFILE_KEY = 'planet_animal_demo_profile';

function normalizeProfile(data: any) {
  if (!data) return data;
  return {
    ...data,
    name: data.petName || data.name || '',
  };
}

export const DEMO_ROADMAP_TEXT = `### Phase: 1-3 Months
* **Baseline Wellness Exam**: Complete a full nose-to-tail veterinary exam | Scientific Rationale: Establishes clinical baselines for early detection.
* **Joint Mobility Check**: Screen hips, elbows, and gait because Labs are active, larger dogs | Scientific Rationale: Early mobility care preserves long-term comfort.
* **Nutrition Calibration**: Review body condition and protein intake | Scientific Rationale: Weight control reduces orthopedic and metabolic risk.

### Phase: 3-6 Months
* **Dental Assessment**: Check plaque, gums, and chewing patterns | Scientific Rationale: Oral inflammation can affect systemic health.
* **Skin and Ear Review**: Monitor ears and coat after grooming or monsoon exposure | Scientific Rationale: Moisture and allergies can trigger recurrent infections.
* **Vaccination Audit**: Confirm core and lifestyle vaccines are current | Scientific Rationale: Preventive immunity lowers avoidable disease burden.

### Phase: 6-12 Months
* **Annual Lab Panel**: Run bloodwork and organ screening | Scientific Rationale: Labs reveal trends before symptoms appear.
* **Exercise Plan Refresh**: Adjust activity to age, joints, and body condition | Scientific Rationale: Consistent movement supports cardiac and muscle health.
* **Parasite Prevention Check**: Confirm tick, flea, and deworming schedule | Scientific Rationale: Parasite prevention protects both pet and household health.

### Phase: Long-term
* **Longevity Review**: Revisit roadmap every quarter | Scientific Rationale: Adaptive care plans keep prevention aligned with aging.
* **Senior Screening Prep**: Plan early screening before senior years | Scientific Rationale: Earlier monitoring improves treatment windows.
* **Caregiver Routine**: Build stable medication, nutrition, and visit reminders | Scientific Rationale: Adherence improves health outcomes.

### Verifiable Sources
* [AAHA Preventive Healthcare Guidelines](https://www.aaha.org)
* [AVMA Pet Preventive Care](https://www.avma.org)
* [Cornell Richard P. Riney Canine Health Center](https://www.vet.cornell.edu)`;

export function usePetProfile() {
  const location = useLocation();
  const isDemoMode = location.search.includes('demo_mode=true');
  const demoProfile = {
    parentName: 'Shishir',
    petName: 'Onyx',
    name: 'Onyx',
    petType: 'Dog',
    breed: 'Black Lab',
    weight: '32kg',
    dietaryPreferences: 'High-Protein Kibble',
    age: '3 years',
    gender: 'Male',
    medicalHistory: 'No known issues',
    surgicalHistory: 'Neutered at 6 months',
    pawPoints: 1250,
    cachedRoadmap: DEMO_ROADMAP_TEXT,
    roadmapGeneratedAt: Date.now(),
    roadmapProgress: {
      '1-3 Months-0': true,
    },
  };

  const readDemoProfile = () => {
    try {
      const saved = localStorage.getItem(DEMO_PROFILE_KEY);
      if (!saved) return normalizeProfile(demoProfile);
      const parsed = JSON.parse(saved);
      return normalizeProfile({
        ...demoProfile,
        ...parsed,
        cachedRoadmap: parsed.cachedRoadmap || demoProfile.cachedRoadmap,
        roadmapGeneratedAt: parsed.roadmapGeneratedAt || demoProfile.roadmapGeneratedAt,
        roadmapProgress: {
          ...demoProfile.roadmapProgress,
          ...(parsed.roadmapProgress || {}),
        },
      });
    } catch {
      return normalizeProfile(demoProfile);
    }
  };

  const [profile, setProfile] = useState<any>(isDemoMode ? readDemoProfile() : {});
  const [loading, setLoading] = useState(!isDemoMode);

  useEffect(() => {
    if (isDemoMode) {
      setProfile(readDemoProfile());
      setLoading(false);
      return;
    }

    let unsubscribeSnapshot: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(normalizeProfile(docSnap.data()));
          } else {
            setProfile({});
          }
          setLoading(false);
        }, (err) => {
          console.error('onSnapshot error in usePetProfile:', err);
          setLoading(false);
        });
      } else {
        setProfile({});
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const updateProfile = async (updates: any) => {
    if (isDemoMode) {
      setProfile((current: any) => {
        const nextProfile = normalizeProfile({ ...current, ...updates });
        localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(nextProfile));
        return nextProfile;
      });
      return;
    }
    if (!auth.currentUser) throw new Error('Not authenticated');
    const docRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(docRef, updates);
  };

  return { profile, loading, updateProfile };
}
