"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CreditCard, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle,
  Loader2,
  ChevronRight,
  Sparkles,
  Crown,
  Check,
  RefreshCw,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import GradientText from '../ui/GradientText';
import { PRICING_CONFIG } from '@/config/pricing';

interface ManageSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onCancel: () => Promise<void>;
  isCancelling: boolean;
}

export function ManageSubscriptionModal({ 
  isOpen, 
  onClose, 
  user, 
  onCancel,
  isCancelling 
}: ManageSubscriptionModalProps) {
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [localCancelled, setLocalCancelled] = useState(false);

  // Check local storage for persistent cancellation state if DB is slow
  const isStorageCancelled = typeof window !== 'undefined' && user?.email && localStorage.getItem(`cancelled_${user.email}`) === 'true';

  // Determine if already cancelled (Check both snake_case and camelCase for safety)
  const isCancelled = localCancelled || 
                      isStorageCancelled ||
                      user?.subscription_status === 'cancelled' || 
                      user?.subscriptionStatus === 'cancelled' || 
                      (user?.plan === 'pro' && !!user?.plan_expires_at) ||
                      (user?.plan === 'pro' && !!user?.planExpiresAt);
  const expiresAt = (user?.plan_expires_at || user?.planExpiresAt) ? new Date(user?.plan_expires_at || user?.planExpiresAt) : null;
  
  // Billing date calculation
  const billingDate = expiresAt || new Date(new Date().setDate(new Date().getDate() + 30));
  const formattedDate = billingDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const handleCancel = async () => {
    try {
      await onCancel();
      setLocalCancelled(true);
      setIsSuccess(true);
      setShowConfirmCancel(false);
    } catch (error) {
      console.error('Cancellation modal error:', error);
      setShowConfirmCancel(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setShowConfirmCancel(false);
        setIsSuccess(false);
      }, 500);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[3.5rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.9)] max-h-[90vh] flex flex-col"
          >
            {/* Top Shine */}
            <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-accent-purple/10 to-transparent pointer-events-none" />

            <div className="p-10 border-b border-white/5 flex items-center justify-between relative bg-white/[0.01] shrink-0">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-[1.25rem] bg-zinc-900 flex items-center justify-center text-accent-purple border border-white/10 shadow-2xl relative group overflow-hidden">
                  <div className="absolute inset-0 bg-accent-purple/5 group-hover:bg-accent-purple/10 transition-colors" />
                  <Crown size={28} className="relative z-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white flex items-center gap-2">
                    {isCancelled ? "Canceled" : "Elite Membership"}
                    {!isCancelled && <Check size={18} className="text-emerald-500" />}
                  </h3>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.25em]">
                    {isCancelled ? "Terminating Soon" : "Active Elite Subscription"}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white/5 rounded-full transition-all text-zinc-500 hover:text-white shrink-0"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-10 space-y-10 overflow-y-auto no-scrollbar relative z-10">
              {/* Plan Overview Card */}
              <div className={cn(
                "p-10 rounded-[2.75rem] relative overflow-hidden group transition-all duration-700",
                isCancelled ? "bg-zinc-950 border border-white/5" : "bg-[#050505] border border-accent-purple/30 shadow-[0_0_40px_rgba(168,85,247,0.1)]"
              )}>
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Crown size={80} className="text-accent-purple" />
                </div>
                
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl",
                      isCancelled ? "bg-zinc-800 text-zinc-400" : "bg-accent-purple text-white"
                    )}>
                      {isCancelled ? "CANCELED" : "ELITE PRO"}
                    </span>
                    {isCancelled && (
                      <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                        <AlertTriangle size={12} /> Pending Termination
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-3">
                    <span className="text-6xl font-black italic text-white tracking-tighter">${PRICING_CONFIG.PRO_PLAN.USD}</span>
                    <span className="text-zinc-500 text-sm font-bold uppercase tracking-[0.15em]">/ Month</span>
                  </div>
                  
                  <div className="h-px w-full bg-white/5" />
                  
                  <p className="text-[11px] font-medium text-zinc-500 leading-relaxed max-w-[260px]">
                    {isCancelled 
                      ? `Your subscription will end on ${formattedDate}. You can still use all Pro features until then.`
                      : "You have full access to all AI models, priority processing, and elite tools."}
                  </p>
                </div>
              </div>

              {/* Billing Info */}
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between p-6 rounded-[1.75rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                        {isCancelled ? "Ends On" : "Next Renewal"}
                      </p>
                      <p className="text-sm font-bold text-white italic tracking-tight">{formattedDate}</p>
                    </div>
                  </div>
                  <RefreshCw size={16} className={cn("text-zinc-800", !isCancelled && "animate-spin-slow")} />
                </div>

                <div className="flex items-center justify-between p-6 rounded-[1.75rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Billing Method</p>
                      <p className="text-sm font-bold text-white italic tracking-tight">Razorpay Secure</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                    Verified
                  </div>
                </div>
              </div>

              {/* Actions */}
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 rounded-[2rem] bg-emerald-500/[0.03] border border-emerald-500/20 text-center space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto border border-emerald-500/20">
                      <Check size={32} strokeWidth={3} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-black text-white uppercase tracking-tight">Successfully Canceled</p>
                      <p className="text-[11px] text-zinc-500 font-medium">Your Elite access continues until <span className="text-white font-bold">{formattedDate}</span>.</p>
                    </div>
                  </motion.div>
                ) : isCancelled ? (
                  <div className="p-10 rounded-[2.5rem] bg-emerald-500/[0.03] border border-emerald-500/20 text-center space-y-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-linear-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                      <ShieldCheck size={40} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-3 relative z-10">
                      <p className="text-xl font-black text-white uppercase tracking-tight italic">You are all set!</p>
                      <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                        Your subscription has been cancelled. You will retain <span className="text-white font-bold italic">Elite Pro</span> access until <span className="text-white font-bold">{formattedDate}</span>. No further action is required.
                      </p>
                    </div>
                  </div>
                ) : !showConfirmCancel ? (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowConfirmCancel(true)}
                    className="w-full py-6 rounded-3xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600 hover:text-red-500 hover:bg-red-500/5 transition-all flex items-center justify-center gap-3 group"
                  >
                    Cancel Membership
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="p-10 rounded-[2.5rem] bg-red-500/[0.03] border border-red-500/20 space-y-8"
                  >
                    <div className="flex items-start gap-5">
                      <div className="p-4 rounded-2xl bg-red-500/10 text-red-500 shadow-lg">
                        <AlertTriangle size={24} />
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-black text-white uppercase tracking-tight leading-none">Confirm Cancellation</p>
                        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                          You will keep your Elite status until <span className="text-white font-bold">{formattedDate}</span>. After that, your generations limit will be reduced to 50.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setShowConfirmCancel(false)}
                        className="flex-1 py-5 rounded-2xl bg-white text-black text-[11px] font-black uppercase tracking-widest hover:scale-[1.03] active:scale-95 transition-all shadow-2xl"
                      >
                        Keep Elite
                      </button>
                      <button 
                        onClick={handleCancel}
                        disabled={isCancelling}
                        className="flex-1 py-5 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 text-[11px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        {isCancelling ? <Loader2 size={16} className="animate-spin" /> : "Confirm"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

