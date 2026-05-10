"use client";

import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Monitor, 
  Upload, 
  Code2, 
  Eye, 
  Copy, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Zap,
  Globe,
  Layout,
  RefreshCw,
  Crown,
  ChevronRight,
  Info,
  Maximize,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePro } from "@/hooks/usePro";
import { ToolUploader } from "./ToolUploader";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const FRAMEWORKS = [
  { id: "react-tailwind", label: "React + Tailwind", icon: Zap, pro: false },
  { id: "html-css", label: "HTML/CSS", icon: Globe, pro: true },
  { id: "nextjs", label: "Next.js", icon: Layout, pro: true },
  { id: "vue", label: "Vue.js", icon: Code2, pro: true },
];

export function ScreenshotToCode() {
  const { isPro, user } = usePro();
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [framework, setFramework] = useState("react-tailwind");
  const [activeView, setActiveView] = useState<"code" | "preview">("preview");
  const [copied, setCopied] = useState(false);
  const lastFileRef = useRef<File | null>(null);
  
  const triggerAnalysis = useCallback(async (file: File, targetFramework: string) => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    setGeneratedCode(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("framework", targetFramework);
    formData.append("quality", isPro ? "ultra" : "high");

    try {
      const response = await fetch("/api/tools/ai/screenshot-to-code", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to analyze screenshot");
      }

      const data = await response.json();
      setGeneratedCode(data.result);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isPro, isAnalyzing]);

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    lastFileRef.current = file;
    const reader = new FileReader();
    reader.onload = (e) => setScreenshot(e.target?.result as string);
    reader.readAsDataURL(file);

    await triggerAnalysis(file, framework);
  };

  // 2. Functional Framework Switching: Auto-regenerate when framework changes
  React.useEffect(() => {
    if (lastFileRef.current && screenshot && !isAnalyzing) {
      triggerAnalysis(lastFileRef.current, framework);
    }
  }, [framework]); // Only trigger when framework changes

  const handleManualRegenerate = () => {
    if (lastFileRef.current) {
      triggerAnalysis(lastFileRef.current, framework);
    }
  };

  const copyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCode = () => {
    if (!generatedCode) return;
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ui-component-${Date.now()}.tsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-12 pb-32">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        
        {/* Left/Main Column */}
        <div className="xl:col-span-8 space-y-8">
           {!screenshot ? (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-white/[0.03] border border-white/10 rounded-[4rem] p-16 md:p-24 backdrop-blur-3xl shadow-4xl text-center relative overflow-hidden group"
             >
                <div className="absolute inset-0 bg-linear-to-br from-violet-500/5 to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative z-10 space-y-8">
                   <div className="w-24 h-24 rounded-3xl bg-violet-600/20 flex items-center justify-center mx-auto mb-8 shadow-2xl border border-violet-500/20">
                      <Monitor className="w-12 h-12 text-violet-400" />
                   </div>
                   <div className="max-w-xl mx-auto space-y-4">
                      <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white italic">
                         Screenshot to <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">Code</span>
                      </h2>
                      <p className="text-zinc-500 text-lg font-medium leading-relaxed uppercase text-[10px] tracking-[0.3em]">
                         Upload any UI design and get production-ready React code instantly.
                      </p>
                   </div>
                   <div className="pt-8">
                      <ToolUploader 
                        onUpload={handleUpload} 
                        acceptedTypes={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }} 
                        maxSize={10} 
                      />
                   </div>
                </div>
             </motion.div>
           ) : (
             <div className="space-y-8">
                {/* Result Control Bar */}
                <div className="flex items-center justify-between bg-zinc-950/40 backdrop-blur-3xl border border-white/5 rounded-3xl px-8 py-6 shadow-2xl">
                   <div className="flex items-center gap-6">
                      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                         {[
                           { id: 'preview', label: 'Preview', icon: Eye },
                           { id: 'code', label: 'Code', icon: Code2 }
                         ].map((tab) => (
                           <button
                             key={tab.id}
                             onClick={() => setActiveView(tab.id as any)}
                             className={cn(
                               "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                               activeView === tab.id ? "bg-white text-black shadow-xl scale-105" : "text-zinc-500 hover:text-white"
                             )}
                           >
                              <tab.icon className="w-3 h-3" />
                              {tab.label}
                           </button>
                         ))}
                      </div>
                      <div className="h-8 w-px bg-white/5" />
                      <div className="hidden md:flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                         <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Live Component</p>
                      </div>
                   </div>

                   <div className="flex items-center gap-3">
                      <button 
                        onClick={handleManualRegenerate}
                        disabled={!screenshot || isAnalyzing}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all disabled:opacity-50"
                        title="Manual Regenerate"
                      >
                         <RefreshCw className={cn("w-4 h-4", isAnalyzing && "animate-spin")} />
                         Regenerate
                      </button>
                      <button 
                        onClick={() => { setScreenshot(null); setGeneratedCode(null); lastFileRef.current = null; }}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-500 hover:text-white transition-all"
                        title="Start Over"
                      >
                         <RotateCcw className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={copyCode}
                        disabled={!generatedCode}
                        className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-500 transition-all shadow-lg shadow-violet-600/20 disabled:opacity-50"
                      >
                         {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                         {copied ? "Copied" : "Copy Code"}
                      </button>
                      <button 
                        onClick={downloadCode}
                        disabled={!generatedCode}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-500 hover:text-white transition-all"
                      >
                         <Download className="w-5 h-5" />
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[700px]">
                   {/* Original Screenshot */}
                   <div className="bg-zinc-950/40 border border-white/5 rounded-[3rem] overflow-hidden relative group">
                      <div className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[8px] font-black uppercase tracking-widest text-white/50">
                         Original Screenshot
                      </div>
                      <div className="h-full w-full p-8 flex items-center justify-center">
                         <img 
                           src={screenshot} 
                           alt="Original" 
                           className="max-h-full max-w-full rounded-2xl shadow-2xl object-contain transition-transform duration-700 group-hover:scale-105" 
                         />
                      </div>
                   </div>

                   {/* Preview or Code Output */}
                   <div className="bg-[#0D0D0E] border border-white/10 rounded-[2.5rem] overflow-hidden relative shadow-4xl flex flex-col group/container">
                      {/* Window Header */}
                      <div className="h-12 bg-[#161617] border-b border-white/5 flex items-center justify-between px-6 shrink-0">
                         <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-[0_0_10px_rgba(255,95,86,0.2)]" />
                            <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-[0_0_10px_rgba(255,189,46,0.2)]" />
                            <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-[0_0_10px_rgba(39,201,63,0.2)]" />
                         </div>
                         <div className="flex items-center gap-3">
                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 group-hover/container:text-white/40 transition-colors">
                               {activeView === 'code' ? 'main.tsx' : 'v0.dev/preview'}
                            </div>
                         </div>
                         <div className="w-12" /> {/* Spacer */}
                      </div>

                      <AnimatePresence mode="wait">
                         {isAnalyzing ? (
                           <motion.div 
                             key="loading"
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             exit={{ opacity: 0 }}
                             className="flex-1 flex flex-col items-center justify-center space-y-8 p-12 text-center"
                           >
                              <div className="relative">
                                 <motion.div 
                                   animate={{ rotate: 360 }}
                                   transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                   className="w-32 h-32 border-2 border-violet-500/10 border-t-violet-500 rounded-full" 
                                 />
                                 <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-10 h-10 text-violet-400 animate-pulse" />
                                 </div>
                                 {/* Scanning line effect */}
                                 <motion.div 
                                   animate={{ top: ['0%', '100%', '0%'] }}
                                   transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                   className="absolute left-0 right-0 h-0.5 bg-violet-500/40 shadow-[0_0_15px_rgba(168,85,247,0.5)] z-10"
                                 />
                              </div>
                              <div className="space-y-3">
                                 <h4 className="text-2xl font-black uppercase italic tracking-[0.2em] text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">Analyzing Design</h4>
                                 <div className="flex items-center justify-center gap-2">
                                    <RefreshCw size={12} className="text-violet-400 animate-spin" />
                                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">Engine: Llama 4 Scout</p>
                                 </div>
                              </div>
                           </motion.div>
                         ) : generatedCode ? (
                           <motion.div 
                             key={activeView}
                             initial={{ opacity: 0, scale: 0.98 }}
                             animate={{ opacity: 1, scale: 1 }}
                             exit={{ opacity: 0, scale: 1.02 }}
                             transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                             className="flex-1 overflow-hidden"
                           >
                              {activeView === "preview" ? (
                                <div className="h-full bg-white relative">
                                   {(() => {
                                      let rawCode = generatedCode || "";
                                      // Clean common AI garbage
                                      rawCode = rawCode.replace(/```[a-z]*|```/g, '').trim();
                                      
                                      // Extract the JSX content if it's a React component
                                      let cleanJSX = rawCode;
                                      if (rawCode.includes('return (')) {
                                        const start = rawCode.indexOf('return (') + 8;
                                        const end = rawCode.lastIndexOf(')');
                                        if (start > 7 && end > start) {
                                           cleanJSX = rawCode.substring(start, end);
                                        }
                                      } else if (rawCode.includes('return ')) {
                                        const start = rawCode.indexOf('return ') + 7;
                                        const end = rawCode.lastIndexOf(';');
                                        if (start > 6 && end > start) {
                                           cleanJSX = rawCode.substring(start, end);
                                        }
                                      }

                                      // Handle className -> class conversion for raw HTML injection
                                      cleanJSX = cleanJSX.replace(/className=/g, 'class=');

                                      return (
                                        <iframe 
                                          srcDoc={`
                                            <html>
                                              <head>
                                                <script src="https://cdn.tailwindcss.com"></script>
                                                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
                                                <style>
                                                  body { 
                                                    font-family: 'Inter', sans-serif; 
                                                    margin: 0; 
                                                    padding: 0;
                                                    background: #f8fafc;
                                                  }
                                                  #root {
                                                    min-height: 100vh;
                                                    padding: 2rem;
                                                  }
                                                </style>
                                              </head>
                                              <body>
                                                <div id="root">${cleanJSX}</div>
                                              </body>
                                            </html>
                                          `}
                                          className="w-full h-full border-none"
                                        />
                                      );
                                   })()}
                                </div>
                              ) : (
                                <div className="h-full custom-scrollbar overflow-auto bg-[#0A0A0B]">
                                   <SyntaxHighlighter 
                                     language="tsx" 
                                     style={atomDark}
                                     customStyle={{ 
                                       background: 'transparent', 
                                       padding: '2.5rem', 
                                       fontSize: '14px',
                                       lineHeight: '1.7',
                                       fontFamily: '"JetBrains Mono", "Fira Code", monospace'
                                     }}
                                     showLineNumbers={true}
                                     lineNumberStyle={{ minWidth: '3em', paddingRight: '1.5em', color: '#333' }}
                                   >
                                     {generatedCode}
                                   </SyntaxHighlighter>
                                </div>
                              )}
                           </motion.div>
                         ) : (
                           <div className="flex-1 flex flex-col items-center justify-center space-y-6 p-12 text-center">
                              <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                                 <Code2 className="w-8 h-8 text-zinc-800" />
                              </div>
                              <div className="space-y-2">
                                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">Terminal Idle</p>
                                 <p className="text-[8px] font-bold text-zinc-800 uppercase tracking-widest">Waiting for input...</p>
                              </div>
                           </div>
                         )}
                      </AnimatePresence>
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* Sidebar Setup */}
        <div className="xl:col-span-4 space-y-8">
           <div className="bg-white/[0.03] border border-white/10 rounded-[3.5rem] p-10 backdrop-blur-3xl sticky top-24">
              <div className="flex items-center justify-between mb-10">
                 <h3 className="text-2xl font-black uppercase tracking-tight italic">Engine Config</h3>
                 <Zap className="w-6 h-6 text-violet-400" />
              </div>

              <div className="space-y-12">
                 {/* Framework Selection */}
                 <div className="space-y-6">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-[0.4em]">Target Stack</label>
                    <div className="grid grid-cols-1 gap-3">
                       {FRAMEWORKS.map((fw) => (
                         <button
                           key={fw.id}
                           onClick={() => setFramework(fw.id)}
                           className={cn(
                             "group flex items-center justify-between p-5 rounded-2xl border transition-all relative overflow-hidden",
                             framework === fw.id ? "bg-violet-600 border-violet-500 text-white shadow-xl" : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10",
                             fw.pro && !isPro && "opacity-60 grayscale cursor-not-allowed"
                           )}
                         >
                            <div className="flex items-center gap-4 relative z-10">
                               <fw.icon className={cn("w-5 h-5", framework === fw.id ? "text-white" : "text-violet-400")} />
                               <span className="text-xs font-black uppercase tracking-widest">{fw.label}</span>
                            </div>
                            
                            {fw.pro && (
                              <div className="relative z-10 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/20 text-[7px] font-black">
                                 <Crown size={8} className="text-amber-400" />
                                 PRO
                              </div>
                            )}

                            {framework === fw.id && (
                              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />
                            )}
                         </button>
                       ))}
                    </div>
                 </div>

                 {/* System Status */}
                 <div className="pt-8 border-t border-white/5 space-y-6">
                    <div className="flex items-center justify-between p-6 rounded-[2.5rem] bg-violet-500/5 border border-violet-500/10">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/5 rounded-2xl text-violet-400">
                             <Sparkles size={20} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-white uppercase tracking-widest">Llama 4 Scout Vision</p>
                             <p className="text-[8px] font-bold text-gray-500 uppercase mt-1">Multi-Modal AI Engine</p>
                          </div>
                       </div>
                       <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </div>

                    <div className="p-8 rounded-[2.5rem] bg-linear-to-br from-violet-600/10 to-transparent border border-violet-500/10 space-y-4">
                       <div className="flex items-center gap-3">
                          <Info className="w-4 h-4 text-zinc-500" />
                          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">How it works</h4>
                       </div>
                       <p className="text-[10px] font-medium text-zinc-600 leading-relaxed uppercase tracking-tight">
                          Our AI extracts structural patterns, color palettes, and interactive components from your screenshot to build semantic, accessible code.
                       </p>
                    </div>

                    {!isPro && (
                      <div className="p-1 rounded-[2.5rem] bg-linear-to-r from-violet-600 to-fuchsia-600 p-[1px]">
                         <div className="bg-black rounded-[2.5rem] p-8 space-y-6">
                            <div className="space-y-2 text-center">
                               <h5 className="text-lg font-black italic tracking-tight text-white">Unlock Ultra Precision</h5>
                               <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest">Multiple frameworks & 99% layout accuracy</p>
                            </div>
                            <button className="w-full py-4 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl">
                               Upgrade to Pro
                            </button>
                         </div>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.4);
        }
      `}</style>
    </div>
  );
}
