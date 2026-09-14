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

export async function generatePritpawlRoadmap(_profile: PetProfileInput, _updateProfile?: UpdateProfile): Promise<PritpawlRoadmap> {
  throw new Error('Use the shared care assistant. No local clinical roadmap is generated.');
}
