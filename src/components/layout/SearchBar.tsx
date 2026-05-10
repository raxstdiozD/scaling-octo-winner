"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Command, ArrowRight, Zap, Sparkles, X, TrendingUp, History, Star, MousePointer2, Wand2, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TOOLS, Tool, ICON_MAP, CATEGORIES } from "@/data/tools";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  isHero?: boolean;
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi'));
  
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="text-accent-purple font-black">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function SearchBar({ isHero = false }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Suggested tools when query is empty
  const suggestions = useMemo(() => {
    return TOOLS.filter(t => t.pro || ['image-eraser', 'audio-vocal-remover', 'ai-img-gen'].includes(t.id)).slice(0, 4);
  }, []);

  // Filter tools based on query
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const searchTerms = query.toLowerCase().split(/\s+/);
    return TOOLS.filter((tool) => {
      const toolCategory = CATEGORIES.find(c => c.id === tool.category)?.name || tool.category;
      const searchableText = `${tool.name} ${toolCategory} ${tool.description}`.toLowerCase();
      return searchTerms.every(term => searchableText.includes(term));
    }).slice(0, 8);
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isHero && e.key === "/" && !isOpen && 
          document.activeElement?.tagName !== "INPUT" && 
          document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      if (!isHero && (e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      if (!isOpen) return;

      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
        inputRef.current?.blur();
      }

      const activeList = query.trim() ? results : suggestions;
      if (activeList.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % activeList.length);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + activeList.length) % activeList.length);
        } else if (e.key === "Enter") {
          e.preventDefault();
          handleSelect(activeList[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, suggestions, selectedIndex, query, isHero]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleSelect = (tool: Tool) => {
    router.push(tool.href);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div 
      className={cn(
        "relative transition-all duration-500", 
        isHero ? "w-full max-w-4xl mx-auto z-[60]" : "flex-1 w-full min-w-0 pl-16 sm:pl-4 pr-1 sm:pr-4",
        isOpen ? "z-[110]" : "z-[60]"
      )} 
      ref={dropdownRef}
    >
      {/* Dynamic Master Glow - Scaled down for header */}
      <div suppressHydrationWarning className={cn(
        "absolute -inset-1 bg-linear-to-r from-accent-purple via-accent-cyan to-accent-purple blur-2xl transition-all duration-1000 opacity-0 rounded-[2rem] pointer-events-none",
        isFocused && (isHero ? "opacity-30 animate-pulse scale-110" : "opacity-15 animate-pulse")
      )} />
      
      <div className={cn(
        "relative transition-all duration-500",
        isFocused && isHero ? "scale-[1.02]" : "scale-100"
      )}>
        {/* Input Surface */}
        <div className={cn(
            "relative flex items-center border transition-all duration-300",
            isHero ? "h-20 px-8 rounded-[2rem]" : "h-11 px-4 rounded-2xl",
            isOpen ? "z-[90]" : "z-10",
            isFocused 
                ? "bg-[#0a0a0a] border-accent-purple shadow-[0_0_30px_rgba(168,85,247,0.15)]" 
                : "bg-white/[0.03] border-white/10 backdrop-blur-3xl hover:bg-white/[0.06]"
        )}>
          {isFocused && <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none rounded-[inherit]" />}

          {/* Icon Area */}
          <div className={cn(
            "flex-none flex items-center justify-center w-10 h-10",
            isHero ? "mr-4 text-accent-purple" : "mr-1 text-white"
          )}>
            {query ? <Search size={20} strokeWidth={2.5} /> : <Zap size={20} strokeWidth={2.5} className="text-accent-purple animate-pulse" />}
          </div>
          
          {/* Input Area */}
          <input 
            ref={inputRef}
            type="text" 
            value={query}
            onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
            }}
            onFocus={() => { setIsFocused(true); setIsOpen(true); }}
            onBlur={() => setIsFocused(false)}
            placeholder={isHero ? "Search all tools..." : "Search..."}
            className={cn(
                "flex-1 min-w-0 bg-transparent border-none text-white placeholder:text-zinc-500 outline-none uppercase font-black italic tracking-tighter",
                isHero ? "text-2xl" : "text-[11px] tracking-widest"
            )}
          />

          <div className="flex items-center gap-3 relative z-10">
            {(query || isOpen) && (
              <button 
                onClick={() => { 
                  if (query) {
                    setQuery(""); 
                    inputRef.current?.focus();
                  } else {
                    setIsOpen(false);
                  }
                }}
                className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all active:scale-90 border border-white/5"
              >
                <X size={16} />
              </button>
            )}
            {!isHero && (
                <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-md bg-black border border-white/5 text-[9px] font-black tracking-widest text-zinc-600 uppercase">
                    <Command size={10} />
                    <span>K</span>
                </div>
            )}
          </div>
        </div>

        {/* Results Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop for mobile */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[80] md:hidden"
              />

              <motion.div
                initial={{ opacity: 0, y: isHero ? 20 : 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={cn(
                  "z-[120] overflow-hidden",
                  // Mobile: Hard Viewport Center with offset correction
                  "fixed top-[84px] left-[4vw] w-[92vw] -translate-x-16 md:absolute md:top-full md:left-0 md:w-full md:mt-3 md:h-auto md:translate-x-0",
                  isHero ? "md:mt-6 md:rounded-[2.5rem]" : "md:rounded-[1.5rem]",
                  "border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.9)] bg-zinc-950/98 backdrop-blur-3xl rounded-[2rem]",
                  "max-h-[70vh] md:max-h-none"
                )}
              >
                <div className={cn("flex flex-col p-4 sm:p-5 h-full overflow-y-auto custom-scrollbar")}>
                  {/* 1. Results Section */}
                  <div className="flex flex-col flex-1 space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <p className="text-[9px] sm:text-[8px] font-black uppercase tracking-[0.5em] text-zinc-600">
                        {query.trim() ? "Search Results" : "Suggested Tools"}
                      </p>
                      <div className="h-px flex-1 ml-4 bg-white/5" />
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
                      {(query.trim() ? results : suggestions).map((tool, index) => {
                        const Icon = ICON_MAP[tool.icon] || Zap;
                        const isSelected = index === selectedIndex;
                        const category = CATEGORIES.find(c => c.id === tool.category);
                        
                        return (
                          <div
                            key={tool.id}
                            onMouseEnter={() => setSelectedIndex(index)}
                            onClick={() => handleSelect(tool)}
                            className={cn(
                              "group/item relative flex items-center gap-4 sm:gap-5 p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] cursor-pointer transition-all duration-500 overflow-hidden",
                              isSelected 
                                ? "bg-white/[0.12] border border-white/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] -translate-y-1 scale-[1.01]" 
                                : "bg-white/[0.04] border border-white/5 hover:bg-white/[0.08]"
                            )}
                          >
                            {/* Item Glow */}
                            {isSelected && (
                              <div className="absolute inset-0 bg-linear-to-r from-accent-purple/10 via-transparent to-transparent pointer-events-none" />
                            )}
                            
                            {/* Pro Border Glow */}
                            {tool.pro && isSelected && (
                              <div className="absolute inset-0 border border-accent-purple/30 rounded-2xl sm:rounded-[2rem] animate-pulse-glow pointer-events-none" />
                            )}
   
                            <div className={cn(
                              "w-10 h-10 sm:w-16 sm:h-16 rounded-lg sm:rounded-2xl flex items-center justify-center transition-all duration-700 shrink-0 relative overflow-hidden",
                              isSelected 
                                ? "bg-accent-purple text-white shadow-[0_0_30px_rgba(168,85,247,0.5)] rotate-3" 
                                : tool.pro ? "bg-zinc-900 border border-accent-purple/20 text-accent-purple" : "bg-zinc-900 border border-white/5 text-zinc-500"
                            )}>
                               <Icon size={16} className={cn("sm:w-7 sm:h-7", isSelected && "animate-pulse")} />
                               {tool.pro && !isSelected && (
                                 <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-purple shadow-[0_0_8px_rgba(168,85,247,1)]" />
                               )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                               <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                                  <h4 className={cn(
                                      "text-xs sm:text-lg font-black italic tracking-tighter transition-colors leading-none",
                                      isSelected ? "text-white" : "text-zinc-200"
                                  )}>
                                    <HighlightedText text={tool.name} query={query} />
                                  </h4>
                                  <div className="flex items-center gap-1.5">
                                     {tool.pro && (
                                        <div className="px-2 py-0.5 rounded bg-accent-purple/20 border border-accent-purple/30 text-accent-purple text-[8px] sm:text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                                          <Crown size={8} fill="currentColor" />
                                          <span>Pro</span>
                                        </div>
                                     )}
                                     <span className="px-2 py-0.5 rounded bg-white/10 border border-white/10 text-zinc-400 text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
                                       {category?.name}
                                     </span>
                                  </div>
                               </div>
                               <p className={cn(
                                 "text-[10px] sm:text-[13px] font-medium leading-relaxed transition-colors line-clamp-1",
                                 isSelected ? "text-zinc-400" : "text-zinc-500"
                               )}>
                                  <HighlightedText text={tool.description} query={query} />
                               </p>
                            </div>
     
                            <div className={cn(
                               "transition-all duration-500 flex items-center gap-3",
                               isSelected ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
                            )}>
                               <span className="hidden lg:inline text-[10px] font-black text-accent-purple uppercase tracking-[0.2em] italic">JUMP TO TOOL</span>
                               <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-accent-purple/20 flex items-center justify-center text-accent-purple border border-accent-purple/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                                 <ArrowRight size={16} strokeWidth={3} />
                               </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer Status Bar */}
                  <div className="mt-6 flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/10">
                     <div className="flex items-center gap-4 opacity-50">
                        <div className="hidden sm:flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-zinc-500">
                           <kbd className="px-2 py-1 rounded bg-black border border-white/10">↑↓</kbd> Navigate
                        </div>
                        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-zinc-500">
                           <kbd className="px-2 py-1 rounded bg-black border border-white/10">↵</kbd> Open
                        </div>
                        <div className="md:hidden flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-zinc-500">
                           <Zap size={10} className="text-accent-purple" /> Fast Access
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-2.5">
                         <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.4em] text-accent-cyan/80">System.Ready</span>
                         <div className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                     </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
