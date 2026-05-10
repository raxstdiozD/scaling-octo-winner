"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  Sparkles, 
  Zap, 
  Infinity, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  Mail,
  Loader2,
  Lock,
  Star
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

const UPCOMING_BENEFITS = [
  { 
    title: "1000 Daily Credits", 
    desc: "A massive daily allowance for all your creative needs.", 
    icon: Zap, 
    color: "text-cyan-400"
  },
  { 
    title: "Priority Processing", 
    desc: "Skip the queue with dedicated high-performance servers.", 
    icon: Cpu, 
    color: "text-indigo-400"
  },
  { 
    title: "Unlimited Everything", 
    desc: "Zero limits on generations, messages, and exports.", 
    icon: Infinity, 
    color: "text-purple-400"
  },
  { 
    title: "Commercial Rights", 
    desc: "Full legal ownership of everything you create.", 
    icon: ShieldCheck, 
    color: "text-emerald-400"
  }
];

export function ProComingSoon() {
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
      // Check if email already exists in a waitlist table or users table
      // For now, we'll store it in a 'waitlist' table in Supabase
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email, source: 'pro_coming_soon', created_at: new Date().toISOString() }]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          setStatus('success'); // Still show success if they're already on it
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
      {/* Background Aesthetics */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/[0.03] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/[0.02] blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] mix-blend-overlay" />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-24 relative z-10 w-full flex flex-col items-center">
        
        {/* Header Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 mb-8 backdrop-blur-xl"
        >
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400">Status: Engineering</span>
        </motion.div>
        
        {/* Main Headline */}
        <div className="text-center space-y-6 mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9]"
          >
            LUMORA PRO IS <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400">COMING SOON</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-zinc-500 text-lg md:text-xl font-medium leading-relaxed"
          >
            Get unlimited access, 1000 daily credits, priority processing & exclusive AI models.
          </motion.p>
        </div>

        {/* Waitlist Form */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-lg mb-20"
        >
          {status === 'success' ? (
            <div className="p-8 rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/20 text-center space-y-4 backdrop-blur-xl">
               <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="text-emerald-400 w-8 h-8" />
               </div>
               <h3 className="text-xl font-black uppercase tracking-tight text-white">You're on the list!</h3>
               <p className="text-zinc-500 text-sm font-medium">We'll notify you the exact second Lumora Pro goes live. Prepare for unlimited power.</p>
               <button 
                 onClick={() => router.push('/dashboard')}
                 className="inline-flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest mt-4 hover:gap-4 transition-all"
               >
                 Back to Tools <ArrowRight size={14} />
               </button>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-cyan-600/20 blur-xl opacity-50 group-hover:opacity-100 transition duration-1000" />
              <div className="relative flex flex-col md:flex-row gap-3 p-2 rounded-[2rem] bg-black/40 border border-white/10 backdrop-blur-2xl">
                <div className="flex-1 flex items-center px-6">
                  <Mail className="text-zinc-500 shrink-0" size={18} />
                  <input 
                    type="email" 
                    placeholder="Enter your email address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-zinc-600 text-sm font-medium ml-3"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-8 py-4 rounded-[1.5rem] bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
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

        {/* Benefits Teaser */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {UPCOMING_BENEFITS.map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-all group"
            >
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4 bg-white/[0.02] border border-white/[0.04]", benefit.color)}>
                <benefit.icon size={20} />
              </div>
              <h4 className="text-white font-bold text-sm mb-2">{benefit.title}</h4>
              <p className="text-zinc-600 text-[11px] leading-relaxed font-medium group-hover:text-zinc-400 transition-colors">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col items-center space-y-8"
        >
          <div className="flex items-center gap-12 pt-8 border-t border-white/5 w-full justify-center">
             <div className="flex flex-col items-center gap-1">
                <span className="text-white font-black text-xl">50+</span>
                <span className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">AI Tools</span>
             </div>
             <div className="flex flex-col items-center gap-1">
                <span className="text-white font-black text-xl">4K</span>
                <span className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">Resolution</span>
             </div>
             <div className="flex flex-col items-center gap-1">
                <span className="text-white font-black text-xl">24/7</span>
                <span className="text-zinc-600 text-[9px] font-black uppercase tracking-widest">Support</span>
             </div>
          </div>
          
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-10 py-5 rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-4"
          >
            Explore Free Tools <ArrowRight size={14} className="text-purple-400" />
          </button>
        </motion.div>

      </div>
    </div>
  );
}
