"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Download, 
  RefreshCw, 
  Image as ImageIcon, 
  Settings2, 
  History,
  Trash2,
  Maximize2,
  Wand2,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { useCredits } from "@/hooks/useCredits";

interface GeneratorOptions {
  prompt: string;
  width: number;
  height: number;
  steps: number;
  guidance: number;
  n: number;
}

const ASPECT_RATIOS = [
  { name: "1:1 Square", width: 1024, height: 1024 },
  { name: "16:9 Cinema", width: 1280, height: 720 },
  { name: "9:16 Portrait", width: 720, height: 1280 },
  { name: "4:3 Classic", width: 1024, height: 768 },
];

const EXAMPLE_PROMPTS = [
  "A futuristic cyberpunk city with neon lights and flying cars, cinematic lighting, 8k resolution.",
  "An ethereal forest with glowing mushrooms and a crystal clear lake, studio ghibli style.",
  "Portrait of a mechanical owl with emerald eyes, extremely detailed, macro photography.",
  "Minimalist abstract landscape of a red desert on a distant planet, flat design style.",
];

export function ImageGeneratorTool() {
  const { deductCredits, credits, plan, notification } = useCredits();
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [history, setHistory] = useState<{url: string, prompt: string, width: number, height: number}[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [error, setError] = useState<React.ReactNode | null>(null);

  const { register, handleSubmit, setValue, watch } = useForm<GeneratorOptions>({
    defaultValues: {
      prompt: "",
      width: 1024,
      height: 1024,
      steps: 4,
      guidance: 3.5,
      n: 1
    }
  });

  const onSubmit = async (data: GeneratorOptions) => {
    if (!data.prompt.trim()) {
      setError("Please enter a prompt first.");
      return;
    }

    const cost = 10;
    if (credits < cost) {
      setError(
        <div className="flex flex-col gap-3">
          <p>Insufficient credits. You need {cost} credits but only have {credits}.</p>
          <button 
            onClick={() => window.location.href = '/pricing'}
            className="w-fit px-4 py-2 rounded-lg bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
          >
            Upgrade Now
          </button>
        </div>
      );
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const resp = await axios.post("/api/tools/ai/image-generate", data);
      if (resp.data.success) {
        const newUrl = resp.data.imageUrl;
        setResults([newUrl]);
        setHistory(prev => [{ 
          url: newUrl, 
          prompt: data.prompt,
          width: data.width,
          height: data.height 
        }, ...prev]);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Failed to generate image. Please try again.";
      const needsUpgrade = err.response?.data?.needsUpgrade;
      
      setError(
        needsUpgrade ? (
          <div className="flex flex-col gap-3">
            <p>{errorMsg}</p>
            <button 
              onClick={() => window.location.href = '/pricing'}
              className="w-fit px-4 py-2 rounded-lg bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
            >
              View Pro Plans
            </button>
          </div>
        ) : errorMsg
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSurprise = () => {
    const random = EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)];
    setValue("prompt", random);
  };

  const handleVariations = () => {
    if (results.length === 0) return;
    
    // Get base prompt (remove any existing variation suffix to prevent stacking)
    let currentPrompt = watch("prompt");
    const variationSuffix = ", highly detailed variation, alternative angle, cinematic lighting";
    
    // Simple check: if it already ends with the suffix, don't add it again, just re-run
    if (!currentPrompt.includes("variation")) {
      currentPrompt = `${currentPrompt}${variationSuffix}`;
      setValue("prompt", currentPrompt);
    }
    
    handleSubmit(onSubmit)();
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `lumora-gen-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 min-h-[700px]">
      {/* Configuration Sidebar */}
      <div className="xl:col-span-1 space-y-8 glass-dark p-8 rounded-[2.5rem] border border-white/5 flex flex-col h-fit sticky top-32">
        <div className="flex items-center gap-3 pb-4 border-b border-white/5">
           <Settings2 className="text-zinc-500" size={18} />
           <span className="text-xs font-black uppercase tracking-widest text-zinc-100">Generation Config</span>
        </div>

        <div className="space-y-6">
          {/* Aspect Ratio */}
          <div className="space-y-3">
             <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Dimensions</label>
             <div className="grid grid-cols-2 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.name}
                    type="button"
                    onClick={() => { setValue("width", ratio.width); setValue("height", ratio.height); }}
                    className={cn(
                      "p-3 rounded-xl border text-[10px] font-bold transition-all",
                      watch("width") === ratio.width ? "bg-accent-purple/20 border-accent-purple text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]" : "bg-white/5 border-white/5 text-zinc-500 hover:text-zinc-200"
                    )}
                  >
                    {ratio.name}
                  </button>
                ))}
             </div>
          </div>

          {/* Sliders */}
          <div className="space-y-6">
             <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Flux Steps</label>
                   <span className="text-xs font-bold text-accent-purple">{watch("steps")}</span>
                </div>
                <input type="range" min="1" max="50" {...register("steps")} className="w-full accent-accent-purple bg-zinc-800 rounded-lg h-1.5 cursor-pointer" />
                <p className="text-[9px] text-zinc-600 font-medium">Flux.1 Schnell: 4 steps | Flux Dev: 20+ steps</p>
             </div>

             <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Guidance Scale</label>
                   <span className="text-xs font-bold text-accent-purple">{watch("guidance")}</span>
                </div>
                <input type="range" step="0.1" min="1" max="20" {...register("guidance")} className="w-full accent-accent-purple bg-zinc-800 rounded-lg h-1.5 cursor-pointer" />
             </div>
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-white/5">
           <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 mb-4">
              <Sparkles size={16} className="text-amber-500" />
              <div className="flex flex-col">
                 <span className="text-xs font-bold text-zinc-100 italic">Premium Generation</span>
                 <span className="text-[9px] text-zinc-500 font-medium uppercase tracking-widest">Flux.1 Pro Latent Diffusion</span>
              </div>
           </div>
        </div>
      </div>

      {/* Main Generation Area */}
      <div className="xl:col-span-3 space-y-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
           {/* Prompt Input Container */}
           <div className="relative group p-1 bg-linear-to-b from-accent-purple/20 to-transparent rounded-[2.5rem]">
              <div className="bg-zinc-950/80 rounded-[2.3rem] overflow-hidden border border-white/5 shadow-2xl backdrop-blur-3xl">
                <textarea 
                  {...register("prompt")}
                  placeholder="A futuristic mechanical butterfly with translucent wings..."
                  className="w-full min-h-[180px] p-8 pb-20 bg-transparent text-lg font-medium text-white placeholder:text-zinc-700 focus:outline-none transition-all resize-none"
                />
                <div className="absolute bottom-6 left-8 right-8 flex items-center justify-between border-t border-white/5 pt-4">
                   <div className="flex items-center gap-4">
                      <button 
                        type="button"
                        onClick={handleSurprise}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                      >
                         Surprise Me
                      </button>
                      <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
                         {watch("prompt").length} Characters
                      </span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 rounded-lg bg-accent-purple/10 border border-accent-purple/20 flex items-center gap-2">
                         <Wand2 size={12} className="text-accent-purple" />
                         <span className="text-[10px] font-black text-accent-purple uppercase tracking-widest">Enhanced Mode</span>
                      </div>
                   </div>
                </div>
              </div>
           </div>

           <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                 <button 
                  type="button"
                  onClick={() => setActiveTab('generate')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    activeTab === 'generate' ? "bg-white/10 text-white" : "text-zinc-600 hover:text-zinc-400"
                  )}
                 >
                    Editor
                 </button>
                 <button 
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all gap-2 flex items-center",
                    activeTab === 'history' ? "bg-white/10 text-white" : "text-zinc-600 hover:text-zinc-400"
                  )}
                 >
                    History
                    <History size={14} />
                 </button>
              </div>

              <button 
                type="submit"
                disabled={isGenerating}
                className={cn(
                  "px-10 py-5 rounded-2xl premium-gradient text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-4",
                  isGenerating ? "opacity-70 scale-95 cursor-not-allowed" : "hover:scale-105 active:scale-95"
                )}
              >
                 {isGenerating ? (
                   <>
                    <RefreshCw size={20} className="animate-spin" />
                    Generating...
                   </>
                 ) : (
                  <>
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                        <Sparkles size={20} className="animate-pulse" />
                        Generate Magic
                      </div>
                      <span className="text-[8px] font-black tracking-widest text-white/50">Costs 10 Credits</span>
                    </div>
                  </>
                 )}
              </button>
           </div>
        </form>

        {/* Display Area */}
        <AnimatePresence mode="wait">
           {activeTab === 'generate' ? (
             <motion.div 
               key="editor"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="space-y-8"
             >
                {/* Result Message Container */}
                {error && (
                  <div className="p-6 rounded-[1.5rem] bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold animate-shake">
                     {error}
                  </div>
                )}

                {/* Primary Display */}
                <div className="min-h-[500px] rounded-[3rem] glass-dark border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                   {isGenerating ? (
                     <div className="text-center space-y-8 relative z-10 p-12">
                        <div className="relative w-32 h-32 mx-auto">
                           <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                              className="absolute inset-0 rounded-full border-t-2 border-accent-purple shadow-[0_0_20px_rgba(124,58,237,0.5)]"
                           />
                           <motion.div 
                              animate={{ rotate: -360 }}
                              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                              className="absolute inset-2 rounded-full border-b-2 border-accent-blue shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                           />
                           <div className="absolute inset-0 flex items-center justify-center">
                              <Sparkles size={40} className="text-white animate-pulse" />
                           </div>
                        </div>
                        <div className="space-y-3">
                           <p className="text-2xl font-black text-white tracking-tight animate-pulse">Generating your masterpiece...</p>
                           <div className="flex flex-col gap-1">
                              <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.3em]">Invoking Groq LPU Flux Engines</p>
                              <p className="text-accent-purple/60 font-medium text-[9px] uppercase tracking-widest">Optimized for Near-Instant Inference</p>
                           </div>
                        </div>
                     </div>
                   ) : results.length > 0 ? (
                     <div className="w-full h-full p-6 flex flex-col gap-6">
                        <div className="relative w-full max-h-[70vh] bg-zinc-900 rounded-[2.5rem] overflow-hidden group/img shadow-2xl border border-white/5">
                           <img 
                              src={results[0]} 
                              alt="Generated AI Artwork" 
                              className="w-full h-full object-contain"
                           />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-4">
                              <button 
                                onClick={() => handleDownload(results[0])}
                                className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shadow-2xl"
                                title="Download"
                              >
                                 <Download size={24} />
                              </button>
                              <button 
                                onClick={() => window.open(results[0], '_blank')}
                                className="w-14 h-14 rounded-2xl bg-zinc-800 text-white flex items-center justify-center hover:scale-110 transition-transform shadow-2xl border border-white/10"
                                title="Full Size"
                              >
                                 <Maximize2 size={24} />
                              </button>
                           </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-center gap-4 pb-4">
                           <button 
                              onClick={() => handleDownload(results[0])}
                              className="px-6 py-3 rounded-xl bg-white text-black text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-200 transition-all"
                           >
                              <Download size={16} />
                              Download Image
                           </button>
                           <button 
                              onClick={handleVariations}
                              className="px-6 py-3 rounded-xl bg-zinc-800 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-zinc-700 transition-all border border-white/5"
                           >
                              <RefreshCw size={16} />
                              Generate Variations
                           </button>
                           <button 
                              onClick={() => handleSubmit(onSubmit)()}
                              className="px-6 py-3 rounded-xl bg-accent-blue/10 text-accent-blue text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-accent-blue/20 transition-all border border-accent-blue/20"
                           >
                              <RefreshCw size={16} />
                              Generate Again
                           </button>
                           <button 
                              onClick={() => setActiveTab('history')}
                              className="px-6 py-3 rounded-xl bg-accent-purple/10 text-accent-purple text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-accent-purple/20 transition-all border border-accent-purple/20"
                           >
                              <History size={16} />
                              Save to History
                           </button>
                        </div>
                     </div>
                   ) : (
                     <div className="text-center space-y-8 opacity-50 group-hover:opacity-80 transition-opacity p-20">
                        <div className="w-24 h-24 rounded-[2rem] bg-zinc-800 flex items-center justify-center mx-auto text-zinc-600 border border-white/5">
                           <ImageIcon size={40} />
                        </div>
                        <div className="space-y-2">
                           <p className="text-2xl font-black text-white tracking-tight">Your masterpiece starts here</p>
                           <p className="text-zinc-500 font-medium">Enter a prompt and hit generate to see the magic.</p>
                        </div>
                     </div>
                   )}

                   {/* Background Accents */}
                   <div className="absolute top-0 right-0 w-96 h-96 bg-accent-purple/5 blur-[120px] rounded-full -z-10" />
                   <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-blue/5 blur-[120px] rounded-full -z-10" />
                </div>
             </motion.div>
           ) : (
             <motion.div 
               key="history"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="grid grid-cols-2 lg:grid-cols-3 gap-6"
             >
                {history.length > 0 ? history.map((item, i) => (
                  <div key={i} className="group relative aspect-square rounded-[2.5rem] overflow-hidden glass border border-white/5 shadow-xl">
                     <img src={item.url} alt="History Art" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                     <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                        <p className="text-[10px] text-zinc-100 line-clamp-2 font-bold mb-4 italic leading-relaxed">"{item.prompt}"</p>
                        <div className="flex gap-2">
                           <button 
                              onClick={() => {
                                 setResults([item.url]);
                                 setValue("prompt", item.prompt);
                                 setValue("width", item.width);
                                 setValue("height", item.height);
                                 setActiveTab('generate');
                              }} 
                              className="flex-1 py-3 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                           >
                              Load
                           </button>
                           <button 
                              onClick={() => handleDownload(item.url)}
                              className="p-3 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition-colors border border-white/10"
                           >
                              <Download size={16} />
                           </button>
                        </div>
                     </div>
                  </div>
                )) : (
                  <div className="col-span-full h-96 flex flex-col items-center justify-center space-y-4 opacity-30">
                     <div className="p-8 rounded-full bg-zinc-800/50">
                        <History size={64} className="text-zinc-600" />
                     </div>
                     <div className="text-center">
                        <p className="font-black text-zinc-400 uppercase tracking-[0.3em] text-xs">Awaiting Magic</p>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase mt-2">Your generation history will appear here</p>
                     </div>
                  </div>
                )}
             </motion.div>
           )}
        </AnimatePresence>
      </div>
      {/* --- Notification Toast --- */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={cn(
              "fixed bottom-12 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl z-[1000] flex items-center gap-3 min-w-[200px] justify-center",
              notification.type === 'warning' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-white/5 border-white/10 text-white"
            )}
          >
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              notification.type === 'warning' ? "bg-amber-500" : "bg-accent-purple"
            )} />
            <span className="text-xs font-black uppercase tracking-widest">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
