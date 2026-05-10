"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedTickProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const VerifiedTick: React.FC<VerifiedTickProps> = ({ 
  className,
  size = "md" 
}) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10"
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  return (
    <div className={cn("relative group select-none", sizeClasses[size], className)}>
      {/* Dynamic Glow Aura */}
      <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
      
      {/* Glassmorphic Shell */}
      <div className={cn(
        "relative w-full h-full rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden",
        "bg-zinc-950/90 backdrop-blur-md border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]",
        "group-hover:border-emerald-400 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] group-hover:scale-110"
      )}>
        {/* Subtle Inner Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-transparent" />
        
        {/* Shield Icon with Neon Effect */}
        <ShieldCheck 
          size={iconSizes[size]} 
          className="text-emerald-400 fill-emerald-400/20 drop-shadow-[0_0_5px_rgba(52,211,153,0.6)] relative z-10" 
        />
        
        {/* Refined Shine Sweep */}
        <motion.div
          animate={{
            x: ["-100%", "200%"],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 3
          }}
          className="absolute inset-y-0 w-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent skew-x-12 pointer-events-none"
        />
      </div>
    </div>
  );
};
