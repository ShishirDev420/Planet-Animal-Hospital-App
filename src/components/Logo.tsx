import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-48 h-48',
  };

  return (
    <motion.div 
      initial={{ y: 0 }}
      animate={{ y: [0, -8, 0] }}
      transition={{ 
        duration: 8, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        "relative flex items-center justify-center",
        sizeClasses[size], 
        className
      )}
    >
      <img 
        src="https://lh3.googleusercontent.com/d/1zldPukvYCnUvn5i2V9gqpDuR8WKhZ1_4" 
        alt="Planet Animal Hospital Logo" 
        className="w-full h-full object-contain relative z-0"
        referrerPolicy="no-referrer"
      />
      {/* 3D Glass Orb Wrapper */}
      <div className="absolute inset-0 z-10 rounded-full shadow-[0_30px_80px_-15px_rgba(0,0,0,0.2),inset_0_10px_40px_-10px_rgba(255,255,255,0.6),inset_0_-10px_40px_-10px_rgba(0,0,0,0.2)] mix-blend-overlay overflow-hidden pointer-events-none">
        {/* Breathing Ambient Light */}
        <motion.div 
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut"
          }}
          className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent"
        />
      </div>
    </motion.div>
  );
}
