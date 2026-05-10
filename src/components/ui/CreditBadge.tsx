"use client";

import React from "react";
import { Zap, Crown } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { cn } from "@/lib/utils";
import { CreditModal } from "./CreditModal";

export function CreditBadge() {
  const { credits, plan, loading, showUpsell, setShowUpsell } = useCredits();
  const isPro = plan === 'pro';

  if (loading) return (
    <div className="w-24 h-9 bg-white/5 animate-pulse rounded-full" />
  );

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowUpsell(true)}
          className={cn(
            "group flex items-center gap-2.5 px-4 py-2 rounded-full border transition-all duration-500",
            "bg-zinc-950/40 backdrop-blur-xl border-white/5 hover:border-white/20 hover:bg-zinc-900/60 hover:scale-[1.02]",
            isPro ? "shadow-[0_0_20px_rgba(168,85,247,0.1)]" : "shadow-2xl"
          )}
        >
          <div className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110",
            isPro ? "bg-accent-purple text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "bg-zinc-800 text-zinc-400"
          )}>
            <Zap size={11} fill="currentColor" className={isPro ? "animate-pulse" : ""} />
          </div>
          
          <div className="flex items-center gap-2">
            <span suppressHydrationWarning className="text-[11px] font-black tracking-tight text-white">
              {credits.toLocaleString()} <span className="text-zinc-500 font-bold ml-0.5">Credits</span>
            </span>
          </div>
        </button>

        {isPro && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-linear-to-r from-accent-purple/20 to-accent-blue/20 border border-accent-purple/30 shadow-[0_0_15px_rgba(168,85,247,0.2)] animate-pulse">
            <Crown size={10} className="text-accent-purple fill-accent-purple/50" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">PRO MEMBER</span>
          </div>
        )}
      </div>

      <CreditModal 
        isOpen={showUpsell} 
        onClose={() => setShowUpsell(false)} 
        plan={plan as 'free' | 'pro'} 
        credits={credits}
      />
    </>
  );
}
