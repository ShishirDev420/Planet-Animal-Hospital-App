import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../lib/firebase';

export interface PetProfile {
  name: string;
  breed: string;
  weight: string;
  dietaryPreferences: string;
  healthHistory: string;
  age?: string;
  gender?: string;
  type?: string;
  additionalDetails?: string;
  pawPoints?: number;
  surgicalHistory: string;
  isSenior?: boolean;
  isOverweight?: boolean;
  parentName?: string;
}

const DEFAULT_PROFILE: PetProfile = {
  name: "",
  breed: "",
  weight: "",
  dietaryPreferences: "",
  healthHistory: "",
  age: "",
  gender: "",
  type: "",
  surgicalHistory: "",
  isSenior: false,
  isOverweight: false,
  parentName: "Pet Parent"
};

export function usePetProfile() {
  const [profile, setProfile] = useState<PetProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile(prev => ({
              ...DEFAULT_PROFILE,
              ...prev,
              name: data.petName || DEFAULT_PROFILE.name,
              type: data.petType || DEFAULT_PROFILE.type,
              breed: data.breed || DEFAULT_PROFILE.breed,
              age: data.age || DEFAULT_PROFILE.age,
              gender: data.gender || DEFAULT_PROFILE.gender,
              weight: data.weight || DEFAULT_PROFILE.weight,
              additionalDetails: data.additionalDetails || DEFAULT_PROFILE.additionalDetails,
              pawPoints: data.pawPoints !== undefined ? data.pawPoints : DEFAULT_PROFILE.pawPoints,
              dietaryPreferences: data.dietaryPreferences || DEFAULT_PROFILE.dietaryPreferences,
              surgicalHistory: data.surgicalHistory || DEFAULT_PROFILE.surgicalHistory,
              isSenior: data.age && parseInt(data.age) >= 7 ? true : false,
              parentName: user.displayName || "Pet Parent",
            }));
          }
          setLoading(false);
        });
        return () => unsubscribeDoc();
      } else {
        setProfile(DEFAULT_PROFILE);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const updateProfile = async (updates: Partial<PetProfile>) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid);
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.petName = updates.name;
        if (updates.type) dbUpdates.petType = updates.type;
        if (updates.breed) dbUpdates.breed = updates.breed;
        if (updates.age) dbUpdates.age = updates.age;
        if (updates.gender) dbUpdates.gender = updates.gender;
        if (updates.weight) dbUpdates.weight = updates.weight;
        if (updates.additionalDetails) dbUpdates.additionalDetails = updates.additionalDetails;
        if (updates.dietaryPreferences) dbUpdates.dietaryPreferences = updates.dietaryPreferences;
        if (updates.surgicalHistory) dbUpdates.surgicalHistory = updates.surgicalHistory;

        await updateDoc(docRef, dbUpdates);
      } catch (e) {
        console.error('Failed to update profile', e);
      }
    }
  };

  return { profile, updateProfile, loading };
}
