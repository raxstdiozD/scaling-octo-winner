"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  ArrowUpRight,
  Zap,
  Shield,
  Sparkles,
  ArrowRight,
  Globe,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

// --- Custom Social Icons for Outdated Lucide Versions ---
const GithubIcon = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

const TwitterIcon = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const DiscordIcon = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.682 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.006 14.006 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 01.077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 01.077.01c.12.099.246.197.372.291a.077.077 0 01-.006.128 12.983 12.983 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
  </svg>
);

const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { name: "Dashboard", href: "/" },
      { name: "All Tools", href: "/tools" },
      { name: "Pricing", href: "/pro" },
      { name: "Updates", href: "/changelog" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Contact", href: "/help" },
      { name: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Privacy Policy", href: "/privacy-policy" },
      { name: "Terms of Service", href: "/terms-of-service" },
      { name: "Cookie Policy", href: "/cookies" },
    ],
  },
];

export function Footer() {
  const [session, setSession] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, [supabase]);

  return (
    <footer className="relative bg-[#030303] pt-32 pb-12 overflow-hidden" suppressHydrationWarning>
      {/* 1. Cinematic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-linear-to-r from-transparent via-accent-purple/40 to-transparent" />
        
        {/* Large Decorative Text */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full text-center select-none opacity-[0.03]">
          <h2 className="text-[16vw] font-black tracking-[0.05em] uppercase italic leading-none text-white whitespace-nowrap">
            LUMORA
          </h2>
        </div>

        {/* Ambient Glows */}
        <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] bg-accent-purple/10 blur-[150px] rounded-full" />
        <div className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-accent-cyan/10 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* 2. Pre-Footer CTA */}
        <div className="mb-32 p-12 md:p-24 rounded-[4rem] glass-dark border border-white/5 relative overflow-hidden group">
            {/* CTA Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className="absolute inset-0 bg-linear-to-br from-accent-purple/15 via-transparent to-accent-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent-purple/10 blur-[100px] rounded-full group-hover:scale-150 transition-transform duration-1000" />
            
            <div className="relative z-10 grid grid-cols-1 xl:grid-cols-[1fr_auto] items-center gap-16 xl:gap-32">
                <div className="space-y-10">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-accent-cyan text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl"
                    >
                        <Sparkles size={14} className="animate-pulse" /> The Future is Simple
                    </motion.div>
                    
                    <div className="space-y-8">
                        <div className="space-y-2">
                           <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none select-none">
                               Ready to
                           </h2>
                           <h2 className="text-5xl md:text-8xl font-black gradient-text tracking-tighter uppercase italic leading-none select-none drop-shadow-[0_0_50px_rgba(168,85,247,0.4)] px-4 -mx-4">
                               transcend?
                           </h2>
                        </div>
                        <p className="text-zinc-500 font-medium max-w-md text-lg leading-relaxed">
                            Join 50,000+ creators who have already simplified their creative process with Lumora.
                        </p>
                    </div>
                </div>
                
                <div className="relative group/btn w-fit">
                    <div className="absolute -inset-2 bg-linear-to-r from-accent-purple to-accent-cyan rounded-[2rem] blur-xl opacity-20 group-hover/btn:opacity-60 transition duration-700" />
                    <Link 
                        href={mounted && session ? "/" : "/auth/login"} 
                        className="relative flex items-center gap-6 h-24 px-12 rounded-[1.8rem] bg-zinc-950 border border-white/10 text-white font-black text-xl md:text-2xl tracking-tighter uppercase italic hover:bg-black transition-all shadow-4xl overflow-hidden group/link"
                    >
                        <div className="absolute inset-0 shimmer opacity-10 group-hover/link:opacity-20 transition-opacity" />
                        <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent pointer-events-none" />
                        
                        <span className="relative z-10 whitespace-nowrap">
                          {mounted && session ? "Open Dashboard" : "Get Started"}
                        </span>
                        
                        <div className="relative z-10 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover/link:bg-white group-hover/link:text-black transition-all duration-500">
                          <ArrowRight size={20} className="group-hover/link:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                </div>
            </div>

            {/* Decorative Background Icon */}
            <div className="absolute -bottom-20 -right-20 opacity-[0.03] pointer-events-none rotate-12">
               <Zap size={400} strokeWidth={1} />
            </div>
        </div>

        {/* 3. Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-8 mb-32">
          
          {/* Brand Identity */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left space-y-10">
            <div className="space-y-6">
              <Link href="/" className="flex flex-col lg:flex-row items-center gap-4 group w-fit mx-auto lg:mx-0">
                <div className="w-14 h-14 rounded-2xl premium-gradient p-[1.5px] group-hover:rotate-6 transition-transform duration-500">
                  <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center">
                    <Shield className="text-white fill-white/10" size={24} />
                  </div>
                </div>
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Lumora</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-purple mt-2">All-in-one Creative Hub</p>
                </div>
              </Link>
              <p className="text-zinc-500 font-medium leading-relaxed max-w-sm text-base mx-auto lg:mx-0">
                Making professional creative tools simple for everyone. The best way to use AI for your daily tasks.
              </p>
            </div>

            <div className="flex items-center gap-3 justify-center lg:justify-start">
              <SocialLink href="#" icon={<TwitterIcon size={20} />} label="Twitter" />
              <SocialLink href="#" icon={<GithubIcon size={20} />} label="GitHub" />
              <SocialLink href="#" icon={<DiscordIcon size={20} />} label="Discord" />
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12 lg:pl-12 text-center lg:text-left">
            {FOOTER_LINKS.map((section) => (
              <div key={section.title} className="space-y-8 flex flex-col items-center lg:items-start">
                <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-white/30">{section.title}</h3>
                <ul className="space-y-5">
                  {section.links.map((link) => (
                    <li key={link.name} className="flex justify-center lg:justify-start">
                      <Link 
                        href={link.href}
                        className="text-zinc-500 hover:text-white transition-all font-semibold text-sm flex items-center gap-2 group w-fit hover:translate-x-1"
                      >
                        <span className="w-1.5 h-px bg-accent-purple/0 group-hover:bg-accent-purple/100 transition-all group-hover:w-3" />
                        {link.name}
                        <ArrowUpRight size={12} className="opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all text-accent-purple" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Tech Status Bar (Bottom) */}
        <div className="pt-12 border-t border-white/5">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 text-center lg:text-left">
            {/* Copyright & Info */}
            <div className="flex flex-col md:flex-row items-center gap-8 text-[11px] font-black uppercase tracking-[0.3em] text-zinc-600">
              <span>© 2026 LUMORA PLATFORM</span>
              <div className="hidden md:block w-px h-4 bg-white/5" />
              <span className="text-zinc-500">Made for Creators Worldwide</span>
            </div>

            {/* Live Stats Bar */}
            <div className="flex flex-wrap justify-center items-center gap-6">
                <StatusItem icon={<Globe size={14} />} label="Global Reach" value="24+ Countries" color="cyan" />
                <StatusItem icon={<Activity size={14} />} label="Processing" value="Instant" color="purple" />
                <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl glass-dark border border-emerald-500/20 bg-emerald-500/5">
                    <div className="relative flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <div className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/80">Status: Perfect</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ icon, href, label }: { icon: React.ReactNode; href: string; label: string }) {
  return (
    <motion.a 
      href={href}
      whileHover={{ y: -5, scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="w-14 h-14 rounded-2xl glass-dark border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:border-accent-purple/30 transition-all group relative"
      title={label}
    >
      <div className="absolute inset-0 bg-accent-purple/10 opacity-0 group-hover:opacity-100 rounded-2xl blur-lg transition-opacity" />
      <div className="group-hover:text-accent-purple transition-colors relative z-10">
        {icon}
      </div>
    </motion.a>
  );
}

function StatusItem({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: "cyan" | "purple" }) {
    return (
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl glass-dark border border-white/5 group hover:border-white/10 transition-colors">
            <div className={cn(
                "text-zinc-500 transition-colors duration-300",
                color === "cyan" ? "group-hover:text-accent-cyan" : "group-hover:text-accent-purple"
            )}>
                {icon}
            </div>
            <div className="flex flex-col leading-none">
                <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-600">{label}</span>
                <span className="text-[11px] font-black text-white tracking-tighter tabular-nums mt-1">{value}</span>
            </div>
        </div>
    );
}

