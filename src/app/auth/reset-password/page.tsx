"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, 
  ChevronRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Wand2
} from "lucide-react";
import Link from "next/link";
import { updatePasswordAction } from "@/app/actions/auth";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !email) {
      setError("Invalid or missing reset token.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await updatePasswordAction(email, token, password);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
          <AlertCircle className="text-red-500" size={32} />
        </div>
        <h2 className="text-xl font-bold">Invalid Link</h2>
        <p className="text-zinc-500 text-sm">This password reset link is invalid or has expired.</p>
        <Link 
          href="/auth/login" 
          className="inline-block text-white hover:underline text-xs font-bold uppercase tracking-widest"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
          <CheckCircle2 className="text-emerald-500" size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">Password Reset!</h2>
          <p className="text-zinc-500 text-sm">Your password has been updated successfully. You can now sign in with your new credentials.</p>
        </div>
        <Link 
          href="/auth/login" 
          className="w-full py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
        >
          Sign In Now <ChevronRight size={16} />
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-white">New Password</h2>
        <p className="text-zinc-500 text-sm">Set a secure password for your Lumora account.</p>
      </div>

      <form onSubmit={handleReset} className="space-y-4">
        <div className="space-y-4">
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-purple-500 transition-colors">
              <Lock size={18} />
            </div>
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="NEW PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-xs font-bold tracking-widest placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:bg-purple-500/5 transition-all"
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-purple-500 transition-colors">
              <Lock size={18} />
            </div>
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="CONFIRM PASSWORD"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold tracking-widest placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:bg-purple-500/5 transition-all"
              required
            />
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3"
            >
              <AlertCircle size={16} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          type="submit"
          disabled={isLoading}
          className="w-full py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-zinc-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : (
            <>Update Password <ChevronRight size={16} className="opacity-50" /></>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30 flex flex-col items-center justify-center p-6 relative overflow-hidden font-['Outfit']">
      {/* Premium Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse delay-1000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10 space-y-8"
      >
        <div className="flex flex-col items-center gap-4">
          <Link href="/" className="group flex flex-col items-center">
            <div className="relative mb-2">
              <div className="w-16 h-16 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center group-hover:border-purple-500/50 transition-all duration-500 overflow-hidden relative shadow-2xl">
                <Wand2 size={32} className="text-white group-hover:scale-110 group-hover:rotate-12 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </div>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white italic uppercase">
              Lumora<span className="text-purple-500">.</span>
            </h1>
          </Link>
        </div>

        <div className="relative">
          <div className="absolute -inset-[1px] bg-gradient-to-b from-white/10 to-transparent rounded-[2rem] pointer-events-none" />
          <div className="bg-[#0A0A0B]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)]">
            <Suspense fallback={<div className="py-20 flex justify-center"><Loader2 className="animate-spin text-zinc-700" size={32} /></div>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>

        <div className="text-center">
          <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.4em]">
            Lumora
          </p>
        </div>
      </motion.div>
    </div>
  );
}
