"use client";

import { TOOLS, CATEGORIES, ICON_MAP } from "@/data/tools";
import { ToolCard } from "@/components/ui/ToolCard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import CategoryHeading from "@/components/ui/CategoryHeading";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface CategoryClientProps {
  categoryId: string;
}

export function CategoryClient({ categoryId }: CategoryClientProps) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchFavorites = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data: favs } = await supabase
          .from('Favorite')
          .select('toolId')
          .eq('userId', session.user.id);
        
        if (favs) {
          setFavorites(favs.map(f => f.toolId));
        }
      }
    };
    fetchFavorites();
  }, [supabase]);

  const category = CATEGORIES.find(c => c.id === categoryId);
  const categoryTools = TOOLS.filter(t => t.category === categoryId);

  if (!category) {
    return (
      <div className="p-8 text-center mt-20">
        <h1 className="text-2xl font-bold">Category not found</h1>
        <Link href="/" className="text-accent-purple hover:text-white mt-4 inline-block font-bold">Back home</Link>
      </div>
    );
  }

  const Icon = ICON_MAP[category.icon];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="p-4 md:p-12 max-w-7xl mx-auto space-y-16 pb-32">
      <div className="space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to all tools
        </Link>
        
        <CategoryHeading 
          icon={Icon}
          title={category.name}
          subtitle={`Browse our collection of professional ${category.name.toLowerCase()} architected for high-performance workflows.`}
          categoryId={categoryId}
          isPro={categoryId === 'ai' || categoryId === 'video'}
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {categoryTools.map((tool, idx) => (
          <ToolCard 
            key={tool.id} 
            {...tool} 
            index={idx} 
            initialFavorited={favorites.includes(tool.id)}
          />
        ))}
      </motion.div>

      {categoryTools.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-32 text-center glass-dark border border-dashed border-white/10 rounded-[3rem]"
        >
          <p className="text-zinc-600 font-bold uppercase tracking-widest">No tools found for this category yet.</p>
        </motion.div>
      )}

      <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-accent-purple/5 blur-[150px] -z-10 rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[50%] h-[50%] bg-accent-blue/5 blur-[150px] -z-10 rounded-full pointer-events-none" />
    </div>
  );
}
