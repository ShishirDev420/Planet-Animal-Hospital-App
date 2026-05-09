export type PritpawlRoadmapTask = {
  id: string;
  title: string;
  description: string;
  rationale: string;
  priority: 'routine' | 'important' | 'critical';
  relatedPrescription?: string;
};

export type PritpawlPrescription = {
  name: string;
  dosage: string;
  schedule: string;
  purpose: string;
  refillWindow: string;
  notes: string;
};

export type PritpawlRoadmapPhase = {
  id: string;
  title: string;
  timeline: string;
  focus: string;
  tasks: PritpawlRoadmapTask[];
  checkpoints: string[];
};

export type PritpawlRoadmap = {
  petName: string;
  species: string;
  generatedAt: number;
  summary: string;
  prescriptionPlan: PritpawlPrescription[];
  phases: PritpawlRoadmapPhase[];
  watchouts: string[];
};

type PetProfileInput = {
  petName?: string;
  name?: string;
  petType?: string;
  breed?: string;
  age?: string | number;
  weight?: string;
  medicalHistory?: string;
  surgicalHistory?: string;
  healthHistory?: string;
  additionalDetails?: string;
  dietaryPreferences?: string;
};

type UpdateProfile = (updates: Record<string, unknown>) => Promise<void>;

export async function generatePritpawlRoadmap(profile: PetProfileInput, updateProfile?: UpdateProfile): Promise<PritpawlRoadmap> {
  const remoteRoadmap = await tryRemoteRoadmap(profile);
  const roadmap = remoteRoadmap ?? buildLocalRoadmap(profile);

  if (updateProfile) {
    await updateProfile({
      pritpawlRoadmap: roadmap,
      pritpawlRoadmapGeneratedAt: roadmap.generatedAt,
    });
  }

  return roadmap;
}

async function tryRemoteRoadmap(profile: PetProfileInput): Promise<PritpawlRoadmap | null> {
  const endpoint = import.meta.env.VITE_PRITPAWL_ROADMAP_URL;
  if (!endpoint) return null;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile }),
    });

    if (!response.ok) return null;
    return normalizeRoadmap(await response.json(), profile);
  } catch (error) {
    console.error('Pritpawl remote roadmap failed, using local generator:', error);
    return null;
  }
}

function normalizeRoadmap(value: any, profile: PetProfileInput): PritpawlRoadmap {
  const fallback = buildLocalRoadmap(profile);

  return {
    petName: String(value?.petName || fallback.petName),
    species: String(value?.species || fallback.species),
    generatedAt: Number(value?.generatedAt || Date.now()),
    summary: String(value?.summary || fallback.summary),
    prescriptionPlan: Array.isArray(value?.prescriptionPlan) && value.prescriptionPlan.length > 0 ? value.prescriptionPlan : fallback.prescriptionPlan,
    phases: Array.isArray(value?.phases) && value.phases.length > 0 ? value.phases : fallback.phases,
    watchouts: Array.isArray(value?.watchouts) && value.watchouts.length > 0 ? value.watchouts : fallback.watchouts,
  };
}

function buildLocalRoadmap(profile: PetProfileInput): PritpawlRoadmap {
  const petName = profile.petName || profile.name || 'Your Pet';
  const species = profile.petType || 'Dog';
  const breed = profile.breed || 'mixed breed';
  const age = String(profile.age || 'adult');
  const weight = profile.weight || 'not recorded';
  const history = [profile.medicalHistory, profile.healthHistory, profile.additionalDetails, profile.surgicalHistory].filter(Boolean).join(' ').toLowerCase();
  const isSenior = parseFloat(age) >= 7 || history.includes('senior');
  const needsJointCare = /lab|retriever|german shepherd|rottweiler|dachshund|joint|hip|arthritis|limp/.test(`${breed} ${history}`.toLowerCase());
  const needsSkinCare = /skin|allerg|ear|itch|dermat|coat/.test(history);
  const needsDentalCare = /dental|teeth|gum|tartar|breath/.test(history);
  const primaryFocus = needsJointCare ? 'mobility protection' : needsSkinCare ? 'skin and ear stability' : needsDentalCare ? 'oral inflammation control' : 'preventive longevity';

  return {
    petName,
    species,
    generatedAt: Date.now(),
    summary: `${petName} is a ${age} ${breed} with a current care focus on ${primaryFocus}. Weight is recorded as ${weight}. This roadmap prioritizes prevention, adherence, and early clinical review.`,
    prescriptionPlan: [
      {
        name: needsJointCare ? 'Joint support supplement review' : 'Preventive wellness supplement review',
        dosage: 'Vet-confirmed dose only',
        schedule: 'Daily after meal once approved',
        purpose: needsJointCare ? 'Support cartilage, comfort, and activity tolerance.' : 'Support preventive wellness based on exam findings.',
        refillWindow: 'Review every 30 days',
        notes: 'Do not start or change supplements without veterinary confirmation.',
      },
      {
        name: needsSkinCare ? 'Ear and skin care protocol' : 'Parasite prevention schedule',
        dosage: 'As prescribed by veterinarian',
        schedule: needsSkinCare ? 'Weekly check plus prescribed course if active symptoms exist' : 'Monthly or per product label',
        purpose: needsSkinCare ? 'Reduce recurring irritation and infection risk.' : 'Maintain tick, flea, and worm prevention.',
        refillWindow: '7 days before current product runs out',
        notes: 'Escalate redness, odor, discharge, vomiting, or appetite loss.',
      },
    ],
    phases: [
      {
        id: 'phase-1',
        title: 'Baseline Stabilization',
        timeline: '1-3 months',
        focus: 'Confirm current health baseline and close the highest-risk gaps.',
        tasks: [
          task('baseline-exam', 'Complete wellness exam', `Run a nose-to-tail exam for ${petName} and update weight, body condition, oral health, skin, ears, heart, and mobility.`, 'A current baseline makes future symptom changes easier to detect.', 'critical'),
          needsJointCare
            ? task('mobility-screen', 'Mobility and joint screen', 'Assess hips, elbows, gait, pain score, and activity tolerance.', 'Early mobility intervention can preserve comfort and function.', 'important', 'Joint support supplement review')
            : task('lifestyle-review', 'Lifestyle risk review', 'Review food, exercise, sleep, grooming, and preventive care cadence.', 'Routine risk review prevents small gaps becoming clinical problems.', 'important'),
          task('medication-audit', 'Medication and supplement audit', 'List every current medicine, supplement, dose, and schedule in one source of truth.', 'Clear medication records reduce missed doses and duplicate treatments.', 'critical'),
        ],
        checkpoints: ['Weight updated', 'Medication list verified', 'Next visit date chosen'],
      },
      {
        id: 'phase-2',
        title: 'Targeted Prevention',
        timeline: '3-6 months',
        focus: 'Turn baseline findings into breed-aware preventive care.',
        tasks: [
          task('lab-panel', isSenior ? 'Senior bloodwork panel' : 'Preventive lab panel', 'Check CBC, organ values, and vet-recommended screening markers.', 'Lab trends often change before visible symptoms appear.', isSenior ? 'critical' : 'important'),
          needsDentalCare
            ? task('dental-plan', 'Dental treatment plan', 'Schedule dental grading and cleaning plan if tartar, gum inflammation, or pain is present.', 'Oral inflammation can affect comfort, appetite, and systemic health.', 'important')
            : task('dental-screen', 'Dental screening', 'Document plaque, gum color, fractured teeth, and chewing comfort.', 'Dental screening catches oral disease early.', 'routine'),
          task('vaccine-parasite-review', 'Vaccine and parasite review', 'Confirm core vaccines, lifestyle vaccines, deworming, tick, and flea prevention.', 'Preventive immunity and parasite control lower avoidable disease burden.', 'important', 'Parasite prevention schedule'),
        ],
        checkpoints: ['Labs reviewed', 'Dental grade logged', 'Prevention calendar updated'],
      },
      {
        id: 'phase-3',
        title: 'Outcome Optimization',
        timeline: '6-12 months',
        focus: 'Measure response and tune the plan.',
        tasks: [
          task('progress-review', 'Roadmap progress review', 'Compare symptoms, activity, appetite, coat, stool, sleep, and medication adherence against baseline.', 'Measuring change keeps the plan adaptive instead of static.', 'important'),
          task('nutrition-adjustment', 'Nutrition and weight adjustment', 'Adjust food quantity, protein source, treats, and activity based on body condition.', 'Weight control reduces orthopedic, metabolic, and inflammatory risk.', 'important'),
          task('caregiver-routine', 'Caregiver routine lock-in', 'Set reminder cadence for medication, grooming, refills, and follow-up visits.', 'Consistent adherence is one of the biggest drivers of better outcomes.', 'routine'),
        ],
        checkpoints: ['Symptoms trended', 'Diet plan adjusted', 'Reminder cadence active'],
      },
    ],
    watchouts: [
      'Do not change prescription medication without veterinarian approval.',
      'Escalate breathing difficulty, collapse, seizures, persistent vomiting, or refusal to eat urgently.',
      `Bring ${petName}'s current medication names, doses, and product photos to the next visit.`,
    ],
  };
}

function task(
  id: string,
  title: string,
  description: string,
  rationale: string,
  priority: PritpawlRoadmapTask['priority'],
  relatedPrescription?: string,
): PritpawlRoadmapTask {
  return { id, title, description, rationale, priority, relatedPrescription };
}
