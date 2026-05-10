"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, RefreshCcw, ArrowLeft } from "lucide-react";
import GradientText from "@/components/ui/GradientText";

interface PaymentFailureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  reason?: string;
}

export function PaymentFailureModal({ isOpen, onClose, onRetry, reason }: PaymentFailureModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div key="payment-failure-modal" className="fixed inset-0 z-[130] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-lg glass-dark border border-red-500/10 rounded-[3rem] p-12 overflow-hidden shadow-4xl text-center"
          >
            {/* Error Glow */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-500/5 blur-[120px] pointer-events-none opacity-40" />

            <div className="space-y-10 relative z-10">
               <div className="flex justify-center">
                  <div className="w-24 h-24 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                     <AlertCircle size={48} />
                  </div>
               </div>

               <div className="space-y-4">
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">
                     Payment <GradientText className="from-red-500 to-orange-500">Failed.</GradientText>
                  </h2>
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                     {reason || "Don't worry, no amount was deducted from your account. Your transaction could not be completed at this time."}
                  </p>
               </div>

               <div className="space-y-4">
                  <button 
                    onClick={onRetry}
                    className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-[0.3em] text-[10px] italic shadow-4xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-4"
                  >
                     Try Again <RefreshCcw size={18} />
                  </button>
                  
                  <button 
                    onClick={onClose}
                    className="w-full h-16 rounded-2xl bg-white/[0.05] border border-white/10 text-white font-black uppercase tracking-[0.3em] text-[10px] italic hover:bg-white/10 transition-all flex items-center justify-center gap-4"
                  >
                     Go Back <ArrowLeft size={18} />
                  </button>
               </div>

               <div className="pt-4">
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-700 italic">TRANSACTION ID: NULL • TERMINAL SECURE</span>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
