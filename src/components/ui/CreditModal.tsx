"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Zap, Shield, X, ArrowRight, Check, Crown, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import GradientText from "./GradientText";
import { PRICING_CONFIG } from "@/config/pricing";

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: 'free' | 'pro';
  credits: number;
}

export function CreditModal({ isOpen, onClose, plan, credits }: CreditModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const isPro = plan === 'pro';
  const isOutOfCredits = credits <= 0;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md pointer-events-auto"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto"
          >
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent-purple via-accent-cyan to-accent-purple z-20" />
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-accent-purple/20 blur-[100px] rounded-full" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-accent-cyan/20 blur-[100px] rounded-full" />

            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-zinc-500 transition-colors z-30"
            >
              <X size={20} />
            </button>

            <div className="relative z-10 overflow-y-auto no-scrollbar p-8 md:p-12">
              <div className="space-y-8">
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-accent-purple/10 flex items-center justify-center mx-auto mb-6 border border-accent-purple/20 shadow-4xl">
                    {isPro ? (
                      <Crown className="text-accent-purple" size={32} />
                    ) : isOutOfCredits ? (
                      <Zap className="text-accent-purple" size={32} />
                    ) : (
                      <Sparkles className="text-accent-purple" size={32} />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black italic uppercase tracking-tight leading-tight">
                      {isPro ? (
                        <>Pro <span className="gradient-text">Member</span></>
                      ) : isOutOfCredits ? (
                        <>Out of <span className="gradient-text">Credits</span></>
                      ) : (
                        <>Upgrade to <span className="gradient-text">Pro</span></>
                      )}
                    </h2>
                    <p className="text-zinc-500 font-medium text-sm px-4 leading-relaxed">
                      {isPro 
                        ? `You're enjoying the elite benefits of Lumora Pro. Your credits reset daily to ${PRICING_CONFIG.PRO_PLAN.DAILY_CREDITS}.`
                        : isOutOfCredits 
                          ? `You've used all your daily credits. Upgrade to Pro for 20x more credits and unlimited AI messaging.`
                          : "Unlock the full potential of Lumora with a Pro membership. More credits, faster processing, and exclusive tools."}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                    <div className={cn("w-2 h-2 rounded-full animate-pulse", isPro ? "bg-accent-purple" : "bg-accent-cyan")} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      Balance: <span className="text-white">{credits.toLocaleString()} Credits</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
                          <Shield className="text-accent-cyan" size={16} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-zinc-300">
                          {isPro ? "Active Benefits" : "Pro Benefits"}
                        </span>
                      </div>
                      {!isPro && <span className="text-sm font-black text-accent-cyan">${PRICING_CONFIG.PRO_PLAN.USD}/mo</span>}
                    </div>
                    <ul className="relative z-10 space-y-3">
                      {[
                        `${PRICING_CONFIG.PRO_PLAN.DAILY_CREDITS} Daily Credits (vs 50)`,
                        "Unlimited AI Messages (vs 30)",
                        "Priority AI Processing",
                        "Early access to new tools",
                        "Commercial usage rights"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-xs font-medium text-zinc-400">
                          <div className={cn("flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center", isPro ? "bg-accent-purple/10" : "bg-accent-cyan/10")}>
                            <Check size={10} className={isPro ? "text-accent-purple" : "text-accent-cyan"} strokeWidth={3} />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {isPro ? (
                    <Link
                      href="/pro"
                      onClick={onClose}
                      className="w-full py-4 rounded-2xl bg-white text-black font-black italic uppercase tracking-tight hover:bg-zinc-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                      <RefreshCcw size={18} />
                      Manage Subscription
                    </Link>
                  ) : (
                    <Link
                      href="/pro"
                      onClick={onClose}
                      className="w-full py-4 rounded-2xl bg-white text-black font-black italic uppercase tracking-tight hover:bg-zinc-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                      Upgrade to Pro
                      <ArrowRight size={18} />
                    </Link>
                  )}
                  <button
                    onClick={onClose}
                    className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 font-black italic uppercase tracking-tight hover:bg-white/10 transition-colors"
                  >
                    Close
                  </button>
                </div>

                <p className="text-[10px] text-center text-zinc-600 font-bold uppercase tracking-widest leading-relaxed">
                  Credits reset every 24 hours at 00:00 UTC.<br/>
                  {isPro ? "You are a valued Elite member." : "Upgrade to unlock unlimited creativity."}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}



