"use client";

import { User, LogOut, LogIn, Sparkles, CreditCard, Settings, ShieldCheck, ChevronRight, Crown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GradientText from "../ui/GradientText";
import PremiumButton from "../ui/PremiumButton";
import { usePro } from "@/hooks/usePro";
import { useCredits } from "@/hooks/useCredits";
import { ManageSubscriptionModal } from "../tool/ManageSubscriptionModal";
import { CreditModal } from "../ui/CreditModal";
import { Zap } from "lucide-react";
import { VerifiedTick } from "../ui/VerifiedTick";

export function UserMenu() {
  const { isPro, user: dbUser, isLoading: isProLoading, refresh } = usePro();
  const { credits, showUpsell, setShowUpsell, loading: isCreditsLoading } = useCredits();
  const [session, setSession] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  const isLoading = isProLoading || isCreditsLoading;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    }
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const res = await fetch('/api/razorpay/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await res.json();
      if (result.success) {
        // We no longer close immediately so the modal can show its success state
        await refresh();
        router.refresh();
      } else {
        alert(result.error || 'Failed to cancel subscription.');
      }
    } catch (error) {
      console.error('Cancel failed:', error);
      alert('An error occurred during cancellation.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse border border-white/10" />;
  }

  if (!session) {
    return (
      <button 
        onClick={() => router.push('/auth/login')}
        className="flex items-center gap-3 px-6 py-2.5 rounded-2xl premium-gradient text-white shadow-lg hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase tracking-widest"
      >
        <LogIn size={14} />
        Sign In
      </button>
    );
  }

  const user = session.user;
  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Explorer";
  const avatarUrl = user?.user_metadata?.avatar_url;
  
  const usageCount = dbUser?.aiGenerationsUsed ?? 0;
  const totalLimit = dbUser?.aiGenerationsLimit ?? 50;
  const currentPlan = dbUser?.plan || dbUser?.planType || "free";
  const plan = currentPlan.toLowerCase();
  
  const nextReset = (isMounted && dbUser?.nextResetDate) 
    ? new Date(dbUser.nextResetDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) 
    : "May 1st, 2026";

  const progressPercent = Math.min((usageCount / totalLimit) * 100, 100);

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-1.5 p-1 rounded-full border transition-all duration-500 group relative",
            "bg-zinc-950/40 backdrop-blur-3xl border-white/5 hover:border-white/20 hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)]",
            isOpen && "bg-white/10 border-accent-purple/40 shadow-[0_0_40px_rgba(168,85,247,0.2)]",
            isPro && "shadow-[0_0_25px_rgba(168,85,247,0.08)]"
          )}
        >
          {/* 1. CREDITS SECTION */}
          <div 
            onClick={(e) => {
              if (!isOpen) {
                e.stopPropagation();
                setShowUpsell(true);
              }
            }}
            className="flex items-center gap-3 pl-2 pr-2 py-1.5 rounded-full hover:bg-white/5 transition-all cursor-pointer group/credits"
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg",
              isPro ? "bg-accent-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]" : "bg-zinc-800 text-zinc-400"
            )}>
              <Zap size={14} fill="currentColor" className={isPro ? "animate-pulse" : ""} />
            </div>
            <span suppressHydrationWarning className="text-sm font-black tracking-tight text-white pr-2">
              {credits.toLocaleString()}
            </span>
          </div>

          <div className="h-8 w-px bg-white/10 mx-1" />

          {/* 2. USER & PRO SECTION */}
          <div className="flex items-center gap-4 pr-1 pl-3">
            <div className="hidden md:flex items-center gap-3">
              <div suppressHydrationWarning className={cn(
                "text-sm font-black tracking-tighter transition-colors",
                isPro ? "text-white" : "text-zinc-400 group-hover:text-white"
              )}>
                {isPro ? (
                  <GradientText className="text-sm font-black tracking-tighter">{fullName.split(' ')[0]}</GradientText>
                ) : (
                  fullName.split(' ')[0]
                )}
              </div>
              
              {isPro && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-purple/10 border border-accent-purple/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                   <Crown size={10} className="text-accent-purple fill-accent-purple/50" />
                   <span className="text-[9px] font-black tracking-[0.1em] text-accent-purple uppercase">PRO</span>
                </div>
              )}
            </div>

            <div className="relative p-0.5">
              <div className={cn(
                "w-10 h-10 rounded-full overflow-hidden border-2 transition-all duration-500 z-10 relative",
                isPro ? "border-accent-purple shadow-[0_0_20px_rgba(168,85,247,0.4)]" : "border-white/10"
              )}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <span className="text-xs font-black text-white">{fullName[0].toUpperCase()}</span>
                  </div>
                )}
              </div>
              {isPro && (
                 <div className="absolute -inset-1 bg-accent-purple/30 rounded-full blur-lg animate-pulse" />
              )}
            </div>
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(10px)" }}
              className="absolute right-0 mt-4 w-[320px] bg-zinc-950/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.8)] z-50 overflow-hidden"
            >
              <div suppressHydrationWarning className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-accent-purple/15 blur-[60px] rounded-full -z-10" />

              {/* Profile Header */}
              <div className="p-8 pb-6 text-center space-y-4">
                 <div className="relative inline-block">
                    <div className={cn(
                      "absolute -inset-1.5 bg-linear-to-tr from-accent-purple to-accent-blue rounded-full blur-lg opacity-30 transition-opacity duration-1000",
                      isPro ? "opacity-40 animate-pulse" : "opacity-0"
                    )} />
                    <div className={cn(
                      "relative w-24 h-24 rounded-full border-2 p-1 bg-zinc-950 shadow-2xl transition-all duration-500",
                      isPro ? "border-accent-purple" : "border-white/10"
                    )}>
                      <div className="w-full h-full rounded-full overflow-hidden">
                         {avatarUrl ? (
                           <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full bg-linear-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                             <span className="text-3xl font-black text-white">{fullName[0].toUpperCase()}</span>
                           </div>
                         )}
                      </div>
                      <VerifiedTick className="absolute -bottom-1 -right-1 z-20" size="md" />
                    </div>
                 </div>
                 
                 <div className="space-y-0.5">
                    <h3 suppressHydrationWarning className="text-xl font-black text-white tracking-tighter italic uppercase">
                      {isPro ? <GradientText className="text-xl font-black">{fullName}</GradientText> : fullName}
                    </h3>
                    <p className="text-[10px] font-bold text-zinc-500 tracking-tight uppercase opacity-60">{user?.email}</p>
                 </div>

                 {isPro && (
                   <div className="pt-2">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-purple/10 border border-accent-purple/20">
                        <Sparkles size={10} className="text-accent-purple" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-accent-purple">Elite Pro Plan</span>
                     </div>
                   </div>
                 )}
              </div>

              {/* Stats Block */}
              <div className="px-6 py-6 border-t border-white/5 bg-white/[0.01] space-y-5">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Zap size={14} className="text-accent-purple" />
                       <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">Credits Available</span>
                    </div>
                    <span className="text-[13px] font-black text-white italic tracking-tight">{credits.toLocaleString()}</span>
                 </div>

                 <div className="space-y-3">
                    <div className="flex justify-between items-end">
                       <div className="flex items-center gap-2">
                          <RefreshCw size={12} className="text-zinc-600" />
                          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">Generations</span>
                       </div>
                       <div className="text-[11px] font-black text-white">
                         {usageCount}
                         <span className="text-zinc-600 font-bold ml-1">/ {totalLimit}</span>
                       </div>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden relative border border-white/5">
                       <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          className="h-full rounded-full bg-linear-to-r from-accent-purple to-accent-blue"
                       />
                    </div>
                 </div>
              </div>

              {/* Menu Actions */}
              <div className="p-3 space-y-1 bg-zinc-950/40">
                 <button 
                    onClick={() => {
                      setIsOpen(false);
                      if (isPro) setIsManageModalOpen(true);
                      else router.push('/pro');
                    }}
                    className="w-full group flex items-center gap-3.5 px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                 >
                    <CreditCard size={16} className="text-zinc-600 group-hover:text-accent-purple transition-colors" />
                    {isPro ? "Manage Subscription" : "Upgrade to Pro"}
                    <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                 </button>
                 
                 <Link 
                    href="/account/settings"
                    onClick={() => setIsOpen(false)}
                    className="w-full group flex items-center gap-3.5 px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                 >
                    <Settings size={16} className="text-zinc-600 group-hover:text-accent-blue transition-colors" />
                    Settings & Security
                 </Link>

                 <div className="h-px bg-white/5 my-2 mx-4" />

                 <button 
                   onClick={async () => {
                      await supabase.auth.signOut();
                      router.refresh();
                   }}
                   className="w-full flex items-center gap-3.5 px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.15em] text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                 >
                   <LogOut size={16} />
                   Sign Out
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ManageSubscriptionModal 
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        user={dbUser}
        onCancel={handleCancelSubscription}
        isCancelling={isCancelling}
      />

      <CreditModal 
        isOpen={showUpsell} 
        onClose={() => setShowUpsell(false)} 
        plan={plan as 'free' | 'pro'} 
        credits={credits}
      />
    </>
  );
}
