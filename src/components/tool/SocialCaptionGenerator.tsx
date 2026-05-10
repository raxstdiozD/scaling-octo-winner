"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  RefreshCw, 
  Zap, 
  Camera, 
  MessageSquare, 
  Briefcase, 
  Share2, 
  Image as ImageIcon,
  Smile,
  Globe,
  RotateCcw,
  Music
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePro } from "@/hooks/usePro";
import { ToolUploader } from "./ToolUploader";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
  ), color: "from-purple-500 to-pink-500" },
  { id: "twitter", label: "Twitter/X", icon: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  ), color: "from-zinc-900 to-black" },
  { id: "linkedin", label: "LinkedIn", icon: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
  ), color: "from-blue-600 to-blue-800" },
  { id: "youtube", label: "YouTube", icon: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 2-2 68.4 68.4 0 0 1 15 0 2 2 0 0 1 2 2 24.12 24.12 0 0 1 0 10 2 2 0 0 1-2 2 68.4 68.4 0 0 1-15 0 2 2 0 0 1-2-2Z"/><path d="m10 15 5-3-5-3z"/></svg>
  ), color: "from-red-600 to-red-700" },
  { id: "tiktok", label: "TikTok", icon: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
  ), color: "from-zinc-800 to-black" },
  { id: "facebook", label: "Facebook", icon: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
  ), color: "from-blue-500 to-blue-700" },
];

const MOODS = [
  { id: "professional", label: "Professional", emoji: "💼" },
  { id: "casual", label: "Casual", emoji: "☕" },
  { id: "funny", label: "Funny", emoji: "😂" },
  { id: "emotional", label: "Emotional", emoji: "🥺" },
  { id: "sales", label: "Sales-Oriented", emoji: "💰" },
  { id: "inspiring", label: "Inspiring", emoji: "✨" },
];

const SURPRISE_TOPICS = [
  "A day in the life of a digital nomad",
  "Why minimalism is the key to productivity",
  "My secret recipe for the perfect iced coffee",
  "How to start a business with $0",
  "The future of AI in 2026",
  "My top 5 favorite books of all time",
  "The most important lesson I learned this year",
];

interface Caption {
  caption: string;
  hashtags: string[];
}

export function SocialCaptionGenerator() {
  const { isPro } = usePro();
  const [topic, setTopic] = useState("");
  const [mood, setMood] = useState("professional");
  const [platform, setPlatform] = useState("instagram");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const lastFileRef = useRef<File | null>(null);

  const handleUpload = (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    lastFileRef.current = file;
    const reader = new FileReader();
    reader.onload = (e) => setScreenshot(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSurpriseMe = () => {
    const randomTopic = SURPRISE_TOPICS[Math.floor(Math.random() * SURPRISE_TOPICS.length)];
    setTopic(randomTopic);
  };

  const generateCaptions = async () => {
    if (!topic && !lastFileRef.current) return;
    
    setIsGenerating(true);
    setCaptions([]);

    const formData = new FormData();
    formData.append("topic", topic);
    formData.append("mood", mood);
    formData.append("platform", platform);
    if (lastFileRef.current) {
      formData.append("file", lastFileRef.current);
    }

    try {
      const response = await fetch("/api/tools/ai/social-caption", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate captions");
      }
      
      const data = await response.json();
      const finalResult = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      setCaptions(finalResult);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyCaption = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-12 pb-32">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Side: Inputs */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white/[0.03] border border-white/10 rounded-[3.5rem] p-10 backdrop-blur-3xl shadow-4xl sticky top-24">
            <div className="flex items-center justify-between mb-10">
               <div>
                  <h3 className="text-3xl font-black uppercase tracking-tight italic">Caption AI</h3>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-2">Viral Content Engine</p>
               </div>
               <div className="p-4 bg-violet-600/20 rounded-2xl border border-violet-500/20">
                  <Sparkles className="w-6 h-6 text-violet-400" />
               </div>
            </div>

            <div className="space-y-8">
               {/* Platform Selection */}
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Platform</label>
                  <div className="flex flex-wrap gap-2">
                     {PLATFORMS.map((p) => (
                       <button
                         key={p.id}
                         onClick={() => setPlatform(p.id)}
                         className={cn(
                           "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest",
                           platform === p.id 
                            ? "bg-white text-black border-white shadow-xl scale-105" 
                            : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10"
                         )}
                       >
                          <p.icon />
                          {p.label}
                       </button>
                     ))}
                  </div>
               </div>

               {/* Topic Input */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">What's the topic?</label>
                    <button 
                      onClick={handleSurpriseMe}
                      className="text-[9px] font-black text-violet-400 uppercase tracking-widest hover:text-violet-300 transition-colors"
                    >
                       Surprise Me
                    </button>
                  </div>
                  <div className="relative group">
                     <textarea
                       value={topic}
                       onChange={(e) => setTopic(e.target.value)}
                       placeholder="Describe your post, product, or feeling..."
                       className="w-full bg-white/5 border border-white/5 rounded-3xl p-6 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-violet-500/50 transition-all min-h-[140px] resize-none"
                     />
                     <div className="absolute bottom-4 right-4 text-[9px] font-black text-zinc-800 uppercase tracking-widest">
                        {topic.length} / 500
                     </div>
                  </div>
               </div>

               {/* Image Upload for Context */}
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Visual Context (Optional)</label>
                  {!screenshot ? (
                    <ToolUploader 
                      onUpload={handleUpload}
                      acceptedTypes={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                      maxSize={5}
                    />
                  ) : (
                    <div className="relative rounded-3xl overflow-hidden border border-white/10 group">
                       <img src={screenshot} alt="Preview" className="w-full h-40 object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
                       <div className="absolute inset-0 flex items-center justify-center gap-3">
                          <button 
                            onClick={() => { setScreenshot(null); lastFileRef.current = null; }}
                            className="p-3 bg-black/60 backdrop-blur-xl rounded-2xl text-white hover:bg-red-500 transition-colors shadow-2xl"
                          >
                             <RotateCcw className="w-5 h-5" />
                          </button>
                       </div>
                    </div>
                  )}
               </div>

               {/* Mood Selection */}
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Tone & Mood</label>
                  <div className="grid grid-cols-3 gap-2">
                     {MOODS.map((m) => (
                       <button
                         key={m.id}
                         onClick={() => setMood(m.id)}
                         className={cn(
                           "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all",
                           mood === m.id 
                            ? "bg-violet-600/20 border-violet-500/50 text-white shadow-lg" 
                            : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10"
                         )}
                       >
                          <span className="text-xl">{m.emoji}</span>
                          <span className="text-[8px] font-black uppercase tracking-widest">{m.label}</span>
                       </button>
                     ))}
                  </div>
               </div>

               <button
                 onClick={generateCaptions}
                 disabled={isGenerating || (!topic && !screenshot)}
                 className="w-full py-6 rounded-[2rem] bg-white text-black font-black uppercase tracking-[0.2em] text-xs hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed group"
               >
                  {isGenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 text-violet-600 group-hover:scale-125 transition-transform" />
                  )}
                  {isGenerating ? "Analyzing Context..." : "Generate Magic"}
               </button>
            </div>
          </div>
        </div>

        {/* Right Side: Results */}
        <div className="lg:col-span-7 space-y-8">
           <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Output Feed</h4>
              </div>
              {captions.length > 0 && (
                <button 
                  onClick={() => setCaptions([])}
                  className="text-[9px] font-black uppercase tracking-widest text-zinc-700 hover:text-white transition-colors"
                >
                   Clear All
                </button>
              )}
           </div>

           <AnimatePresence mode="popLayout">
              {isGenerating ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="grid grid-cols-1 gap-6"
                >
                   {[1, 2, 3].map((i) => (
                     <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 h-48 animate-pulse" />
                   ))}
                </motion.div>
              ) : captions.length > 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 gap-6"
                >
                   {captions.map((cap, idx) => (
                     <motion.div
                       key={idx}
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: idx * 0.1 }}
                       className="group bg-[#0D0D0E] border border-white/5 rounded-[2.5rem] p-8 hover:border-white/10 transition-all hover:shadow-4xl relative overflow-hidden"
                     >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="relative z-10 space-y-6">
                           <p className="text-zinc-300 text-sm leading-relaxed font-medium">
                              {cap.caption}
                           </p>
                           
                           <div className="flex flex-wrap gap-2">
                              {cap.hashtags?.map((h, i) => (
                                <span key={i} className="text-[10px] font-bold text-violet-400 hover:text-violet-300 cursor-pointer">
                                   {h}
                                </span>
                              ))}
                           </div>

                           <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-[8px] font-black uppercase tracking-widest text-zinc-500">
                                    <Sparkles size={10} className="text-violet-400" />
                                    AI Crafted
                                 </div>
                              </div>
                              <button
                                onClick={() => copyCaption(cap.caption + "\n\n" + cap.hashtags.join(" "), idx)}
                                className={cn(
                                  "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                  copiedId === idx 
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" 
                                    : "bg-white text-black hover:scale-105"
                                )}
                              >
                                 {copiedId === idx ? <Check size={12} /> : <Copy size={12} />}
                                 {copiedId === idx ? "Copied" : "Copy"}
                              </button>
                           </div>
                        </div>
                     </motion.div>
                   ))}
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 space-y-8 opacity-20">
                   <div className="w-24 h-24 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center">
                      <Share2 size={32} className="text-zinc-700" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">Captions will appear here</p>
                </div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
