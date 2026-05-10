"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  History, 
  Image as ImageIcon,
  MessageSquare,
  LayoutGrid,
  Crown,
  Activity,
  Star,
  ArrowUpRight,
  Plus
} from "lucide-react";
import { TOOLS } from "@/data/tools";
import { ToolCard } from "@/components/ui/ToolCard";
import { RecentlyProcessed } from "./RecentlyProcessed";
import Link from "next/link";
import { cn } from "@/lib/utils";
import GradientText from "@/components/ui/GradientText";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { usePro } from "@/hooks/usePro";
import { PRICING_CONFIG } from "@/config/pricing";

const QUICK_ACTIONS = [
  { 
    label: "AI Chat", 
    description: "Intelligent conversations with advanced models.",
    href: "/tools/ai/chat", 
    icon: MessageSquare, 
    color: "purple",
    glow: "from-purple-600/30 to-blue-600/30",
    accent: "text-accent-purple",
    isPremium: true
  },
  { 
    label: "Image Studio", 
    description: "Generate and edit stunning visuals with AI.",
    href: "/tools/ai/img-gen", 
    icon: ImageIcon, 
    color: "cyan",
    glow: "from-cyan-600/20 to-blue-600/20",
    accent: "text-accent-cyan"
  },
  { 
    label: "Explore Tools", 
    description: "Browse our collection of 50+ professional tools.",
    href: "/tools", 
    icon: LayoutGrid, 
    color: "zinc",
    glow: "from-white/5 to-transparent",
    accent: "text-zinc-400"
  },
];

export function Dashboard() {
  const { 
    creditsRemaining, 
    toolsUsedToday, 
    totalGenerations, 
    isPro, 
    loading: statsLoading 
  } = useDashboardStats();
  const { user: dbUser, authUser } = usePro();
  const [mounted, setMounted] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (dbUser?.id) {
        const { data: favs } = await supabase
          .from('Favorite')
          .select('toolId')
          .eq('userId', dbUser.id);
        
        if (favs) setFavorites(favs.map(f => f.toolId));
      }
    };
    fetchFavorites();
  }, [dbUser, supabase]);

  const popularTools = TOOLS.filter(t => t.popular).slice(0, 6);
  const userName = (authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || dbUser?.name || dbUser?.username || authUser?.email?.split('@')[0] || 'Explorer').split(' ')[0];

  if (!mounted) return <div className="min-h-screen bg-[#030303]" />;

  return (
    <div className="min-h-screen bg-[#030303] selection:bg-purple-500/30 overflow-x-hidden">
      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent-purple/10 blur-[120px] rounded-full opacity-30" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent-blue/10 blur-[120px] rounded-full opacity-30" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-32 space-y-20">
        
        {/* 1. TOP WELCOME SECTION */}
        <section className="space-y-4">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
             className="space-y-2"
           >
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white flex flex-wrap items-center gap-x-3">
                 Welcome back, <GradientText className="cyber-neon-glow">{userName}</GradientText>
              </h1>
              <p className="text-zinc-500 text-lg font-medium tracking-tight">
                 What will you create today?
              </p>
           </motion.div>

           {/* Quick Actions Grid */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
              {QUICK_ACTIONS.map((action, i) => (
                <Link href={action.href} key={i}>
                   <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: 0.1 * i, duration: 0.6 }}
                     whileHover={{ y: -8, scale: 1.02 }}
                     className={cn(
                       "group relative p-8 rounded-[3rem] bg-zinc-950/40 backdrop-blur-3xl border border-white/5 hover:border-white/20 transition-all duration-500 overflow-hidden h-full flex flex-col",
                       action.isPremium && "border-accent-purple/20 bg-linear-to-br from-zinc-950/40 via-zinc-950/40 to-accent-purple/5"
                     )}
                   >
                      {/* Premium Badge */}
                      {action.isPremium && (
                        <div className="absolute top-8 right-8 z-20">
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-purple/10 border border-accent-purple/20 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                            <Crown size={10} className="text-accent-purple fill-accent-purple/20" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-accent-purple">Pro</span>
                          </div>
                        </div>
                      )}

                      {/* Shine Animation Layer */}
                      <div className="absolute inset-0 rounded-[3rem] overflow-hidden pointer-events-none z-10">
                        <div className="absolute inset-0 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out bg-linear-to-r from-transparent via-white/10 to-transparent" />
                      </div>

                      {/* Ambient Glows */}
                      <div className={cn(
                        "absolute -inset-px rounded-[3rem] opacity-0 group-hover:opacity-20 transition-opacity duration-700 blur-2xl -z-10 bg-linear-to-br",
                        action.glow
                      )} />

                      <div className={cn(
                        "w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 relative overflow-hidden transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-2xl",
                        "bg-zinc-900 border border-white/5"
                      )}>
                         <div className={cn("absolute inset-0 opacity-10 bg-linear-to-br", action.glow)} />
                         <action.icon size={28} className={cn("relative z-10 transition-all duration-500 group-hover:scale-110", action.accent)} />
                      </div>

                      <div className="space-y-3 flex-1">
                        <h3 className="text-2xl font-black italic tracking-tight text-white transition-colors group-hover:text-white uppercase">
                          {action.label}
                        </h3>
                        <p className="text-zinc-500 text-sm font-medium leading-relaxed line-clamp-2 group-hover:text-zinc-300 transition-colors">
                          {action.description}
                        </p>
                      </div>

                      <div className="mt-10 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 group-hover:text-white transition-all">
                         <span className="w-8 h-px bg-zinc-800 group-hover:bg-white group-hover:w-12 transition-all" />
                         Launch Studio 
                         <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>

                      {/* Ambient Bottom Glow */}
                      <div className={cn(
                        "absolute inset-x-12 bottom-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-[0.5px] bg-linear-to-r from-transparent via-white/50 to-transparent"
                      )} />
                   </motion.div>
                </Link>
              ))}
           </div>
        </section>

        {/* 2. STATS ROW (REFINED GLASS CARDS) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
           <StatCard 
              label="Credits Remaining" 
              value={creditsRemaining.toLocaleString()} 
              icon={Zap}
              color="cyan"
              loading={statsLoading}
              progress={(creditsRemaining / (isPro ? PRICING_CONFIG.PRO_PLAN.DAILY_CREDITS : 50)) * 100}
           />
           <StatCard 
              label="Tools Used Today" 
              value={toolsUsedToday} 
              icon={Activity}
              color="purple"
              loading={statsLoading}
           />
           <StatCard 
              label="Total Generations" 
              value={totalGenerations.toLocaleString()} 
              icon={Sparkles}
              color="amber"
              loading={statsLoading}
           />
           <StatCard 
              label="Pro Status" 
              value={isPro ? "PRO" : "FREE"} 
              icon={isPro ? Crown : ShieldCheck}
              color={isPro ? "purple" : "zinc"}
              loading={statsLoading}
              isPro={isPro}
           />
        </section>

        {/* 3. POPULAR TOOLS SHOWCASE */}
        <section className="space-y-10">
          <div className="flex items-center justify-between">
             <div className="space-y-1">
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                   <Star size={20} className="text-amber-500 fill-amber-500/20" />
                   Popular This Week
                </h2>
                <p className="text-zinc-500 text-sm font-medium">Tools used most by the community</p>
             </div>
             <Link href="/tools" className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                <span className="font-bold text-xs text-zinc-400 group-hover:text-white">View All</span>
                <ArrowRight size={14} className="text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
             </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {popularTools.map((tool, idx) => (
                <ToolCard 
                  key={tool.id} 
                  {...tool} 
                  index={idx} 
                  initialFavorited={favorites.includes(tool.id)}
                />
             ))}
          </div>
        </section>

        {/* 4. RECENT ACTIVITY & INSIGHTS */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8 border-t border-white/5">
           <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center gap-3">
                 <History className="text-zinc-600" size={20} />
                 <h3 className="text-xl font-bold text-white tracking-tight">Recent Activity</h3>
              </div>
              <RecentlyProcessed />
           </div>

           <div className="space-y-8">
              <div className="flex items-center gap-3">
                 <Zap className="text-accent-purple" size={20} />
                 <h3 className="text-xl font-bold text-white tracking-tight">System Updates</h3>
              </div>
              
              <div className="space-y-4">
                 <motion.div 
                   whileHover={{ x: 5 }}
                   className="p-6 rounded-3xl bg-zinc-900/30 border border-white/5 space-y-3 cursor-pointer group hover:bg-zinc-900/50 transition-colors"
                 >
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-cyan-400">
                       <Plus size={12} /> New Tool
                    </div>
                    <h4 className="text-white font-bold text-base group-hover:text-cyan-400 transition-colors">AI Video Restorer (Beta)</h4>
                    <p className="text-zinc-500 text-xs leading-relaxed">Restore old videos to 4K with smooth, clear playback. Exclusive for Pro.</p>
                 </motion.div>

                 {!isPro && (
                   <div className="p-8 rounded-[2.5rem] bg-linear-to-br from-accent-purple/20 via-accent-blue/10 to-transparent border border-accent-purple/20 space-y-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-purple/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                      <div className="space-y-3 relative z-10">
                         <Crown className="text-accent-purple w-8 h-8" />
                         <h4 className="text-xl font-black text-white tracking-tight">Go Pro.</h4>
                         <p className="text-zinc-500 text-xs font-medium leading-relaxed">Unlock priority processing and all premium AI models.</p>
                      </div>
                      <Link href="/pro" className="block relative z-10">
                         <button className="w-full py-3 rounded-2xl bg-white text-black font-bold text-xs shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                            Upgrade Now
                         </button>
                      </Link>
                   </div>
                 )}
              </div>
           </div>
        </section>
      </div>

      <style jsx global>{`
        .cyber-neon-glow {
          filter: drop-shadow(0 0 8px rgba(168, 85, 247, 0.3));
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, progress, loading, isPro }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "relative p-6 rounded-[2rem] bg-zinc-950/40 backdrop-blur-md border border-white/5 group hover:border-white/10 transition-all duration-500 overflow-hidden",
        isPro && "border-accent-purple/20 shadow-[0_0_30px_rgba(168,85,247,0.1)]"
      )}
    >
      {loading ? (
        <div className="absolute inset-0 bg-zinc-950/20 animate-pulse z-20" />
      ) : null}
      <div className={cn(
        "absolute top-0 right-0 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-700",
        color === "purple" && "bg-purple-600",
        color === "cyan" && "bg-cyan-500",
        color === "amber" && "bg-amber-500",
        color === "gold" && "bg-amber-400"
      )} />

      {isPro && (
        <div className="absolute -inset-1 bg-accent-purple/5 blur-2xl animate-pulse pointer-events-none" />
      )}

      <div className="flex items-center justify-between mb-8 relative z-10">
         <div className={cn(
           "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110",
           color === "purple" ? "bg-purple-500/10 text-accent-purple shadow-[0_0_20px_rgba(168,85,247,0.1)]" : 
           color === "cyan" ? "bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.1)]" : 
           color === "amber" ? "bg-amber-500/10 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]" : 
           color === "gold" ? "bg-amber-400/10 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.1)]" : "bg-white/5 text-zinc-500"
         )}>
            <Icon size={22} />
         </div>
         
         {progress !== undefined && (
            <div className="relative w-10 h-10 flex items-center justify-center">
               <svg className="w-full h-full transform -rotate-90">
                  <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-zinc-900" />
                  <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" 
                     strokeDasharray={100} strokeDashoffset={100 - Math.min(progress, 100)}
                     className={cn(color === "cyan" ? "text-cyan-400" : "text-accent-purple", "transition-all duration-1000")} 
                  />
               </svg>
            </div>
         )}
      </div>
      
      <div className="space-y-1 relative z-10">
         <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400 transition-colors">{label}</p>
         <h3 className="text-3xl font-bold text-white tracking-tight">
            {isPro && label === "Pro Status" ? (
              <GradientText className="from-accent-purple to-accent-blue cyber-neon-glow">PRO</GradientText>
            ) : value}
         </h3>
      </div>
    </motion.div>
  );
}
