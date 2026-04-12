import { useState, useEffect } from 'react';

export interface PetProfile {
  name: string;
  breed: string;
  weight: string;
  dietaryPreferences: string;
  healthHistory: string;
  age?: string;
  surgicalHistory: string;
}

const DEFAULT_PROFILE: PetProfile = {
  name: "Johnny",
  breed: "American Bully",
  weight: "50kg",
  dietaryPreferences: "None",
  healthHistory: "Mild joint stiffness",
  age: "5",
  surgicalHistory: ""
};

export function usePetProfile() {
  const [profile, setProfile] = useState<PetProfile>(() => {
    const saved = localStorage.getItem('petProfile');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with DEFAULT_PROFILE to ensure new fields like surgicalHistory exist
      // Also auto-correct the breed if it was stuck on the old cached value for this demo
      if (parsed.breed === 'Golden Retriever') {
        parsed.breed = 'American Bully';
        parsed.weight = '50kg';
        parsed.dietaryPreferences = 'None';
      }
      return { ...DEFAULT_PROFILE, ...parsed };
    }
    return DEFAULT_PROFILE;
  });

  useEffect(() => {
    localStorage.setItem('petProfile', JSON.stringify(profile));
  }, [profile]);

  const updateProfile = (updates: Partial<PetProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  return { profile, updateProfile };
}
