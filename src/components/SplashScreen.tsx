import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(() => !sessionStorage.getItem('splashShown'));
  const navigate = useNavigate();

  useEffect(() => {
    if (!isVisible) return;
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('splashShown', 'true');
      navigate('/profiles');
    }, 2500);
    return () => clearTimeout(timer);
  }, [isVisible, navigate]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-[#1A1A1A] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Ambient Background Blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-planet-yellow/20 rounded-full blur-[120px] animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-planet-gold/15 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 1.5, 
              ease: "easeOut",
            }}
            className="flex flex-col items-center relative z-10"
          >
            <div className="prestige-glow p-8 rounded-full mb-8">
              <Logo size="lg" />
            </div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="text-center"
            >
              <h1 className="text-4xl font-display font-black tracking-tighter text-white uppercase leading-none drop-shadow-2xl">
                Planet Animal
              </h1>
              <p className="text-planet-yellow font-bold tracking-[0.3em] text-[10px] mt-2 uppercase">
                Hospital & Wellness
              </p>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-16 flex gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-planet-yellow animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-planet-yellow animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-planet-yellow animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </motion.div>
          
          <div className="noise-overlay" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
