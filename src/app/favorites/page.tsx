import { Star, Sparkles, ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { TOOLS } from "@/data/tools";
import { ToolCard } from "@/components/ui/ToolCard";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FavoritesMigration } from "@/components/ui/FavoritesMigration";

export default async function FavoritesPage() {
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
          <Star size={40} className="text-zinc-600" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">Please Login</h1>
        <p className="text-zinc-500 max-w-xs">You need to be logged in to see your favorite tools.</p>
        <Link href="/auth/login" className="mt-8 px-8 py-4 rounded-xl premium-gradient text-white font-black text-xs uppercase tracking-widest">
          Login Now
        </Link>
      </div>
    );
  }

  // Fetch favorites from Prisma
  const favoritesData = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    select: { toolId: true }
  });

  const favoritedIds = favoritesData.map(f => f.toolId);
  const favoritedTools = TOOLS.filter(tool => favoritedIds.includes(tool.id));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 pb-32">
      <FavoritesMigration />
      {/* Header Section */}
      <div className="relative space-y-4">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-accent-purple/10 blur-[100px] rounded-full -z-10" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Star size={24} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase italic">Your Favorites</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Quick access to your most used AI tools</p>
          </div>
        </div>
      </div>

      {favoritedTools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {favoritedTools.map((tool, idx) => (
            <ToolCard 
              key={tool.id} 
              {...tool} 
              index={idx} 
              initialFavorited={true}
            />
          ))}
        </div>
      ) : (
        <div className="py-32 flex flex-col items-center justify-center text-center space-y-8 bg-zinc-900/20 border border-dashed border-white/5 rounded-[3rem] backdrop-blur-sm">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
            <Star size={80} className="text-zinc-800 relative z-10" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">No favorites yet</h2>
            <p className="text-zinc-500 max-w-sm font-medium">
              Star some tools to save them here for quick access. Start exploring our collection to find your favorites!
            </p>
          </div>
          <Link href="/tools" className="group flex items-center gap-3 px-8 py-4 rounded-xl glass-dark border border-white/10 text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:text-white hover:border-white/20 transition-all">
            Explore All Tools
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}

      {/* Suggested Section */}
      {favoritedTools.length > 0 && (
        <div className="pt-20 space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent-purple/10 flex items-center justify-center text-accent-purple">
                 <Sparkles size={20} />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">Discover More</h2>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {TOOLS.filter(t => !favoritedIds.includes(t.id)).slice(0, 4).map((tool, i) => (
                 <Link key={tool.id} href={tool.href} className="group p-6 rounded-3xl glass-dark border border-white/5 hover:border-accent-purple/30 transition-all">
                    <p className="text-white font-bold mb-1 group-hover:text-accent-purple transition-colors">{tool.name}</p>
                    <p className="text-[10px] text-zinc-500 font-medium line-clamp-1">{tool.description}</p>
                 </Link>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}
