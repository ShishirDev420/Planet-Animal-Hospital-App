import { useState, useEffect } from 'react';
import { usePetProfile } from './usePetProfile';

// Helper: Get current season in India based on month number
export function getIndianSeason(month: number): 'summer' | 'monsoon' | 'winter' {
  // India seasons: Summer (Mar-May), Monsoon (Jun-Sep), Winter (Nov-Feb)
  // Note: Oct is transitional, but we'll include in monsoon/post-monsoon
  if (month >= 3 && month <= 5) return 'summer';
  if (month >= 6 && month <= 9) return 'monsoon';
  return 'winter'; // Nov, Dec, Jan, Feb
}

// Helper: Parse medications from additionalDetails text (if structured fields not available)
function parseMedicationsFromText(additionalDetails: string | undefined): Array<{ name: string; time: string; dosage: string }> {
  if (!additionalDetails) return [];
  
  const medications = [];
  const lines = additionalDetails.split('\n');
  
  // Look for lines that mention medication, dosage, frequency
  const medPatterns = [
    /(\w+(?:\s+\w+)?)\s+(\d+(?:\.\d+)?\s*(?:mg|g|ml|tablet|tab|capsule)?)\s*(?:.*?)(?:morning|afternoon|evening|night|daily|bd|tid)?/i,
    /medication[:\s]+([^,\n]+)/i,
    /medicine[:\s]+([^,\n]+)/i,
    /tablet[:\s]+([^,\n]+)/i,
  ];
  
  for (const line of lines) {
    for (const pattern of medPatterns) {
      const match = line.match(pattern);
      if (match) {
        medications.push({
          name: match[1]?.trim() || 'Medication',
          dosage: match[2]?.trim() || 'as prescribed',
          time: '9:00 AM' // default, could parse from line if specified
        });
        break;
    }
    }
  }
  
  return medications.length > 0 ? medications : [];
}

// Helper: Parse allergies from additionalDetails
function parseAllergiesFromText(additionalDetails: string | undefined): string[] {
  if (!additionalDetails) return [];
  
  const allergies: string[] = [];
  const lower = additionalDetails.toLowerCase();
  
  // Common allergy keywords
  const allergyKeywords = ['allergy', 'allergic', 'allergies', 'sensitive'];
  const found = allergyKeywords.some(keyword => lower.includes(keyword));
  
  if (found) {
    // Try to extract specific items after allergy mention
    const allergyMatch = lower.match(/(?:allerg(?:y|ies|ic)\s*(?:to|:)?\s*)([^,\n]+)/i);
    if (allergyMatch) {
      const items = allergyMatch[1].split(/[,&]/).map(s => s.trim());
      allergies.push(...items.filter(Boolean));
    } else {
      // Generic fallback
      allergies.push('consult vet for specifics');
    }
  }
  
  return allergies;
}

// Helper: Get current season string
function getCurrentSeason(): 'summer' | 'monsoon' | 'winter' {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  return getIndianSeason(month);
}

export function usePawlMessage() {
  const { profile, loading: profileLoading } = usePetProfile();
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (profileLoading) return;
    if (!profile?.petName) {
      setMessage('');
      return;
    }

  const fetchPawlMessage = async () => {
    // Check cache first (localStorage, per pet per day)
    const today = new Date().toDateString();
    const cacheKey = `pawl_${profile.uid}_${today}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      console.log('🐾 [Pawl] Using cached message for', profile.petName);
      setMessage(cached);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      // Build pet data payload from profile with defensive defaults
      const petData: any = {
        name: (profile.petName || 'your pet').trim(),
        species: (profile.petType || 'dog').toLowerCase(),
        breed: (profile.breed || 'indian pariah').toLowerCase(),
        age: String(profile.age || 'adult'),
        city: (profile.city || 'Mumbai').trim(),
        month: getCurrentSeason(),
        medications: [],
        allergies: []
      };

      console.log('🐾 [Pawl] Fetching message for:', petData);

      // Parse medications from additionalDetails if not structured
      if (profile.additionalDetails) {
        const meds = parseMedicationsFromText(profile.additionalDetails);
        if (meds.length > 0) {
          petData.medications = meds.map(m => ({
            name: m.name,
            time: m.time,
            dosage: m.dosage
          }));
        }
      }

      // Parse allergies
      if (profile.additionalDetails) {
        const allergyList = parseAllergiesFromText(profile.additionalDetails);
        if (allergyList.length > 0) {
          petData.allergies = allergyList;
        }
      }

      // Call Pawl backend
      const PAWL_BACKEND_URL = import.meta.env.VITE_PAWL_URL || 'http://localhost:8000';
      console.log('🐾 [Pawl] Calling:', `${PAWL_BACKEND_URL}/daily-briefing`);
      
      const response = await fetch(`${PAWL_BACKEND_URL}/daily-briefing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(petData),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('🐾 [Pawl] HTTP error:', response.status, errorBody);
        throw new Error(`Pawl responded ${response.status}: ${errorBody.substring(0, 100)}`);
      }

      const data = await response.json();
      console.log('🐾 [Pawl] Message received:', data.message.substring(0, 100) + '...');
      setMessage(data.message);
      localStorage.setItem(cacheKey, data.message);
      setError(false);
    } catch (err: any) {
      console.error('🐾 [Pawl] Fetch error:', err);
      setError(true);
      // Fallback: simple generic tip based on pet info
      const fallback = getGenericDailyTip(profile);
      console.log('🐾 [Pawl] Using fallback message');
      setMessage(fallback);
    } finally {
      setLoading(false);
    }
  };

    fetchPawlMessage();
  }, [profile, profileLoading]);

  return { message, loading, error };
}

// Fallback generic daily tips when Pawl is unavailable
function getGenericDailyTip(profile: any): string {
  const petName = profile?.petName || 'your pet';
  const species = (profile?.petType || 'dog').toLowerCase();
  const breed = profile?.breed || 'mixed';
  const city = profile?.city || 'your city';
  const season = getCurrentSeason();
  
  const base = `Good morning! Here's a daily reminder for ${petName}:\n\n`;
  
  if (species === 'dog') {
    const tips: Record<string, string> = {
      summer: `🌞 Summer care for ${petName}:\n• Walk early morning (6-8 AM) or late evening (6-8 PM)\n• Always fresh water available\n• Never leave outside in heat — AC/fan required\n• Check paws for hot surfaces`,
      monsoon: `🌧️ Monsoon tips for ${petName}:\n• Dry ears and paws after walks\n• Check for ticks daily (they love humidity!)\n• Keep coat brushed to prevent matting\n• Avoid puddles — fungal infections risk`,
      winter: `❄️ Winter care for ${petName}:\n• Provide warm bedding\n• Short-haired breeds may need a jacket\n• Keep indoors during cold nights\n• Continue regular exercise but avoid cold mornings`
    };
    return base + (tips[season] || tips.summer);
  } else {
    // Cat tips
    const tips: Record<string, string> = {
      summer: `🌞 Summer care for ${petName}:\n• Fresh water multiple times daily\n• Keep indoors with AC/fan\n• Brush regularly to prevent hairballs\n• Never leave in closed car`,
      monsoon: `🌧️ Monsoon tips for ${petName}:\n• Keep indoors as much as possible\n• Check for ticks after any outdoor time\n• Clean litter box frequently\n• Provide indoor play to prevent boredom`,
      winter: `❄️ Winter care for ${petName}:\n• Warm, cozy sleeping spot\n• Extra blankets if needed\n• Indoor play to maintain activity\n• Watch for drafty windows`
    };
    return base + (tips[season] || tips.summer);
  }
}