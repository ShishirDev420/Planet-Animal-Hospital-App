import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlanetOrbLoader from './PlanetOrbLoader';

export default function SplashScreen() {
  const isInsideFrame = typeof window !== 'undefined' && (window.self !== window.top || window.location.search.includes('preview_frame=true'));
  const [isVisible, setIsVisible] = useState(() => !sessionStorage.getItem('splashShown'));

  useEffect(() => {
    if (!isVisible) return;
    
    // Don't auto-navigate when inside preview frame - just mark splash as shown
    if (isInsideFrame) {
      sessionStorage.setItem('splashShown', 'true');
      setIsVisible(false);
      return;
    }
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('splashShown', 'true');
    }, 2500);
    return () => clearTimeout(timer);
  }, [isVisible, isInsideFrame]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] overflow-hidden"
        >
          <PlanetOrbLoader
            fullscreen
            label="Planet Animal Hospital"
            detail="Opening a premium care experience"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
