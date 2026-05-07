"use client";

import React from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Loader2, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

interface ProtectedToolProps {
  children: React.ReactNode;
}

export function ProtectedTool({ children }: ProtectedToolProps) {
  const { user, isLoading } = useRequireAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();


  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin opacity-50" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 animate-pulse">
            Verifying Identity
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    const returnUrl = encodeURIComponent(pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ""));
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-[500px] flex flex-col items-center justify-center p-12 text-center relative overflow-hidden"
      >
        {/* Aesthetic Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
        </div>

        <div className="relative z-10 max-w-md w-full space-y-8 bg-zinc-950/40 backdrop-blur-2xl border border-white/[0.06] p-12 rounded-[3rem] shadow-2xl">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 relative group">
            <div className="absolute inset-0 bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <Lock size={36} className="relative z-10" />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
              Elite Access Required
            </h2>
            <p className="text-zinc-500 font-medium leading-relaxed">
              Login required to use Pro tools and credits system. Connect your account to unlock our high-performance AI engine.
            </p>
          </div>

          <div className="pt-4">
            <Link href={`/auth/login?returnUrl=${returnUrl}`}>
              <button className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-zinc-200 transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 group">
                Login to Continue
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            
            <Link href="/">
              <button className="w-full mt-4 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 hover:text-white transition-colors">
                Back to Free Tools
              </button>
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return <>{children}</>;
}
