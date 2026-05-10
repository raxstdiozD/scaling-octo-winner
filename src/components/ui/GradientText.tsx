"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
  glow?: boolean;
  speed?: number;
}

const GradientText: React.FC<GradientTextProps> = ({
  children,
  className,
  animate = true,
  glow = true,
  speed = 4,
}) => {
  return (
    <span className={cn(
      "relative inline-flex items-center font-outfit font-black tracking-tighter", 
      className
    )}>
      <motion.span
        className={cn(
          "bg-clip-text text-transparent relative z-10"
        )}
        style={{
          backgroundImage: "linear-gradient(to right, #A855F7, #6366F1, #22D3EE, #A855F7)",
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
      
      {/* Refined Metallic Shine Sweep */}
      {animate && (
        <span className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <motion.span
            className="absolute inset-y-0 w-full opacity-0"
            initial={{ x: "-100%" }}
            animate={{ 
              x: ["-100%", "200%"],
              opacity: [0, 0.2, 0] 
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              repeatDelay: 5,
              ease: "easeInOut",
            }}
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
              skewX: "-20deg",
              display: "block",
              height: "100%"
            }}
          />
        </span>
      )}
    </span>
  );
};

export default GradientText;

