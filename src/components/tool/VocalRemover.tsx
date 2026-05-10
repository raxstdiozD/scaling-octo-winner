"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { 
  Upload, 
  X, 
  Music, 
  Mic2, 
  Download, 
  RefreshCw, 
  Play, 
  Pause,
  Volume2,
  Trash2,
  Sparkles,
  Loader2,
  FileAudio,
  Zap,
  Archive,
  MonitorPlay,
  Waves
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- Types ---

interface AudioState {
  file: File;
  url: string;
  duration: number;
}

interface SeparationResult {
  vocals: {
    url: string;
    peaks: number[];
  };
  instrumental: {
    url: string;
    peaks: number[];
  };
  zip: string;
}

// --- Waveform Component ---

const WaveformVisualizer = ({ peaks, color, progress, onSeek }: { peaks: number[], color: string, progress: number, onSeek?: (p: number) => void }) => {
    return (
        <div 
            className="flex items-center gap-[1px] h-full w-full py-4 px-2 relative cursor-pointer group/wave"
            onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const p = Math.max(0, Math.min(1, x / rect.width));
                onSeek?.(p);
            }}
        >
            {peaks.map((p, i) => {
                const barProgress = i / peaks.length;
                const isPlayed = barProgress <= progress;
                return (
                    <div 
                        key={i} 
                        className={cn(
                            "flex-1 rounded-full transition-colors duration-200", 
                            isPlayed ? color : "bg-white/10"
                        )} 
                        style={{ height: `${Math.max(0.1, p) * 100}%`, minHeight: '2px' }}
                    />
                );
            })}
            
            {/* Playhead Line */}
            <motion.div 
                className="absolute top-0 bottom-0 w-[2px] bg-white z-20 shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                initial={false}
                animate={{ left: `${progress * 100}%` }}
                transition={{ type: "spring", bounce: 0, duration: 0.1 }}
            />
            
            {/* Hover seek indicator */}
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/wave:opacity-100 transition-opacity pointer-events-none" />
        </div>
    );
};

// --- Main Tool ---

export function VocalRemover() {
  const [audio, setAudio] = useState<AudioState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<SeparationResult | null>(null);
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
  const [playbackProgress, setPlaybackProgress] = useState<Record<string, number>>({});
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [isMounted, setIsMounted] = useState(false);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const steps = [
    "Getting ready...",
    "Looking at the song...",
    "Separating voices...",
    "Finishing up..."
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const audioTag = new Audio(url);
      audioTag.onloadedmetadata = () => {
        setAudio({
          file,
          url,
          duration: audioTag.duration
        });
      };
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "audio/*": [".mp3", ".wav", ".m4a", ".flac"] },
    multiple: false,
  });

  const extractPeaks = (buffer: AudioBuffer, points: number) => {
    const channelData = buffer.getChannelData(0);
    const step = Math.floor(channelData.length / points);
    const peaks = [];
    for (let i = 0; i < points; i++) {
        let max = 0;
        for (let j = 0; j < step; j++) {
            const val = Math.abs(channelData[i * step + j]);
            if (val > max) max = val;
        }
        peaks.push(max);
    }
    return peaks;
  };

  const handleProcess = async () => {
    if (!audio) return;
    setIsProcessing(true);
    setStep(0);
    setProgress(0);

    try {
        // Step 0: Initializing
        setStep(0);
        setProgress(5);

        // Create FormData for the file upload
        const formData = new FormData();
        formData.append('file', audio.file);

        // Step 1: Uploading & Analyzing
        setStep(1);
        setProgress(15);

        // Call the engine directly if possible to bypass Vercel timeouts
        const engineBaseUrl = process.env.NEXT_PUBLIC_ENGINE_URL || '';
        const apiUrl = engineBaseUrl ? `${engineBaseUrl.endsWith('/') ? engineBaseUrl.slice(0, -1) : engineBaseUrl}/separate` : '/api/tools/vocal-remover';
        
        console.log('Sending request to:', apiUrl);
        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            let errorMsg = 'Separation failed';
            try {
                const error = await response.json();
                errorMsg = error.error || error.detail || errorMsg;
            } catch (e) {
                const text = await response.text();
                errorMsg = text || errorMsg;
            }
            
            if (response.status === 503) {
                alert("The AI service is currently starting up. Please wait 30 seconds and try again!");
            } else {
                throw new Error(errorMsg);
            }
            return;
        }

        // Simulating some progress while waiting for the heavy lifting on the server
        // This makes the UI feel more alive
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev < 90) {
                    if (prev < 40) setStep(1);
                    else if (prev < 80) setStep(2);
                    else setStep(3);
                    return prev + 1;
                }
                return prev;
            });
        }, 300);

        const data = await response.json();
        clearInterval(progressInterval);
        
        setProgress(95);
        setStep(3);

        if (!data.success) {
            throw new Error(data.error || 'Failed to separate audio');
        }

        const { vocals, instrumental } = data.result;

        // Process results to get peaks for visualization
        // Using a fresh context for each attempt to avoid issues
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        const getPeaksFromSource = async (src: string) => {
            try {
                const res = await fetch(src);
                const arrayBuffer = await res.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                return extractPeaks(audioBuffer, 80);
            } catch (err) {
                console.warn("Peak extraction failed, using fallback:", err);
                // Return some random-looking peaks as fallback
                return Array.from({ length: 80 }, () => Math.random() * 0.5 + 0.2);
            }
        };

        // Extract peaks in parallel for better performance
        const [vocalPeaks, instrumentalPeaks] = await Promise.all([
            getPeaksFromSource(vocals),
            getPeaksFromSource(instrumental)
        ]);

        setResult({
            vocals: { url: vocals, peaks: vocalPeaks },
            instrumental: { url: instrumental, peaks: instrumentalPeaks },
            zip: "#" 
        });

        setProgress(100);

    } catch (e: any) {
        console.error("Extraction error:", e);
        alert("Extraction failed: " + (e.message || "Unknown error"));
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!result || !audio) return;
    
    try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        
        const vocalRes = await fetch(result.vocals.url);
        const vocalBlob = await vocalRes.blob();
        zip.file("Vocals.mp3", vocalBlob);
        
        const instRes = await fetch(result.instrumental.url);
        const instBlob = await instRes.blob();
        zip.file("Instrumental.mp3", instBlob);
        
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${audio.file.name.split('.')[0]}_separated.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("ZIP creation failed:", e);
        alert("Failed to create ZIP file");
    }
  };


  const togglePlay = (id: string, url: string) => {
    // Pause other tracks
    Object.keys(audioRefs.current).forEach(k => { 
        if(k !== id && !audioRefs.current[k]?.paused) { 
            audioRefs.current[k]?.pause(); 
            setIsPlaying(p => ({...p, [k]: false})); 
        } 
    });

    if (!audioRefs.current[id]) {
      const audio = new Audio(url);
      audioRefs.current[id] = audio;
      
      audio.onloadedmetadata = () => {
          setDurations(prev => ({ ...prev, [id]: audio.duration }));
      };

      audio.ontimeupdate = () => {
          setPlaybackProgress(prev => ({ 
              ...prev, 
              [id]: audio.currentTime / audio.duration 
          }));
      };

      audio.onended = () => {
          setIsPlaying(p => ({ ...p, [id]: false }));
          setPlaybackProgress(prev => ({ ...prev, [id]: 0 }));
      };
    }

    const a = audioRefs.current[id];
    if (isPlaying[id]) { 
        a.pause(); 
        setIsPlaying(p => ({...p, [id]: false})); 
    } else { 
        a.play().catch(console.error);
        setIsPlaying(p => ({...p, [id]: true})); 
    }
  };

  const handleSeek = (id: string, percent: number) => {
      const audio = audioRefs.current[id];
      if (audio && audio.duration) {
          audio.currentTime = percent * audio.duration;
          setPlaybackProgress(prev => ({ ...prev, [id]: percent }));
      }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${r.toString().padStart(2, '0')}`;
  };

  const reset = () => {
    setAudio(null);
    setResult(null);
    setStep(0);
    setProgress(0);
  };

  if (!isMounted) return <div className="min-h-[500px]" />;

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-6" suppressHydrationWarning>
      <AnimatePresence mode="wait">
        {!audio && !result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
            <div 
              {...getRootProps()} 
              className={cn(
                "min-h-[450px] rounded-[3rem] border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center p-12 text-center group cursor-pointer relative",
                isDragActive ? "border-accent-cyan bg-accent-cyan/5 shadow-2xl scale-[1.01]" : "border-white/10 glass-dark hover:border-white/20 shadow-xl"
              )}
            >
              <input {...getInputProps()} />
              <div className="w-24 h-24 rounded-[2rem] bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-600 group-hover:text-accent-cyan group-hover:scale-110 transition-all duration-500 mb-8">
                <Upload size={40} />
              </div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4 uppercase italic">Separate voice and music</h1>
              <p className="text-zinc-500 max-w-md text-lg font-medium leading-relaxed">
                Use AI to separate voices and music from any song.
              </p>
              <div className="mt-10 px-10 py-4 rounded-xl bg-white text-black font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                Choose audio file
              </div>
              <div className="mt-8 flex gap-4 text-white/20 text-[10px] font-black tracking-widest uppercase">
                <span>MP3</span>
                <span>WAV</span>
                <span>M4A</span>
                <span>FLAC</span>
              </div>
            </div>
          </motion.div>
        )}

        {audio && !isProcessing && !result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-8">
            <div className="glass-dark border border-white/5 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-12 shadow-2xl">
              <div className="w-40 h-40 rounded-[2.5rem] bg-linear-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-accent-cyan shadow-inner border border-white/10">
                <FileAudio size={64} />
              </div>
              <div className="flex-1 space-y-6 w-full text-center md:text-left">
                <div>
                   <h2 className="text-3xl font-black text-white mb-2 truncate max-w-lg leading-tight uppercase italic tracking-tighter">{audio.file.name}</h2>
                   <div className="flex items-center justify-center md:justify-start gap-4">
                      <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black text-zinc-400 uppercase tracking-widest">{audio.file.type.split('/')[1]?.toUpperCase() || "AUDIO"}</span>
                      <span className="flex items-center gap-2 text-zinc-500 text-[9px] font-black uppercase tracking-widest"><Volume2 size={12}/> {formatTime(audio.duration)}</span>
                   </div>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                   <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1 }} className="h-full bg-accent-cyan shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
                </div>
                <div className="flex gap-4 pt-2">
                  <button onClick={handleProcess} className="flex-[3] py-5 rounded-2xl bg-linear-to-r from-accent-cyan to-accent-blue text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4">
                    <Zap size={18} /> Start
                  </button>
                  <button onClick={() => setAudio(null)} className="flex-1 py-5 rounded-2xl border border-white/10 text-zinc-600 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center">
                    <Trash2 size={22} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[450px] w-full glass-dark border border-white/10 rounded-[3.5rem] flex flex-col items-center justify-center p-12 text-center shadow-3xl">
             <div className="w-32 h-32 mb-12 relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-accent-cyan animate-spin" />
                <span className="text-2xl font-black text-white italic">{progress}%</span>
             </div>
             <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Working...</h2>
             <div className="flex items-center gap-3 text-accent-cyan">
                <Loader2 size={24} className="animate-spin" />
                <p className="text-sm font-black uppercase tracking-[0.4em]">{steps[step]}</p>
             </div>
          </motion.div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full space-y-10">
            <div className="flex items-center justify-between border-b border-white/5 pb-8">
              <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Your songs are ready</h2>
              <button onClick={reset} className="px-6 py-3 rounded-xl border border-white/10 text-zinc-500 hover:text-white hover:bg-white/5 font-black text-[10px] uppercase tracking-widest transition-all gap-2 flex items-center">
                <RefreshCw size={14} /> Try another
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               {/* Vocals Card */}
               <div className="glass-dark border border-white/10 rounded-[3rem] p-10 space-y-8 relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent-purple/5 blur-[50px] -z-10" />
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-accent-purple/20 text-accent-purple flex items-center justify-center shadow-lg"><Mic2 size={24} /></div>
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Just the voice</h3>
                     </div>
                     <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[9px] font-black uppercase tracking-widest">Clear</span>
                  </div>
                  
                  <div className="bg-black/40 border border-white/5 rounded-3xl h-32 relative overflow-hidden group/wave-container">
                     <WaveformVisualizer 
                        peaks={result.vocals.peaks} 
                        color="bg-accent-purple" 
                        progress={playbackProgress['v'] || 0}
                        onSeek={(p) => handleSeek('v', p)}
                     />
                     <div className="absolute bottom-2 right-4 text-[10px] font-black text-white/30 tracking-widest uppercase">
                        {formatTime((playbackProgress['v'] || 0) * (durations['v'] || 0))} / {formatTime(durations['v'] || 0)}
                     </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => togglePlay('v', result.vocals.url)} className="w-16 h-16 rounded-2xl bg-accent-purple flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all">
                       {isPlaying['v'] ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                    </button>
                    <a href={result.vocals.url} download="vocals.mp3" className="flex-1 py-5 rounded-2xl border border-accent-purple/30 text-accent-purple hover:bg-accent-purple hover:text-white font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                       <Download size={20} /> Save voice
                    </a>
                  </div>
               </div>

               {/* Instrumental Card */}
               <div className="glass-dark border border-white/10 rounded-[3rem] p-10 space-y-8 relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-accent-cyan/5 blur-[50px] -z-10" />
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-accent-cyan/20 text-accent-cyan flex items-center justify-center shadow-lg"><Music size={24} /></div>
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Just the music</h3>
                     </div>
                     <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[9px] font-black uppercase tracking-widest">Clear</span>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-3xl h-32 relative overflow-hidden group/wave-container">
                     <WaveformVisualizer 
                        peaks={result.instrumental.peaks} 
                        color="bg-accent-cyan" 
                        progress={playbackProgress['i'] || 0}
                        onSeek={(p) => handleSeek('i', p)}
                     />
                     <div className="absolute bottom-2 right-4 text-[10px] font-black text-white/30 tracking-widest uppercase">
                        {formatTime((playbackProgress['i'] || 0) * (durations['i'] || 0))} / {formatTime(durations['i'] || 0)}
                     </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => togglePlay('i', result.instrumental.url)} className="w-16 h-16 rounded-2xl bg-accent-cyan flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all">
                       {isPlaying['i'] ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                    </button>
                    <a href={result.instrumental.url} download="instrumental.mp3" className="flex-1 py-5 rounded-2xl border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan hover:text-white font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3">
                       <Download size={20} /> Save music
                    </a>
                  </div>
               </div>
            </div>

            <button 
                onClick={handleDownloadZip}
                className="w-full py-8 rounded-[2.5rem] bg-linear-to-r from-accent-purple to-accent-cyan text-white font-black text-xl italic uppercase tracking-[0.2em] shadow-4xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-6 group"
            >
                <Archive size={32} className="group-hover:rotate-12 transition-transform" /> Save everything as a ZIP
            </button>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
