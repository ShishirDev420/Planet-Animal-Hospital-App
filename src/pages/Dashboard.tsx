import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, Calendar, FileText, Award, ChevronRight, Gift, X, Dog, 
  CheckCircle2, Syringe, Sparkles, Stethoscope, ChevronDown, ChevronUp, Loader2 
} from 'lucide-react';
import Logo from '../components/Logo';
import DualAvatar from '../components/DualAvatar';
import { useProfileImages } from '../hooks/useProfileImages';
import { usePawPoints } from '../hooks/usePawPoints';

const SERVICE_MENU = [
  {
    category: "Grooming Spa",
    icon: <Sparkles size={18} />,
    items: [
      { name: "Standard Spa Session", price: "₹1,199" },
      { name: "Medicated Bath (Tick/Flea/Fungal)", price: "₹1,499" }
    ]
  },
  {
    category: "General Checkup",
    icon: <Stethoscope size={18} />,
    items: [
      { name: "Standard Wellness Check", price: "₹500" },
      { name: "Emergency Checkup (Skip the line)", price: "₹1,200" }
    ]
  },
  {
    category: "Dental Scaling",
    icon: <Dog size={18} />,
    items: [
      { name: "Dental Scaling Consultation", price: "₹450" },
      { name: "Full Dental Scaling", price: "₹2,500" }
    ]
  },
  {
    category: "Vaccinations (Dog Specific)",
    icon: <Syringe size={18} />,
    items: [
      { name: "Anti-Rabies", price: "₹400" },
      { name: "7-in-1 Combo (DHPPiL)", price: "₹950" },
      { name: "Bordetella (Kennel Cough)", price: "₹800" }
    ]
  },
  {
    category: "Skin Checkup",
    icon: <FileText size={18} />,
    items: [
      { name: "Skin Issues Consultation", price: "₹650" }
    ]
  }
];

const petProfile = { name: 'Johnny', breed: 'American Bully', age: 8, isSenior: true };

function getPersonalizedIncentives(pet: { name: string, breed: string, age: number, isSenior: boolean }) {
  const incentives = [];

  if (pet.isSenior) {
    incentives.push({
      id: "senior-health",
      title: "Senior Health Screening",
      subtext: "Specialized care for the golden years.",
      pointsText: "+1,200 pts",
      pointsValue: 1200,
      highValue: true,
      theme: "blue" as const
    });
  }

  const breedLower = pet.breed.toLowerCase();
  if (breedLower.includes('bully') || breedLower.includes('pug')) {
    incentives.push({
      id: "joint-mobility",
      title: "Joint & Mobility Check",
      subtext: "Keep those joints healthy.",
      pointsText: "+800 pts",
      pointsValue: 800,
      highValue: true,
      theme: "blue" as const
    });
    incentives.push({
      id: "respiratory-wellness",
      title: "Respiratory Wellness",
      subtext: "Breathe easy and stay active.",
      pointsText: "+700 pts",
      pointsValue: 700,
      theme: "green" as const
    });
  } else if (breedLower.includes('golden retriever')) {
    incentives.push({
      id: "advanced-grooming",
      title: "Advanced Grooming Spa",
      subtext: "Deep clean for that golden coat.",
      pointsText: "+900 pts",
      pointsValue: 900,
      highValue: true,
      theme: "yellow" as const
    });
  }

  // Standard baseline options
  incentives.push({
    id: "general-checkup",
    title: "General Checkup",
    subtext: "Standard wellness check.",
    pointsText: "+1,000 pts",
    pointsValue: 1000,
    highValue: true,
    theme: "yellow" as const
  });
  
  incentives.push({
    id: "vaccinations",
    title: "Vaccinations",
    subtext: "Keep them protected.",
    pointsText: "+750 pts",
    pointsValue: 750,
    theme: "yellow" as const
  });

  incentives.push({
    id: "social-spotlight",
    title: "Social Spotlight",
    subtext: "Tag us in a pic of your pet!",
    pointsText: "+300 pts",
    pointsValue: 300,
    theme: "purple" as const
  });

  return incentives;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { harshalImage, johnnyImage } = useProfileImages();
  const { verifiedPoints, pendingPoints, pendingActions, addPoints } = usePawPoints();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Booking State
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Drag-to-Scroll State
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  // Wheel-to-Horizontal-Scroll Logic
  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    let isThrottled = false;

    const handleWheel = (e: WheelEvent) => {
      // Prevent vertical scrolling of the page
      e.preventDefault();
      
      if (isThrottled) return;
      isThrottled = true;
      
      // Translate vertical wheel movement to horizontal scrolling
      carousel.scrollBy({ left: e.deltaY > 0 ? 400 : -400, behavior: 'smooth' });
      
      setTimeout(() => {
        isThrottled = false;
      }, 400);
    };

    // Attach non-passive event listener to allow preventDefault()
    carousel.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      carousel.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const closeModal = () => {
    setActiveModal(null);
    setTimeout(() => {
      setSelectedServices([]);
      setExpandedCategory(null);
      setIsConnecting(false);
    }, 300); // reset after close animation
  };

  const toggleService = (serviceName: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceName) 
        ? prev.filter(s => s !== serviceName)
        : [...prev, serviceName]
    );
  };

  const handleConfirmBooking = () => {
    if (selectedServices.length === 0) return;
    setIsConnecting(true);
    
    setTimeout(() => {
      const serviceList = selectedServices.map(s => `- ${s}`).join('\n');
      const message = `Hi Planet Animal Hospital! 🐾 I am reaching out from the app. I would like to book the following for my pet:\n${serviceList}\nCould you let me know what times are available today or tomorrow?`;
      
      window.open('https://wa.me/919004290923?text=' + encodeURIComponent(message), '_blank');
      
      setIsConnecting(false);
      closeModal();
    }, 500);
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      {/* Header with Logo */}
      <header className="pt-4 mb-2">
        <div className="flex justify-between items-center relative mb-6">
          <button onClick={() => navigate('/profiles')} className="shrink-0 group z-10">
            <div className="animate-sync-heartbeat origin-left">
              <Logo className="!w-16 !h-16" />
            </div>
          </button>
          
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-start pointer-events-none whitespace-nowrap z-0">
            <span className="font-black tracking-tight text-lg uppercase text-slate-800 block leading-none">Planet Animal</span>
            <span className="text-planet-yellow font-bold tracking-[0.2em] text-[9px] uppercase mt-1">Hospital & Wellness</span>
          </div>

          <button onClick={() => navigate('/settings')} className="shrink-0 z-10">
            <div className="animate-sync-heartbeat origin-center">
              <DualAvatar 
                leftImage={harshalImage}
                rightImage={johnnyImage}
                className="w-16 h-16"
              />
            </div>
          </button>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hi, Harshal 👋</h1>
          <p className="text-slate-500 text-sm">Let's keep Johnny healthy today.</p>
        </div>
      </header>

      {/* Points Wallet - Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-planet-yellow/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 bg-white/50 px-3 py-1 rounded-full backdrop-blur-md border border-white/60 shadow-sm">
              <Award className="text-planet-yellow" size={16} />
              <span className="text-xs font-bold text-slate-800">Proactive Member</span>
            </div>
            <div className="bg-planet-yellow text-black text-[10px] uppercase tracking-wider font-black px-2 py-1 rounded-lg shadow-sm">
              2x Multiplier
            </div>
          </div>
          <h2 className="text-slate-600 text-sm font-medium mb-1">Paw Points Balance</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tighter text-slate-800">{verifiedPoints.toLocaleString()}</span>
            <span className="text-planet-yellow font-bold">pts</span>
          </div>
          
          {pendingPoints > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="bg-yellow-400/20 backdrop-blur-md text-yellow-700 border border-yellow-300/50 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                + {pendingPoints.toLocaleString()} Pending
              </div>
              <span className="text-[10px] text-slate-400 font-medium max-w-[150px] leading-tight">
                Points are verified after clinic confirmation via WhatsApp.
              </span>
            </div>
          )}

          <div className="mt-5">
            <div className="h-2.5 w-full bg-slate-900/10 rounded-full overflow-hidden shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (verifiedPoints / 5000) * 100)}%` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                className="h-full bg-gradient-to-r from-planet-yellow to-yellow-400 rounded-full"
              />
            </div>
            <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-wider">
              {Math.max(0, 5000 - verifiedPoints).toLocaleString()} points until your next <span className="text-slate-800">FREE Consultation!</span>
            </p>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95 transition-transform text-sm">
              <QrCode size={16} />
              Scan to Earn
            </button>
            <button 
              onClick={() => setActiveModal('redeem')}
              className="flex-1 bg-white/80 backdrop-blur-md text-slate-900 border border-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform text-sm"
            >
              <Gift size={16} className="text-planet-yellow" />
              Redeem
            </button>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <ActionCard 
            icon={<Calendar className="text-teal-500" />} 
            title="Book Visit" 
            subtitle="Checkups & Grooming" 
            onClick={() => setActiveModal('book')}
          />
          <ActionCard 
            icon={<FileText className="text-indigo-500" />} 
            title="Medical Records" 
            subtitle="Vaccines & History" 
            onClick={() => setActiveModal('records')}
          />
        </div>
      </div>

      {/* Upcoming */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Upcoming for Johnny</h3>
          <button className="text-planet-yellow text-sm font-bold flex items-center">View All <ChevronRight size={16}/></button>
        </div>
        <div className="glass rounded-2xl p-4 flex items-center gap-4">
          <div className="bg-teal-100 w-12 h-12 rounded-xl flex items-center justify-center text-teal-600 font-bold text-xl shrink-0">
            12
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Annual Wellness Exam</h4>
            <p className="text-sm text-slate-500">Dr. Naveen • 10:30 AM</p>
          </div>
        </div>
      </div>

      {/* Ways to Earn Points */}
      <div className="pt-2">
        <h3 className="text-lg font-bold mb-4">Ways to Earn Points</h3>
        <div 
          ref={carouselRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-6 pb-8 -mx-6 px-6 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {getPersonalizedIncentives(petProfile).map((incentive) => (
            <EarnCard 
              key={incentive.id}
              id={incentive.id}
              title={incentive.title}
              subtext={incentive.subtext}
              pointsText={incentive.pointsText}
              pointsValue={incentive.pointsValue}
              highValue={incentive.highValue}
              theme={incentive.theme}
              isPending={pendingActions.includes(incentive.id)}
              onBook={(id, val, title) => {
                addPoints(val, id);
                const message = `Hi Planet Animal Hospital! 🐾 I am reaching out from the app. I would like to book the following for my pet:\n- ${title}\nCould you let me know what times are available today or tomorrow?`;
                window.open('https://wa.me/919004290923?text=' + encodeURIComponent(message), '_blank');
              }} 
            />
          ))}
        </div>
      </div>

      {/* Modals / Bottom Sheets */}
      <AnimatePresence>
        {activeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-2xl rounded-t-3xl z-[70] p-6 pb-12 border-t border-white/50 shadow-2xl max-h-[85vh] overflow-y-auto hide-scrollbar flex flex-col"
            >
              <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-6 shrink-0" />
              
              {activeModal === 'book' && (
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-6 shrink-0">
                    <h2 className="text-2xl font-bold">Book a Visit</h2>
                    <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
                  </div>
                  
                  <div className="space-y-4 overflow-y-auto hide-scrollbar pb-4 flex-1">
                    {SERVICE_MENU.map((category) => (
                      <div key={category.category} className="bg-white/60 rounded-2xl border border-white overflow-hidden shadow-sm">
                        <button 
                          onClick={() => setExpandedCategory(expandedCategory === category.category ? null : category.category)}
                          className="w-full flex items-center justify-between p-4 bg-white/40 active:bg-white/60 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-slate-500">{category.icon}</div>
                            <span className="font-bold text-slate-800">{category.category}</span>
                          </div>
                          {expandedCategory === category.category ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                        </button>
                        
                        <AnimatePresence>
                          {expandedCategory === category.category && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-2 space-y-2 bg-slate-50/50">
                                {category.items.map((item) => {
                                  const isSelected = selectedServices.includes(item.name);
                                  return (
                                    <div 
                                      key={item.name}
                                      onClick={() => toggleService(item.name)}
                                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                                        isSelected 
                                          ? 'bg-planet-yellow/10 border-planet-yellow shadow-sm' 
                                          : 'bg-white border-transparent hover:border-slate-200'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                          isSelected ? 'border-planet-yellow bg-planet-yellow text-black' : 'border-slate-300'
                                        }`}>
                                          {isSelected && <CheckCircle2 size={14} />}
                                        </div>
                                        <span className={`text-sm ${isSelected ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                          {item.name}
                                        </span>
                                      </div>
                                      <span className="text-xs font-bold text-slate-500">{item.price}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 mt-auto shrink-0 bg-white/90 backdrop-blur-md border-t border-slate-100">
                    <button 
                      onClick={handleConfirmBooking}
                      disabled={selectedServices.length === 0 || isConnecting}
                      className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                        selectedServices.length === 0
                          ? 'bg-slate-200 text-slate-400 shadow-none'
                          : 'bg-planet-yellow text-black shadow-planet-yellow/20 active:scale-95'
                      }`}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Connecting to WhatsApp...
                        </>
                      ) : (
                        `Confirm Booking (${selectedServices.length})`
                      )}
                    </button>
                  </div>
                </div>
              )}

              {activeModal === 'records' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Medical Records</h2>
                    <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
                  </div>
                  <div className="text-center py-12 px-4">
                    <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FileText size={40} className="text-indigo-300" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Awaiting First Visit</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      Your pet's medical records, vaccination history, and test results will automatically populate here as you keep visiting us.
                    </p>
                  </div>
                </div>
              )}

              {activeModal === 'redeem' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Redeem Points</h2>
                    <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
                  </div>
                  <div className="space-y-4">
                    <RewardOption title="Free Gourmet Treat" points="500" />
                    <RewardOption title="10% Off Grooming" points="1,200" />
                    <RewardOption title="Free Toy of Choice" points="2,000" />
                    <RewardOption title="Free General Consult" points="5,000" />
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionCard({ icon, title, subtitle, onClick }: { icon: React.ReactNode, title: string, subtitle: string, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="glass rounded-2xl p-4 flex flex-col items-start gap-3 active:scale-95 transition-transform cursor-pointer hover:bg-white/50"
    >
      <div className="bg-white/80 p-2 rounded-xl shadow-sm">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function RewardOption({ title, points }: { title: string, points: string }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white/50">
      <span className="font-bold text-slate-700">{title}</span>
      <button className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg active:scale-95 transition-transform">
        {points} pts
      </button>
    </div>
  );
}

function EarnCard({ id, title, subtext, pointsText, pointsValue, highValue, isPending, theme = 'yellow', onBook }: { id: string, title: string, subtext?: string, pointsText: string, pointsValue: number, highValue?: boolean, isPending: boolean, theme?: 'blue' | 'orange' | 'green' | 'purple' | 'yellow', onBook: (id: string, points: number, title: string) => void }) {
  const themeGradients = {
    blue: 'from-blue-400/20',
    orange: 'from-orange-400/20',
    green: 'from-emerald-400/20',
    purple: 'from-purple-400/20',
    yellow: 'from-yellow-400/20'
  };

  const textGradients = {
    blue: 'from-blue-500 to-blue-700',
    orange: 'from-orange-500 to-orange-700',
    green: 'from-emerald-500 to-emerald-700',
    purple: 'from-purple-500 to-purple-700',
    yellow: 'from-yellow-500 to-yellow-700'
  };

  return (
    <div className="snap-start relative min-w-[220px] shrink-0 flex flex-col p-6 bg-white/5 backdrop-blur-[40px] rounded-[2rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.02] hover:bg-white/10 overflow-hidden group border border-white/20">
      {/* Dynamic Gradient Background */}
      <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${themeGradients[theme]} via-transparent to-transparent pointer-events-none`} />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex flex-col items-start gap-2 mb-2">
          {highValue && (
            <div className="bg-yellow-400/20 backdrop-blur-md border border-yellow-300/50 text-yellow-700 font-bold tracking-widest text-[10px] rounded-full px-3 py-1 shadow-[0_0_15px_rgba(250,204,21,0.4)] animate-pulse uppercase">
              High Value
            </div>
          )}
          <h4 className="font-bold text-slate-800 text-base leading-tight">{title}</h4>
          {subtext && <p className="text-xs text-slate-500 font-medium">{subtext}</p>}
        </div>
        
        <p className={`mt-2 mb-6 font-black text-2xl drop-shadow-sm bg-clip-text text-transparent bg-gradient-to-r ${textGradients[theme]}`}>
          {pointsText}
        </p>
        
        <button 
          onClick={() => onBook(id, pointsValue, title)}
          disabled={isPending}
          className={`mt-auto text-xs font-bold py-3 rounded-xl w-full transition-all shadow-sm ${
            isPending 
              ? 'bg-gray-100/50 text-gray-500 cursor-not-allowed border border-white/40' 
              : 'bg-slate-900 text-white active:scale-95 group-hover:bg-slate-800 shadow-[0_5px_15px_rgba(0,0,0,0.2)]'
          }`}
        >
          {isPending ? 'Pending Confirmation' : 'Book Now'}
        </button>
      </div>
    </div>
  );
}
