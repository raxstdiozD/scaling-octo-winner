"use client";

import { useState, useEffect } from "react";
import { Tool, Category, ICON_MAP } from "@/data/tools";
import { ToolCard } from "@/components/ui/ToolCard";
import { useToolProcessor } from "@/hooks/useToolProcessor";
import { ImageGeneratorTool } from "@/components/tool/ImageGeneratorTool";
import { PasswordGenerator } from "@/components/tool/PasswordGenerator";
import { UnitConverter } from "@/components/tool/UnitConverter";
import { PaletteGenerator } from "@/components/tool/PaletteGenerator";
import { JsonFormatter } from "@/components/tool/JsonFormatter";
import { BackgroundRemover } from "@/components/tool/BackgroundRemover";
import { BulkImageCompressor } from "@/components/tool/BulkImageCompressor";
import { ImageResizerCropper } from "@/components/tool/ImageResizerCropper";
import { ImageFormatConverter } from "@/components/tool/ImageFormatConverter";
import { PhotoRestorer } from "@/components/tool/PhotoRestorer";
import { WatermarkRemover } from "@/components/tool/WatermarkRemover";
import { CollageMaker } from "@/components/tool/CollageMaker";
import { VocalRemover } from "@/components/tool/VocalRemover";
import { StemSplitter } from "@/components/tool/StemSplitter";
import { NoiseRemover } from "@/components/tool/NoiseRemover";
import { TextToSpeech } from "@/components/tool/TextToSpeech";
import { AiChatTool } from "@/components/tool/AiChatTool";
import { AiCodeGenerator } from "@/components/tool/AiCodeGenerator";
import AiWriter from "@/components/tool/AiWriter";
import PdfMerger from "@/components/tool/PdfMerger";
import PdfSplitter from "@/components/tool/PdfSplitter";
import PdfCompressor from "@/components/tool/PdfCompressor";
import PdfToImage from "@/components/tool/PdfToImage";
import ImgToPdf from "@/components/tool/ImgToPdf";
import PdfToWord from "@/components/tool/PdfToWord";
import OcrExtractor from "@/components/tool/OcrExtractor";
import Link from "next/link";
import { 
  ArrowLeft, 
  Upload, 
  Play,
  CheckCircle2,
  Sparkles,
  Download,
  Share2,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Script from "next/script";
import { ProtectedTool } from "@/components/tool/ProtectedTool";
import axios from "axios";

interface ToolDetailClientProps {
  tool: Tool;
  category: Category;
  relatedTools: Tool[];
  categoryId: string;
  toolId: string;
}

export function ToolDetailClient({ tool, category, relatedTools, categoryId, toolId }: ToolDetailClientProps) {
  const endpoint = `/api/tools/${categoryId}/${toolId.replace('img-', '').replace('vid-', '').replace('pdf-', '')}`;
  const { processFile, isProcessing, progress, error, result, reset } = useToolProcessor(endpoint);
  
  const [fileName, setFileName] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [displayResult, setDisplayResult] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showShareToast, setShowShareToast] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const fetchFavorites = async () => {
      try {
        const response = await axios.get('/api/user/favorites');
        setIsFavorited(response.data.favorites.includes(toolId));
      } catch (err) {
        console.error("Failed to fetch favorites:", err);
      }
    };
    fetchFavorites();
  }, [toolId]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    }
  };

  const handleFavorite = async () => {
    const previousState = isFavorited;
    setIsFavorited(!isFavorited);
    
    try {
      await axios.post('/api/user/favorites', {
        toolId,
        action: previousState ? 'remove' : 'add'
      });
    } catch (err) {
      console.error("Failed to update favorite:", err);
      setIsFavorited(previousState);
    }
  };

  const Icon = ICON_MAP[tool.icon] || Sparkles;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    await processFile(file);
  };

  const handleGenerate = async () => {
    if (!textInput.trim()) return;
    reset();
    setDisplayResult(null);
    const blob = new Blob([textInput], { type: 'text/plain' });
    const file = new File([blob], "prompt.txt", { type: 'text/plain' });
    await processFile(file);
  };

  useEffect(() => {
    if (result && !tool.requiresFileUpload) {
      const blob = new Blob([result], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      setDisplayResult(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setDisplayResult(result);
    }
  }, [result, tool]);

  const isSpecialTool = [
    'ai-img-gen', 'ai-logo', 'ai-writer', 'ai-chat',
    'productivity-passgen', 'productivity-units', 'productivity-palette', 'productivity-json',
    'image-eraser', 'image-compressor', 'image-resizer', 'image-converter', 'image-restorer', 'watermark-remover', 'image-collage',
    'audio-vocal-remover', 'audio-stem-splitter', 'audio-noise-remover', 'audio-tts',
    'pdf-merger', 'pdf-splitter', 'pdf-compressor', 'pdf-to-img', 'pdf-img-to-pdf', 'pdf-to-word', 'pdf-ocr'
  ].includes(tool.id);

  const PageContent = (
    <div className="p-4 md:p-12 max-w-7xl mx-auto space-y-12 pb-32">
      {categoryId === 'pdf' && (
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
          strategy="beforeInteractive"
          onLoad={() => {
            if (typeof window !== 'undefined' && (window as any).pdfjsLib) {
              (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
            }
          }}
        />
      )}
       {tool.id !== 'image-eraser' && (
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-zinc-800/50">

          <div className="space-y-6">
            <Link href={`/category/${categoryId}`} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all group">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              {category.name}
            </Link>
            <div className="flex items-center gap-6">
               <div className="w-24 h-24 rounded-[2.5rem] glass-dark border border-white/10 flex items-center justify-center shadow-2xl relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                  <Icon size={48} className={cn("relative z-10", tool.pro ? "text-accent-purple" : "text-white")} />
               </div>
               <div className="space-y-2 text-left">
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase italic px-8 -mx-8">
                      {tool.name}
                    </h1>
                    {tool.pro && (
                      <span className="px-3 py-1 rounded-full bg-accent-purple/20 border border-accent-purple/30 text-accent-purple text-[10px] font-black uppercase tracking-widest">
                        Pro
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-500 font-medium max-w-2xl text-lg leading-relaxed">{tool.description}</p>
               </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 relative">
             <AnimatePresence>
                {showShareToast && (
                   <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute -top-12 right-0 px-4 py-2 rounded-xl bg-accent-purple text-white text-[10px] font-black uppercase tracking-widest shadow-2xl z-50 whitespace-nowrap"
                   >
                      Link Copied!
                   </motion.div>
                )}
             </AnimatePresence>

             <button 
                onClick={handleShare}
                title="Share tool"
                className="p-5 rounded-2xl glass-dark border border-white/5 text-zinc-400 hover:text-white transition-all hover:scale-110 active:scale-95 group relative"
             >
                <Share2 size={24} />
             </button>

             <button 
                onClick={handleFavorite}
                title="Save to favorites"
                className={cn(
                    "p-5 rounded-2xl glass-dark border border-white/5 transition-all hover:scale-110 active:scale-95 group relative",
                    isFavorited ? "text-accent-purple border-accent-purple/30 bg-accent-purple/5" : "text-zinc-400 hover:text-white"
                )}
             >
                <Star size={24} className={cn("relative z-10", isFavorited && "fill-accent-purple")} />
             </button>
          </div>
       </div>
       )}


       <div className="grid grid-cols-1 xl:grid-cols-3 gap-16">
          <div className={cn(isSpecialTool ? "xl:col-span-3" : "xl:col-span-2", "space-y-10")}>
             {tool.id === 'ai-img-gen' || tool.id === 'ai-logo' ? (
                <ImageGeneratorTool />
             ) : tool.id === 'ai-chat' ? (
                <AiChatTool />
             ) : tool.id === 'ai-writer' ? (
                <AiWriter />
             ) : tool.id === 'productivity-passgen' ? (
                <PasswordGenerator />
             ) : tool.id === 'productivity-units' ? (
                <UnitConverter />
             ) : tool.id === 'productivity-palette' ? (
                <PaletteGenerator />
             ) : tool.id === 'productivity-json' ? (
                <JsonFormatter />
             ) : tool.id === 'image-eraser' ? (
                <BackgroundRemover />
             ) : tool.id === 'image-compressor' ? (
                <BulkImageCompressor />
             ) : tool.id === 'image-resizer' ? (
                <ImageResizerCropper />
             ) : tool.id === 'image-converter' ? (
                <ImageFormatConverter />
             ) : tool.id === 'image-restorer' ? (
                <PhotoRestorer />
             ) : tool.id === 'watermark-remover' ? (
                <WatermarkRemover />
             ) : tool.id === 'image-collage' ? (
                <CollageMaker />
             ) : tool.id === 'audio-vocal-remover' ? (
                <VocalRemover />
             ) : tool.id === 'audio-stem-splitter' ? (
                <StemSplitter />
             ) : tool.id === 'audio-noise-remover' ? (
                <NoiseRemover />
             ) : tool.id === 'audio-tts' ? (
                <TextToSpeech />
             ) : tool.id === 'pdf-merger' ? (
                <PdfMerger />
             ) : tool.id === 'pdf-splitter' ? (
                <PdfSplitter />
             ) : tool.id === 'pdf-compressor' ? (
                <PdfCompressor />
             ) : tool.id === 'pdf-to-img' ? (
                <PdfToImage />
             ) : tool.id === 'pdf-img-to-pdf' ? (
                <ImgToPdf />
             ) : tool.id === 'pdf-to-word' ? (
                <PdfToWord />
             ) : tool.id === 'pdf-ocr' ? (
                <OcrExtractor />
             ) : (
                <div className="space-y-10">
                   <div className="relative group">
                      <div className={cn(
                        "min-h-[450px] rounded-[3.5rem] glass-dark border-2 border-zinc-800 p-8 md:p-12 transition-all duration-700",
                        "group-hover:border-white/10",
                        tool.requiresFileUpload && "border-dashed"
                      )}>
                         <AnimatePresence mode="wait">
                            {!isProcessing && !result && (
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full h-full flex flex-col items-center justify-center text-center space-y-8">
                                 {tool.requiresFileUpload ? (
                                   fileName ? (
                                     <div className="space-y-6">
                                        <div className="w-24 h-24 rounded-3xl bg-accent-purple/10 flex items-center justify-center text-accent-purple mx-auto"><Play size={40} /></div>
                                        <p className="text-2xl font-black text-white">{fileName}</p>
                                        <button onClick={() => setFileName(null)} className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest">Remove file</button>
                                     </div>
                                   ) : (
                                     <>
                                       <div className="w-28 h-28 rounded-[2.5rem] bg-zinc-800/50 flex items-center justify-center text-zinc-500 group-hover:text-accent-purple group-hover:scale-110 transition-all duration-700 shadow-3xl border border-white/5"><Upload size={48} /></div>
                                       <div className="space-y-2">
                                         <p className="text-3xl font-black text-white tracking-tight text-center">Drop your files here</p>
                                         <p className="text-zinc-500 font-medium text-center">Supported: {tool.acceptedFileTypes?.join(', ') || 'Various formats'}</p>
                                       </div>
                                       <label className="px-12 py-5 rounded-2xl premium-gradient text-white font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer">
                                         Select Files
                                         <input type="file" className="hidden" accept={tool.acceptedFileTypes?.join(',')} onChange={handleFileChange} />
                                       </label>
                                     </>
                                   )
                                 ) : (
                                   <div className="w-full space-y-8 text-left">
                                     <div className="relative">
                                       <textarea 
                                         className="w-full min-h-[300px] bg-zinc-900/50 rounded-[2.5rem] p-10 text-xl md:text-2xl text-white placeholder-zinc-700 border border-white/10 focus:border-accent-purple/50 focus:ring-4 focus:ring-accent-purple/5 outline-none transition-all resize-none shadow-inner"
                                         placeholder={tool.placeholderPrompt || "Enter your instructions here..."}
                                         value={textInput}
                                         onChange={(e) => setTextInput(e.target.value)}
                                       />
                                       <div className="absolute bottom-8 right-8">
                                         <button onClick={handleGenerate} className="flex items-center gap-3 px-10 py-5 rounded-2xl premium-gradient text-white font-black text-sm uppercase tracking-widest shadow-3xl hover:scale-105 active:scale-95 transition-all">
                                           <Sparkles size={20} /> Generate magic
                                         </button>
                                       </div>
                                     </div>
                                   </div>
                                 )}
                              </motion.div>
                            )}
                            {isProcessing && (
                              <div className="w-full h-full flex flex-col items-center justify-center space-y-10 py-12">
                                 <div className="relative w-40 h-40">
                                    <svg className="w-full h-full transform -rotate-90">
                                       <circle cx="80" cy="80" r="75" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-zinc-800" />
                                       <circle cx="80" cy="80" r="75" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-accent-purple transition-all duration-300" style={{ strokeDasharray: 471, strokeDashoffset: 471 - (471 * progress) / 100 }} />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center"><span className="text-3xl font-black text-white">{progress}%</span></div>
                                 </div>
                              </div>
                            )}
                            {result && (
                               <div className="flex flex-col md:flex-row items-center justify-between p-10 rounded-[2.5rem] glass border border-emerald-500/20 bg-emerald-500/5 gap-8">
                                  <div className="flex items-center gap-8 text-left">
                                     <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]"><CheckCircle2 size={40} /></div>
                                     <div>
                                        <p className="text-3xl font-black text-white tracking-tight">Success!</p>
                                        <p className="text-zinc-500 font-medium">Your content has been processed and is ready.</p>
                                     </div>
                                  </div>
                                  <a href={displayResult || "#"} download={`toolverse-${tool.id}-result.txt`} className="w-full md:auto px-10 py-5 rounded-2xl bg-emerald-500 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all">
                                     <Download size={20} /> Download result
                                  </a>
                               </div>
                            )}
                         </AnimatePresence>
                      </div>
                   </div>
                </div>
             )}
          </div>

          {!isSpecialTool && (
            <div className="space-y-12 text-left">
               <div className="space-y-8">
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Related Tools</h3>
                     <div className="flex-1 h-px bg-zinc-800/50 mx-6" />
                  </div>
                  <div className="space-y-8">
                     {relatedTools.map((t, idx) => (
                        <ToolCard key={t.id} {...t} index={idx} className="hover:scale-[1.02] transition-transform origin-left" />
                     ))}
                  </div>
               </div>

               <div className="p-10 rounded-[3rem] bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-violet-500/20 relative overflow-hidden group">
                  <div className="relative z-10 space-y-6">
                     <div className="w-16 h-16 rounded-[1.5rem] bg-accent-purple/20 flex items-center justify-center text-accent-purple">
                        <Sparkles size={32} className="animate-pulse" />
                     </div>
                     <h3 className="text-2xl font-black text-white tracking-tight">Upgrade to Meta Pro</h3>
                     <button className="w-full py-5 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest shadow-3xl hover:bg-zinc-200 transition-all">
                        Go Unlimited
                     </button>
                  </div>
               </div>
            </div>
          )}
       </div>

      <div className="fixed top-0 right-0 w-[60%] h-[60%] bg-accent-purple/[0.03] blur-[150px] -z-10 rounded-full" />
      <div className="fixed bottom-0 left-0 w-[60%] h-[60%] bg-accent-blue/[0.03] blur-[150px] -z-10 rounded-full" />
    </div>
  );

  return tool.isProTool ? (
    <ProtectedTool>
      {PageContent}
    </ProtectedTool>
  ) : PageContent;
}
