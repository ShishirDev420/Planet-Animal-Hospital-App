import { useState, useEffect } from 'react';
import { usePetProfile } from './usePetProfile';
import { useTimeOfDay, type TimePeriod } from './useTimeOfDay';

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

function getDailyVariantIndex(profile: any, period: TimePeriod, count: number): number {
  const key = `${new Date().toDateString()}-${profile?.uid || profile?.parentName || 'demo'}-${profile?.petName || 'pet'}-${period}`;
  const seed = key.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return count > 0 ? seed % count : 0;
}

function pickDailyVariant(variants: Record<'summer' | 'monsoon' | 'winter', string[]>, season: 'summer' | 'monsoon' | 'winter', profile: any, period: TimePeriod) {
  const pool = variants[season] || variants.summer;
  return pool[getDailyVariantIndex(profile, period, pool.length)] || pool[0];
}

export function usePawlMessage(period?: TimePeriod) {
  const { profile, loading: profileLoading } = usePetProfile();
  const { currentPeriod } = useTimeOfDay();
  const activePeriod = period || currentPeriod;
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
    // Check cache first (localStorage, per pet per day per period)
    const today = new Date().toDateString();
    const cacheKey = `pawl_${profile.uid}_${today}_${activePeriod}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      console.log(`🐾 [Pawl] Using cached message for ${profile.petName} (${activePeriod})`);
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
        timeOfDay: activePeriod,
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
        console.info('🐾 [Pawl] HTTP fallback:', response.status, errorBody);
        throw new Error(`Pawl responded ${response.status}: ${errorBody.substring(0, 100)}`);
      }

      const data = await response.json();
      console.log('🐾 [Pawl] Message received:', data.message.substring(0, 100) + '...');
      setMessage(data.message);
      localStorage.setItem(cacheKey, data.message);
      setError(false);
    } catch (err: any) {
      console.info('🐾 [Pawl] Fetch fallback:', err?.message || err);
      setError(true);
      // Fallback: period-aware tip based on pet info
      const fallback = getGenericDailyTip(profile, activePeriod);
      console.log(`🐾 [Pawl] Using fallback message (${activePeriod})`);
      setMessage(fallback);
    } finally {
      setLoading(false);
    }
  };

    fetchPawlMessage();
  }, [profile, profileLoading, activePeriod]);

  return { message, loading, error };
}

// Breed-specific care notes for dogs
function getBreedDogNotes(breed: string): Record<string, string> {
  const b = breed.toLowerCase();
  const notes: Record<string, string> = {
    'labrador': 'Labs love food — measure portions carefully to prevent obesity. Prone to hip dysplasia, so avoid high-impact exercise on hard surfaces.',
    'golden retriever': 'Goldens have thick double coats — brush daily in shedding season. Prone to ear infections; dry ears thoroughly after swimming.',
    'german shepherd': 'GSDs need mental stimulation. Prone to bloat — avoid exercise right after meals. Joint supplements recommended.',
    'poodle': 'Poodles need regular grooming to prevent matting. Prone to ear infections; keep ears clean and dry.',
    'bulldog': 'Bulldogs overheat easily — keep cool and avoid midday walks. Clean face folds daily to prevent infections.',
    'beagle': 'Beagles follow their nose — always walk on a leash. Prone to obesity; measure food strictly.',
    'indian pariah': 'Pariahs are hardy and adaptive. Great for Indian climate — minimal grooming needed. Loyal watchdogs.',
    'shih tzu': 'Shih Tzus need daily face cleaning and regular grooming. Prone to breathing issues in heat — keep cool.',
    'pomeranian': 'Poms have delicate bones — avoid rough play and jumping from heights. Coat needs regular brushing.',
    'dachshund': 'Dachshunds are prone to back problems — no jumping on/off furniture. Use ramps for stairs.',
    'boxer': 'Boxers are energetic — need daily exercise. Prone to heart conditions; regular cardiac check-ups important.',
    'rottweiler': 'Rottweilers need consistent training and socialization. Prone to joint issues; maintain healthy weight.',
  };
  for (const key of Object.keys(notes)) {
    if (b.includes(key)) return { key, note: notes[key] };
  }
  return { key: 'general', note: '' };
}

// Breed-specific care notes for cats
function getBreedCatNotes(breed: string): Record<string, string> {
  const b = breed.toLowerCase();
  const notes: Record<string, string> = {
    'persian': 'Persians need daily face cleaning and eye care. Brush coat daily to prevent matting.',
    'siamese': 'Siamese are social — need company and interactive play. Prone to dental issues.',
    'bengal': 'Bengals are energetic — need lots of play and climbing space. Secure outdoor enclosures recommended.',
    'maine coon': 'Maine Coons need regular brushing for their thick coat. Prone to hip dysplasia and heart conditions.',
    'ragdoll': 'Ragdolls are gentle — indoor-only cats. Keep litter box extra clean.',
    'indian': 'Indian street cats are hardy but benefit from regular deworming and vaccination.',
  };
  for (const key of Object.keys(notes)) {
    if (b.includes(key)) return { key, note: notes[key] };
  }
  return { key: 'general', note: '' };
}

// Fallback period-aware daily tips when Pawl is unavailable
function getGenericDailyTip(profile: any, period: TimePeriod): string {
  const petName = profile?.petName || 'your pet';
  const species = (profile?.petType || 'dog').toLowerCase();
  const breed = profile?.breed || 'mixed';
  const season = getCurrentSeason();
  const breedInfo = species === 'dog' ? getBreedDogNotes(breed) : getBreedCatNotes(breed);
  const breedNote = breedInfo.note ? `\n\n🐾 ${breed} tip: ${breedInfo.note}` : '';

  if (period === 'morning') {
    if (species === 'dog') {
      const tips: Record<string, string> = {
        summer: `☀️ Good morning! Here's your ${period} briefing for ${petName}:\n\n🌅 Morning Routine:\n• Early walk before 8 AM (paws-safe hours)\n• Breakfast portion — measure accurately\n• Fresh water refill\n• Quick coat check for ticks (monsoon humidity)\n• Morning medication if scheduled`,
        monsoon: `🌧️ Good morning! Here's your ${period} briefing for ${petName}:\n\n🌅 Morning Routine:\n• Walk between 6-8 AM before rain starts\n• Breakfast as usual\n• Dry paws and belly after walk\n• Check for ticks — they're active after rain\n• Morning medication if scheduled`,
        winter: `❄️ Good morning! Here's your ${period} briefing for ${petName}:\n\n🌅 Morning Routine:\n• Walk after sunrise (avoid foggy early hours)\n• Warm breakfast\n• Joint warm-up stretches for older dogs\n• Coat check — short-haired breeds need a jacket\n• Morning medication if scheduled`
      };
      return (tips[season] || tips.summer) + breedNote;
    } else {
      const tips: Record<string, string> = {
        summer: `☀️ Good morning! Here's your ${period} briefing for ${petName}:\n\n🌅 Morning Routine:\n• Fresh food and water\n• Clean litter box\n• Morning play session (15 min)\n• Brush coat to reduce shedding\n• Check window perches are safe`,
        monsoon: `🌧️ Good morning! Here's your ${period} briefing for ${petName}:\n\n🌅 Morning Routine:\n• Fresh food and water\n• Clean litter box\n• Indoor play — keep active despite rain\n• Check for damp spots near windows\n• Grooming session to prevent hairballs`,
        winter: `❄️ Good morning! Here's your ${period} briefing for ${petName}:\n\n🌅 Morning Routine:\n• Warm food (slightly heated)\n• Clean litter box\n• Indoor play to keep joints warm\n• Cozy bed near warm spot\n• Extra cuddle time`
      };
      return (tips[season] || tips.summer) + breedNote;
    }
  }

  if (period === 'afternoon') {
    if (species === 'dog') {
      const tips: Record<string, string> = {
        summer: `🌤 Good afternoon! Here's your ${period} briefing for ${petName}:\n\n🌤 Midday Care:\n• Indoor rest during peak heat\n• Fresh water always available — add ice cubes\n• No walks until evening (paws burn on hot ground!)\n• Cool mat or tiled floor for napping\n• Watch for overheating signs (panting, drooling)`,
        monsoon: `🌤 Good afternoon! Here's your ${period} briefing for ${petName}:\n\n🌤 Midday Care:\n• Indoor play to burn energy\n• Check ears for moisture buildup\n• Fresh water\n• Quick grooming if coat is damp\n• Watch for fungal spots on belly/paws`,
        winter: `🌤 Good afternoon! Here's your ${period} briefing for ${petName}:\n\n🌤 Midday Care:\n• Best time for a midday walk (sun is warm)\n• Sunbathing spot near window\n• Fresh water\n• Joint-friendly exercise\n• Coat brushing`
      };
      return (tips[season] || tips.summer) + breedNote;
    } else {
      const tips: Record<string, string> = {
        summer: `🌤 Good afternoon! Here's your ${period} briefing for ${petName}:\n\n🌤 Midday Care:\n• Cool, shaded resting spot\n• Fresh water check\n• Light play session\n• Brush loose fur\n• Check water fountain is working`,
        monsoon: `🌤 Good afternoon! Here's your ${period} briefing for ${petName}:\n\n🌤 Midday Care:\n• Indoor enrichment (puzzle toys)\n• Check litter box\n• Fresh water\n• Groom to prevent hairballs\n• Watch for humidity-related skin issues`,
        winter: `🌤 Good afternoon! Here's your ${period} briefing for ${petName}:\n\n🌤 Midday Care:\n• Sunny spot for napping\n• Fresh water\n• Interactive play session\n• Warm bedding check\n• Extra treats for good behavior`
      };
      return (tips[season] || tips.summer) + breedNote;
    }
  }

  // Evening
  if (species === 'dog') {
    const tips: Record<'summer' | 'monsoon' | 'winter', string[]> = {
      summer: [
        `🌙 Good evening! Here's your ${period} briefing for ${petName}:\n\n🌙 Evening Recovery Ritual:\n• Evening walk after 7 PM when the ground is cool\n• Dinner portion — keep it measured, no table scraps\n• Last potty break before sleep\n• Refill overnight water bowl\n• Calm wind-down: dim lights, low noise, predictable bedtime`,
        `🌙 Good evening! Here's your ${period} briefing for ${petName}:\n\n🌙 Heat-Safe Night Routine:\n• Touch-check pavement before the final walk\n• Offer fresh water before dinner and again before bed\n• Keep play gentle after meals to protect digestion\n• Brush or wipe coat if there was outdoor dust\n• Check breathing: heavy panting at rest needs attention`,
        `🌙 Good evening! Here's your ${period} briefing for ${petName}:\n\n🌙 Longevity Close-Out:\n• Short sniff walk for mental decompression\n• Dinner at the usual time to protect routine\n• Quick paw-pad check for heat irritation\n• Bedtime medication if scheduled\n• Quiet recovery spot with airflow, not direct AC blast`,
      ],
      monsoon: [
        `🌙 Good evening! Here's your ${period} briefing for ${petName}:\n\n🌙 Monsoon Night Ritual:\n• Walk only if rain has eased and visibility is safe\n• Dry paws, belly, tail base, and ears thoroughly\n• Check between toes for redness or damp debris\n• Dinner as usual — avoid wet outdoor treats\n• Keep bedding dry and away from drafts`,
        `🌙 Good evening! Here's your ${period} briefing for ${petName}:\n\n🌙 Rainy-Day Recovery:\n• Replace outdoor play with 10 minutes of indoor scent games\n• Towel-dry coat even after a short walk\n• Check ears for moisture buildup or odor\n• Fresh water before bed\n• Inspect for ticks after any grass exposure`,
        `🌙 Good evening! Here's your ${period} briefing for ${petName}:\n\n🌙 Humidity Defense:\n• Final potty break in the driest safe window\n• Wipe paws with a clean dry cloth\n• Keep dinner steady — no rich monsoon snacks\n• Scan belly and armpits for fungal hot spots\n• Set a clean, dry sleep surface tonight`,
      ],
      winter: [
        `🌙 Good evening! Here's your ${period} briefing for ${petName}:\n\n🌙 Warmth & Recovery Ritual:\n• Early evening walk before the temperature drops\n• Warm dinner if your vet-approved diet allows it\n• Joint comfort check after activity\n• Extra blanket or insulated bed layer\n• Bedtime medication if scheduled`,
        `🌙 Good evening! Here's your ${period} briefing for ${petName}:\n\n🌙 Cold-Weather Close-Out:\n• Keep the final walk short but mentally enriching\n• Dry paws after dew or damp ground\n• Watch stiffness when getting up from rest\n• Offer water — winter pets can still dehydrate\n• Set sleeping spot away from cold floor drafts`,
        `🌙 Good evening! Here's your ${period} briefing for ${petName}:\n\n🌙 Senior-Safe Night Check:\n• Gentle movement before sleep to prevent stiffness\n• Dinner on schedule; avoid heavy late feeding\n• Check coat or sweater fit if used\n• Warm bedding, easy access to water\n• Quiet wind-down with predictable lights-out`,
      ],
    };
    return pickDailyVariant(tips, season, profile, period) + breedNote;
  } else {
    const tips: Record<'summer' | 'monsoon' | 'winter', string[]> = {
      summer: [
        `🌙 Good evening! Here's your ${period} briefing for ${petName}:\n\n🌙 Evening Recovery Ritual:\n• Dinner at the usual time\n• Short play burst before bedtime\n• Clean litter box for overnight comfort\n• Fresh water in a cool, shaded spot\n• Calm wind-down environment`,
        `🌙 Good evening! Here's your ${period} briefing for ${petName}:\n\n🌙 Heat-Safe Cat Routine:\n• Refresh water bowl or fountain before sleep\n• Offer a cool resting surface away from direct sun\n• Gentle wand play, then let breathing settle\n• Quick coat brush to reduce shed load\n• Check window screens and balcony access`,
        `🌙 Good evening! Here's your ${period} briefing for ${petName}:\n\n🌙 Feline Longevity Close-Out:\n• Clean litter box and note stool/urine changes\n• Dinner portion on schedule\n• Five minutes of hunting-style play\n• Keep hiding and climbing spaces accessible\n• Quiet, predictable bedtime routine`,
      ],
      monsoon: [
        `🌙 Good evening! Here's your ${period} briefing for ${petName}:\n\n🌙 Monsoon Indoor Ritual:\n• Dinner time\n• Interactive play to release rainy-day energy\n• Litter box check before sleep\n• Groom coat to prevent damp mats and hairballs\n• Cozy sleeping spot away from window drafts`,
        `🌙 Good evening! Here's your ${period} briefing for ${petName}:\n\n🌙 Humidity Defense:\n• Check bedding for dampness\n• Refresh water and clean food area\n• Inspect ears and coat for odor or irritation\n• Puzzle feeder or scent game for indoor enrichment\n• Keep litter box extra dry tonight`,
        `🌙 Good evening! Here's your ${period} briefing for ${petName}:\n\n🌙 Rainy Night Reset:\n• Close unsafe window gaps but preserve airflow\n• Brush coat lightly if humidity is high\n• Clean litter box and surrounding floor\n• Short chase-play session, then calm lights\n• Check favorite hiding spot is dry`,
      ],
      winter: [
        `🌙 Good evening! Here's your ${period} briefing for ${petName}:\n\n🌙 Warmth & Recovery Ritual:\n• Warm dinner if appropriate for their diet\n• Short play session to keep joints moving\n• Litter box check\n• Extra warm bedding away from cold tiles\n• Cuddle time if they seek contact`,
        `🌙 Good evening! Here's your ${period} briefing for ${petName}:\n\n🌙 Cold-Weather Cat Close-Out:\n• Refresh water before bed\n• Keep sleeping spot insulated from the floor\n• Gentle climbing or wand play before rest\n• Watch stiffness after naps\n• Keep the litter route easy and warm`,
        `🌙 Good evening! Here's your ${period} briefing for ${petName}:\n\n🌙 Quiet Night Routine:\n• Dinner on schedule\n• Clean litter box and note any changes\n• Warm blanket in the preferred sleep zone\n• Five minutes of enrichment, then reduce stimulation\n• Keep drafts away from resting areas`,
      ],
    };
    return pickDailyVariant(tips, season, profile, period) + breedNote;
  }
}
