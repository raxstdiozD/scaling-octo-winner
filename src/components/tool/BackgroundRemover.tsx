"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { 
  ImageIcon, 
  Upload, 
  Download, 
  RefreshCw, 
  Loader2, 
  Sparkles, 
  Check, 
  X, 
  Layers, 
  Zap, 
  ShieldCheck, 
  History,
  Eraser,
  Minus,
  Plus,
  Undo2,
  Redo2,
  LayoutGrid,
  Maximize
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { saveFileHistory } from "@/lib/history";

type Mode = "bg-remove" | "object-erase";

interface HistoryState {
  mask: string;
}

export function BackgroundRemover() {
  const [mode, setMode] = useState<Mode>("bg-remove");
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("image.png");
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [comparisonValue, setComparisonValue] = useState(50);
  const [showComparison, setShowComparison] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Object Erase specific state
  const [brushSize, setBrushSize] = useState(40);
  const [brushHardness, setBrushHardness] = useState(80);
  const [isDrawing, setIsDrawing] = useState(false);
  const [maskHistory, setMaskHistory] = useState<HistoryState[]>([]);
  const [maskHistoryIndex, setMaskHistoryIndex] = useState(-1);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Canvas for Object Erase
  const initCanvas = useCallback((imgSrc: string) => {
    if (mode !== "object-erase") return;
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgSrc;
    img.onload = () => {
      const canvas = canvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      if (!canvas || !maskCanvas) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
      if (!ctx || !maskCtx) return;

      const parent = canvas.parentElement;
      if (!parent) return;
      
      const maxWidth = parent.clientWidth;
      const maxHeight = 600;
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
      
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Reset history
      const initialState = maskCanvas.toDataURL();
      setMaskHistory([{ mask: initialState }]);
      setMaskHistoryIndex(0);
    };
  }, [mode]);

  useEffect(() => {
    if (image && mode === "object-erase") {
      setTimeout(() => initCanvas(image), 100);
    }
  }, [mode, image, initCanvas]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        setImage(src);
        setResult(null);
        setShowComparison(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const processAction = async () => {
    if (mode === "bg-remove") await processBgRemoval();
    else await processObjectEraser();
  };

  const processBgRemoval = async () => {
    if (!imageFile) return;
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const response = await fetch("/api/tools/image/bg-remove", {
        method: "POST",
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        setResult(data.result);
        setShowComparison(true);
        setSuccessMessage("Background removed successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        
        await saveFileHistory({
          toolType: "bg-remove",
          originalName: fileName,
          resultUrl: data.result,
          fileType: "image",
          status: "completed",
        });
      } else {
        throw new Error(data.error || "Processing failed");
      }
    } catch (error: any) {
      console.error("Background removal failed:", error);
      setErrorMessage(error.message || "Something went wrong. Please try again.");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const processObjectEraser = async () => {
    if (!image) return;
    setIsProcessing(true);

    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    
    // Create a black and white mask for the API
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = maskCanvas.width;
    tempCanvas.height = maskCanvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCtx.fillStyle = "black";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    const maskData = maskCanvas.getContext("2d")?.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    if (maskData) {
      for (let i = 0; i < maskData.data.length; i += 4) {
        if (maskData.data[i + 3] > 0) {
          maskData.data[i] = 255;
          maskData.data[i + 1] = 255;
          maskData.data[i + 2] = 255;
          maskData.data[i + 3] = 255;
        }
      }
      tempCtx.putImageData(maskData, 0, 0);
    }

    try {
      const response = await fetch("/api/tools/image/eraser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, mask: tempCanvas.toDataURL("image/png") })
      });
      
      const data = await response.json();
      if (data.success) {
        setResult(data.result);
        setShowComparison(true);
        setSuccessMessage("Object removed with high precision!");
        setTimeout(() => setSuccessMessage(null), 3000);
        
        await saveFileHistory({
          toolType: "image-eraser",
          originalName: fileName,
          resultUrl: data.result,
          fileType: "image",
          status: "completed",
        });
      } else {
        throw new Error(data.error || "Erasure failed");
      }
    } catch (error: any) {
      console.error("Eraser failed:", error);
      setErrorMessage(error.message || "Something went wrong. Please try again.");
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Drawing Logic
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (isProcessing) return;
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = maskCanvasRef.current;
      if (canvas) {
        const newState = canvas.toDataURL();
        const newHistory = maskHistory.slice(0, maskHistoryIndex + 1);
        newHistory.push({ mask: newState });
        setMaskHistory(newHistory);
        setMaskHistoryIndex(newHistory.length - 1);
      }
    }
    setIsDrawing(false);
    maskCanvasRef.current?.getContext("2d")?.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (("touches" in e) ? e.touches[0].clientX : (e as React.MouseEvent).clientX) - rect.left;
    const y = (("touches" in e) ? e.touches[0].clientY : (e as React.MouseEvent).clientY) - rect.top;

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    const blur = (1 - brushHardness / 100) * brushSize / 2;
    ctx.shadowBlur = blur;
    ctx.shadowColor = "rgba(168, 85, 247, 0.8)";
    ctx.strokeStyle = "rgba(168, 85, 247, 0.8)";

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const undo = () => {
    if (maskHistoryIndex > 0) {
      const newIndex = maskHistoryIndex - 1;
      setMaskHistoryIndex(newIndex);
      loadHistoryState(newIndex);
    }
  };

  const redo = () => {
    if (maskHistoryIndex < maskHistory.length - 1) {
      const newIndex = maskHistoryIndex + 1;
      setMaskHistoryIndex(newIndex);
      loadHistoryState(newIndex);
    }
  };

  const loadHistoryState = (index: number) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = maskHistory[index].mask;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  const resetAll = () => {
    setImage(null);
    setImageFile(null);
    setResult(null);
    setMaskHistory([]);
    setMaskHistoryIndex(-1);
    setShowComparison(false);
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      
      {/* ERROR MESSAGE */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl bg-red-500/90 backdrop-blur-md text-white font-black text-xs uppercase tracking-widest shadow-3xl border border-red-400/50 flex items-center gap-4"
          >
             <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <X size={16} />
             </div>
             {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP TOOL BAR */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 p-6 rounded-[2.5rem] glass-dark border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 rounded-2xl bg-accent-purple/10 flex items-center justify-center text-accent-purple shadow-inner">
              {mode === "bg-remove" ? <ImageIcon size={32} /> : <Eraser size={32} />}
           </div>
           <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                {mode === "bg-remove" ? "Background Remover" : "Object Eraser"}
              </h2>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                {mode === "bg-remove" ? "Professional AI Cutouts" : "Studio-Grade Retouching"}
              </p>
           </div>
        </div>

        <div className="flex items-center gap-4 bg-black/40 p-1.5 rounded-2xl border border-white/5">
           <button 
             onClick={() => { setMode("bg-remove"); setResult(null); }}
             className={cn(
               "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               mode === "bg-remove" ? "bg-white/10 text-white shadow-xl" : "text-zinc-500 hover:text-zinc-300"
             )}
           >
              <LayoutGrid size={14} /> Background
           </button>
           <button 
             onClick={() => { setMode("object-erase"); setResult(null); }}
             className={cn(
               "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               mode === "object-erase" ? "bg-white/10 text-white shadow-xl" : "text-zinc-500 hover:text-zinc-300"
             )}
           >
              <Sparkles size={14} /> Objects
           </button>
        </div>

        <div className="flex items-center gap-3">
           {image && (
             <button 
               onClick={resetAll}
               className="group flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest"
             >
                <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> 
                New
             </button>
           )}
           {result && (
              <button 
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = result;
                  a.download = `${mode === 'bg-remove' ? 'cutout' : 'retouched'}-${fileName}`;
                  a.click();
                }}
                className="flex items-center gap-2 px-10 py-4 rounded-2xl premium-gradient text-white shadow-3xl hover:scale-105 active:scale-95 transition-all font-black text-[10px] uppercase tracking-[0.2em]"
              >
                 <Download size={18} /> Download Result
              </button>
           )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[650px]">
        
        {/* LEFT SIDE: SOURCE / UPLOAD */}
        <div className="relative rounded-[3rem] glass-dark border border-white/10 overflow-hidden flex flex-col shadow-4xl group/workspace">
           <div className="absolute top-6 left-6 z-20 flex items-center gap-3 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
              <div className="w-2 h-2 rounded-full bg-accent-purple animate-pulse" />
              <span className="text-[9px] font-black text-white uppercase tracking-widest">
                {mode === "bg-remove" ? "Image Source" : "Workspace"}
              </span>
           </div>

           <div className="flex-1 flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
              {!image ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-8 cursor-pointer hover:border-accent-purple/30 hover:bg-accent-purple/5 transition-all duration-700"
                >
                   <div className="relative">
                      <div className="absolute inset-0 bg-accent-purple/20 blur-3xl rounded-full" />
                      <div className="relative w-24 h-24 rounded-3xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500">
                         <Upload size={40} />
                      </div>
                   </div>
                   <div className="text-center space-y-2">
                      <h3 className="text-xl font-black text-white uppercase tracking-widest">Upload Image</h3>
                      <p className="text-zinc-500 text-sm font-medium">Drag & drop or click to browse</p>
                   </div>
                   <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                </div>
              ) : (
                <div className="relative max-w-full">
                   {mode === "bg-remove" ? (
                      <img src={image} className="rounded-2xl shadow-2xl max-w-full block" alt="Source" />
                   ) : (
                      <>
                        <canvas ref={canvasRef} className="rounded-2xl shadow-2xl max-w-full block" />
                        <canvas 
                          ref={maskCanvasRef} 
                          className={cn(
                             "absolute top-0 left-0 cursor-crosshair max-w-full block",
                             isProcessing && "pointer-events-none opacity-50"
                          )}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                      </>
                   )}
                </div>
              )}
           </div>

           {/* WORKSPACE TOOLBAR */}
           {image && !result && (
             <div className="p-4 md:p-6 border-t border-white/5 flex flex-wrap items-center justify-between bg-black/40 gap-4">
                {mode === "object-erase" && (
                   <div className="flex flex-wrap items-center gap-3 md:gap-6">
                      <div className="flex items-center gap-2 md:gap-3 bg-zinc-900/80 p-2 rounded-xl border border-white/5 shadow-inner">
                         <button onClick={() => setBrushSize(Math.max(5, brushSize - 5))} className="p-1.5 md:p-2 text-zinc-500 hover:text-white transition-colors"><Minus size={14}/></button>
                         <div className="flex flex-col items-center min-w-[45px]">
                            <span className="text-[10px] font-black text-white">{brushSize}px</span>
                            <span className="text-[8px] text-zinc-600 font-bold uppercase">Size</span>
                         </div>
                         <button onClick={() => setBrushSize(Math.min(150, brushSize + 5))} className="p-1.5 md:p-2 text-zinc-500 hover:text-white transition-colors"><Plus size={14}/></button>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <button onClick={undo} disabled={maskHistoryIndex <= 0} className="p-2.5 rounded-xl bg-white/5 text-zinc-400 hover:text-white disabled:opacity-20 transition-all border border-white/5"><Undo2 size={16} /></button>
                         <button onClick={redo} disabled={maskHistoryIndex >= maskHistory.length - 1} className="p-2.5 rounded-xl bg-white/5 text-zinc-400 hover:text-white disabled:opacity-20 transition-all border border-white/5"><Redo2 size={16} /></button>
                      </div>
                   </div>
                )}
                
                <button 
                   onClick={processAction} 
                   disabled={isProcessing} 
                   className={cn(
                     "flex items-center gap-2 px-10 py-4 rounded-xl premium-gradient text-white font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap",
                     mode === "bg-remove" && "mx-auto"
                   )}
                >
                   {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                   <span>{mode === "bg-remove" ? "Remove Background" : "Erase Selected"}</span>
                </button>
             </div>
           )}
        </div>

        {/* RIGHT SIDE: RESULT / BEFORE-AFTER */}
        <div className="relative rounded-[3rem] glass-dark border border-white/10 overflow-hidden flex flex-col shadow-4xl group/result">
           <div className="absolute top-6 left-6 z-20 flex items-center gap-3 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-black text-white uppercase tracking-widest">Result</span>
           </div>

           <div className="flex-1 flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] relative">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-8 text-center">
                   <div className="relative w-24 h-24">
                      <div className="absolute inset-0 rounded-full border-4 border-zinc-800" />
                      <div className="absolute inset-0 rounded-full border-4 border-t-accent-purple animate-spin" />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-xl font-black text-white uppercase tracking-widest animate-pulse">
                        {mode === "bg-remove" ? "Removing background..." : "Erasing object..."}
                      </h3>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                        {mode === "bg-remove" ? "Generating high-quality cutout" : "Synthesizing realistic background"}
                      </p>
                   </div>
                </div>
              ) : result ? (
                 <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <AnimatePresence>
                       {successMessage && (
                          <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2"
                          >
                             <Check size={14} /> {successMessage}
                          </motion.div>
                       )}
                    </AnimatePresence>
                    {showComparison ? (
                       <div className="relative w-full aspect-auto rounded-2xl overflow-hidden shadow-4xl border border-white/10 cursor-ew-resize">
                          <img src={image || ""} className="w-full h-auto block" alt="Before" />
                          <div 
                            className="absolute inset-0 overflow-hidden" 
                            style={{ clipPath: `inset(0 0 0 ${comparisonValue}%)` }}
                          >
                             <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                                <img src={result} className="w-full h-auto block" alt="After" />
                             </div>
                          </div>
                          
                          <div 
                            className="absolute inset-y-0 w-1 bg-white z-20 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                            style={{ left: `${comparisonValue}%` }}
                          >
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-2xl border-4 border-accent-purple/20">
                                <div className="flex gap-1">
                                   <div className="w-0.5 h-3 bg-accent-purple rounded-full" />
                                   <div className="w-0.5 h-3 bg-accent-purple rounded-full" />
                                </div>
                             </div>
                          </div>

                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={comparisonValue} 
                            onChange={(e) => setComparisonValue(parseInt(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                          />

                          <div className="absolute top-4 left-1/4 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[8px] font-black text-white uppercase tracking-widest pointer-events-none">Original</div>
                          <div className="absolute top-4 right-1/4 translate-x-1/2 px-4 py-1.5 rounded-full bg-accent-purple/60 backdrop-blur-md border border-accent-purple/20 text-[8px] font-black text-white uppercase tracking-widest pointer-events-none">Result</div>
                       </div>
                    ) : (
                       <img src={result} className="w-full h-auto rounded-2xl shadow-4xl" alt="Final" />
                    )}

                    <div className="mt-8 flex items-center gap-4">
                       <button 
                         onClick={() => setShowComparison(!showComparison)}
                         className={cn(
                            "px-6 py-3 rounded-xl border transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2",
                            showComparison ? "bg-accent-purple border-accent-purple/30 text-white" : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                         )}
                       >
                          <Layers size={14} /> {showComparison ? "Hide Comparison" : "Show Comparison"}
                       </button>
                    </div>
                 </div>
              ) : (
                <div className="flex flex-col items-center gap-6 text-center opacity-20">
                   <LayoutGrid size={64} className="text-zinc-600" />
                   <div className="space-y-1">
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Ready for action</p>
                      <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-widest leading-loose">
                        {mode === "bg-remove" ? "Upload an image to remove its background" : "Paint over objects to erase them naturally"}
                      </p>
                   </div>
                </div>
              )}
           </div>

           {/* RESULT ACTIONS */}
           {result && !isProcessing && (
              <div className="p-6 border-t border-white/5 flex items-center justify-center bg-black/20 gap-4">
                 <button 
                   onClick={() => {
                      const a = document.createElement("a");
                      a.href = result;
                      a.download = `${mode === 'bg-remove' ? 'cutout' : 'retouched'}-${fileName}`;
                      a.click();
                   }}
                   className="flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl premium-gradient text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                 >
                    <Download size={20} /> Download Result
                 </button>
                 <button 
                   onClick={resetAll}
                   className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all font-black text-xs uppercase tracking-widest"
                 >
                    <RefreshCw size={20} /> New
                 </button>
              </div>
           )}
        </div>

      </div>

      {/* BOTTOM INFO PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { icon: Zap, label: "AI Precision", value: mode === 'bg-remove' ? "Bria-AI RMBG" : "Flux Inpainting", color: "text-amber-500" },
           { icon: ShieldCheck, label: "Quality", value: "Lossless export", color: "text-emerald-500" },
           { icon: History, label: "Cloud Sync", value: "History enabled", color: "text-accent-blue" }
         ].map((stat, i) => (
           <div key={i} className="p-6 rounded-3xl glass-dark border border-white/5 flex items-center gap-4 group hover:border-white/10 transition-all">
              <div className={cn("w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center", stat.color)}>
                 <stat.icon size={20} />
              </div>
              <div className="text-left">
                 <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{stat.label}</div>
                 <div className="text-xs text-white font-bold">{stat.value}</div>
              </div>
           </div>
         ))}
      </div>

    </div>
  );
}
