"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  LogOut, 
  Camera, 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Crop as CropIcon,
  CreditCard,
  Settings,
  UserCircle,
  ExternalLink,
  ChevronRight,
  Activity,
  History,
  Lock,
  Bell,
  Wallet,
  Calendar,
  Clock,
  Crown,
  LayoutGrid,
  ChevronLeft,
  Loader2,
  RefreshCcw,
  ArrowRight,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cropper from "react-easy-crop";
import { cn } from "@/lib/utils";
import GradientText from "@/components/ui/GradientText";
import { useCredits } from "@/hooks/useCredits";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";
import { ManageSubscriptionModal } from "@/components/tool/ManageSubscriptionModal";
import { InvoiceModal } from "@/components/ui/InvoiceModal";
import { PRICING_CONFIG } from "@/config/pricing";

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (error) => reject(error));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error("Canvas is empty")); return; }
      resolve(blob);
    }, "image/jpeg");
  });
}

type TabType = 'profile' | 'security' | 'billing' | 'credits' | 'preferences';

export default function AccountSettings() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [user, setUser] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { dailyCredits, lifetimeCredits, messagesUsed, plan, isPro, refreshCredits } = useCredits();
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/auth/login'); return; }
      setUser(session.user);
      setName(session.user.user_metadata?.full_name || "");
      const { data: dbData } = await supabase.from('User').select('*').eq('email', session.user.email).single();
      if (dbData) { setDbUser(dbData); setUsername(dbData.username || ""); }
    }
    loadData();
  }, [supabase, router]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => { setImageToCrop(reader.result?.toString() || null); });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCroppedImage = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    try {
      setIsUploading(true);
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const fileName = `${user.id}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, croppedBlob, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      if (updateError) throw updateError;
      setUser({ ...user, user_metadata: { ...user.user_metadata, avatar_url: publicUrl } });
      setImageToCrop(null);
      setStatus({ type: 'success', message: 'Profile picture updated!' });
      router.refresh();
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Failed to process image' });
    } finally { setIsUploading(false); }
  };

  const handleUpdateProfile = async () => {
    try {
      setIsUpdating(true);
      setStatus(null);
      setSuggestions([]);
      const response = await fetch('/api/user/update-profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, username }) });
      const data = await response.json();
      if (!response.ok) { if (data.suggestions) { setSuggestions(data.suggestions); } throw new Error(data.error || 'Failed to update profile'); }
      setStatus({ type: 'success', message: 'Profile updated successfully!' });
      router.refresh();
    } catch (error: any) { setStatus({ type: 'error', message: error.message || 'Failed to update profile' }); } finally { setIsUpdating(false); }
  };

  const [isResetting, setIsResetting] = useState(false);
  const handleResetPassword = async () => {
    try {
      setIsResetting(true);
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/auth/update-password` });
      if (error) throw error;
      setStatus({ type: 'success', message: 'Password reset email sent!' });
    } catch (error: any) { setStatus({ type: 'error', message: error.message || 'Failed to send reset email' }); } finally { setIsResetting(false); }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true);
      const response = await fetch('/api/razorpay/cancel', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to cancel');
      setStatus({ type: 'success', message: 'Subscription cancelled successfully' });
      router.refresh();
    } catch (error: any) {
      setStatus({ type: 'error', message: error.message || 'Failed to cancel' });
    } finally {
      setIsCancelling(false);
    }
  };

  const getHoursUntilReset = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    return Math.floor(diff / (1000 * 60 * 60));
  };

  if (!isMounted || !user) return <div className="min-h-screen bg-[#030303]" />;

  const navigation = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
    { id: 'credits', label: 'Credits & Usage', icon: Zap },
    { id: 'preferences', label: 'Preferences', icon: Settings },
  ];

  return (
    <div suppressHydrationWarning className="min-h-screen bg-[#030303] text-white selection:bg-purple-500/30 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.05)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-24">
        <div className="flex items-center justify-between mb-16">
           <Link href="/" className="group flex items-center gap-3 text-zinc-500 hover:text-white transition-all">
              <div className="w-10 h-10 rounded-2xl glass-dark border border-white/5 flex items-center justify-center group-hover:border-white/20 transition-all">
                 <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Exit Terminal</span>
           </Link>
           <div className="flex items-center gap-4">
              <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="px-6 py-2.5 rounded-full glass-dark border border-white/5 text-zinc-500 font-black uppercase tracking-widest text-[9px] hover:text-red-500 hover:border-red-500/20 transition-all">Sign Out</button>
           </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-3 space-y-8">
             <div className="space-y-2">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Settings</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Account Infrastructure</p>
             </div>
             <nav className="space-y-2">
                {navigation.map((item) => (
                  <button key={item.id} onClick={() => setActiveTab(item.id as TabType)} className={cn("w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group", activeTab === item.id ? "bg-white/[0.05] border border-white/10 text-white shadow-2xl" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] border border-transparent")}>
                    <item.icon size={18} className={cn("transition-all", activeTab === item.id ? "text-accent-purple" : "group-hover:scale-110")} />
                    <span className="font-black uppercase tracking-widest text-[10px]">{item.label}</span>
                    {activeTab === item.id && <motion.div layoutId="nav-glow" className="ml-auto w-1 h-1 rounded-full bg-accent-purple shadow-[0_0_10px_#7c3aed]" />}
                  </button>
                ))}
             </nav>
          </div>
          <div className="lg:col-span-9 space-y-8">
             <AnimatePresence>
                {status && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn("p-5 rounded-2xl border flex items-center justify-between backdrop-blur-2xl mb-8", status.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400")}>
                    <div className="flex items-center gap-4">
                       {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                       <span className="text-[10px] font-black uppercase tracking-widest">{status.message}</span>
                    </div>
                    <button onClick={() => setStatus(null)}><X size={16} /></button>
                  </motion.div>
                )}
             </AnimatePresence>
             <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="space-y-8">
                {activeTab === 'profile' && (
                   <div className="space-y-8">
                      <section className="glass-dark border border-white/5 rounded-[3rem] p-8 md:p-12 relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-accent-purple/5 blur-[80px] pointer-events-none" />
                         <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                            <div className="relative group/avatar">
                               <div className="absolute -inset-2 bg-linear-to-tr from-accent-purple to-accent-cyan rounded-full opacity-20 blur-md group-hover/avatar:opacity-40 transition-opacity duration-700" />
                               <div onClick={() => !isUploading && fileInputRef.current?.click()} className="relative w-48 h-48 rounded-full border-4 border-zinc-950 p-1 bg-black overflow-hidden cursor-pointer group/inner shadow-4xl">
                                  {user.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-full" /> : <div className="w-full h-full bg-zinc-900 flex items-center justify-center"><User size={64} className="text-zinc-700" /></div>}
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/inner:opacity-100 flex flex-col items-center justify-center transition-all duration-300"><Camera size={32} className="text-white mb-2" /><span className="text-[9px] font-black uppercase tracking-widest text-white">Change Photo</span></div>
                               </div>
                               <input type="file" ref={fileInputRef} onChange={onFileChange} className="hidden" accept="image/*" />
                            </div>
                            <div className="flex-1 space-y-8">
                               <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                     <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">{username ? `@${username}` : (user.user_metadata?.full_name || 'Anonymous User')}</h2>
                                     <div suppressHydrationWarning className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest", isPro ? "bg-accent-purple/10 text-accent-purple border border-accent-purple/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]" : "bg-zinc-800 text-zinc-500")}>{isPro ? "Pro Member" : "Free Tier"}</div>
                                  </div>
                                  <p className="text-sm font-medium text-zinc-500">{user.email}</p>
                               </div>
                               <div className="space-y-3">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-1">Username</label>
                                  <div className="relative group">
                                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors">@</div>
                                     <input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="unique_username" className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white focus:bg-white/[0.05] focus:border-white/10 outline-none transition-all" />
                                  </div>
                                  {suggestions.length > 0 && (
                                     <div className="mt-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-amber-500">Suggested Usernames:</p>
                                        <div className="flex flex-wrap gap-2">
                                           {suggestions.map((s) => <button key={s} onClick={() => { setUsername(s); setSuggestions([]); }} className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 text-[10px] font-bold hover:bg-amber-500/20 transition-all">@{s}</button>)}
                                        </div>
                                     </div>
                                  )}
                               </div>
                               <div className="space-y-3">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-1">Full Name</label>
                                  <div className="relative group">
                                     <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors" size={18} />
                                     <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white focus:bg-white/[0.05] focus:border-white/10 outline-none transition-all" />
                                  </div>
                               </div>
                               <div className="space-y-3">
                                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-1">Email Address</label>
                                  <div className="relative">
                                     <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
                                     <input type="text" value={user.email} readOnly className="w-full bg-white/[0.01] border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-zinc-600 cursor-not-allowed" />
                                  </div>
                               </div>
                               <button onClick={handleUpdateProfile} disabled={isUpdating || (name === (user.user_metadata?.full_name || "") && username === (dbUser?.username || ""))} className="flex items-center gap-3 px-10 py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                                  {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                  Sync Profile
                                </button>
                            </div>
                         </div>
                      </section>
                   </div>
                )}
                {activeTab === 'credits' && (
                   <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <section className="glass-dark border border-white/5 rounded-[3rem] p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-purple/5 blur-[80px] pointer-events-none group-hover:bg-accent-purple/10 transition-colors" />
                            <div className="space-y-8 relative z-10">
                               <div className="flex items-center gap-3 text-accent-purple"><Sparkles size={20} className="animate-pulse" /><span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Permanent Reserve</span></div>
                               <div suppressHydrationWarning className="space-y-1"><h3 className="text-6xl font-black italic uppercase tracking-tighter text-white">{lifetimeCredits}</h3><p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic">Bought • Never Expires</p></div>
                               <button onClick={() => setIsBuyModalOpen(true)} className="w-full py-4 rounded-xl premium-gradient text-white font-black uppercase tracking-widest text-[9px] shadow-4xl hover:scale-[1.02] active:scale-98 transition-all">Purchase Permanent Credits</button>
                            </div>
                         </section>
                         <section className="glass-dark border border-white/5 rounded-[3rem] p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-cyan/5 blur-[80px] pointer-events-none group-hover:bg-accent-cyan/10 transition-colors" />
                            <div className="space-y-8 relative z-10">
                               <div className="flex items-center gap-3 text-accent-cyan"><Zap size={20} className="fill-accent-cyan/20" /><span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Daily Allowance</span></div>
                               <div suppressHydrationWarning className="space-y-1"><h3 className="text-6xl font-black italic uppercase tracking-tighter text-white">{dailyCredits} <span className="text-2xl text-zinc-800 tracking-normal">/</span> <span className="text-2xl text-zinc-600">{isPro ? PRICING_CONFIG.PRO_PLAN.DAILY_CREDITS : 50}</span></h3><p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest italic">Replenishes Daily</p></div>
                               <div className="space-y-4">
                                  <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden p-[1px] border border-white/5"><motion.div initial={{ width: 0 }} animate={{ width: `${(dailyCredits / (isPro ? PRICING_CONFIG.PRO_PLAN.DAILY_CREDITS : 50)) * 100}%` }} className="h-full bg-linear-to-r from-accent-cyan to-blue-600 rounded-full shadow-[0_0_15px_rgba(0,255,255,0.2)]" /></div>
                                  <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-zinc-600"><div className="flex items-center gap-1.5"><Clock size={10} />Resets in {getHoursUntilReset()} hours</div><div className="flex items-center gap-3"><button onClick={refreshCredits} className="hover:text-white transition-colors flex items-center gap-1"><RefreshCcw size={10} /> Sync</button></div></div>
                               </div>
                            </div>
                         </section>
                      </div>
                      <div className="mt-12 flex items-center gap-6"><button onClick={() => setIsBuyModalOpen(true)} className="flex-1 py-5 rounded-2xl premium-gradient text-white font-black uppercase tracking-widest text-[10px] shadow-4xl hover:scale-[1.02] active:scale-98 transition-all">Buy More Credits</button><button onClick={refreshCredits} className="p-5 rounded-2xl glass-dark border border-white/5 text-zinc-500 hover:text-white transition-all"><RefreshCcw size={18} /></button></div>
                      <section className="glass-dark border border-white/5 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center space-y-8">
                         <div className="relative w-40 h-40 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90"><circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-900" /><circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * (isPro ? 100 : (messagesUsed / 30) * 100)) / 100} className="text-accent-purple transition-all duration-1000" /></svg>
                            <div className="absolute flex flex-col items-center"><span className="text-4xl font-black text-white italic">{messagesUsed}</span><span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Messages</span></div>
                         </div>
                         <div className="space-y-2"><h4 className="text-sm font-black uppercase tracking-widest text-white">AI Interactions</h4><p className="text-[10px] font-medium text-zinc-500 leading-relaxed uppercase tracking-tight px-4">{isPro ? "Unlimited elite model access active" : `Daily limit: ${messagesUsed}/30 interactions`}</p></div>
                      </section>
                      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6"><h4 className="text-sm font-black uppercase tracking-[0.2em] text-accent-purple italic">What consumes credits?</h4><ul className="space-y-4">{[{ label: "AI Image Generation", value: "5 Credits" }, { label: "Magic Object Removal", value: "3 Credits" }, { label: "Vocal Extraction", value: "8 Credits" }, { label: "Video Processing", value: "10-20 Credits" }].map((item, i) => <li key={i} className="flex items-center justify-between"><span className="text-[11px] font-medium text-zinc-400 uppercase tracking-tight">{item.label}</span><span className="text-[10px] font-black text-white tracking-widest">{item.value}</span></li>)}</ul></div>
                         <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6"><h4 className="text-sm font-black uppercase tracking-[0.2em] text-accent-cyan italic">What is free?</h4><ul className="space-y-4">{[{ label: "PDF Merging", value: "Free" }, { label: "Basic Image Compression", value: "Free" }, { label: "Text Formatting", value: "Free" }, { label: "QR Code Generation", value: "Free" }].map((item, i) => <li key={i} className="flex items-center justify-between"><span className="text-[11px] font-medium text-zinc-400 uppercase tracking-tight">{item.label}</span><span className="text-[10px] font-black text-accent-cyan tracking-widest uppercase">{item.value}</span></li>)}</ul></div>
                      </section>
                   </div>
                )}
                {activeTab === 'security' && (
                   <div className="space-y-8">
                      <section className="glass-dark border border-white/5 rounded-[3rem] p-12 space-y-12 relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[80px] pointer-events-none" /><div className="space-y-4"><h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">Security Infrastructure</h3><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Protect your creative assets and identity</p></div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-6"><div className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-white"><Lock size={32} /></div><div className="space-y-4"><h4 className="text-xl font-black italic uppercase tracking-tighter text-white">Update Password</h4><p className="text-[11px] font-medium text-zinc-500 leading-relaxed uppercase tracking-tight">We will send a secure reset link to your registered email address.</p><button onClick={handleResetPassword} disabled={isResetting} className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[9px] hover:bg-white hover:text-black transition-all flex items-center gap-3">{isResetting ? <Loader2 size={14} className="animate-spin" /> : "Request Reset Link"}<ArrowRight size={14} /></button></div></div>
                            <div className="space-y-6"><div className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-white"><ShieldCheck size={32} /></div><div className="space-y-4"><h4 className="text-xl font-black italic uppercase tracking-tighter text-white">Multi-Factor Auth</h4><p className="text-[11px] font-medium text-zinc-500 leading-relaxed uppercase tracking-tight">Add an extra layer of security to your account using 2FA.</p><button className="px-8 py-4 rounded-xl bg-zinc-900 border border-white/5 text-zinc-600 font-black uppercase tracking-widest text-[9px] cursor-not-allowed italic">Coming Soon</button></div></div>
                         </div>
                      </section>
                   </div>
                )}
                {activeTab === 'billing' && (
                    <div className="space-y-8">
                       <section className="glass-dark border border-white/5 rounded-[3rem] p-12 space-y-12 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-purple/5 blur-[80px] pointer-events-none" />
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-4">
                              <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">Subscription</h3>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Your current plan and billing cycle</p>
                            </div>
                            <div className={cn(
                              "px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs italic border transition-all",
                              isPro 
                                ? "bg-accent-purple/10 border-accent-purple/20 text-accent-purple shadow-[0_0_20px_rgba(168,85,247,0.2)]" 
                                : "bg-zinc-800/50 border-white/5 text-zinc-500"
                            )}>
                              {isPro ? "Active Pro Plan" : "Free Explorer"}
                            </div>
                          </div>

                          <div className="p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-10">
                             <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                  <div className="w-20 h-20 rounded-[2rem] bg-zinc-900 border border-white/5 flex items-center justify-center text-accent-purple shadow-2xl relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-accent-purple/5 group-hover:bg-accent-purple/10 transition-colors" />
                                    <Crown size={40} className={cn("relative z-10", isPro && "fill-accent-purple/20")} />
                                  </div>
                                  <div>
                                    <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                                      {isPro ? "Lumora Elite Pro" : "Lumora Free"}
                                    </h4>
                                    <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest mt-1">
                                      {isPro 
                                        ? dbUser?.subscription_status === 'cancelled' 
                                          ? `Pro access ends on: ${new Date(dbUser.plan_expires_at).toLocaleDateString()}`
                                          : `Next billing date: June 1, 2026` 
                                        : "Upgrade for premium AI tools"}
                                    </p>
                                  </div>
                                </div>

                                {isPro && (
                                   <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">Secure & Verified</span>
                                   </div>
                                )}
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button 
                                  onClick={() => isPro ? setIsManageModalOpen(true) : router.push('/pro')}
                                  className="py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 hover:scale-[1.02] active:scale-98 transition-all shadow-xl"
                                >
                                  {isPro ? "Manage Subscription" : "Upgrade to Pro"}
                                </button>
                                <button 
                                  onClick={() => setIsInvoiceModalOpen(true)}
                                  className="py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/10 hover:border-white/20 transition-all"
                                >
                                  View Invoices
                                </button>
                             </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             {[{ icon: Wallet, label: "Payment Method", value: "Razorpay" }, { icon: Calendar, label: "Cycle", value: "Monthly" }, { icon: Activity, label: "Status", value: isPro ? "Active" : "Standard" }].map((item, i) => (
                               <div key={i} className="p-6 rounded-[1.75rem] bg-white/[0.01] border border-white/5 flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-600">
                                     <item.icon size={18} />
                                  </div>
                                  <div>
                                     <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">{item.label}</p>
                                     <p className="text-xs font-bold text-white italic">{item.value}</p>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </section>
                    </div>
                 )}
                {activeTab === 'preferences' && (
                   <div className="space-y-8">
                      <section className="glass-dark border border-white/5 rounded-[3rem] p-12 space-y-12">
                         <div className="space-y-4"><h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">Preferences</h3><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Customize your Lumora experience</p></div>
                         <div className="space-y-6">{[{ label: "Auto-Refresh History", desc: "Keep recently processed files updated in real-time.", icon: History }, { label: "Email Notifications", desc: "Receive updates about new AI tools and features.", icon: Bell }, { label: "High Fidelity Preview", desc: "Show higher resolution previews (higher bandwidth).", icon: ImageIcon }].map((pref, i) => (
                              <div key={i} className="flex items-center justify-between p-8 rounded-3xl bg-white/[0.02] border border-white/5 group hover:bg-white/[0.04] transition-all"><div className="flex items-center gap-6"><div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors"><pref.icon size={22} /></div><div className="space-y-1"><h4 className="text-[11px] font-black uppercase tracking-widest text-white">{pref.label}</h4><p className="text-[9px] font-medium text-zinc-600 uppercase tracking-tight">{pref.desc}</p></div></div><div className="w-12 h-6 rounded-full bg-zinc-800 relative cursor-pointer"><div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-zinc-600" /></div></div>
                            ))}</div>
                      </section>
                   </div>
                )}
             </motion.div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {imageToCrop && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 md:p-10">
            <div className="relative w-full max-w-2xl h-[80vh] flex flex-col items-center justify-center bg-[#030303] border border-white/10 rounded-[3rem] overflow-hidden shadow-4xl">
               <div className="absolute top-0 inset-x-0 p-8 flex items-center justify-between z-10 bg-linear-to-b from-black to-transparent"><div className="flex items-center gap-4"><div className="p-3 rounded-2xl bg-accent-purple/20 text-accent-purple"><CropIcon size={24} /></div><div><h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Perfect Your Look</h2><p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Crop and align your digital identity</p></div></div><button onClick={() => setImageToCrop(null)} className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"><X size={24} /></button></div>
               <div className="relative w-full flex-1 mt-10"><Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} cropShape="round" showGrid={false} style={{ containerStyle: { background: 'transparent' }, cropAreaStyle: { border: '2px solid rgba(168, 85, 247, 0.5)' } }} /></div>
               <div className="w-full p-8 md:p-12 space-y-8 bg-zinc-950/80 backdrop-blur-md relative z-10"><div className="space-y-4"><div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500 px-2"><span>Optical Zoom</span><span>{Math.round(zoom * 100)}%</span></div><input type="range" value={zoom} min={1} max={3} step={0.1} aria-labelledby="Zoom" onChange={(e) => setZoom(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-accent-purple" /></div>
                  <div className="flex gap-4"><button onClick={() => setImageToCrop(null)} className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/5 text-zinc-500 font-black uppercase tracking-widest text-[10px] hover:text-white transition-all">Cancel</button><button onClick={handleSaveCroppedImage} disabled={isUploading} className="flex-1 py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-all shadow-xl disabled:opacity-30">{isUploading ? "Uploading..." : "Save Identity"}</button></div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <BuyCreditsModal isOpen={isBuyModalOpen} onClose={() => setIsBuyModalOpen(false)} />
      <ManageSubscriptionModal 
        isOpen={isManageModalOpen} 
        onClose={() => setIsManageModalOpen(false)} 
        user={dbUser}
        onCancel={handleCancelSubscription}
        isCancelling={isCancelling}
      />
      <InvoiceModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} />
    </div>
  );
}
