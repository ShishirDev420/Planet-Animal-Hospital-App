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
          className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 1 }}
            transition={{ 
              duration: 2, 
              ease: "easeOut",
            }}
            className="flex flex-col items-center"
          >
            <Logo size="lg" className="mb-8" />
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="text-center"
            >
              <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase leading-none">
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
            className="absolute bottom-12 flex gap-1"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-planet-yellow animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-planet-yellow animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-planet-yellow animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
