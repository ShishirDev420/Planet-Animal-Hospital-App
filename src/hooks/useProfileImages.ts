import { useState, useEffect } from 'react';

const DEFAULT_USER = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80';
const DEFAULT_PET = 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80';

export function useProfileImages() {
  const [userImage, setUserImage] = useState(() => localStorage.getItem('userImage') || DEFAULT_USER);
  const [petImage, setPetImage] = useState(() => localStorage.getItem('petImage') || DEFAULT_PET);

  useEffect(() => {
    const handleStorageChange = () => {
      setUserImage(localStorage.getItem('userImage') || DEFAULT_USER);
      setPetImage(localStorage.getItem('petImage') || DEFAULT_PET);
    };

    window.addEventListener('profileImagesUpdated', handleStorageChange);
    return () => window.removeEventListener('profileImagesUpdated', handleStorageChange);
  }, []);

  const updateUserImage = (url: string) => {
    try {
      localStorage.setItem('userImage', url);
      setUserImage(url);
      window.dispatchEvent(new Event('profileImagesUpdated'));
    } catch (e) {
      console.warn("Storage quota exceeded, couldn't save image to localStorage");
      setUserImage(url);
      window.dispatchEvent(new Event('profileImagesUpdated'));
    }
  };

  const updatePetImage = (url: string) => {
    try {
      localStorage.setItem('petImage', url);
      setPetImage(url);
      window.dispatchEvent(new Event('profileImagesUpdated'));
    } catch (e) {
      console.warn("Storage quota exceeded, couldn't save image to localStorage");
      setPetImage(url);
      window.dispatchEvent(new Event('profileImagesUpdated'));
    }
  };

  return { userImage, petImage, updateUserImage, updatePetImage };
}
