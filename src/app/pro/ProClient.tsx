"use client";

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Loader2, 
  Zap, 
  Crown, 
  Infinity, 
  Cpu, 
  Headset, 
  Lock,
  RefreshCcw,
  Star,
  CheckCircle2,
  Shield,
  ZapIcon,
  ShieldCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { usePro } from '@/hooks/usePro';
import { ManageSubscriptionModal } from '@/components/tool/ManageSubscriptionModal';
import { PaymentSuccessModal } from '@/components/modals/PaymentSuccessModal';
import { PaymentFailureModal } from '@/components/modals/PaymentFailureModal';
import { PRICING_CONFIG, getIsIndia } from '@/config/pricing';
import { ProComingSoon } from '@/components/pro/ProComingSoon';

const PRO_FEATURES = [
  { 
    title: "Unlimited Generations & Messages", 
    desc: "Experience total creative freedom with zero limits on AI generations and message volume.", 
    icon: Infinity, 
    color: "text-purple-400",
    glow: "rgba(168, 85, 247, 0.12)"
  },
  { 
    title: `${PRICING_CONFIG.PRO_PLAN.DAILY_CREDITS} Daily Credits + Permanent Credits`, 
    desc: "A massive daily allowance plus a vault for non-expiring credits that stay with you.", 
    icon: Zap, 
    color: "text-cyan-400",
    glow: "rgba(34, 211, 238, 0.12)"
  },
  { 
    title: "Priority 20x Faster Processing", 
    desc: "Skip the queue entirely. Your tasks are handled by our most powerful dedicated neural nodes.", 
    icon: Cpu, 
    color: "text-indigo-400",
    glow: "rgba(99, 102, 241, 0.12)"
  },
  { 
    title: "4K Exports with No Watermarks", 
    desc: "Download your creations in stunning ultra-high resolution, perfectly clean for any use.", 
    icon: Sparkles, 
    color: "text-blue-400",
    glow: "rgba(59, 130, 246, 0.12)"
  },
  { 
    title: "Commercial Rights", 
    desc: "Full legal ownership of everything you create. Perfect for professional and agency work.", 
    icon: ShieldCheck, 
    color: "text-emerald-400",
    glow: "rgba(16, 185, 129, 0.12)"
  },
  { 
    title: "Early Access + VIP Support", 
    desc: "Test new models before anyone else and enjoy 24/7 priority assistance from our team.", 
    icon: Headset, 
    color: "text-rose-400",
    glow: "rgba(244, 63, 94, 0.12)"
  }
];

export function ProClient() {
  const router = useRouter();
  const { user, authUser, isPro, isLoading: isProLoading, refresh } = usePro();
  const [loading, setLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const isIndia = mounted && typeof window !== 'undefined' && getIsIndia();
  const currencySymbol = isIndia ? "₹" : "$";
  const priceUSD = PRICING_CONFIG.PRO_PLAN.USD;
  const priceINR = PRICING_CONFIG.PRO_PLAN.INR;
  const priceDisplay = isIndia ? priceINR.toString() : priceUSD.toString();
  const currencyCode = isIndia ? "INR" : "USD";

  const handleUpgrade = async () => {
    if (!user && !authUser) {
      router.push('/auth/login');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan: 'pro',
          currency: currencyCode
        }),
      });
      
      const order = await res.json();
      if (order.error) throw new Error(order.error);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: order.amount,
        currency: order.currency,
        name: 'Lumora Pro',
        description: 'Elite Membership Subscription',
        order_id: order.id,
        handler: async function (response: any) {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              plan: 'pro',
              isINR: isIndia
            }),
          });
          
          const result = await verifyRes.json();
          if (result.success) {
            // Force an immediate refresh of the Pro status in the UI
            await refresh();
            setShowSuccess(true);
            router.refresh();
          } else {
            setShowFailure(true);
          }
        },
        prefill: {
          name: user?.full_name || user?.name || authUser?.user_metadata?.full_name || '',
          email: user?.email || authUser?.email || '',
        },
        theme: { color: '#7c3aed' },
        modal: {
          ondismiss: () => setLoading(false)
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error(error);
      setShowFailure(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const res = await fetch('/api/razorpay/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await res.json();
      if (result.success) {
        if (typeof window !== 'undefined' && user?.email) {
          localStorage.setItem(`cancelled_${user.email}`, 'true');
        }
        
        try {
          await new Promise(r => setTimeout(r, 1000));
          await refresh();
          router.refresh();
        } catch (refreshErr) {
          console.warn('Silent refresh deferred:', refreshErr);
        }
      } else {
        alert(result.error || 'Failed to cancel subscription.');
      }
    } catch (error) {
      console.error('Cancel failed:', error);
      alert('An error occurred during cancellation.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isProLoading) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!isPro && !PRICING_CONFIG.PRO_PLAN.IS_PRO_LIVE) {
    return <ProComingSoon />;
  }

  return (
    <div className="min-h-screen bg-[#020202] text-zinc-100 selection:bg-purple-500/30 overflow-x-hidden font-sans">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/[0.03] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/[0.02] blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] mix-blend-overlay" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        
        <div className="flex flex-col items-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.02] border border-white/5 mb-6"
          >
            <Crown size={12} className="text-purple-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Premium Subscription</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight text-center"
          >
            <span className="text-white">LUMORA </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400">PRO</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-zinc-500 text-sm md:text-base font-medium"
          >
            Elevate your creative workflow with elite-grade AI tools.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRO_FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative p-6 rounded-3xl bg-white/[0.01] border border-white/[0.04] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.02] hover:border-white/[0.08]"
              >
                <div 
                  className="absolute inset-0 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
                  style={{ background: `radial-gradient(circle at center, ${feature.glow} 0%, transparent 70%)` }}
                />
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center mb-5 bg-white/[0.02] border border-white/[0.04] transition-transform group-hover:scale-110",
                  feature.color
                )}>
                  <feature.icon size={20} />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium group-hover:text-zinc-400 transition-colors">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="relative p-10 md:p-12 rounded-[2.5rem] bg-[#050505] border border-white/[0.06] shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/5 blur-[60px] rounded-full -ml-16 -mb-16" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Pro Plan</h2>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mt-1">Full Platform Access</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <Star size={18} className="text-purple-400" />
                  </div>
                </div>

                <div className="mb-10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black tracking-tighter text-white">{currencySymbol}{priceDisplay}</span>
                    <span className="text-zinc-500 font-bold text-sm tracking-wide">/ month</span>
                  </div>
                  {isIndia && (
                    <p className="text-[10px] font-bold text-zinc-600 mt-2 uppercase tracking-widest">
                      Approx. ${priceUSD} / month
                    </p>
                  )}
                  {!isIndia && (
                    <p className="text-[10px] font-bold text-zinc-600 mt-2 uppercase tracking-widest">
                      Approx. ₹{priceINR} / month
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  {isPro ? (
                    <button onClick={() => setIsModalOpen(true)} className="w-full py-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] transition-all flex items-center justify-center gap-3 group">
                       <span className="text-xs font-bold uppercase tracking-[0.2em] text-white">Manage Membership</span>
                       <RefreshCcw size={16} className="text-purple-400 group-hover:rotate-180 transition-transform duration-700" />
                    </button>
                  ) : (
                    <div className="space-y-6">
                      <button onClick={handleUpgrade} disabled={loading} className="w-full py-5 rounded-2xl relative overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] group shadow-[0_20px_40px_-10px_rgba(124,58,237,0.2)]">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500" />
                        <div className="relative flex items-center justify-center gap-2">
                          {loading ? <Loader2 size={20} className="animate-spin text-white" /> : <span className="text-xs font-black uppercase tracking-[0.2em] text-white">UPGRADE TO PRO →</span>}
                        </div>
                      </button>
                      <button
                        onClick={async () => {
                          setLoading(true);
                          try {
                            const res = await fetch('/api/user/sync', { method: 'POST' });
                            const result = await res.json();
                            if (result.success) {
                              setToast({ message: 'Account Synced Successfully! 🚀', type: 'success' });
                              setTimeout(() => window.location.reload(), 1500);
                            } else {
                              setToast({ message: result.error || 'No payment found.', type: 'error' });
                            }
                          } catch (err) {
                            setToast({ message: 'Sync failed.', type: 'error' });
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="w-full py-3 rounded-xl border border-white/5 hover:bg-white/5 transition-all text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white"
                      >
                        Already Paid? Sync Account
                      </button>
                    </div>
                  )}

                  <div className="pt-6 space-y-4 border-t border-white/[0.04]">
                     <TrustItem icon={<Lock size={12} className="text-zinc-500" />} text="Secure SSL Checkout" />
                     <TrustItem icon={<RefreshCcw size={12} className="text-zinc-500" />} text="Cancel anytime" />
                     <TrustItem icon={<Shield size={12} className="text-zinc-500" />} text="Happiness Guarantee" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] min-w-[320px]">
            <div className={cn("px-6 py-4 rounded-2xl backdrop-blur-3xl border flex items-center gap-4", toast.type === 'success' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400")}>
              {toast.type === 'success' ? <CheckCircle2 size={20} /> : <Shield size={20} />}
              <p className="text-[11px] font-black uppercase tracking-widest">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ManageSubscriptionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={user} onCancel={handleCancelSubscription} isCancelling={isCancelling} />
      <PaymentSuccessModal isOpen={showSuccess} onClose={() => setShowSuccess(false)} type="pro" />
      <PaymentFailureModal isOpen={showFailure} onClose={() => setShowFailure(false)} onRetry={() => { setShowFailure(false); handleUpgrade(); }} />
    </div>
  );
}

function TrustItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.1em] text-zinc-500">
      <div className="w-5 h-5 rounded-lg bg-white/[0.02] border border-white/[0.04] flex items-center justify-center shrink-0">{icon}</div>
      <span className="opacity-80">{text}</span>
    </div>
  );
}
