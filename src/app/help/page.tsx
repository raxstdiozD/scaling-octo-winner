"use client";

import { motion } from "framer-motion";
import { ArrowLeft, MessageSquare, Mail, HelpCircle, Sparkles, Send, Zap, Shield } from "lucide-react";
import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-accent-purple/30 pb-32 overflow-hidden" suppressHydrationWarning>
      {/* Cinematic Background Architecture */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.08)_0%,transparent_70%)]" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-accent-purple/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-accent-cyan/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
      </div>
      
      <main className="max-w-6xl mx-auto px-6 pt-32 space-y-24 relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 hover:text-white transition-all group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Support / Back
        </Link>

        <header className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 text-accent-purple"
          >
            <div className="w-16 h-16 rounded-2xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center">
              <HelpCircle size={32} className="animate-pulse" />
            </div>
            <div className="h-px w-24 bg-linear-to-r from-accent-purple/50 to-transparent" />
          </motion.div>
          
          <div className="space-y-4">
            <h1 className="text-7xl md:text-[9rem] font-black tracking-tighter uppercase italic leading-[0.8] select-none">
              Get <br />
              <span className="gradient-text drop-shadow-[0_0_50px_rgba(168,85,247,0.3)]">Help.</span>
            </h1>
            <p className="text-zinc-500 font-medium text-xl max-w-xl leading-relaxed">
              Our team of specialists is standing by to ensure your creative flow remains uninterrupted.
            </p>
          </div>
        </header>

        <div className="flex justify-center">
          {/* Email Support Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative group p-12 rounded-[4rem] glass-dark border border-white/5 overflow-hidden transition-all duration-700 hover:border-white/20 max-w-2xl w-full"
          >
            <div className="absolute inset-0 bg-linear-to-br from-accent-cyan/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            <div className="relative z-10 space-y-10 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-3xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan shadow-[0_0_40px_rgba(34,211,238,0.15)] group-hover:scale-110 transition-transform duration-500">
                <Mail size={36} />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Support Mail</h2>
                <p className="text-zinc-500 font-medium text-lg leading-relaxed">
                  Detailed inquiries or bug reports. We guarantee a response within <span className="text-white">24 business hours</span>.
                </p>
              </div>
              <a 
                href="mailto:careers@lumoraai.online"
                className="w-full h-20 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 font-black text-xs uppercase tracking-[0.3em] hover:text-white hover:border-white/20 hover:bg-white/[0.08] transition-all flex items-center justify-center gap-3"
              >
                careers@lumoraai.online <Send size={16} />
              </a>
            </div>
          </motion.div>
        </div>

        {/* FAQ Section with Premium Styling */}
        <section className="space-y-16">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-zinc-600">Common Questions</h2>
            <div className="h-px flex-1 mx-12 bg-white/5" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { q: "How do I upgrade to Pro?", a: "Access the Pricing page or visit your Account Settings to upgrade instantly.", icon: Sparkles },
              { q: "What files are supported?", a: "We support all major image, audio, and document formats with high-fidelity output.", icon: Zap },
              { q: "Is my data secure?", a: "Yes. All processing is transient and encrypted. Your original files are never permanently stored.", icon: Shield }
            ].map((faq, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="p-8 rounded-[2.5rem] glass-dark border border-white/5 space-y-6"
              >
                <faq.icon size={20} className="text-accent-purple" />
                <div className="space-y-3">
                  <h3 className="text-lg font-black text-white uppercase italic tracking-tight">{faq.q}</h3>
                  <p className="text-zinc-500 font-medium text-sm leading-relaxed">{faq.a}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
