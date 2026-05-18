"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createRazorpayOrder, verifyRazorpayPayment, openLuckyDrop } from "@/app/actions/shop";
import Script from "next/script";
import confetti from "canvas-confetti";
import { Zap, PackageOpen, Star, Diamond, Coins, Loader2, Sparkles, AlertCircle, ShieldCheck, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";

const CREDIT_PACKS = [
  { id: "pack_500", credits: 500, price: 4.99, popular: false, icon: <Coins size={28} className="text-emerald-400" />, color: "from-emerald-500/20 to-emerald-900/20", borderColor: "border-emerald-500/30" },
  { id: "pack_1500", credits: 1500, price: 9.99, popular: true, icon: <Diamond size={28} className="text-cyan-400" />, color: "from-cyan-500/20 to-blue-900/20", borderColor: "border-cyan-500/50" },
  { id: "pack_5000", credits: 5000, price: 24.99, popular: false, icon: <Star size={28} className="text-purple-400" />, color: "from-purple-500/20 to-fuchsia-900/20", borderColor: "border-purple-500/30" },
];

export default function ShopPage() {
  const { user } = useAuth();
  const { credits, dailyCredits, lifetimeCredits, refreshCredits, toast } = useCredits();
  
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  
  const [openingDrop, setOpeningDrop] = useState(false);
  const [dropResult, setDropResult] = useState<{ creditsWon: number, rarity: string } | null>(null);
  
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);

  // Initialize Razorpay
  const handlePurchase = async (pack: typeof CREDIT_PACKS[0]) => {
    if (!user) {
      toast("Please login to purchase credits", "warning");
      return;
    }
    if (!isRazorpayLoaded) {
      toast("Payment system is loading, please wait", "info");
      return;
    }

    setIsProcessingId(pack.id);
    
    try {
      const { success, order, error } = await createRazorpayOrder(pack.price, `${pack.credits} Credits Pack`);
      
      if (!success || !order) {
        toast(error || "Failed to initialize payment", "warning");
        setIsProcessingId(null);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Lumora AI",
        description: `${pack.credits} Permanent Credits`,
        order_id: order.id,
        handler: async function (response: any) {
          const verify = await verifyRazorpayPayment(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature,
            pack.credits
          );

          if (verify.success) {
            toast(`Successfully added ${pack.credits} credits!`, "success");
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            refreshCredits();
          } else {
            toast(verify.error || "Payment verification failed", "warning");
          }
          setIsProcessingId(null);
        },
        prefill: {
          email: user?.email || "",
        },
        theme: {
          color: "#7c3aed",
        },
        modal: {
          ondismiss: function () {
            setIsProcessingId(null);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast("Payment failed or cancelled", "warning");
        setIsProcessingId(null);
      });
      rzp.open();

    } catch (err) {
      console.error(err);
      toast("An unexpected error occurred", "warning");
      setIsProcessingId(null);
    }
  };

  const handleOpenDrop = async () => {
    if (!user) {
      toast("Please login to open Lucky Drops", "warning");
      return;
    }
    
    if (credits < 50) {
      toast("You need 50 credits to open a Lucky Drop!", "warning");
      return;
    }

    setOpeningDrop(true);
    setDropResult(null);

    // Initial animation delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const res = await openLuckyDrop();
      if (!res.success) {
        toast(res.error || "Failed to open drop", "warning");
        setOpeningDrop(false);
        return;
      }

      // Brawl Stars style suspense delay before showing reward
      await new Promise(resolve => setTimeout(resolve, 1200));

      setDropResult({ creditsWon: res.creditsWon, rarity: res.rarity });
      
      if (res.rarity === 'legendary') {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 }, colors: ['#fbbf24', '#f59e0b', '#fff'] });
      } else if (res.rarity === 'epic') {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 }, colors: ['#c084fc', '#a855f7', '#fff'] });
      }

      refreshCredits();
    } catch (err) {
      console.error(err);
      toast("Failed to open drop", "warning");
    } finally {
      setOpeningDrop(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20 px-4 md:px-8 font-sans selection:bg-purple-500/30">
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js" 
        strategy="lazyOnload" 
        onLoad={() => setIsRazorpayLoaded(true)} 
      />

      {/* Background Refinements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Header section */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-sm font-medium mb-6 backdrop-blur-md"
          >
            <Zap size={16} className="text-yellow-400" />
            <span>Your Balance:</span>
            <span className="font-bold text-white">{credits} Credits</span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 mb-4">
            Power Up Your Creativity
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto text-lg">
            Get permanent lifetime credits that never expire or try your luck with a mystery drop!
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Shop Section */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                <Coins size={20} className="text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Credit Packs</h2>
            </div>

            <div className="grid gap-4">
              {CREDIT_PACKS.map((pack, idx) => (
                <motion.div 
                  key={pack.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative overflow-hidden rounded-3xl border ${pack.popular ? pack.borderColor : 'border-white/5'} bg-white/[0.02] backdrop-blur-xl p-1 transition-all hover:bg-white/[0.04]`}
                >
                  {pack.popular && (
                    <div className="absolute top-0 right-8 px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-[10px] font-black uppercase tracking-widest rounded-b-lg shadow-lg">
                      Most Popular
                    </div>
                  )}
                  
                  <div className={`absolute inset-0 bg-gradient-to-br ${pack.color} opacity-50`} />
                  
                  <div className="relative p-6 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-black/40 border border-white/10 shadow-inner`}>
                        {pack.icon}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black">{pack.credits} <span className="text-zinc-500 text-lg font-medium">Credits</span></h3>
                        <p className="text-zinc-400 text-sm flex items-center gap-1 mt-1">
                          <ShieldCheck size={14} className="text-emerald-500" /> 
                          Permanent Reserve
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handlePurchase(pack)}
                      disabled={isProcessingId !== null}
                      className={`px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-xl flex items-center gap-2
                        ${pack.popular 
                          ? 'bg-white text-black hover:bg-zinc-200' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                        } disabled:opacity-50`}
                    >
                      {isProcessingId === pack.id ? <Loader2 size={18} className="animate-spin" /> : `$${pack.price}`}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Lucky Drop Section */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                <PackageOpen size={20} className="text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Lucky Drop</h2>
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-3xl border border-yellow-500/30 bg-black/40 backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.1),transparent_70%)]" />
              
              <div className="p-8 relative flex flex-col items-center text-center">
                
                {/* 3D Box Representation */}
                <div className="relative w-48 h-48 mb-8 mt-4 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {!dropResult ? (
                      <motion.div
                        key="closed-box"
                        animate={openingDrop ? {
                          scale: [1, 1.1, 0.9, 1.2, 0.8, 1.3],
                          rotate: [0, -5, 5, -10, 10, 0],
                        } : {
                          y: [0, -10, 0]
                        }}
                        transition={openingDrop ? { duration: 1.5, ease: "easeInOut" } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="relative z-10"
                      >
                        <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.5)] border-2 border-yellow-300/50 flex items-center justify-center overflow-hidden">
                          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-pulse" />
                          <Sparkles size={48} className="text-white drop-shadow-lg" />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="open-result"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="flex flex-col items-center"
                      >
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(0,0,0,0.5)] border-4
                          ${dropResult.rarity === 'legendary' ? 'bg-gradient-to-br from-yellow-400 to-amber-600 border-yellow-200 shadow-yellow-500/50' : 
                            dropResult.rarity === 'epic' ? 'bg-gradient-to-br from-purple-500 to-fuchsia-600 border-fuchsia-300 shadow-purple-500/50' : 
                            'bg-gradient-to-br from-zinc-600 to-zinc-800 border-zinc-400 shadow-white/20'}`}
                        >
                          <span className="text-4xl font-black text-white drop-shadow-md">
                            +{dropResult.creditsWon}
                          </span>
                        </div>
                        <div className={`mt-4 text-xs font-black uppercase tracking-[0.3em] px-4 py-1 rounded-full border
                          ${dropResult.rarity === 'legendary' ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' : 
                            dropResult.rarity === 'epic' ? 'text-purple-400 border-purple-400/30 bg-purple-400/10' : 
                            'text-zinc-400 border-zinc-400/30 bg-zinc-400/10'}`}
                        >
                          {dropResult.rarity} Drop
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-2 mb-8 h-16">
                  {!dropResult && !openingDrop && (
                    <>
                      <h3 className="text-xl font-bold">Mystery Credit Box</h3>
                      <p className="text-zinc-400 text-sm">Win up to 500 permanent credits!</p>
                    </>
                  )}
                  {openingDrop && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-yellow-400 font-bold text-lg animate-pulse">
                      Unlocking...
                    </motion.div>
                  )}
                  {dropResult && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {dropResult.creditsWon > 0 ? `You won ${dropResult.creditsWon} Credits!` : "Better luck next time!"}
                      </h3>
                      <button 
                        onClick={() => setDropResult(null)}
                        className="text-zinc-400 text-sm hover:text-white transition-colors underline decoration-white/20 underline-offset-4"
                      >
                        Spin again
                      </button>
                    </motion.div>
                  )}
                </div>

                <button
                  onClick={handleOpenDrop}
                  disabled={openingDrop}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-black text-sm uppercase tracking-widest hover:from-yellow-400 hover:to-amber-500 active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2"
                >
                  {openingDrop ? <Loader2 className="animate-spin" size={18} /> : "Open for 50 Credits"}
                </button>

                <div className="mt-6 flex items-center justify-center gap-4 text-[10px] uppercase font-bold tracking-widest text-zinc-500">
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-zinc-500" /> Common (98%)</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /> Epic (1.9%)</span>
                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500" /> Legendary (0.1%)</span>
                </div>
              </div>
            </motion.div>
            
            <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex gap-3 text-sm text-zinc-400">
              <Info size={18} className="text-blue-400 shrink-0" />
              <p>Lucky drops deduct from your balance first. Won credits are added to your <strong className="text-white">permanent lifetime reserve</strong>.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
