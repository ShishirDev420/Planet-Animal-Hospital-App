import React from 'react';
import { HeartHandshake } from 'lucide-react';

export default function Adoption() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 pb-32">
      <div className="glass-card dark:bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-sm rounded-[2rem] p-10 max-w-md w-full flex flex-col items-center relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#fec708] rounded-full blur-[80px] opacity-20"></div>

        <div className="w-24 h-24 bg-[#fec708]/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(254,199,8,0.3)] border border-[#fec708]/50 z-10">
          <HeartHandshake className="w-10 h-10 text-[#fec708]" />
        </div>
        
        <div className="z-10 relative">
          <h2 className="text-4xl font-extrabold font-heading tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] text-center mb-6">Donate & Double Up!</h2>
          <p className="text-lg font-medium font-body text-slate-200 text-center leading-relaxed max-w-md mx-auto drop-shadow-md">
            Donate your Paw Points to valuable causes! As a thank you, your generosity <span className="text-planet-yellow font-extrabold text-xl drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">DOUBLES</span> your Paw Points on your next visit.
          </p>
        </div>
      </div>
    </div>
  );
}
