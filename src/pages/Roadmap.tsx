import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, RefreshCw, Lock, Stethoscope, Shield, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { DEMO_ROADMAP_TEXT, usePetProfile } from '../hooks/usePetProfile';
import HealthJourney, { Stage, Task } from '../components/HealthJourney';
import Markdown from 'react-markdown';
import Logo from '../components/Logo';
import PlanetOrbLoader from '../components/PlanetOrbLoader';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

const generateRoadmapText = async (formData: any) => {
  if (!apiKey) {
    throw new Error('Groq API Key missing');
  }
  
  const petProfile = {
    name: formData.name,
    species: formData.species,
    breed: formData.breed,
    age: formData.age,
    issues: formData.issues
  };
  const medicalHistory = formData.medicalHistory || 'None';

  try {
     const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
       method: "POST",
       headers: {
         "Authorization": `Bearer ${apiKey}`,
         "Content-Type": "application/json"
       },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are an elite veterinary longevity researcher at Planet Animal Hospital. 
Your task is to generate a comprehensive, science-backed health roadmap.

STRUCTURE RULES (CRITICAL):
1. Use EXACTLY these headings for phases: '### Phase: 1-3 Months', '### Phase: 3-6 Months', '### Phase: 6-12 Months', '### Phase: Long-term'.
2. For each phase, provide 3 specific action items as bullet points.
3. Format each bullet point EXACTLY like this:
   * **[Action Name]**: [Short Description] | [Scientific Rationale: ...]
4. Each rationale should be a concise, authoritative explanation of WHY this extends life or improves health.
5. Include a '### Verifiable Sources' section at the end with 2-3 real links to institutions like AVMA (avma.org), AAHA (aaha.org), or Cornell Vet (vet.cornell.edu).
6. Tone: Premium, visionary, and deeply scientific. Avoid fluff.`
            },
           {
             role: "user",
             content: `Generate a longevity roadmap for ${petProfile.name}.
Species: ${petProfile.species}
Breed: ${petProfile.breed}
Age: ${petProfile.age}
Primary Concerns: ${petProfile.issues}
Medical History: ${medicalHistory}
Surgical History: ${formData.surgicalHistory || 'None'}`
           }
         ],
         temperature: 0.6,
         max_tokens: 2500
       })
     });

     if (!response.ok) {
       const errText = await response.text();
       throw new Error(`API Error: ${response.status} ${errText}`);
     }

     const data = await response.json();
     const markdownText = data.choices[0].message.content;
     return markdownText || "Failed to generate roadmap.";
  } catch (error: any) {
    console.error("Error generating roadmap:", error);
    throw new Error(error.message || "Failed to generate roadmap.");
  }
};

const parseRoadmap = (text: string, progressData: any = {}): Stage[] => {
  const stages: Stage[] = [];
  
  // More robust regex to split by any header that looks like a Phase
  const phaseRegex = /### Phase:\s*([^\n]+)/gi;
  let match;
  const phaseIndices: { start: number; title: string }[] = [];
  
  while ((match = phaseRegex.exec(text)) !== null) {
    phaseIndices.push({ start: match.index, title: match[1].trim() });
  }
  
  for (let i = 0; i < phaseIndices.length; i++) {
    const start = phaseIndices[i].start;
    const end = phaseIndices[i + 1]?.start || text.length;
    const phaseContent = text.substring(start, end);
    const title = phaseIndices[i].title;
    
    const tasks: Task[] = [];
    // Robust task extraction: bullet point followed by **Name**: Desc | Rationale
    const taskRegex = /\*\s+\*\*([^*]+)\*\*\s*:\s*([^|]+)(?:\|\s*(?:Scientific Rationale:\s*)?([^|*\n]+))?/gi;
    let tMatch;
    let taskIdx = 0;
    
    while ((tMatch = taskRegex.exec(phaseContent)) !== null) {
      const taskName = tMatch[1].trim();
      const taskDesc = tMatch[2].trim();
      const rationale = tMatch[3]?.trim() || '';
      
      const taskId = `${title}-${taskIdx}`;
      const isCompleted = progressData[taskId] || false;
      
      tasks.push({
        id: taskId,
        text: `${taskName}: ${taskDesc}`,
        rationale: rationale,
        completed: isCompleted
      });
      taskIdx++;
    }

    if (tasks.length > 0) {
      stages.push({
        id: title,
        title: title,
        tasks: tasks,
        isUnlocked: false // Will be set in the next pass
      });
    }
  }

  // Ensure stages are unlocked sequentially based on completion
  for (let i = 0; i < stages.length; i++) {
    if (i === 0) {
      stages[i].isUnlocked = true;
    } else {
      const prevStage = stages[i-1];
      stages[i].isUnlocked = prevStage.tasks.length > 0 && prevStage.tasks.every(t => t.completed);
    }
  }
  
  return stages;
};

export default function Roadmap() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading, updateProfile } = usePetProfile();
  const isDemoMode = window.location.search.includes('demo_mode=true');
  
  const isProfileIncomplete = !profile?.petName && !profile?.name;

  const [formData, setFormData] = useState({ 
    name: profile?.petName || profile?.name || '', 
    species: profile?.petType || 'Dog', 
    breed: profile?.breed || '', 
    age: profile?.age || '5', 
    issues: profile?.healthHistory || '',
    medicalHistory: profile?.medicalHistory || '',
    surgicalHistory: profile?.surgicalHistory || ''
  });
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [hasAutoGenerated, setHasAutoGenerated] = useState(false);

  useEffect(() => {
    if (!isProfileIncomplete && !roadmap && !loading && !hasAutoGenerated) {
      const autoGenerate = async () => {
        setHasAutoGenerated(true);

        const cachedRoadmap = profile?.cachedRoadmap || (isDemoMode ? DEMO_ROADMAP_TEXT : '');
        const roadmapGeneratedAt = profile?.roadmapGeneratedAt || (isDemoMode ? Date.now() : 0);

        if (cachedRoadmap && roadmapGeneratedAt) {
          if ((Date.now() - roadmapGeneratedAt) < 5184000000) {
            setRoadmap(cachedRoadmap);
            return;
          }
        }
        
        setLoading(true);
        const currentData = {
          name: profile?.petName || profile?.name || '',
          species: profile?.petType || 'Dog',
          breed: profile?.breed || '',
          age: profile?.age || '5',
          issues: profile?.healthHistory || '',
          medicalHistory: profile?.medicalHistory || '',
          surgicalHistory: profile?.surgicalHistory || ''
        };
        setFormData(currentData);

        try {
          const generated = await generateRoadmapText(currentData);
          setRoadmap(generated);
          if (updateProfile) {
            try {
              await updateProfile({
                cachedRoadmap: generated,
                roadmapGeneratedAt: Date.now()
              });
            } catch (err) {
              console.error('Failed to cache roadmap:', err);
            }
          }
        } catch (err: any) {
          setError(err.message || 'Failed to generate roadmap.');
          // Don't keep trying to auto-generate if it failed once
          setHasAutoGenerated(true);
        } finally {
          setLoading(false);
        }
      };
      autoGenerate();
    }
  }, [isProfileIncomplete, roadmap, loading, hasAutoGenerated, profile, updateProfile]);

  const handleInputChange = (e: any) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!formData.name || !formData.breed || !formData.age) return setError('Please fill in Name, Breed, and Age.');
    
    setError('');
    setRoadmap(null);
    setLoading(true);
    
    const latestData = {
      ...formData,
      medicalHistory: profile?.medicalHistory || '',
      surgicalHistory: profile?.surgicalHistory || ''
    };
    
    try {
      const generated = await generateRoadmapText(latestData);
      setRoadmap(generated);
      if (updateProfile) {
        try {
          await updateProfile({
            cachedRoadmap: generated,
            roadmapGeneratedAt: Date.now()
          });
        } catch (err) {
          console.error('Failed to cache roadmap:', err);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate roadmap.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRoadmap(null);
    setFormData({ 
      name: profile?.petName || profile?.name || '', 
      species: profile?.petType || 'Dog', 
      breed: profile?.breed || '', 
      age: profile?.age || '5', 
      issues: profile?.healthHistory || '',
      medicalHistory: profile?.medicalHistory || '',
      surgicalHistory: profile?.surgicalHistory || ''
    });
  };

  if (profileLoading) {
    return (
      <PlanetOrbLoader
        label="Loading Pet Profile"
        detail="Gathering the health context for your roadmap"
        className="h-full pb-32"
      />
    );
  }

  if (isProfileIncomplete) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl dark:backdrop-blur-[24px] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] rounded-[2rem] p-10 max-w-md w-full text-center flex flex-col items-center"
        >
          <div className="w-24 h-24 bg-[#fec708]/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(254,199,8,0.3)] border border-[#fec708]/50">
            <Lock className="w-10 h-10 text-[#fec708]" />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-white mb-3">Profile Incomplete</h2>
          <p className="font-body font-medium text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
            A complete profile is required to unlock the personalized Longevity Roadmap for your pet.
          </p>
          <button 
            onClick={() => navigate('/settings')}
            className="w-full bg-gradient-to-r from-[#fec708] to-[#fec708] text-black py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(254,199,8,0.4)] hover:scale-[1.02] active:scale-95 transition-all"
          >
            Update Profile
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col pb-32">
      <div className="relative flex items-center justify-center pt-8 pb-4 w-full">
        {/* Outer Aura */}
        <div className="absolute w-64 h-64 bg-[#fec708]/15 rounded-full blur-[100px] mix-blend-screen transform-gpu" style={{ animation: 'pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
        {/* Inner Core */}
        <div className="absolute w-40 h-40 bg-white/10 rounded-full blur-[70px] mix-blend-screen transform-gpu" style={{ animation: 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite', animationDelay: '1s' }}></div>
        {/* The Logo Container */}
        <div className="relative z-10 p-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl shadow-[0_0_50px_rgba(255,255,255,0.05)] flex items-center justify-center">
          <Logo className="!w-24 !h-24 z-20 relative transform transition-transform duration-700 hover:scale-105" />
        </div>
      </div>
      <AnimatePresence>
        {loading && (
          <PlanetOrbLoader
            key="loading-overlay"
            compact
            label="Building Longevity Roadmap"
            detail="Synthesizing Planet Animal Hospital care signals"
            className="min-h-[56vh]"
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {!loading && (
          <motion.div
            key="roadmap-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 max-w-2xl md:max-w-4xl mx-auto w-full p-6"
          >
            <div className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl dark:backdrop-blur-[24px] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.4)] rounded-[2rem] overflow-hidden">
              <AnimatePresence mode="wait">
                {!roadmap ? (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 sm:p-10 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="bg-[#fec708] p-3 rounded-xl shadow-[0_0_20px_rgba(254,199,8,0.3)]">
                        <Sparkles className="w-6 h-6 text-black" />
                      </div>
                      <div>
                        <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white">Longevity Roadmap</h3>
                        <p className="font-body font-medium text-slate-500 dark:text-slate-300 text-sm leading-relaxed">Personalized health timeline</p>
                      </div>
                    </div>
                    
                    {error && (
                      <div className="mb-6 p-3 bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-white backdrop-blur-md border border-red-200 dark:border-red-500/30 rounded-lg text-sm font-medium">
                        {error}
                      </div>
                    )}
                    
                    <div className="flex-1 flex flex-col justify-center space-y-6">
                      <p className="font-body text-slate-600 dark:text-slate-300 text-center leading-relaxed">
                        Ready to generate a highly personalized health and longevity roadmap for <strong>{profile?.petName || profile?.name || 'your pet'}</strong> using advanced AI based on their specific breed and medical history?
                      </p>
                      
                      <button onClick={handleSubmit} disabled={loading} className="w-full bg-gradient-to-r from-[#fec708] to-[#fec708] text-black py-4 rounded-xl font-heading font-extrabold tracking-wide flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(254,199,8,0.4)] hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100 transition-all">
                        Generate My Roadmap <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 sm:p-10 flex-1 flex flex-col space-y-8">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-slate-200 dark:border-white/[0.08] pb-8">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fec708]/20 text-[#fec708] text-xs font-bold mb-3 border border-[#fec708]/50 shadow-sm">
                          <Sparkles className="w-3 h-3" /> Roadmap Generated{profile?.roadmapGeneratedAt ? ` on ${new Date(profile.roadmapGeneratedAt).toLocaleDateString()}` : ''}
                        </div>
                        <h2 className="font-heading font-extrabold text-3xl md:text-4xl text-[#fec708] tracking-tight drop-shadow-sm">
                          {(formData?.name || profile?.petName || profile?.name || 'Your Pet')}'s <span className="text-white dark:text-white">Longevity Plan</span>
                        </h2>
                      </div>
                      <button onClick={handleSubmit} className="p-3 text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white bg-white/50 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200 dark:border-white/[0.08] rounded-full hover:bg-white dark:hover:bg-white/[0.08] transition-all shadow-sm group active:scale-95" title="Refresh/Start Over">
                        <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                      </button>
                    </div>
                    
                    <div className="font-body text-slate-300 text-base leading-relaxed tracking-wide space-y-12">
                      {parseRoadmap(roadmap, profile?.roadmapProgress || {}).length > 0 ? (
                        <>
                          <HealthJourney 
                            petName={profile?.petName || profile?.name || 'Your Pet'}
                            stages={parseRoadmap(roadmap, profile?.roadmapProgress || {})}
                            onToggleTask={async (stageId, taskId) => {
                              const currentProgress = profile?.roadmapProgress || {};
                              const newProgress = {
                                ...currentProgress,
                                [taskId]: !currentProgress[taskId]
                              };
                              
                              if (updateProfile) {
                                try {
                                  await updateProfile({
                                    roadmapProgress: newProgress
                                  });
                                } catch (err) {
                                  console.error('Failed to update roadmap progress:', err);
                                }
                              }
                            }}
                          />

                          <div className="pt-16 mt-12 border-t border-white/10 relative">
                            {/* Vault Icon Header */}
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-[#fec708] rounded-full flex items-center gap-2 shadow-[0_0_30px_rgba(254,199,8,0.4)]">
                              <Shield size={16} className="text-black" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black">Evidence Vault</span>
                            </div>

                            <div className="bg-black/40 rounded-[2rem] p-8 border border-white/5 shadow-2xl">
                              <h3 className="font-heading font-black text-2xl uppercase tracking-tighter italic text-white mb-6 flex items-center gap-3">
                                <Stethoscope className="text-[#fec708]" /> Scientific <span className="text-[#fec708]">Foundation</span>
                              </h3>
                              
                              <div className="prose prose-invert max-w-none">
                                <Markdown
                                  components={{
                                    h1: ({node, ...props}) => <h1 className="hidden" {...props} />,
                                    h2: ({node, ...props}) => <h2 className="hidden" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="font-heading text-lg font-black uppercase tracking-tight text-white/90 mt-6 mb-3" {...props} />,
                                    p: ({node, ...props}) => <p className="font-body text-white/50 text-sm leading-relaxed mb-4" {...props} />,
                                    ul: ({node, ...props}) => <ul className="space-y-3 mb-8" {...props} />,
                                    li: ({node, ...props}) => (
                                      <li className="flex items-start gap-3 text-xs text-white/70 bg-white/[0.03] p-4 rounded-xl border border-white/5 hover:border-[#fec708]/20 transition-colors">
                                        <div className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#fec708] shadow-[0_0_8px_rgba(254,199,8,0.8)]" />
                                        <span className="flex-1">{props.children}</span>
                                      </li>
                                    ),
                                    a: ({node, ...props}) => (
                                      <a 
                                        className="inline-flex items-center gap-1 text-[#fec708] hover:text-white font-bold transition-all group" 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        {...props}
                                      >
                                        {props.children}
                                        <ExternalLink size={10} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                      </a>
                                    )
                                  }}
                                >
                                  {roadmap.split('### Verifiable Sources')[1] || ''}
                                </Markdown>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <Markdown
                          components={{
                            h1: ({node, ...props}) => <h1 className="font-heading font-extrabold text-3xl text-[#fec708] mt-12 mb-6 border-b border-[#fec708]/20 pb-4 tracking-tight" {...props} />,
                            h2: ({node, ...props}) => <h2 className="font-heading font-bold text-2xl text-[#fec708] mt-10 mb-5 tracking-tight border-l-4 border-[#fec708] pl-4" {...props} />,
                            h3: ({node, ...props}) => <h3 className="font-heading font-semibold text-xl text-[#fec708]/90 mt-8 mb-4 tracking-tight" {...props} />,
                            p: ({node, ...props}) => <p className="font-body text-slate-300 leading-relaxed mb-6 text-left" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-4 mb-8 text-left" {...props} />,
                            li: ({node, ...props}) => <li className="font-body text-slate-300 leading-relaxed pl-2 text-left" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-[#fec708]" {...props} />,
                            a: ({node, ...props}) => <a className="text-[#fec708] hover:text-white underline underline-offset-4 decoration-[#fec708]/30 hover:decoration-white transition-all" target="_blank" rel="noopener noreferrer" {...props} />
                          }}
                        >
                          {roadmap}
                        </Markdown>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
