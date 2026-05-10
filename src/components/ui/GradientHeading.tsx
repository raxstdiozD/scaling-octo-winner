"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientHeadingProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  animate?: boolean;
  glow?: boolean;
  speed?: number;
}

const GradientHeading: React.FC<GradientHeadingProps> = ({
  children,
  className,
  size = 'xl',
  animate = true,
  glow = true,
  speed = 5,
}) => {
  const sizeClasses = {
    'sm': 'text-xl sm:text-2xl',
    'md': 'text-2xl sm:text-3xl',
    'lg': 'text-3xl sm:text-4xl',
    'xl': 'text-4xl sm:text-5xl',
    '2xl': 'text-5xl sm:text-6xl',
    '3xl': 'text-6xl sm:text-8xl',
  };

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Background Glow */}
      {glow && (
        <div 
          className="absolute inset-0 blur-[40px] opacity-20 pointer-events-none"
          style={{
            background: "linear-gradient(to right, #A855F7, #22D3EE, #8B5CF6)",
          }}
        />
      )}

      <h1 className={cn(
        "relative font-black tracking-tighter leading-tight italic uppercase px-8 -mx-8", 
        sizeClasses[size]
      )}>
        <motion.span
          className="bg-clip-text text-transparent relative z-10 block px-8 -mx-8"
          style={{
            backgroundImage: "linear-gradient(to right, #A855F7, #22D3EE, #8B5CF6, #A855F7)",
            backgroundSize: "200% auto",
            WebkitBackgroundClip: "text",
          }}
          animate={
            animate
              ? {
                  backgroundPosition: ["0% center", "-200% center"],
                }
              : {}
          }
          transition={{
            duration: speed,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {children}
        </motion.span>
        
        {/* Cinematic Shine Sweep */}
        {animate && (
          <span className="absolute inset-0 pointer-events-none overflow-hidden select-none">
            <motion.span
              className="absolute inset-y-0 w-full opacity-0"
              initial={{ x: "-100%" }}
              animate={{ 
                x: ["-100%", "200%"],
                opacity: [0, 0.3, 0] 
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                repeatDelay: 4,
                ease: "easeInOut",
              }}
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                skewX: "-20deg",
                display: "block",
                height: "100%"
              }}
            />
          </span>
        )}
      </h1>
    </div>
  );
};

export default GradientHeading;
