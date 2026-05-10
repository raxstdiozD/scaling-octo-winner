"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Sparkles, Crown, Zap } from "lucide-react";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import GradientText from "@/components/ui/GradientText";
import { cn } from "@/lib/utils";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'pro' | 'credits';
  amount?: number;
}

export function PaymentSuccessModal({ isOpen, onClose, type, amount }: PaymentSuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      const timer = setTimeout(onClose, 8000); // Auto close after 8s
      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="payment-success-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 40 }}
            className="relative w-full max-w-xl glass-dark border border-white/10 rounded-[3rem] p-12 overflow-hidden shadow-4xl text-center"
          >
            {/* Success Glow */}
            <div className={cn(
              "absolute -top-24 -right-24 w-96 h-96 blur-[120px] pointer-events-none opacity-40",
              type === 'pro' ? "bg-accent-purple" : "bg-accent-cyan"
            )} />

            <div className="space-y-10 relative z-10">
               <div className="flex justify-center">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, delay: 0.2 }}
                    className={cn(
                      "w-28 h-28 rounded-[2.5rem] flex items-center justify-center shadow-2xl",
                      type === 'pro' ? "bg-accent-purple text-white shadow-purple-500/30" : "bg-accent-cyan text-black shadow-cyan-500/30"
                    )}
                  >
                     <Check size={54} strokeWidth={3} />
                  </motion.div>
               </div>

               <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                     {type === 'pro' ? (
                       <>Welcome to <GradientText>Lumora Pro.</GradientText></>
                     ) : (
                       <><GradientText>Refuel</GradientText> Complete.</>
                     )}
                  </h2>
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                     {type === 'pro' 
                       ? "Your creative potential is now unlimited. All pro tools and priority processing are now active." 
                       : `Successfully added ${amount || 0} credits to your account reserve. Carry on creating.`}
                  </p>
               </div>

               <div className="space-y-6">
                  <button 
                    onClick={onClose}
                    className={cn(
                      "w-full h-16 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] italic transition-all flex items-center justify-center gap-4",
                      type === 'pro' ? "premium-gradient text-white" : "bg-white text-black hover:bg-zinc-200"
                    )}
                  >
                     {type === 'pro' ? "Explore Pro Features" : "Continue Creating"} <ArrowRight size={18} />
                  </button>
                  
                  <div className="flex items-center justify-center gap-6 text-zinc-700">
                     <div className="flex items-center gap-2">
                        {type === 'pro' ? <Crown size={12} /> : <Zap size={12} />}
                        <span className="text-[8px] font-black uppercase tracking-widest">{type === 'pro' ? "Elite Member" : "Credits Updated"}</span>
                     </div>
                     <div className="w-1 h-1 rounded-full bg-zinc-800" />
                     <div className="flex items-center gap-2">
                        <Sparkles size={12} />
                        <span className="text-[8px] font-black uppercase tracking-widest">System Ready</span>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
