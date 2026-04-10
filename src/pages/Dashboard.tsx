import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, Calendar, FileText, Award, ChevronRight, Gift, X, Dog, 
  CheckCircle2, Syringe, Sparkles, Stethoscope, ChevronDown, ChevronUp, Loader2 
} from 'lucide-react';
import Logo from '../components/Logo';
import DualAvatar from '../components/DualAvatar';
import { useProfileImages } from '../hooks/useProfileImages';

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { harshalImage, johnnyImage } = useProfileImages();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Booking State
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Grooming Spa");
  const [isConnecting, setIsConnecting] = useState(false);

  const closeModal = () => {
    setActiveModal(null);
    setTimeout(() => {
      setSelectedServices([]);
      setExpandedCategory("Grooming Spa");
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
      <header className="flex justify-between items-start pt-4">
        <div>
          <button onClick={() => navigate('/profiles')} className="flex items-center gap-3 mb-4 group text-left">
            <div className="animate-sync-heartbeat origin-left">
              <Logo className="!w-16 !h-16" />
            </div>
            <div>
              <span className="font-black tracking-tight text-lg uppercase text-slate-800 block leading-none">Planet Animal</span>
              <span className="text-planet-yellow font-bold tracking-[0.2em] text-[9px] uppercase">Hospital & Wellness</span>
            </div>
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Hi, Harshal 👋</h1>
          <p className="text-slate-500 text-sm">Let's keep Johnny healthy today.</p>
        </div>
        <button onClick={() => navigate('/settings')} className="shrink-0">
          <div className="animate-sync-heartbeat origin-center">
            <DualAvatar 
              leftImage={harshalImage}
              rightImage={johnnyImage}
              className="w-16 h-16"
            />
          </div>
        </button>
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
            <span className="text-5xl font-black tracking-tighter text-slate-800">2,450</span>
            <span className="text-planet-yellow font-bold">pts</span>
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
          <h3 className="text-lg font-bold">Upcoming for Max</h3>
          <button className="text-planet-yellow text-sm font-bold flex items-center">View All <ChevronRight size={16}/></button>
        </div>
        <div className="glass rounded-2xl p-4 flex items-center gap-4">
          <div className="bg-teal-100 w-12 h-12 rounded-xl flex items-center justify-center text-teal-600 font-bold text-xl shrink-0">
            12
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Annual Wellness Exam</h4>
            <p className="text-sm text-slate-500">Dr. Sharma • 10:30 AM</p>
          </div>
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
