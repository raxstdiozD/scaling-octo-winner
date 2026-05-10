"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  Loader2,
  DollarSign,
  Crown,
  Infinity,
  Cpu,
  Headset
} from "lucide-react";
import confetti from "canvas-confetti";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { PRICING_CONFIG } from "@/config/pricing";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "input" | "processing" | "success" | "failure";

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [error, setError] = useState("");
  const supabase = createClient();

  const BENEFITS = [
    { icon: Infinity, text: "Unlimited AI Generations" },
    { icon: Zap, text: `${PRICING_CONFIG.PRO_PLAN.DAILY_CREDITS} Daily Credits` },
    { icon: Cpu, text: "20x Faster Processing" },
    { icon: Sparkles, text: "4K Resolution Exports" },
    { icon: ShieldCheck, text: "Commercial Usage Rights" },
    { icon: Headset, text: "24/7 Priority Support" },
  ];

  const handleTestPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    
    if (isNaN(val)) {
        setError("Please enter a valid amount");
        return;
    }

    setStep("processing");
    setError("");

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (val >= 4) {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) {
                throw new Error("Login required to upgrade.");
            }

            const { error: upsertError } = await supabase
                .from('User')
                .upsert({ 
                    id: session.user.id,
                    email: session.user.email,
                    plan: 'pro',
                    planType: 'PRO',
                    aiGenerationsLimit: PRICING_CONFIG.PRO_PLAN.DAILY_CREDITS
                }, {
                    onConflict: 'id'
                });

            if (upsertError) throw upsertError;

            confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#A855F7', '#22D3EE', '#EC4899'],
            });

            setStep("success");
        } catch (err: any) {
            setError(err.message || "Connection failed.");
            setStep("input");
        }
    } else {
        setError(`Minimum amount for Pro is $${PRICING_CONFIG.PRO_PLAN.USD}`);
        setStep("failure");
    }
  };

  const reset = () => {
    setAmount("");
    setStep("input");
    setError("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#030303]/90 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[3rem] overflow-hidden relative shadow-[0_50px_100px_rgba(0,0,0,0.9)]"
          >
            {/* Header Accent */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-accent-purple via-accent-blue to-accent-purple" />
            
            <button 
                onClick={onClose}
                className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full z-20"
            >
                <X size={20} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Left Side: Benefits (Only on Input/Success) */}
                {(step === "input" || step === "success") && (
                    <div className="bg-white/[0.02] p-10 border-r border-white/5 space-y-8 hidden md:block">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center text-accent-purple border border-accent-purple/20">
                                <Crown size={20} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-[0.3em] text-white">Elite Pro</span>
                        </div>
                        
                        <div className="space-y-6">
                            {BENEFITS.map((benefit, i) => (
                                <div key={i} className="flex items-center gap-4 group">
                                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-accent-purple group-hover:border-accent-purple/30 transition-all">
                                        <benefit.icon size={16} />
                                    </div>
                                    <span className="text-[11px] font-bold text-zinc-400 group-hover:text-white transition-colors">{benefit.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Right Side: Action Area */}
                <div className={cn("p-10 flex flex-col justify-center", (step === "processing" || step === "failure") && "md:col-span-2")}>
                    {step === "input" && (
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Unlock <span className="text-accent-purple">Pro</span></h2>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Test Simulation Payment</p>
                            </div>

                            <form onSubmit={handleTestPayment} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-4">Payment Amount (USD)</label>
                                    <div className="relative group">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-zinc-700 group-focus-within:text-accent-purple transition-colors">$</span>
                                        <input 
                                            type="text"
                                            autoFocus
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder={PRICING_CONFIG.PRO_PLAN.USD.toString()}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-12 pr-6 text-xl font-black text-white outline-none focus:border-accent-purple/50 focus:ring-4 focus:ring-accent-purple/10 transition-all placeholder:text-zinc-800"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest px-2">
                                        <AlertCircle size={14} />
                                        {error}
                                    </div>
                                )}

                                <button 
                                    type="submit"
                                    className="w-full py-5 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                                >
                                    Proceed to Payment <ArrowRight size={18} />
                                </button>
                            </form>
                        </div>
                    )}

                    {step === "processing" && (
                        <div className="py-20 text-center space-y-8 flex flex-col items-center">
                            <div className="relative">
                                <Loader2 className="w-20 h-20 text-accent-purple animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <ShieldCheck size={32} className="text-white/20" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Processing</h2>
                                <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">Securing Transaction...</p>
                            </div>
                        </div>
                    )}

                    {step === "success" && (
                        <div className="text-center space-y-10 py-4">
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)]"
                            >
                                <CheckCircle2 size={40} />
                            </motion.div>

                            <div className="space-y-3">
                                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Welcome Pro</h2>
                                <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest leading-relaxed">Payment of ${amount} confirmed.</p>
                            </div>

                            <button 
                                onClick={onClose}
                                className="w-full py-5 rounded-2xl bg-accent-purple text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:scale-[1.02] transition-all"
                            >
                                Start Creating
                            </button>
                        </div>
                    )}

                    {step === "failure" && (
                        <div className="text-center space-y-8 py-10">
                            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mx-auto border border-red-500/20 mb-6">
                                <AlertCircle size={32} />
                            </div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Failed</h2>
                            <p className="text-zinc-500 font-medium text-xs px-6 italic leading-relaxed">
                                "${amount}" is below the minimum required for Pro access.
                            </p>
                            <div className="flex flex-col gap-3 pt-4">
                                <button onClick={reset} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/10">Try Again</button>
                                <button onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-zinc-400">Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
