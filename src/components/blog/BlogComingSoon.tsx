"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Sparkles, 
  Zap, 
  ArrowRight,
  Mail,
  Loader2,
  PenTool,
  Globe
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

const UPCOMING_TOPICS = [
  { 
    title: "AI Design Mastery", 
    desc: "How to use Lumora to create professional brand assets in minutes.", 
    icon: PenTool, 
    color: "text-purple-400"
  },
  { 
    title: "Prompt Engineering", 
    desc: "Master the art of talking to AI for pixel-perfect image generation.", 
    icon: Zap, 
    color: "text-cyan-400"
  },
  { 
    title: "Video Workflow", 
    desc: "Automating your social media video production with AI background removal.", 
    icon: Sparkles, 
    color: "text-indigo-400"
  },
  { 
    title: "Productivity Hacks", 
    desc: "Using AI to handle your boring tasks so you can focus on creativity.", 
    icon: Globe, 
    color: "text-emerald-400"
  }
];

export function BlogComingSoon() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const supabase = createClient();

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email, source: 'blog_coming_soon', created_at: new Date().toISOString() }]);

      if (error) {
        if (error.code === '23505') {
          setStatus('success');
        } else {
          throw error;
        }
      } else {
        setStatus('success');
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 selection:bg-purple-500/30 overflow-x-hidden font-sans relative flex flex-col items-center">
      {/* Cinematic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/[0.03] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/[0.02] blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] mix-blend-overlay" />
      </div>

      <div className="max-w-5xl mx-auto px-6 py-24 relative z-10 w-full flex flex-col items-center">
        
        {/* Navigation Link */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/')}
          className="self-start flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 hover:text-white transition-all mb-16 group"
        >
          <ArrowRight size={14} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
          Dashboard
        </motion.button>
        
        {/* Header Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 mb-8 backdrop-blur-xl"
        >
          <BookOpen size={14} className="text-indigo-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">The Lumora Journal</span>
        </motion.div>
        
        {/* Main Headline */}
        <div className="text-center space-y-6 mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.85] uppercase italic"
          >
            Insights & <br />
            <span className="gradient-text">Inspiration.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-zinc-500 text-lg md:text-xl font-medium leading-relaxed"
          >
            Tutorials, latest updates, and expert deep-dives into the future of AI tools and creativity.
          </motion.p>
        </div>

        {/* Waitlist Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-xl mb-24"
        >
          {status === 'success' ? (
            <div className="p-8 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/20 text-center space-y-4 backdrop-blur-xl">
               <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
                  <Mail className="text-emerald-400 w-8 h-8" />
               </div>
               <h3 className="text-xl font-black uppercase tracking-tight text-white">We'll keep you posted!</h3>
               <p className="text-zinc-500 text-sm font-medium">You're now on the list for the first edition of the Lumora Journal.</p>
               <button 
                 onClick={() => router.push('/')}
                 className="inline-flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest mt-4 hover:gap-4 transition-all"
               >
                 Back to Tools <ArrowRight size={14} />
               </button>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-emerald-600/20 blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
              <div className="relative flex flex-col md:flex-row gap-3 p-2 rounded-[2.5rem] bg-black/40 border border-white/10 backdrop-blur-2xl overflow-hidden">
                <div className="flex-1 flex items-center px-6">
                  <Mail className="text-zinc-500 shrink-0" size={18} />
                  <input 
                    type="email" 
                    placeholder="Enter email for early access" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-zinc-600 text-sm font-medium ml-3 h-14"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-8 h-14 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                >
                  {status === 'loading' ? <Loader2 className="animate-spin w-4 h-4" /> : "Notify Me →"}
                </button>
              </div>
              {status === 'error' && (
                <p className="text-red-400 text-[10px] font-bold mt-4 ml-6 uppercase tracking-widest">{errorMessage}</p>
              )}
            </form>
          )}
        </motion.div>

        {/* Section Title */}
        <div className="w-full flex items-center gap-8 mb-12">
           <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-700 whitespace-nowrap">Coming to the Journal</span>
           <div className="h-px flex-1 bg-white/5" />
        </div>

        {/* Upcoming Topics */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-32">
          {UPCOMING_TOPICS.map((topic, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="p-8 rounded-[3rem] bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.02] hover:border-white/[0.1] transition-all group flex gap-6 items-start"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-white/[0.02] border border-white/[0.04] shrink-0 group-hover:scale-110 transition-transform duration-500", topic.color)}>
                <topic.icon size={24} />
              </div>
              <div className="space-y-2">
                <h4 className="text-white font-black text-lg uppercase italic tracking-tight">{topic.title}</h4>
                <p className="text-zinc-500 text-sm leading-relaxed font-medium group-hover:text-zinc-400 transition-colors">{topic.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col items-center space-y-12 w-full pt-12 border-t border-white/5"
        >
          <div className="flex flex-col items-center gap-4">
             <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Ready to create?</h3>
             <p className="text-zinc-500 text-sm font-medium">While you wait for the blog, explore our elite suite of AI tools.</p>
          </div>
          
          <button 
            onClick={() => router.push('/')}
            className="px-12 py-6 rounded-full bg-white text-black hover:bg-zinc-200 transition-all text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-4"
          >
            Launch All Tools <Zap size={16} />
          </button>
        </motion.div>

      </div>
    </div>
  );
}
