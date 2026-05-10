"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, Crown } from "lucide-react";

interface CategoryHeadingProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  categoryId: string;
  isPro?: boolean;
  className?: string;
}

const CATEGORY_STYLES: Record<string, { gradient: string, glow: string, accent: string }> = {
  'image': {
    gradient: "from-purple-500 via-pink-500 to-purple-500",
    glow: "rgba(168, 85, 247, 0.3)",
    accent: "text-purple-400"
  },
  'video': {
    gradient: "from-cyan-500 via-blue-500 to-cyan-500",
    glow: "rgba(34, 211, 238, 0.3)",
    accent: "text-cyan-400"
  },
  'audio': {
    gradient: "from-orange-500 via-red-500 to-orange-500",
    glow: "rgba(249, 115, 22, 0.3)",
    accent: "text-orange-400"
  },
  'ai': {
    gradient: "from-violet-600 via-cyan-400 to-violet-600",
    glow: "rgba(124, 58, 237, 0.3)",
    accent: "text-violet-400"
  },
  'pdf': {
    gradient: "from-emerald-500 via-teal-500 to-emerald-500",
    glow: "rgba(16, 185, 129, 0.3)",
    accent: "text-emerald-400"
  },
  'productivity': {
    gradient: "from-blue-500 via-indigo-500 to-blue-500",
    glow: "rgba(59, 130, 246, 0.3)",
    accent: "text-blue-400"
  }
};

const CategoryHeading: React.FC<CategoryHeadingProps> = ({
  icon: Icon,
  title,
  subtitle,
  categoryId,
  isPro = false,
  className
}) => {
  const style = CATEGORY_STYLES[categoryId] || CATEGORY_STYLES['ai'];

  return (
    <div className={cn("relative space-y-12", className)}>
      <div className="flex flex-col gap-8">
        {/* Integrated Studio Badge - Static & Professional */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#0c0c0e] border border-white/10 flex items-center justify-center shadow-2xl relative overflow-hidden group">
            <div className={cn(
              "absolute inset-0 opacity-10 bg-linear-to-br",
              style.gradient
            )} />
            <Icon size={24} style={{ color: style.glow.replace('0.3', '1') }} className="relative z-10" />
            <div className="absolute inset-0 bg-linear-to-tr from-white/5 to-transparent" />
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Sparkles size={12} className={style.accent} />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">
                {isPro ? "Premium Pro Series" : "Essential Creative Suite"}
              </p>
            </div>
            {isPro && (
              <div className="flex mt-1">
                <span className="text-[9px] font-black text-accent-purple uppercase tracking-widest bg-accent-purple/10 px-2 py-0.5 rounded border border-accent-purple/20">Elite Studio</span>
              </div>
            )}
          </div>
        </div>

        {/* Hero Title - Engineered for Zero Clipping */}
        <div className="space-y-6">
          <div className="relative py-2 pr-12 overflow-visible inline-block"> 
            <motion.h1 
              animate={{ 
                backgroundPosition: ["0% center", "200% center"] 
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              style={{
                backgroundImage: `linear-gradient(to right, ${
                  categoryId === 'image' ? '#A855F7, #EC4899, #A855F7' :
                  categoryId === 'video' ? '#06B6D4, #3B82F6, #06B6D4' :
                  categoryId === 'audio' ? '#F97316, #EF4444, #F97316' :
                  categoryId === 'ai' ? '#7C3AED, #22D3EE, #7C3AED' :
                  categoryId === 'pdf' ? '#10B981, #14B8A6, #10B981' :
                  '#3B82F6, #6366F1, #3B82F6' // Productivity
                })`,
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
              className={cn(
                "text-5xl md:text-7xl xl:text-8xl font-black tracking-tighter uppercase italic leading-none select-none px-8 -mx-8 bg-clip-text text-transparent",
                className
              )}
            >
              {title}
            </motion.h1>
            {/* Soft Ambient Depth */}
            <span 
              className="absolute inset-0 text-white/5 blur-3xl -z-10 select-none uppercase italic font-black text-5xl md:text-7xl xl:text-8xl tracking-tighter leading-none px-8 -mx-8"
            >
              {title}
            </span>
          </div>

          <p className="text-xl md:text-2xl text-zinc-400 max-w-4xl leading-relaxed font-medium">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Cinematic Divider */}
      <div className="relative h-px w-full overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent" />
        <motion.div 
           animate={{ x: ['-100%', '200%'] }}
           transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
           className={cn("absolute inset-y-0 w-40 bg-linear-to-r from-transparent via-current to-transparent opacity-30", style.accent)} 
        />
      </div>
    </div>
  );
};

export default CategoryHeading;
