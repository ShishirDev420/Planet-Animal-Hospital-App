import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
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

  return { profile, loading };
}
