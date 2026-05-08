import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[1000] p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white dark:bg-[#0a221a] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 dark:border-white/5 pointer-events-auto relative"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-planet-yellow/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

              <div className="p-8 flex flex-col items-center text-center relative">
                {/* Close Button */}
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>

                {/* Icon Container */}
                <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-3xl flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-red-500/20 rounded-3xl blur-xl animate-pulse" />
                  <LogOut size={36} className="text-red-500 relative z-10" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-2">
                  Already Leaving?
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-body mb-8">
                  Your pet's proactive health plan is still running. Are you sure you want to sign out?
                </p>

                {/* Actions */}
                <div className="flex flex-col w-full gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onConfirm}
                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-heading font-bold text-lg shadow-lg shadow-red-500/25 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut size={20} />
                    Log Out
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="w-full py-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-2xl font-heading font-bold text-lg transition-colors"
                  >
                    Stay Connected
                  </motion.button>
                </div>
              </div>

              {/* Bottom accent bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-planet-yellow to-emerald-500 opacity-50" />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
