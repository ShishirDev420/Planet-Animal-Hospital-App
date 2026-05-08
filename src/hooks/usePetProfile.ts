import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useLocation } from 'react-router-dom';

export function usePetProfile() {
  const location = useLocation();
  const isDemoMode = location.search.includes('demo_mode=true');

  const [profile, setProfile] = useState<any>(isDemoMode ? {
    parentName: 'Shishir',
    petName: 'Onyx',
    breed: 'Black Lab',
    weight: '32kg',
    dietaryPreferences: 'High-Protein Kibble',
    age: '3 years',
    gender: 'Male',
    medicalHistory: 'No known issues',
    surgicalHistory: 'Neutered at 6 months'
  } : {});
  const [loading, setLoading] = useState(!isDemoMode);

  useEffect(() => {
    if (isDemoMode) {
      setProfile({
        parentName: 'Shishir',
        petName: 'Onyx',
        breed: 'Black Lab',
        weight: '32kg',
        dietaryPreferences: 'High-Protein Kibble',
        age: '3 years',
        gender: 'Male',
        medicalHistory: 'No known issues',
        surgicalHistory: 'Neutered at 6 months'
      });
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
            setProfile(docSnap.data());
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
    if (isDemoMode) return; // Don't try to save in demo mode
    if (!auth.currentUser) throw new Error('Not authenticated');
    const docRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(docRef, updates);
  };

  return { profile, loading, updateProfile };
}
