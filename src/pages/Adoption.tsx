import React from 'react';
import { motion } from 'framer-motion';
import { HeartHandshake, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Adoption() {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 pb-32 overflow-hidden relative">
      {/* Background Aurora Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#fec708]/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="group relative max-w-md w-full"
      >
        {/* Border Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fec708]/30 via-white/5 to-[#fec708]/30 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        
        <div className="relative glass-card bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 flex flex-col items-center overflow-hidden">
          {/* Internal Mesh Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(254,199,8,0.2),transparent_70%)]" />
          </div>

          {/* Animated Icon Container */}
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="relative w-28 h-28 mb-8"
          >
            <div className="absolute inset-0 bg-[#fec708]/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-full h-full bg-gradient-to-br from-[#fec708]/30 to-transparent rounded-full flex items-center justify-center border border-[#fec708]/50 shadow-[0_0_40px_rgba(254,199,8,0.2)]">
              <HeartHandshake className="w-12 h-12 text-[#fec708] drop-shadow-[0_0_10px_rgba(254,199,8,0.5)]" />
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5] 
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="w-6 h-6 text-[#fec708]" />
              </motion.div>
            </div>
          </motion.div>
          
          <div className="z-10 text-center space-y-6">
            <div className="space-y-2">
              <h2 className="cinematic-section-title text-4xl">
                Donate & <span className="text-[#fec708]">Double Up!</span>
              </h2>
              <div className="h-1 w-20 bg-gradient-to-r from-transparent via-[#fec708] to-transparent mx-auto rounded-full opacity-50" />
            </div>

            <p className="text-lg font-medium font-body text-white/70 leading-relaxed max-w-[280px] mx-auto">
              Donate your Paw Points to valuable causes! As a thank you, your generosity 
              <span className="block mt-2 relative inline-block">
                <span className="relative z-10 text-[#fec708] font-black text-2xl tracking-tight uppercase italic drop-shadow-[0_0_15px_rgba(254,199,8,0.6)]">
                  DOUBLES
                </span>
                <span className="absolute inset-0 bg-[#fec708]/20 blur-lg animate-pulse" />
              </span>
              <span className="block text-sm text-white/40 mt-1 uppercase tracking-widest font-bold">your points next visit</span>
            </p>

            {/* Premium CTA Button */}
            <motion.button
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group/btn relative w-full mt-4"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fec708] to-[#e8bc4b] rounded-2xl blur opacity-30 group-hover/btn:opacity-60 transition duration-200" />
              <div className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-[#fec708] to-[#e8bc4b] text-black font-black py-4 px-8 rounded-2xl shadow-xl transition-all">
                <span className="text-lg uppercase tracking-tight">Pledge My Points</span>
                <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </div>
            </motion.button>

            <button 
              onClick={() => navigate(-1)}
              className="text-white/30 hover:text-white/60 text-xs font-bold uppercase tracking-[0.2em] transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
