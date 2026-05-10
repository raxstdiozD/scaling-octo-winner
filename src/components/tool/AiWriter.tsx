"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Sparkles, 
  Type, 
  Send, 
  Copy, 
  Check, 
  RotateCcw, 
  FileText, 
  PenTool,
  Clock,
  Layers,
  Zap,
  Globe,
  Share2,
  Settings2,
  RefreshCw,
  MoreVertical,
  MessageSquare
} from "lucide-react";

const QUICK_PROMPTS = [
  { id: "blog", label: "Blog Post", icon: FileText, prompt: "Write a detailed blog post about..." },
  { id: "caption", label: "IG Caption", icon: Layers, prompt: "Generate a catchy Instagram caption for..." },
  { id: "email", label: "Email", icon: Send, prompt: "Write a professional email to..." },
  { id: "story", label: "Short Story", icon: PenTool, prompt: "Tell a sci-fi short story about..." },
  { id: "script", label: "YT Script", icon: Zap, prompt: "Create a 5-minute YouTube script for..." },
];

const TONES = ["Professional", "Casual", "Funny", "Persuasive", "Creative"];
const LENGTHS = ["Short", "Medium", "Long"];

import { useCredits } from "@/hooks/useCredits";

export default function AiWriter() {
  const { credits, deductCredits, setShowUpsell } = useCredits();
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("Creative");
  const [length, setLength] = useState("Medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    // Credit Check (Pre-flight)
    const cost = 5;
    if (credits < cost) {
      setShowUpsell(true);
      return;
    }

    setIsGenerating(true);
    setResult("");
    setActiveTab("preview");

    try {
      const response = await fetch("/api/tools/ai/writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tone, length }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate content. Please try again.");
      }

      const data = await response.json();
      setResult(data.content);
    } catch (error: any) {
      console.error(error);
      setResult(`Error: ${error.message || "Failed to connect to the AI system."}`);
    } finally {
      setIsGenerating(false);
    }
  };


  const handleQuickPrompt = (p: string) => {
    setPrompt(p);
    textareaRef.current?.focus();
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-12 pb-24">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* Main Interface */}
        <div className="xl:col-span-8 space-y-8">
          <div className="bg-white/[0.03] border border-white/10 rounded-[3rem] overflow-hidden backdrop-blur-xl shadow-2xl relative">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-10 py-6 border-b border-white/5">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
               </div>
               <div className="flex bg-white/5 p-1 rounded-xl">
                  {["write", "preview"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={cn(
                        "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        activeTab === tab ? "bg-white text-black shadow-xl" : "text-gray-500 hover:text-white"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
               </div>
            </div>

            <div className="p-8 md:p-12 min-h-[500px]">
               <AnimatePresence mode="wait">
                  {activeTab === "write" ? (
                    <motion.div 
                      key="write"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-8"
                    >
                       <textarea
                         ref={textareaRef}
                         value={prompt}
                         onChange={(e) => setPrompt(e.target.value)}
                         placeholder="What should I write for you today?"
                         className="w-full h-[400px] bg-transparent text-2xl md:text-3xl font-medium text-white placeholder-zinc-700 outline-none resize-none leading-relaxed"
                       />
                       
                       <div className="flex flex-wrap gap-3 pt-8 border-t border-white/5">
                          {QUICK_PROMPTS.map((qp) => (
                            <button
                              key={qp.id}
                              onClick={() => handleQuickPrompt(qp.prompt)}
                              className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all group"
                            >
                               <qp.icon className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                               {qp.label}
                            </button>
                          ))}
                       </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative h-full"
                    >
                       {isGenerating ? (
                         <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-6">
                            <div className="relative">
                               <div className="w-20 h-20 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                               <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-purple-500 animate-pulse" />
                            </div>
                            <h4 className="text-xl font-black uppercase italic tracking-widest text-white/50">AI is Thinking...</h4>
                         </div>
                       ) : (
                         <div className="prose prose-invert max-w-none">
                            <div className="text-xl md:text-2xl text-zinc-300 leading-relaxed whitespace-pre-wrap font-serif">
                               {result || "Generation will appear here..."}
                            </div>
                         </div>
                       )}
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>

            {/* Float Bottom Bar */}
            <div className="p-8 border-t border-white/5 bg-white/[0.01]">
               <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                     <button onClick={() => setPrompt("")} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-500 transition-all"><RotateCcw size={20} /></button>
                     <div className="h-8 w-px bg-white/5 mx-2" />
                     <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                        {prompt.length} Characters
                     </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                     {result && (
                       <button 
                         onClick={handleCopy}
                         className="flex items-center gap-3 px-8 py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                       >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                          {copied ? "Copied" : "Copy Result"}
                       </button>
                     )}
                     <button
                       onClick={handleGenerate}
                       disabled={!prompt.trim() || isGenerating}
                       className="group flex items-center gap-4 px-12 py-5 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-purple-50 transition-all shadow-2xl disabled:opacity-50"
                     >
                        <span>{isGenerating ? "Processing" : "Generate Magic"}</span>
                        <Sparkles size={20} className={cn("group-hover:rotate-12 transition-transform", isGenerating && "animate-spin")} />
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Sidebar Configuration */}
        <div className="xl:col-span-4 space-y-8">
           <div className="bg-white/[0.03] border border-white/10 rounded-[3.5rem] p-10 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-2xl font-black uppercase tracking-tight italic">Studio Setup</h3>
                 <Settings2 className="w-6 h-6 text-purple-400" />
              </div>

              <div className="space-y-12">
                 {/* Tone Selection */}
                 <div className="space-y-6">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.4em]">Response Tone</label>
                    <div className="grid grid-cols-2 gap-3">
                       {TONES.map((t) => (
                         <button
                           key={t}
                           onClick={() => setTone(t)}
                           disabled={isGenerating}
                           className={cn(
                             "py-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all",
                             tone === t ? "bg-purple-600 border-purple-500 text-white shadow-xl scale-105" : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10"
                           )}
                         >
                           {t}
                         </button>
                       ))}
                    </div>
                 </div>

                 {/* Length Selection */}
                 <div className="space-y-6">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.4em]">Content Length</label>
                    <div className="grid grid-cols-3 gap-3">
                       {LENGTHS.map((l) => (
                         <button
                           key={l}
                           onClick={() => setLength(l)}
                           disabled={isGenerating}
                           className={cn(
                             "py-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all",
                             length === l ? "bg-purple-600 border-purple-500 text-white shadow-xl" : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10"
                           )}
                         >
                           {l}
                         </button>
                       ))}
                    </div>
                 </div>

                 {/* Export & Actions */}
                 <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="p-6 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4">
                       <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                          <Globe size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-widest">Multi-Engine</p>
                          <p className="text-[8px] font-bold text-gray-500 uppercase mt-1">Universal Language Support</p>
                       </div>
                    </div>
                    
                    <button className="w-full py-6 flex items-center justify-center gap-3 bg-white/5 rounded-[2rem] text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">
                       <Share2 size={18} />
                       Export Project
                    </button>
                 </div>
              </div>
           </div>

           {/* Quick Stats */}
           <div className="p-8 rounded-[3rem] bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-violet-500/20">
              <div className="flex items-center gap-4 mb-6">
                 <div className="p-3 bg-white/10 rounded-2xl">
                    <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />
                 </div>
                 <h4 className="text-sm font-black text-white uppercase tracking-widest">Llama 3.3 Engine</h4>
              </div>
              <p className="text-gray-400 text-xs font-medium leading-relaxed">Your content is processed by the cutting-edge Llama 3.3 70B cluster for world-class writing quality.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
