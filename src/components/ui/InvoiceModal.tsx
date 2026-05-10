"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  FileText, 
  CreditCard, 
  Calendar, 
  ShieldCheck,
  Check,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import GradientText from './GradientText';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: {
    id: string;
    date: string;
    amount: string;
    plan: string;
    method: string;
    status: string;
  };
}

export function InvoiceModal({ isOpen, onClose, invoice }: InvoiceModalProps) {
  // Default dummy data if none provided
  const data = invoice || {
    id: "INV-2026-0507-8821",
    date: "May 7, 2026",
    amount: "$6.99",
    plan: "Lumora Elite Pro - Monthly",
    method: "Razorpay (Visa •••• 4242)",
    status: "Paid"
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-zinc-950 border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.9)]"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-accent-purple shadow-xl">
                  <Receipt size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Invoice Details</h3>
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{data.id}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-white/5 rounded-full transition-all text-zinc-500 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-10 space-y-10">
              {/* Status Banner */}
              <div className="flex items-center justify-between p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Check size={20} strokeWidth={3} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-tight">Payment Successful</p>
                    <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-tight">Transaction processed via Razorpay Secure</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black italic text-white tracking-tighter">{data.amount}</p>
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Amount Paid</p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-zinc-600">
                    <Calendar size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Billing Date</span>
                  </div>
                  <p className="text-sm font-bold text-white italic tracking-tight px-1">{data.date}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-zinc-600">
                    <CreditCard size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Payment Method</span>
                  </div>
                  <p className="text-sm font-bold text-white italic tracking-tight px-1">{data.method}</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center gap-2 text-zinc-600">
                    <FileText size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Plan Description</span>
                  </div>
                  <p className="text-sm font-bold text-white italic tracking-tight px-1">{data.plan}</p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-6 space-y-4">
                <button className="w-full py-5 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-[10px] hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]">
                  <Download size={16} />
                  Download PDF Invoice
                </button>
                <div className="flex items-center justify-center gap-2 text-[9px] font-black text-zinc-700 uppercase tracking-widest">
                  <ShieldCheck size={12} />
                  Secure Transaction • Lumora Studios
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
