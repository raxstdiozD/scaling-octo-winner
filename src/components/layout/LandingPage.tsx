"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { 
  Zap, 
  Infinity as InfinityIcon,
  Sparkles,
  ArrowRight,
  Eraser,
  Mic2,
  FileText,
  LayoutGrid,
  PenTool,
  Palette,
  Layout,
  Box,
  Quote,
  ShieldCheck,
  Zap as ZapIcon,
  Cloud,
  Globe,
  Star,
  Users,
  CheckCircle2,
  Cpu,
  MousePointer2,
  Lock,
  ChevronRight,
  Plus,
  Crown,
  Play,
  Layers,
  Search,
  Video,
  Music,
  Trash2,
  Wand2
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ToolCard } from "@/components/ui/ToolCard";
import GradientText from "@/components/ui/GradientText";
import { PRICING_CONFIG } from "@/config/pricing";

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div ref={containerRef} className="flex flex-col w-full overflow-hidden bg-[#020202] selection:bg-purple-500/30 font-sans text-zinc-100">
      
      {/* 1. PREMIUM NAVIGATION */}
      <nav className="fixed top-0 inset-x-0 h-20 z-[100] backdrop-blur-md border-b border-white/[0.04] bg-black/10">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center transition-transform group-hover:scale-110">
                <Sparkles className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase italic text-white">Lumora</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              {['Tools', 'Pricing', 'Blog'].map((item) => (
                <Link key={item} href={`/${item.toLowerCase()}`} className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors">
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="hidden sm:block text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors px-6">
              Login
            </Link>
            <Link href="/tools">
              <button className="h-10 px-6 rounded-full bg-white/[0.03] border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-white/[0.08] transition-all">
                Try Free
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-40 px-6 overflow-hidden">
        {/* Animated Background Ambience */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[120%] bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.08)_0%,transparent_70%)]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />
          
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              x: [0, 20, 0],
              y: [0, -20, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[15%] right-[-5%] w-[600px] h-[600px] bg-purple-600/[0.03] blur-[120px] rounded-full" 
          />
          <motion.div 
            animate={{ 
              scale: [1.1, 1, 1.1],
              x: [0, -30, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[15%] left-[-5%] w-[500px] h-[500px] bg-cyan-600/[0.02] blur-[100px] rounded-full" 
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center space-y-12"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.02] border border-white/5 backdrop-blur-md mx-auto w-fit"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">The Next Generation AI Platform</span>
              </motion.div>

              <h1 className="text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter text-white leading-[0.85] uppercase">
                ALL-IN-ONE <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 drop-shadow-[0_0_30px_rgba(168,85,247,0.2)]">AI STUDIO.</span>
              </h1>
            </div>

            <p className="text-lg md:text-2xl text-zinc-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Remove backgrounds, generate images, edit videos, restore photos, and create music — <span className="text-zinc-300">everything you need, in one simple place.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
              <Link href="/tools" className="w-full sm:w-auto group">
                <button className="h-16 px-10 w-full sm:w-auto rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_-10px_rgba(124,58,237,0.3)]">
                  Try for Free
                </button>
              </Link>
              <Link href="/pro" className="w-full sm:w-auto group">
                <button className="h-16 px-10 w-full sm:w-auto rounded-2xl bg-white/[0.03] border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/[0.08] transition-all flex items-center justify-center gap-3">
                  Upgrade to Pro
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>

            <div className="pt-12 flex flex-col items-center gap-4 opacity-40">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-[#020202] bg-zinc-800" />
                  ))}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Trusted by 10,000+ creators</span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-600">No credit card required to start</p>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-12 flex flex-col items-center gap-2 opacity-20"
        >
          <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent" />
        </motion.div>
      </section>

      {/* 3. POPULAR TOOLS SHOWCASE */}
      <section id="explore" className="py-40 px-6 max-w-7xl mx-auto w-full relative">
        <div className="flex flex-col items-center mb-24 text-center space-y-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Wand2 size={12} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Flagship Suite</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">
            Curated <span className="text-zinc-600 italic font-medium">Power Tools.</span>
          </h2>
          <p className="text-zinc-500 font-medium text-sm md:text-base max-w-lg">
            Our most popular AI-driven utilities used by professionals worldwide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <ToolCard 
            id="image-eraser" 
            name="Background Remover" 
            description="Remove backgrounds from your photos instantly with professional-grade AI precision." 
            category="image" 
            icon="ImageIcon" 
            href="/tools/image/eraser" 
            popular 
          />
          <ToolCard 
            id="ai-img-gen" 
            name="AI Image Generator" 
            description="Transform your imagination into beautiful art and photos using advanced AI magic." 
            category="ai" 
            icon="Sparkles" 
            href="/tools/ai/img-gen" 
            pro 
            popular
          />
          <ToolCard 
            id="audio-vocal-remover" 
            name="Vocal Remover" 
            description="Extract high-quality vocals or instrumentals from any track with studio-grade separation." 
            category="audio" 
            icon="Mic2" 
            href="/tools/audio/vocal-remover" 
            popular 
          />
          <ToolCard 
            id="ai-writer" 
            name="AI Content Architect" 
            description="Generate professional scripts, articles, and creative copy optimized for engagement and SEO." 
            category="ai" 
            icon="PenTool" 
            href="/tools/ai/writer" 
            pro 
          />
          <ToolCard 
            id="video-bg-remover" 
            name="AI Video Studio" 
            description="Remove and replace video backgrounds instantly without any manual work or green screens." 
            category="video" 
            icon="Video" 
            href="/tools/video/bg-remover" 
            pro 
          />
          <ToolCard 
            id="pdf-ocr" 
            name="Smart OCR Extractor" 
            description="Convert complex documents, scans, and images into structured, editable digital text." 
            category="pdf" 
            icon="Search" 
            href="/tools/pdf/ocr" 
            popular
          />
        </div>

        <div className="mt-20 text-center">
          <Link href="/tools">
             <button className="group h-14 px-8 rounded-2xl bg-white/[0.02] border border-white/5 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.3em] hover:text-white hover:border-white/10 transition-all flex items-center gap-3 mx-auto">
                Explore All 50+ Tools
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
             </button>
          </Link>
        </div>
      </section>

      {/* 4. WHY LUMORA (BENEFITS) */}
      <section className="py-40 px-6 relative bg-zinc-950/30 border-y border-white/[0.04]">
         <div className="max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
               <div className="space-y-10">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                     <Cpu size={28} />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase leading-[0.9]">
                      ELITE <br />
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">PERFORMANCE.</span>
                    </h2>
                    <p className="text-lg text-zinc-500 font-medium leading-relaxed max-w-lg">
                      We've bridged the gap between complex AI research and professional creative workflows. One platform, unlimited possibilities.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                    <BenefitItem icon={ZapIcon} title="Warp Speed" desc="Proprietary hardware acceleration for instant processing." />
                    <BenefitItem icon={InfinityIcon} title="Unlimited Pro" desc="Zero caps for subscribers. Total creative freedom." />
                    <BenefitItem icon={Lock} title="Privacy First" desc="Secure, encrypted processing. Your data stays yours." />
                    <BenefitItem icon={Layers} title="Unified Flow" desc="Every tool you need in a single, cohesive interface." />
                  </div>
               </div>
               
               <div className="relative aspect-square md:aspect-video lg:aspect-square rounded-[3rem] bg-gradient-to-br from-zinc-900 to-black border border-white/10 overflow-hidden group">
                  <div className="absolute inset-0 bg-linear-to-br from-purple-600/10 to-cyan-600/5 opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl group-hover:scale-110 transition-transform">
                      <Play className="text-white fill-white translate-x-0.5" size={24} />
                    </div>
                  </div>
                  <div className="absolute bottom-8 left-8 right-8 p-6 rounded-2xl bg-black/40 backdrop-blur-md border border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white">AI Neural Engine v4.0</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Active nodes: 1,420 • Latency: 12ms</p>
                      </div>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-3 bg-purple-500/40 rounded-full" />)}
                      </div>
                    </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* 5. TESTIMONIALS */}
      <section className="py-48 px-6 max-w-7xl mx-auto w-full relative">
        <div className="text-center mb-32 space-y-4">
          <div className="text-purple-400 flex items-center justify-center gap-1">
            {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight">
            Loved by <span className="text-zinc-600 italic font-medium">Creators.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <TestimonialCard 
            quote="Lumora has completely replaced four other subscriptions for me. The AI quality is unmatched."
            author="Sarah Jenkins"
            role="Digital Artist"
            avatar="SJ"
          />
          <TestimonialCard 
            quote="The speed is what blew me away. Vocal removal takes seconds, not minutes. Highly recommended."
            author="Marcus Chen"
            role="Music Producer"
            avatar="MC"
          />
          <TestimonialCard 
            quote="Finally, an AI suite that actually feels professional. The UI is a dream to work in every day."
            author="Elena Rodriguez"
            role="Content Director"
            avatar="ER"
          />
        </div>
      </section>

      {/* 6. PRICING TEASER */}
      <section className="py-40 px-6 relative">
         <div className="max-w-5xl mx-auto relative z-10 text-center space-y-12 bg-zinc-950/40 p-16 md:p-32 rounded-[4rem] border border-white/[0.06] overflow-hidden group">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full group-hover:bg-purple-600/20 transition-all duration-700" />
            
            <div className="relative z-10 space-y-12">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/5 w-fit mx-auto">
                  <Crown size={12} className="text-purple-400" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Elite Access</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-[0.85]">
                   UNLIMITED <br />
                   <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">PRO POWER.</span>
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 max-w-2xl mx-auto text-left">
                 {['Unlimited AI Usage', '4K Ultra-HD Output', 'Priority Rendering', 'No Ads or Watermarks', 'Commercial License', 'VIP 24/7 Support'].map(feat => (
                   <div key={feat} className="flex items-center gap-3">
                     <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <CheckCircle2 size={12} className="text-purple-400" />
                     </div>
                     <span className="text-zinc-500 font-bold uppercase tracking-widest text-[9px]">{feat}</span>
                   </div>
                 ))}
              </div>
              
              <div className="pt-8 space-y-6">
                 <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-3">
                       <span className="text-zinc-700 line-through text-xl font-bold">$14.99</span>
                       <span className="text-white text-6xl font-black tracking-tighter">${PRICING_CONFIG.PRO_PLAN.USD}<span className="text-lg text-zinc-600 font-bold">/mo</span></span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 italic">Limited time launch pricing</p>
                 </div>
                 <Link href="/pro">
                    <button className="h-20 px-16 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_-10px_rgba(124,58,237,0.4)]">
                       Unlock Pro Access Now
                    </button>
                 </Link>
                 <div className="flex items-center justify-center gap-6 opacity-40">
                    <TrustBadge icon={<Lock size={12} />} text="Secure Checkout" />
                    <TrustBadge icon={<RefreshCcw size={12} />} text="Cancel Anytime" />
                 </div>
              </div>
            </div>
         </div>
      </section>

    </div>
  );
}

function BenefitItem({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="space-y-3 group">
      <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
        <Icon size={20} />
      </div>
      <h4 className="text-white font-black uppercase tracking-widest text-xs">{title}</h4>
      <p className="text-[11px] text-zinc-600 font-medium leading-relaxed uppercase tracking-tight group-hover:text-zinc-500 transition-colors">{desc}</p>
    </div>
  );
}

function TestimonialCard({ quote, author, role, avatar }: { quote: string; author: string; role: string; avatar: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      className="p-10 rounded-[3rem] bg-zinc-900/20 border border-white/[0.04] backdrop-blur-sm relative group hover:bg-zinc-900/40 transition-all duration-500"
    >
      <Quote className="absolute top-8 right-8 text-white/5" size={48} />
      <div className="relative z-10 space-y-8">
        <p className="text-lg text-zinc-300 font-medium italic leading-relaxed">
          "{quote}"
        </p>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-[10px]">
            {avatar}
          </div>
          <div>
            <h4 className="text-white font-bold text-sm tracking-tight">{author}</h4>
            <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest">{role}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-zinc-600">
      {icon}
      {text}
    </div>
  );
}

function RefreshCcw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  )
}
