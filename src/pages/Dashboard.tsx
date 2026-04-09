import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Calendar, FileText, Award, ChevronRight, Gift, X, Dog, CheckCircle2, Syringe, Sparkles, Stethoscope } from 'lucide-react';

export default function Dashboard() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const closeModal = () => {
    setActiveModal(null);
    setTimeout(() => setBookingConfirmed(false), 300); // reset after close animation
  };

  return (
    <div className="p-6 space-y-8 pb-32">
      {/* Header with Logo */}
      <header className="flex justify-between items-start pt-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-planet-yellow rounded-full flex items-center justify-center shadow-sm">
              <Dog size={16} className="text-black" />
            </div>
            <span className="font-black tracking-tight text-sm uppercase text-slate-800">Planet Animal</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Hi, Sarah 👋</h1>
          <p className="text-slate-500 text-sm">Let's keep Max healthy today.</p>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md shrink-0">
          <img src="https://picsum.photos/seed/sarah/100/100" alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-2xl rounded-t-3xl z-[70] p-6 pb-12 border-t border-white/50 shadow-2xl max-h-[85vh] overflow-y-auto hide-scrollbar"
            >
              <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-6" />
              
              {activeModal === 'book' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Book a Visit</h2>
                    <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={20}/></button>
                  </div>
                  
                  {!bookingConfirmed ? (
                    <div className="space-y-3">
                      <ServiceOption icon={<Stethoscope />} title="General Checkup" points="+100 pts" />
                      <ServiceOption icon={<Sparkles />} title="Grooming Spa" points="+150 pts" />
                      <ServiceOption icon={<Syringe />} title="Vaccination" points="+50 pts" />
                      <ServiceOption icon={<Dog />} title="Dental Scaling" points="+300 pts" />
                      
                      <button 
                        onClick={() => setBookingConfirmed(true)}
                        className="w-full mt-6 bg-planet-yellow text-black py-4 rounded-xl font-bold text-lg shadow-lg shadow-planet-yellow/20 active:scale-95 transition-transform"
                      >
                        Confirm Booking
                      </button>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8"
                    >
                      <div className="w-20 h-20 bg-teal-100 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={40} />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Booking Requested!</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">
                        We've received your request. Our front desk will call you shortly to confirm the exact time and details.
                      </p>
                      <button 
                        onClick={closeModal}
                        className="w-full mt-8 bg-slate-900 text-white py-4 rounded-xl font-bold active:scale-95 transition-transform"
                      >
                        Done
                      </button>
                    </motion.div>
                  )}
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

function ServiceOption({ icon, title, points }: { icon: React.ReactNode, title: string, points: string }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white/50 active:bg-slate-50 cursor-pointer transition-colors">
      <div className="flex items-center gap-4">
        <div className="text-slate-400">{icon}</div>
        <span className="font-bold text-slate-700">{title}</span>
      </div>
      <span className="text-xs font-bold text-planet-yellow bg-planet-yellow/10 px-2 py-1 rounded-md">{points}</span>
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
