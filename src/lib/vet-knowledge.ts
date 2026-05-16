export interface VetKnowledgeEntry {
  id: string;
  category: 'emergency' | 'symptom' | 'toxin' | 'breed' | 'care' | 'medication';
  title: string;
  content: string;
  source: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  species?: ('dog' | 'cat' | 'bird' | 'rabbit' | 'other')[];
}

export const VET_KNOWLEDGE_BASE: VetKnowledgeEntry[] = [
  {
    id: 'emergency-1',
    category: 'emergency',
    title: 'Life-Threatening Emergency Signs',
    content: 'Seek IMMEDIATE veterinary care if your pet shows: difficulty breathing, pale/blue gums, uncontrolled bleeding, collapse or inability to stand, seizures lasting more than 2 minutes, suspected poisoning, bloated/distended abdomen (especially in large dogs — GDV), severe trauma (hit by car, falls), or inability to urinate (especially male cats — urinary blockage is fatal within 24-48 hours).',
    source: 'AVMA Emergency Guidelines, Merck Veterinary Manual',
    severity: 'critical',
    species: ['dog', 'cat'],
  },
  {
    id: 'emergency-2',
    category: 'emergency',
    title: 'GDV (Bloat) — Gastric Dilatation-Volvulus',
    content: 'GDV is a life-threatening emergency most common in large, deep-chested breeds (Great Danes, German Shepherds, Standard Poodles, Weimaraners). Signs: unproductive retching, distended abdomen, restlessness, drooling, rapid heart rate. Mortality exceeds 30% even with treatment. Time is critical — survival drops significantly after 6 hours. DO NOT wait to see if it resolves.',
    source: 'Merck Veterinary Manual, Journal of Veterinary Emergency and Critical Care',
    severity: 'critical',
    species: ['dog'],
  },
  {
    id: 'emergency-3',
    category: 'emergency',
    title: 'Feline Urinary Blockage',
    content: 'Male cats are at high risk for urethral obstruction. Signs: frequent trips to litter box with no production, crying while attempting to urinate, licking genital area, vomiting, lethargy. This is a TRUE EMERGENCY — bladder rupture and death can occur within 24-48 hours. Immediate veterinary intervention required.',
    source: 'International Society of Feline Medicine (ISFM), Merck Veterinary Manual',
    severity: 'critical',
    species: ['cat'],
  },
  {
    id: 'toxin-1',
    category: 'toxin',
    title: 'Common Toxic Foods for Dogs',
    content: 'NEVER feed dogs: chocolate (theobromine — dark chocolate is most dangerous), xylitol/artificial sweetener (causes rapid insulin release and liver failure), grapes/raisins (kidney failure), onions/garlic (hemolytic anemia), macadamia nuts, alcohol, caffeine, raw yeast dough, avocado (persin in skin/pit). If ingestion suspected, contact Pet Poison Helpline (1-855-426-7435) or your vet immediately.',
    source: 'ASPCA Animal Poison Control Center, Merck Veterinary Manual',
    severity: 'high',
    species: ['dog'],
  },
  {
    id: 'toxin-2',
    category: 'toxin',
    title: 'Common Toxic Substances for Cats',
    content: 'NEVER expose cats to: lilies (ALL parts — even pollen causes acute kidney failure), acetaminophen/Tylenol (fatal — cats cannot metabolize it), essential oils (tea tree, eucalyptus, peppermint, citrus), antifreeze/ethylene glycol (tiny amounts fatal), human medications, chocolate, onions/garlic, raw dough. If exposure occurs, seek emergency veterinary care immediately.',
    source: 'ASPCA Animal Poison Control Center, International Cat Care',
    severity: 'high',
    species: ['cat'],
  },
  {
    id: 'toxin-3',
    category: 'toxin',
    title: 'Xylitol Poisoning',
    content: 'Xylitol (artificial sweetener in sugar-free gum, candy, peanut butter, baked goods) is extremely toxic to dogs. As little as 0.1g/kg can cause hypoglycemia; 0.5g/kg can cause liver failure. Signs: vomiting, lethargy, loss of coordination, seizures, collapse. Onset is rapid (10-60 minutes). This is an emergency — do not wait for symptoms.',
    source: 'ASPCA Animal Poison Control Center, Journal of Veterinary Emergency and Critical Care',
    severity: 'critical',
    species: ['dog'],
  },
  {
    id: 'symptom-1',
    category: 'symptom',
    title: 'Vomiting — When to Worry',
    content: 'Occasional vomiting (once, pet otherwise normal) may be monitored for 12-24 hours with bland diet. SEEK VET CARE if: vomiting persists beyond 24 hours, blood in vomit, pet is lethargic/depressed, accompanied by diarrhea, pet cannot keep water down, suspected foreign body ingestion, or pet is very young/old. Note: repeated unproductive retching is an EMERGENCY (possible bloat).',
    source: 'Merck Veterinary Manual, WSAVA Guidelines',
    severity: 'medium',
    species: ['dog', 'cat'],
  },
  {
    id: 'symptom-2',
    category: 'symptom',
    title: 'Diarrhea — Assessment Guide',
    content: 'Mild diarrhea (1-2 episodes, pet otherwise bright) can be monitored with bland diet (boiled chicken + rice) for 24-48 hours. SEEK VET CARE if: diarrhea persists beyond 48 hours, blood in stool, black/tarry stool, pet is lethargic or vomiting, pet is a puppy/kitten (dehydration risk), or accompanied by fever. Prolonged diarrhea can cause dangerous dehydration.',
    source: 'Merck Veterinary Manual, WSAVA Gastrointestinal Guidelines',
    severity: 'medium',
    species: ['dog', 'cat'],
  },
  {
    id: 'symptom-3',
    category: 'symptom',
    title: 'Lethargy and Loss of Appetite',
    content: 'Pets that skip one meal but are otherwise acting normally can be monitored. SEEK VET CARE if: appetite loss exceeds 24 hours (cats) or 48 hours (dogs), accompanied by lethargy, hiding behavior, weight loss, vomiting/diarrhea, or changes in water consumption. Cats that stop eating for more than 48 hours risk hepatic lipidosis (fatty liver disease), which is life-threatening.',
    source: 'Merck Veterinary Manual, International Society of Feline Medicine',
    severity: 'medium',
    species: ['dog', 'cat'],
  },
  {
    id: 'symptom-4',
    category: 'symptom',
    title: 'Itching and Skin Issues',
    content: 'Common causes of pruritus (itching): flea allergy dermatitis (most common), food allergies, environmental allergies (atopic dermatitis), ear infections, mange, bacterial/fungal skin infections. Chronic scratching can lead to secondary infections. If itching persists beyond a few days, causes hair loss, skin redness, or hot spots, veterinary evaluation is needed. Flea prevention is the first line of defense.',
    source: 'WSAVA Dermatology Guidelines, Merck Veterinary Manual',
    severity: 'low',
    species: ['dog', 'cat'],
  },
  {
    id: 'symptom-5',
    category: 'symptom',
    title: 'Ear Infections — Signs and Care',
    content: 'Signs of ear infection: head shaking, scratching at ears, foul odor, redness, discharge, tilting head, pain when ears touched. Common in floppy-eared breeds (Cocker Spaniels, Basset Hounds, Golden Retrievers). Yeast infections (brown waxy discharge) and bacterial infections require different treatments. DO NOT put anything in the ear canal without veterinary guidance — ruptured eardrums can be worsened by improper cleaning.',
    source: 'Merck Veterinary Manual, WSAVA Guidelines',
    severity: 'medium',
    species: ['dog', 'cat'],
  },
  {
    id: 'care-1',
    category: 'care',
    title: 'Vaccination Guidelines (Core Vaccines)',
    content: 'DOGS — Core vaccines: DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza) and Rabies. Puppy series starts at 6-8 weeks, boosters every 3-4 weeks until 16 weeks. Rabies at 12-16 weeks. Adult boosters: DHPP every 3 years, Rabies per local law (1-3 years). CATS — Core vaccines: FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia) and Rabies. Kitten series starts at 6-8 weeks. Adult boosters every 3 years. WSAVA recommends titer testing as an alternative to routine revaccination for some diseases.',
    source: 'WSAVA Vaccination Guidelines, AAHA Canine Vaccination Guidelines, AAFP Feline Vaccination Guidelines',
    severity: 'high',
    species: ['dog', 'cat'],
  },
  {
    id: 'care-2',
    category: 'care',
    title: 'Dental Health',
    content: 'Dental disease affects 80% of dogs and 70% of cats by age 3. Signs: bad breath, yellow/brown tartar, red gums, difficulty eating, drooling, pawing at mouth. Prevention: daily tooth brushing with pet-safe toothpaste, dental chews, VOHC-approved products, annual veterinary dental exams. Professional dental cleaning under anesthesia is often necessary. Untreated dental disease can lead to heart, liver, and kidney damage.',
    source: 'AVDC (American Veterinary Dental College), Merck Veterinary Manual',
    severity: 'medium',
    species: ['dog', 'cat'],
  },
  {
    id: 'care-3',
    category: 'care',
    title: 'Flea and Tick Prevention',
    content: 'Year-round flea and tick prevention is recommended by veterinarians. Fleas can cause anemia (especially in young pets), tapeworms, and severe allergic dermatitis. Ticks transmit Lyme disease, Ehrlichia, Anaplasma, Rocky Mountain Spotted Fever, and babesiosis. Options: topical (Frontline, Advantage), oral (NexGard, Bravecto, Simparica), collars (Seresto). Choose based on pet lifestyle, age, and health status. Consult your vet for the best option.',
    source: 'CAPC (Companion Animal Parasite Council), Merck Veterinary Manual',
    severity: 'high',
    species: ['dog', 'cat'],
  },
  {
    id: 'care-4',
    category: 'care',
    title: 'Heartworm Prevention',
    content: 'Heartworm disease is transmitted by mosquitoes and is potentially fatal. Prevention is monthly (oral or topical) or every 6-12 months (injectable ProHeart). Annual heartworm testing is recommended even on prevention. Signs of infection: cough, fatigue, weight loss, swollen belly, heart failure. Treatment is expensive, risky, and requires strict exercise restriction. Prevention is far safer and more cost-effective than treatment.',
    source: 'American Heartworm Society, Merck Veterinary Manual',
    severity: 'high',
    species: ['dog'],
  },
  {
    id: 'care-5',
    category: 'care',
    title: 'Nutrition Basics',
    content: 'Feed age-appropriate, complete and balanced diets (look for AAFCO or FEDIAF statement). Puppies/kittens need higher protein and calories. Senior pets may need joint support and reduced calories. Avoid free-feeding (leads to obesity). Measure portions. Fresh water should always be available. Sudden diet changes can cause GI upset — transition over 7-10 days. Consult your vet for specific dietary needs, especially for pets with medical conditions.',
    source: 'WSAVA Global Nutrition Guidelines, AAHA Nutritional Assessment Guidelines',
    severity: 'medium',
    species: ['dog', 'cat'],
  },
  {
    id: 'care-6',
    category: 'care',
    title: 'Obesity in Pets',
    content: 'Over 50% of pets are overweight or obese. Obesity leads to diabetes, arthritis, heart disease, respiratory issues, and reduced lifespan (up to 2.5 years shorter). Body Condition Score (BCS): you should be able to feel ribs without pressing hard, see a waist from above, and see an abdominal tuck from the side. Weight management: measured portions, limit treats to 10% of daily calories, regular exercise, veterinary weight management plan.',
    source: 'AAHA Weight Management Guidelines, WSAVA Global Nutrition Guidelines',
    severity: 'medium',
    species: ['dog', 'cat'],
  },
  {
    id: 'breed-1',
    category: 'breed',
    title: 'Golden Retriever — Common Health Concerns',
    content: 'Golden Retrievers are predisposed to: hip and elbow dysplasia, heart conditions (subvalvular aortic stenosis), eye conditions (cataracts, PRA), skin allergies, hypothyroidism, and cancer (hemangiosarcoma, lymphoma — lifetime cancer risk ~60%). Regular screening: hip evaluations, cardiac exams, annual eye exams, thyroid panels. Maintain healthy weight to reduce joint stress. Average lifespan: 10-12 years.',
    source: 'Golden Retriever Club of America, Orthopedic Foundation for Animals (OFA)',
    severity: 'medium',
    species: ['dog'],
  },
  {
    id: 'breed-2',
    category: 'breed',
    title: 'German Shepherd — Common Health Concerns',
    content: 'German Shepherds are predisposed to: hip and elbow dysplasia, degenerative myelopathy (DM), exocrine pancreatic insufficiency (EPI), bloat/GDV, allergies, and epilepsy. Regular screening: OFA hip/elbow evaluations, DM genetic testing. Feed from elevated bowls is controversial for bloat — current evidence suggests it may INCREASE risk. Avoid strenuous exercise 1 hour before and after meals. Average lifespan: 9-13 years.',
    source: 'German Shepherd Dog Club of America, OFA, Merck Veterinary Manual',
    severity: 'medium',
    species: ['dog'],
  },
  {
    id: 'breed-3',
    category: 'breed',
    title: 'Persian Cat — Common Health Concerns',
    content: 'Persian cats are predisposed to: Polycystic Kidney Disease (PKD — genetic, affects ~38%), brachycephalic airway syndrome (breathing difficulties due to flat face), eye conditions (entropion, cherry eye, excessive tearing), dental malocclusions, hypertrophic cardiomyopathy (HCM), and skin fold dermatitis. Regular screening: PKD genetic testing/ultrasound, annual cardiac exams, daily eye cleaning. Average lifespan: 12-17 years.',
    source: 'International Cat Care, CFA, Merck Veterinary Manual',
    severity: 'medium',
    species: ['cat'],
  },
  {
    id: 'breed-4',
    category: 'breed',
    title: 'Labrador Retriever — Common Health Concerns',
    content: 'Labrador Retrievers are predisposed to: hip and elbow dysplasia, obesity (genetic predisposition — POMC gene mutation), exercise-induced collapse (EIC), progressive retinal atrophy (PRA), heart conditions, and osteochondritis dissecans (OCD). They are prone to overeating — strict portion control is essential. Regular screening: OFA hip/elbow, EIC genetic testing, annual eye exams. Average lifespan: 10-14 years.',
    source: 'Labrador Retriever Club, OFA, Merck Veterinary Manual',
    severity: 'medium',
    species: ['dog'],
  },
  {
    id: 'medication-1',
    category: 'medication',
    title: 'Never Give Human Medications Without Veterinary Guidance',
    content: 'DANGEROUS for pets: Ibuprofen (Advil, Motrin) — causes GI ulcers and kidney failure in dogs/cats. Acetaminophen (Tylenol) — FATAL to cats, causes liver damage in dogs. Aspirin — can be used in dogs under veterinary guidance but dosing is critical and it carries GI bleeding risk. Naproxen (Aleve) — toxic to dogs and cats. ALWAYS consult your veterinarian before giving any human medication. Many human drugs are toxic to pets at doses that seem small.',
    source: 'ASPCA Animal Poison Control Center, Merck Veterinary Manual',
    severity: 'critical',
    species: ['dog', 'cat'],
  },
  {
    id: 'medication-2',
    category: 'medication',
    title: 'Common Veterinary Medications (Informational Only)',
    content: 'Commonly prescribed by veterinarians: Amoxicillin-clavulanate (broad-spectrum antibiotic), Metronidazole (GI infections, diarrhea), Prednisone/Prednisolone (anti-inflammatory, immunosuppressant), Apoquel/Cytopoint (itching/allergies in dogs), Gabapentin (pain, anxiety), Carprofen/Meloxicam (NSAIDs for pain/inflammation — NEVER combine with steroids). DOSING is weight-specific and condition-specific. NEVER self-prescribe or adjust doses without veterinary guidance.',
    source: 'Merck Veterinary Manual, Plumb\'s Veterinary Drug Handbook',
    severity: 'high',
    species: ['dog', 'cat'],
  },
  {
    id: 'symptom-6',
    category: 'symptom',
    title: 'Coughing in Dogs',
    content: 'Causes of coughing: kennel cough (infectious tracheobronchitis — dry, honking cough), heart disease (especially in small breeds — cough worsens at night), collapsing trachea (common in toy breeds — goose-honk cough), heartworm disease, pneumonia, lung tumors, or foreign body. SEEK VET CARE if: cough persists beyond a few days, is accompanied by lethargy or difficulty breathing, produces colored discharge, or your pet is not eating. Emergency if: gums are blue/pale, pet is struggling to breathe.',
    source: 'Merck Veterinary Manual, ACVIM Consensus Guidelines',
    severity: 'medium',
    species: ['dog'],
  },
  {
    id: 'symptom-7',
    category: 'symptom',
    title: 'Increased Thirst and Urination (PU/PD)',
    content: 'Polyuria/polydipsia (excessive urination/thirst) can indicate: diabetes mellitus, kidney disease, Cushing\'s disease, liver disease, urinary tract infection, or hypercalcemia. Normal water intake: dogs ~50-100ml/kg/day, cats ~20-30ml/kg/day. If your pet is drinking significantly more than usual or having accidents indoors, veterinary bloodwork and urinalysis are recommended. Early detection of kidney disease and diabetes significantly improves outcomes.',
    source: 'Merck Veterinary Manual, ACVIM Guidelines',
    severity: 'high',
    species: ['dog', 'cat'],
  },
  {
    id: 'care-7',
    category: 'care',
    title: 'Senior Pet Care (7+ Years)',
    content: 'Senior pets need: bi-annual veterinary checkups (vs. annual for adults), senior blood panels (CBC, chemistry, thyroid), urinalysis, blood pressure monitoring, dental evaluations, joint health support (glucosamine, omega-3, weight management), cognitive health monitoring (disorientation, sleep changes, house soiling), and adjusted nutrition (senior-formulated diets). Early detection of age-related diseases (kidney, thyroid, heart, cancer) dramatically improves quality of life and longevity.',
    source: 'AAHA Senior Canine Guidelines, AAFP Senior Cat Guidelines',
    severity: 'medium',
    species: ['dog', 'cat'],
  },
];

export function getKnowledgeByCategory(category: VetKnowledgeEntry['category']): VetKnowledgeEntry[] {
  return VET_KNOWLEDGE_BASE.filter(e => e.category === category);
}

export function getKnowledgeBySpecies(species: VetKnowledgeEntry['species'][number]): VetKnowledgeEntry[] {
  return VET_KNOWLEDGE_BASE.filter(e => e.species?.includes(species));
}

export function getEmergencyKnowledge(): VetKnowledgeEntry[] {
  return VET_KNOWLEDGE_BASE.filter(e => e.severity === 'critical' || e.category === 'emergency');
}

export function searchKnowledge(query: string): VetKnowledgeEntry[] {
  const lower = query.toLowerCase();
  return VET_KNOWLEDGE_BASE.filter(e =>
    e.title.toLowerCase().includes(lower) ||
    e.content.toLowerCase().includes(lower) ||
    e.source.toLowerCase().includes(lower)
  );
}

export function buildKnowledgeContext(
  petType: string,
  petBreed: string,
  userMessage: string
): string {
  const relevantEntries: VetKnowledgeEntry[] = [];

  const species = petType.toLowerCase().includes('cat') ? 'cat' :
                  petType.toLowerCase().includes('dog') ? 'dog' : null;

  if (species) {
    relevantEntries.push(...getKnowledgeBySpecies(species));
  }

  const searchResults = searchKnowledge(userMessage);
  for (const result of searchResults) {
    if (!relevantEntries.find(e => e.id === result.id)) {
      relevantEntries.push(result);
    }
  }

  const emergencies = getEmergencyKnowledge();
  for (const emergency of emergencies) {
    if (!relevantEntries.find(e => e.id === emergency.id)) {
      relevantEntries.push(emergency);
    }
  }

  const context = relevantEntries.slice(0, 8).map(e =>
    `[${e.category.toUpperCase()}] ${e.title}\n${e.content}\nSource: ${e.source}`
  ).join('\n\n---\n\n');

  return context;
}
