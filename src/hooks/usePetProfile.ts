import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function usePetProfile() {
  const [profile, setProfile] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          } else {
            setProfile({});
          }
          setLoading(false);
        }, (err) => {
          console.error(err);
          setLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        setProfile({});
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const updateProfile = async (updates: any) => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const docRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(docRef, updates);
  };

  return { profile, loading, updateProfile };
}
