"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { 
  Upload, 
  Music, 
  Mic2, 
  Download, 
  RefreshCw, 
  Play, 
  Pause,
  Volume2,
  Trash2,
  Zap,
  Archive,
  FileAudio,
  Loader2,
  Drum,
  Guitar,
  Waves
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
            
            <motion.div 
                className="absolute top-0 bottom-0 w-[2px] bg-white z-20 shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                initial={false}
                animate={{ left: `${progress * 100}%` }}
                transition={{ type: "spring", bounce: 0, duration: 0.1 }}
            />
        </div>
    );
};

export function StemSplitter() {
  const [audio, setAudio] = useState<{ file: File; url: string; duration: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Record<string, { url: string; peaks: number[] }> | null>(null);
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
  const [isMuted, setIsMuted] = useState<Record<string, boolean>>({});
  const [isMasterPlaying, setIsMasterPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState<Record<string, number>>({});
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [isMounted, setIsMounted] = useState(false);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => { setIsMounted(true); }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const audioTag = new Audio(url);
      audioTag.onloadedmetadata = () => {
        setAudio({ file, url, duration: audioTag.duration });
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
    setProgress(10);

    try {
        const formData = new FormData();
        formData.append('file', audio.file);

        // 1. Try Modal directly from the client (Bypasses Vercel's 4.5MB payload limit)
        const modalUrl = process.env.NEXT_PUBLIC_MODAL_AUDIO_URL;
        if (modalUrl) {
            try {
                console.log('Attempting direct Modal stem splitting...');
                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(audio.file);
                });
                const base64DataUrl = await base64Promise;
                const base64Audio = base64DataUrl.split(',')[1];
                
                const modalResponse = await fetch(`${modalUrl}/process`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        file_name: audio.file.name,
                        file_data_base64: base64Audio,
                        stems: 4,
                        task: "separate"
                    })
                });

                if (modalResponse.ok) {
                    const data = await modalResponse.json();
                    if (data.success) {
                        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const stems = ['vocals', 'drums', 'bass', 'other'];
                        const processedResult: Record<string, { url: string; peaks: number[] }> = {};

                        for (const stem of stems) {
                            const url = data.result?.[stem];
                            if (!url) continue;
                            try {
                                const res = await fetch(url);
                                const arrayBuffer = await res.arrayBuffer();
                                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                                processedResult[stem] = { url, peaks: extractPeaks(audioBuffer, 80) };
                            } catch (err) {
                                processedResult[stem] = { url, peaks: Array.from({ length: 80 }, () => Math.random() * 0.5 + 0.2) };
                            }
                        }
                        setResult(processedResult);
                        setProgress(100);
                        setIsProcessing(false);
                        return;
                    } else {
                        console.warn('Modal processing failed:', data.error);
                        if (data.trace) console.debug('Modal Trace:', data.trace);
                    }
                } else {
                    console.warn('Modal server returned error:', modalResponse.status);
                }
            } catch (modalError: any) {
                console.warn('Direct Modal call failed:', modalError.message);
            }
        }

        // 2. Fallback to Next.js API
        const response = await fetch('/api/tools/audio/stem-splitter', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error('Splitting failed');

        const data = await response.json();
        console.log('Stem splitting result:', data);
        if (!data.success) throw new Error(data.error || 'Unknown error');

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const stems = ['vocals', 'drums', 'bass', 'other'];
        const processedResult: Record<string, { url: string; peaks: number[] }> = {};

        for (const stem of stems) {
            const url = data.result?.[stem];
            if (!url) {
                console.warn(`Stem ${stem} missing from response`);
                continue;
            }
            
            try {
                const res = await fetch(url);
                const arrayBuffer = await res.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                processedResult[stem] = { url, peaks: extractPeaks(audioBuffer, 80) };
            } catch (err) {
                processedResult[stem] = { url, peaks: Array.from({ length: 80 }, () => Math.random() * 0.5 + 0.2) };
            }
        }

        if (Object.keys(processedResult).length === 0) throw new Error("No stems were successfully processed.");
        
        setResult(processedResult);
        setProgress(100);
    } catch (e: any) {
        console.error("Processing error:", e);
        alert("Failed to split stems: " + e.message);
    } finally {
        setIsProcessing(false);
    }
  };

  const togglePlay = (id: string, url: string) => {
    if (!audioRefs.current[id]) {
      const audioTag = new Audio(url);
      audioRefs.current[id] = audioTag;
      audioTag.onloadedmetadata = () => setDurations(prev => ({ ...prev, [id]: audioTag.duration }));
      audioTag.ontimeupdate = () => setPlaybackProgress(prev => ({ ...prev, [id]: audioTag.currentTime / audioTag.duration }));
      audioTag.onended = () => {
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

  const toggleMasterPlay = () => {
      const stems = Object.keys(result || {});
      if (isMasterPlaying) {
          stems.forEach(id => {
              audioRefs.current[id]?.pause();
              setIsPlaying(p => ({ ...p, [id]: false }));
          });
          setIsMasterPlaying(false);
      } else {
          // Find max current time to sync to? Or just play all from where they are
          stems.forEach(id => {
              if (audioRefs.current[id]) {
                  audioRefs.current[id].play().catch(console.error);
                  setIsPlaying(p => ({ ...p, [id]: true }));
              }
          });
          setIsMasterPlaying(true);
      }
  };

  const toggleMute = (id: string) => {
      const a = audioRefs.current[id];
      if (a) {
          a.muted = !a.muted;
          setIsMuted(p => ({ ...p, [id]: a.muted }));
      }
  };

  const handleSeek = (id: string, percent: number) => {
    // Sync seeking across ALL tracks
    Object.keys(audioRefs.current).forEach(k => {
        const a = audioRefs.current[k];
        if (a && a.duration) {
            a.currentTime = percent * a.duration;
            setPlaybackProgress(prev => ({ ...prev, [k]: percent }));
        }
    });
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${r.toString().padStart(2, '0')}`;
  };

  const handleDownloadZip = async () => {
    if (!result || !audio) return;
    try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        for (const [name, data] of Object.entries(result)) {
            const res = await fetch(data.url);
            const blob = await res.blob();
            zip.file(`${name.charAt(0).toUpperCase() + name.slice(1)}.mp3`, blob);
        }
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${audio.file.name.split('.')[0]}_stems.zip`;
        link.click();
    } catch (e) { alert("Failed to create ZIP"); }
  };

  if (!isMounted) return null;

  return (
    <div className="w-full max-w-6xl mx-auto py-8" suppressHydrationWarning>
      <AnimatePresence mode="wait">
        {!audio && !result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} {...getRootProps()} className="min-h-[400px] rounded-[3rem] border-2 border-dashed border-white/10 glass-dark flex flex-col items-center justify-center p-12 text-center group cursor-pointer hover:border-white/20 transition-all shadow-2xl">
            <input {...getInputProps()} />
            <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-600 group-hover:text-accent-purple group-hover:scale-110 transition-all mb-6">
              <Upload size={32} />
            </div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">Split Song into 4 Stems</h2>
            <p className="text-zinc-500 font-medium">Drop your audio file here (MP3, WAV, FLAC)</p>
          </motion.div>
        )}

        {audio && !isProcessing && !result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-dark border border-white/5 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10 shadow-2xl">
             <div className="w-32 h-32 rounded-3xl bg-zinc-800 flex items-center justify-center text-accent-purple shadow-inner"><FileAudio size={48} /></div>
             <div className="flex-1 space-y-4 w-full">
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{audio.file.name}</h3>
                <div className="flex gap-4">
                   <button onClick={handleProcess} className="flex-1 py-4 rounded-xl bg-accent-purple text-white font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2">
                      <Zap size={16} /> Start Splitting
                   </button>
                   <button onClick={() => setAudio(null)} className="px-6 py-4 rounded-xl border border-white/10 text-zinc-500 hover:text-white transition-all"><Trash2 size={20} /></button>
                </div>
             </div>
          </motion.div>
        )}

        {isProcessing && (
          <div className="min-h-[400px] flex flex-col items-center justify-center space-y-6">
             <Loader2 size={64} className="text-accent-purple animate-spin" />
             <p className="text-xl font-black text-white uppercase italic tracking-widest">AI is splitting your stems...</p>
             <div className="w-64 h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div className="h-full bg-accent-purple" animate={{ width: `${progress}%` }} />
             </div>
          </div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
             <div className="flex flex-col md:flex-row justify-between items-center gap-6 glass-dark p-6 rounded-[2rem] border border-white/5">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Separation Complete</h2>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Master Mix Studio</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={toggleMasterPlay}
                        className="px-8 py-4 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all"
                    >
                        {isMasterPlaying ? <Pause size={20} /> : <Play size={20} />}
                        {isMasterPlaying ? "Pause All" : "Play Together"}
                    </button>
                    <button onClick={() => { setAudio(null); setResult(null); }} className="p-4 rounded-2xl border border-white/10 text-zinc-500 hover:text-white transition-all"><RefreshCw size={20}/></button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { id: 'vocals', name: 'Vocals', color: 'bg-accent-purple', icon: Mic2 },
                    { id: 'drums', name: 'Drums', color: 'bg-emerald-500', icon: Drum },
                    { id: 'bass', name: 'Bass', color: 'bg-accent-blue', icon: Guitar },
                    { id: 'other', name: 'Other', color: 'bg-amber-500', icon: Music },
                ].filter(stem => result[stem.id]).map((stem) => (
                    <div key={stem.id} className="glass-dark border border-white/10 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg", stem.color)}><stem.icon size={20} /></div>
                                <h4 className="font-black text-white uppercase italic tracking-tight">{stem.name}</h4>
                            </div>
                        </div>

                        <div className="bg-black/40 border border-white/5 rounded-2xl h-24 relative overflow-hidden">
                            <WaveformVisualizer 
                                peaks={result[stem.id]?.peaks || []} 
                                color={stem.color} 
                                progress={playbackProgress[stem.id] || 0}
                                onSeek={(p) => handleSeek(stem.id, p)}
                            />
                            <div className="absolute bottom-2 right-4 text-[9px] font-black text-white/20 uppercase">
                                {formatTime((playbackProgress[stem.id] || 0) * (durations[stem.id] || 0))} / {formatTime(durations[stem.id] || 0)}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => togglePlay(stem.id, result[stem.id].url)} className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-xl transition-all", stem.color)}>
                                {isPlaying[stem.id] ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                            </button>
                            <button 
                                onClick={() => toggleMute(stem.id)} 
                                className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center border transition-all",
                                    isMuted[stem.id] ? "bg-red-500/20 border-red-500 text-red-500" : "border-white/10 text-white/50 hover:text-white"
                                )}
                            >
                                {isMuted[stem.id] ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            <a href={result[stem.id].url} download={`${stem.name}.mp3`} className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                <Download size={14} /> Download
                            </a>
                        </div>
                    </div>
                ))}
             </div>

             <button onClick={handleDownloadZip} className="w-full py-6 rounded-3xl bg-linear-to-r from-accent-purple via-accent-blue to-emerald-500 text-white font-black text-lg uppercase italic tracking-widest shadow-2xl hover:scale-[1.01] transition-all flex items-center justify-center gap-4">
                <Archive size={24} /> Download All Stems (ZIP)
             </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
