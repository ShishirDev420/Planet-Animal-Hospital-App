import { useState, useEffect } from 'react';

const DEFAULT_HARSHAL = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80';
const DEFAULT_JOHNNY = 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80';

export function useProfileImages() {
  const [harshalImage, setHarshalImage] = useState(() => localStorage.getItem('harshalImage') || DEFAULT_HARSHAL);
  const [johnnyImage, setJohnnyImage] = useState(() => localStorage.getItem('johnnyImage') || DEFAULT_JOHNNY);

  useEffect(() => {
    const handleStorageChange = () => {
      setHarshalImage(localStorage.getItem('harshalImage') || DEFAULT_HARSHAL);
      setJohnnyImage(localStorage.getItem('johnnyImage') || DEFAULT_JOHNNY);
    };

    window.addEventListener('profileImagesUpdated', handleStorageChange);
    return () => window.removeEventListener('profileImagesUpdated', handleStorageChange);
  }, []);

  const updateHarshalImage = (url: string) => {
    try {
      localStorage.setItem('harshalImage', url);
      setHarshalImage(url);
      window.dispatchEvent(new Event('profileImagesUpdated'));
    } catch (e) {
      console.warn("Storage quota exceeded, couldn't save image to localStorage");
      setHarshalImage(url);
      window.dispatchEvent(new Event('profileImagesUpdated'));
    }
  };

  const updateJohnnyImage = (url: string) => {
    try {
      localStorage.setItem('johnnyImage', url);
      setJohnnyImage(url);
      window.dispatchEvent(new Event('profileImagesUpdated'));
    } catch (e) {
      console.warn("Storage quota exceeded, couldn't save image to localStorage");
      setJohnnyImage(url);
      window.dispatchEvent(new Event('profileImagesUpdated'));
    }
  };

  return { harshalImage, johnnyImage, updateHarshalImage, updateJohnnyImage };
}
