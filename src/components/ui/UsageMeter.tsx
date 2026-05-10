"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Loader2, AlertTriangle, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility for Tailwind CSS class merging
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UsageData {
  generations_used: number;
  generations_limit: number;
}

interface UsageMeterProps {
  userId: string;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({ userId }) => {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      const period = new Date().toISOString().slice(0, 7); // YYYY-MM
      const { data, error } = await supabase
        .from("user_usage")
        .select("generations_used, generations_limit")
        .eq("user_id", userId)
        .eq("period", period)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setUsage(data);
      } else {
        // Default if no record exists for current period
        setUsage({ generations_used: 0, generations_limit: 1000 });
      }
    } catch (err: any) {
      console.error("Error fetching usage:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchUsage();

    // Set up realtime subscription using Supabase postgres_changes
    const channel = supabase
      .channel(`usage-changes-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_usage",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newData = payload.new as UsageData;
          setUsage(newData);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_usage",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newData = payload.new as UsageData;
          setUsage(newData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 bg-zinc-950/40 rounded-2xl border border-zinc-800/50 backdrop-blur-xl h-[120px]">
        <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-400 text-xs text-center font-medium">
        Failed to sync usage data.
      </div>
    );
  }

  const generationsUsed = usage?.generations_used ?? 0;
  const generationsLimit = usage?.generations_limit ?? 1000;
  const percentage = Math.min((generationsUsed / generationsLimit) * 100, 100);

  const isWarning = percentage >= 80 && percentage < 95;
  const isCritical = percentage >= 95;

  return (
    <div className="relative group overflow-hidden bg-zinc-950/40 rounded-2xl border border-zinc-800/50 backdrop-blur-xl p-5 shadow-2xl transition-all duration-300 hover:border-violet-500/30">
      {/* Dynamic Background Glow */}
      <div 
        className={cn(
          "absolute -bottom-12 -right-12 w-40 h-40 blur-[80px] pointer-events-none transition-all duration-700",
          isCritical ? "bg-red-500/10" : isWarning ? "bg-amber-500/10" : "bg-violet-600/10 group-hover:bg-violet-600/20"
        )} 
      />
      
      {/* Glassy Overlay Line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      
      {/* Content */}
      <div className="relative space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "p-2 rounded-xl border transition-colors duration-300",
              isCritical 
                ? "bg-red-500/10 border-red-500/20" 
                : "bg-violet-500/10 border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
            )}>
              <Zap className={cn(
                "w-4 h-4",
                isCritical ? "text-red-400 fill-red-400/20" : "text-violet-400 fill-violet-400/20"
              )} />
            </div>
            <div className="flex flex-col">
              <h3 className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase flex items-center gap-1">
                GENERATIONS
                <ArrowUpRight className="w-3 h-3 text-zinc-600 group-hover:text-violet-400 transition-colors" />
              </h3>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="flex items-baseline gap-1.5 font-mono">
              <motion.span 
                key={generationsUsed}
                initial={{ opacity: 0.5, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-bold text-white tracking-tighter"
              >
                {generationsUsed.toLocaleString()}
              </motion.span>
              <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">
                / {generationsLimit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="space-y-3">
          <div className="relative h-2 w-full bg-zinc-900/90 rounded-full overflow-hidden border border-zinc-800/40 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "h-full rounded-full relative",
                isCritical 
                  ? "bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                  : "bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              )}
            >
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-[40%]" />
            </motion.div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center justify-between min-h-[14px]">
            <AnimatePresence mode="wait">
              {isCritical ? (
                <motion.div
                  key="critical"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 uppercase tracking-widest animate-pulse"
                >
                  <AlertTriangle className="w-3 h-3" />
                  Almost exhausted
                </motion.div>
              ) : isWarning ? (
                <motion.div
                  key="warning"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -5 }}
                  className="text-[10px] font-bold text-amber-500/90 uppercase tracking-widest flex items-center gap-1.5"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                  Running low
                </motion.div>
              ) : (
                <motion.div
                  key="normal"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[9px] font-medium text-zinc-500/60 uppercase tracking-wider"
                >
                  Monthly Allowance
                </motion.div>
              )}
            </AnimatePresence>
            
            <span className="text-[10px] font-bold text-zinc-500/80">
              {Math.round(percentage)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
