"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  Settings, 
  Palette, 
  Globe, 
  Calculator, 
  History as HistoryIcon,
  Crown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Printer,
  ChevronRight,
  Info,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePro } from "@/hooks/usePro";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import Link from "next/link";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  senderName: string;
  senderEmail: string;
  senderAddress: string;
  items: InvoiceItem[];
  taxRate: number;
  currency: string;
  notes: string;
  themeColor: string;
  template: 'modern' | 'minimal' | 'professional';
}

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'INR', symbol: '₹' },
  { code: 'JPY', symbol: '¥' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CAD', symbol: 'C$' },
];

const THEME_COLORS = [
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Emerald', hex: '#10b881' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Slate', hex: '#475569' },
];

export function InvoiceGeneratorClient({ tool, category }: { tool: any, category: any }) {
  const { isPro, isLoading: proLoading, user } = usePro();
  const [data, setData] = useState<InvoiceData>({
    invoiceNumber: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
    date: new Date().toISOString().split('T')[0],
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    senderName: "",
    senderEmail: "",
    senderAddress: "",
    items: [{ id: '1', description: 'Web Development Services', quantity: 1, price: 500 }],
    taxRate: 0,
    currency: 'USD',
    notes: "Thank you for your business!",
    themeColor: '#6366f1',
    template: 'modern'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const subtotal = useMemo(() => {
    return data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  }, [data.items]);

  const taxAmount = useMemo(() => {
    return (subtotal * data.taxRate) / 100;
  }, [subtotal, data.taxRate]);

  const total = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  const addItem = () => {
    setData(prev => ({
      ...prev,
      items: [...prev.items, { id: Math.random().toString(36).substr(2, 9), description: "", quantity: 1, price: 0 }]
    }));
  };

  const removeItem = (id: string) => {
    if (data.items.length === 1) return;
    setData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const themeRgb = hexToRgb(data.themeColor);
      const accentColor = rgb(themeRgb.r, themeRgb.g, themeRgb.b);
      const textColor = rgb(0.1, 0.1, 0.1);
      const mutedColor = rgb(0.4, 0.4, 0.4);

      // Header Background
      page.drawRectangle({
        x: 0,
        y: height - 120,
        width: width,
        height: 120,
        color: accentColor,
      });

      // Invoice Title
      page.drawText("INVOICE", {
        x: 40,
        y: height - 70,
        size: 32,
        font: boldFont,
        color: rgb(1, 1, 1),
      });

      // Invoice Details (Right Aligned in header)
      page.drawText(`# ${data.invoiceNumber}`, {
        x: width - 180,
        y: height - 55,
        size: 14,
        font: boldFont,
        color: rgb(1, 1, 1),
      });
      page.drawText(`Date: ${data.date}`, {
        x: width - 180,
        y: height - 75,
        size: 10,
        font: font,
        color: rgb(1, 1, 1),
      });

      // Addresses
      // From
      page.drawText("FROM", { x: 40, y: height - 160, size: 10, font: boldFont, color: accentColor });
      page.drawText(data.senderName || "Your Name", { x: 40, y: height - 180, size: 12, font: boldFont, color: textColor });
      page.drawText(data.senderEmail || "email@example.com", { x: 40, y: height - 195, size: 10, font: font, color: mutedColor });
      page.drawText(data.senderAddress || "Your Address", { x: 40, y: height - 210, size: 10, font: font, color: mutedColor });

      // To
      page.drawText("BILL TO", { x: width / 2, y: height - 160, size: 10, font: boldFont, color: accentColor });
      page.drawText(data.clientName || "Client Name", { x: width / 2, y: height - 180, size: 12, font: boldFont, color: textColor });
      page.drawText(data.clientEmail || "client@example.com", { x: width / 2, y: height - 195, size: 10, font: font, color: mutedColor });
      page.drawText(data.clientAddress || "Client Address", { x: width / 2, y: height - 210, size: 10, font: font, color: mutedColor });

      // Table Header
      const tableTop = height - 280;
      page.drawRectangle({
        x: 40,
        y: tableTop - 5,
        width: width - 80,
        height: 25,
        color: rgb(0.95, 0.95, 0.95),
      });

      page.drawText("Description", { x: 50, y: tableTop + 5, size: 10, font: boldFont, color: textColor });
      page.drawText("Qty", { x: 350, y: tableTop + 5, size: 10, font: boldFont, color: textColor });
      page.drawText("Price", { x: 420, y: tableTop + 5, size: 10, font: boldFont, color: textColor });
      page.drawText("Total", { x: 500, y: tableTop + 5, size: 10, font: boldFont, color: textColor });

      // Items
      let currentY = tableTop - 30;
      data.items.forEach((item, index) => {
        page.drawText(item.description || "Service", { x: 50, y: currentY, size: 10, font: font, color: textColor });
        page.drawText(item.quantity.toString(), { x: 350, y: currentY, size: 10, font: font, color: textColor });
        page.drawText(`${data.currency} ${item.price.toFixed(2)}`, { x: 420, y: currentY, size: 10, font: font, color: textColor });
        page.drawText(`${data.currency} ${(item.quantity * item.price).toFixed(2)}`, { x: 500, y: currentY, size: 10, font: boldFont, color: textColor });
        
        currentY -= 25;
        // Draw line
        page.drawLine({
          start: { x: 40, y: currentY + 15 },
          end: { x: width - 40, y: currentY + 15 },
          thickness: 0.5,
          color: rgb(0.9, 0.9, 0.9),
        });
      });

      // Totals
      const totalsX = width - 180;
      page.drawText("Subtotal:", { x: totalsX, y: currentY - 20, size: 10, font: font, color: mutedColor });
      page.drawText(`${data.currency} ${subtotal.toFixed(2)}`, { x: totalsX + 80, y: currentY - 20, size: 10, font: font, color: textColor });
      
      if (data.taxRate > 0) {
        page.drawText(`Tax (${data.taxRate}%):`, { x: totalsX, y: currentY - 40, size: 10, font: font, color: mutedColor });
        page.drawText(`${data.currency} ${taxAmount.toFixed(2)}`, { x: totalsX + 80, y: currentY - 40, size: 10, font: font, color: textColor });
      }

      page.drawRectangle({
        x: totalsX - 10,
        y: currentY - 70,
        width: 150,
        height: 25,
        color: accentColor,
      });
      page.drawText("TOTAL:", { x: totalsX, y: currentY - 60, size: 12, font: boldFont, color: rgb(1, 1, 1) });
      page.drawText(`${data.currency} ${total.toFixed(2)}`, { x: totalsX + 80, y: currentY - 60, size: 12, font: boldFont, color: rgb(1, 1, 1) });

      // Notes
      if (data.notes) {
        page.drawText("NOTES", { x: 40, y: 100, size: 10, font: boldFont, color: accentColor });
        page.drawText(data.notes, { x: 40, y: 80, size: 10, font: font, color: mutedColor, maxWidth: 300 });
      }

      // Watermark for free users
      if (!isPro) {
        page.drawText("Generated by Lumora AI", {
          x: width / 2 - 60,
          y: 20,
          size: 8,
          font: font,
          color: rgb(0.8, 0.8, 0.8),
        });
        
        // Diagonal Watermark
        page.drawText("FREE VERSION", {
          x: width / 4,
          y: height / 2,
          size: 60,
          font: boldFont,
          color: rgb(0.95, 0.95, 0.95),
          opacity: 0.1,
          rotate: { type: 'degrees', angle: 45 },
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${data.invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      // Save history if pro
      if (isPro && user) {
        await saveToHistory();
      }

    } catch (error) {
      console.error("PDF Error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveToHistory = async () => {
    setSaveStatus('saving');
    try {
      const response = await fetch("/api/files/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolType: 'invoice-generator',
          originalName: `Invoice ${data.invoiceNumber}`,
          fileType: 'pdf',
          status: 'completed',
          metadata: data,
          resultUrl: null, // Since we generate it client-side, we don't have a URL yet
        })
      });

      if (response.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('idle');
      }
    } catch (e) {
      console.error(e);
      setSaveStatus('idle');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 bg-[#030303] text-white font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="flex items-center gap-4"
             >
                <div className="p-3 bg-indigo-600/20 rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                   <FileText className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                   <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-indigo-400 italic">
                      Invoice Generator
                   </h1>
                   <p className="text-zinc-500 font-medium uppercase text-[10px] tracking-[0.3em] flex items-center gap-2">
                      <Calculator className="w-3 h-3" />
                      Professional Billing Engine
                   </p>
                </div>
             </motion.div>
          </div>

          <div className="flex items-center gap-3">
             {isPro ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                   <Crown className="w-3 h-3" />
                   Pro Features Enabled
                </div>
             ) : (
                <Link href="/pro">
                   <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all">
                      <Crown className="w-3 h-3" />
                      Go Pro for Branding
                   </button>
                </Link>
             )}
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left: Editor Form */}
          <section className="lg:col-span-5 space-y-8 h-full">
             <div className="bg-zinc-950/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 md:p-10 shadow-2xl space-y-10">
                
                {/* Section: Details */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                      <Settings className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] italic">Invoice Config</h3>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Inv Number</label>
                         <input 
                           type="text" 
                           value={data.invoiceNumber}
                           onChange={(e) => setData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                           className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all font-bold"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Date</label>
                         <input 
                           type="date" 
                           value={data.date}
                           onChange={(e) => setData(prev => ({ ...prev, date: e.target.value }))}
                           className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all font-bold color-scheme-dark"
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Currency</label>
                         <select 
                           value={data.currency}
                           onChange={(e) => setData(prev => ({ ...prev, currency: e.target.value }))}
                           disabled={!isPro}
                           className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all font-bold appearance-none cursor-pointer disabled:opacity-50"
                         >
                            {CURRENCIES.map(c => <option key={c.code} value={c.code} className="bg-zinc-900">{c.code} ({c.symbol})</option>)}
                         </select>
                         {!isPro && <p className="text-[8px] text-zinc-700 uppercase font-black tracking-tighter">Pro Feature</p>}
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Tax Rate (%)</label>
                         <input 
                           type="number" 
                           value={data.taxRate}
                           onChange={(e) => setData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                           disabled={!isPro}
                           className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all font-bold disabled:opacity-50"
                         />
                         {!isPro && <p className="text-[8px] text-zinc-700 uppercase font-black tracking-tighter">Pro Feature</p>}
                      </div>
                   </div>
                </div>

                {/* Section: Parties */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Sender (You)</h4>
                      <input 
                        placeholder="Your Name/Company"
                        value={data.senderName}
                        onChange={(e) => setData(prev => ({ ...prev, senderName: e.target.value }))}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs focus:border-indigo-500 outline-none transition-all"
                      />
                      <textarea 
                        placeholder="Your Address"
                        value={data.senderAddress}
                        onChange={(e) => setData(prev => ({ ...prev, senderAddress: e.target.value }))}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs focus:border-indigo-500 outline-none transition-all h-20 resize-none"
                      />
                   </div>
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Client (Bill To)</h4>
                      <input 
                        placeholder="Client Name"
                        value={data.clientName}
                        onChange={(e) => setData(prev => ({ ...prev, clientName: e.target.value }))}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs focus:border-indigo-500 outline-none transition-all"
                      />
                      <textarea 
                        placeholder="Client Address"
                        value={data.clientAddress}
                        onChange={(e) => setData(prev => ({ ...prev, clientAddress: e.target.value }))}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs focus:border-indigo-500 outline-none transition-all h-20 resize-none"
                      />
                   </div>
                </div>

                {/* Section: Items */}
                <div className="space-y-6">
                   <div className="flex items-center justify-between pb-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                         <Calculator className="w-4 h-4 text-indigo-400" />
                         <h3 className="text-xs font-black uppercase tracking-[0.3em] italic">Line Items</h3>
                      </div>
                      <button 
                        onClick={addItem}
                        className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-all"
                      >
                         <Plus className="w-4 h-4" />
                      </button>
                   </div>

                   <div className="space-y-4">
                      {data.items.map((item) => (
                        <div key={item.id} className="grid grid-cols-12 gap-3 items-start">
                           <div className="col-span-6">
                              <input 
                                placeholder="Description"
                                value={item.description}
                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs focus:border-indigo-500 outline-none transition-all"
                              />
                           </div>
                           <div className="col-span-2">
                              <input 
                                type="number"
                                placeholder="Qty"
                                value={item.quantity}
                                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs focus:border-indigo-500 outline-none transition-all text-center"
                              />
                           </div>
                           <div className="col-span-3">
                              <input 
                                type="number"
                                placeholder="Price"
                                value={item.price}
                                onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs focus:border-indigo-500 outline-none transition-all"
                              />
                           </div>
                           <div className="col-span-1 pt-3">
                              <button 
                                onClick={() => removeItem(item.id)}
                                className="text-zinc-600 hover:text-rose-500 transition-colors"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Section: Customization */}
                <div className="space-y-6">
                   <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                      <Palette className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] italic">Branding</h3>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center gap-4 flex-wrap">
                         {THEME_COLORS.map(c => (
                            <button 
                              key={c.hex}
                              onClick={() => setData(prev => ({ ...prev, themeColor: c.hex }))}
                              disabled={!isPro}
                              className={cn(
                                "w-10 h-10 rounded-full border-2 transition-all relative group/color",
                                data.themeColor === c.hex ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100 hover:scale-105",
                                !isPro && "cursor-not-allowed"
                              )}
                              style={{ backgroundColor: c.hex }}
                            >
                               {!isPro && <Crown className="absolute inset-0 m-auto w-3 h-3 text-white/50" />}
                            </button>
                         ))}
                      </div>
                      {!isPro && (
                         <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-4">
                            <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                            <p className="text-[10px] text-zinc-500 font-medium leading-relaxed uppercase tracking-tight">
                               Custom branding, templates, and watermark removal are available in the <span className="text-indigo-400 font-black italic">Pro Membership</span>.
                            </p>
                         </div>
                      )}
                   </div>
                </div>

                <button 
                  onClick={generatePDF}
                  disabled={isGenerating}
                  className={cn(
                    "w-full h-16 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl relative group overflow-hidden",
                    isPro ? "premium-gradient text-white" : "bg-white text-black hover:bg-zinc-200"
                  )}
                >
                   {isGenerating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                   ) : (
                      <>
                         <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                         Generate {isPro ? 'Pro PDF' : 'Free PDF'}
                      </>
                   )}
                   {isPro && (
                      <div className="absolute inset-0 bg-white/10 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000" />
                   )}
                </button>
             </div>
          </section>

          {/* Right: Preview */}
          <section className="lg:col-span-7 sticky top-24">
             <div className="relative group/preview">
                {/* Preview Toolbar */}
                <div className="flex items-center justify-between mb-6 px-2">
                   <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Live Engine Preview</span>
                   </div>
                   
                   <div className="flex items-center gap-3">
                      <button 
                        onClick={() => window.print()}
                        className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-zinc-400 hover:text-white hover:border-white/20 transition-all shadow-xl group/print"
                        title="Print Invoice"
                      >
                         <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      </button>
                      <div className="hidden md:flex items-center gap-2 px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                         <Info className="w-4 h-4 text-indigo-400" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Auto-Calculating</span>
                      </div>
                   </div>
                </div>

                {/* Preview Frame */}
                <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden aspect-[1/1.41] w-full transform transition-transform duration-700 group-hover:scale-[1.005] origin-top relative border border-white/5">
                   {/* PDF Mockup UI */}
                   <div className="h-full flex flex-col text-black p-10 space-y-12">
                      
                      {/* Header */}
                      <div className="flex justify-between items-start">
                         <div className="space-y-1">
                            <h2 className="text-4xl font-bold tracking-tight" style={{ color: data.themeColor }}>INVOICE</h2>
                            <p className="text-zinc-400 font-bold text-xs"># {data.invoiceNumber}</p>
                         </div>
                         <div className="text-right space-y-1">
                            <p className="text-[10px] font-black uppercase text-zinc-400">Total Amount</p>
                            <p className="text-3xl font-black">{CURRENCIES.find(c => c.code === data.currency)?.symbol}{total.toFixed(2)}</p>
                         </div>
                      </div>

                      <div className="h-px bg-zinc-100 w-full" />

                      {/* Info Row */}
                      <div className="grid grid-cols-2 gap-10">
                         <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: data.themeColor }}>From</p>
                            <div className="space-y-1">
                               <p className="font-bold text-sm">{data.senderName || "Your Company Name"}</p>
                               <p className="text-zinc-500 text-[10px] whitespace-pre-line">{data.senderAddress || "Your Office Address\nCity, Country"}</p>
                            </div>
                         </div>
                         <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: data.themeColor }}>Bill To</p>
                            <div className="space-y-1">
                               <p className="font-bold text-sm">{data.clientName || "Client Name"}</p>
                               <p className="text-zinc-500 text-[10px] whitespace-pre-line">{data.clientAddress || "Client Address\nCity, Country"}</p>
                            </div>
                         </div>
                      </div>

                      {/* Items Table */}
                      <div className="flex-1 space-y-6">
                         <div className="grid grid-cols-12 gap-4 pb-4 border-b-2 border-zinc-50">
                            <div className="col-span-6 text-[10px] font-black uppercase text-zinc-400">Item Description</div>
                            <div className="col-span-2 text-[10px] font-black uppercase text-zinc-400 text-center">Qty</div>
                            <div className="col-span-2 text-[10px] font-black uppercase text-zinc-400 text-right">Price</div>
                            <div className="col-span-2 text-[10px] font-black uppercase text-zinc-400 text-right">Total</div>
                         </div>

                         <div className="space-y-6">
                            {data.items.map(item => (
                               <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
                                  <div className="col-span-6 font-bold text-xs">{item.description || "Project Service"}</div>
                                  <div className="col-span-2 text-center text-xs text-zinc-600">{item.quantity}</div>
                                  <div className="col-span-2 text-right text-xs text-zinc-600">{CURRENCIES.find(c => c.code === data.currency)?.symbol}{item.price.toFixed(2)}</div>
                                  <div className="col-span-2 text-right text-xs font-bold">{(item.quantity * item.price).toFixed(2)}</div>
                               </div>
                            ))}
                         </div>
                      </div>

                      {/* Summary */}
                      <div className="flex justify-end pt-8">
                         <div className="w-64 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                               <span className="text-zinc-500 font-medium">Subtotal</span>
                               <span className="font-bold">{CURRENCIES.find(c => c.code === data.currency)?.symbol}{subtotal.toFixed(2)}</span>
                            </div>
                            {data.taxRate > 0 && (
                               <div className="flex justify-between items-center text-xs">
                                  <span className="text-zinc-500 font-medium">Tax ({data.taxRate}%)</span>
                                  <span className="font-bold">{CURRENCIES.find(c => c.code === data.currency)?.symbol}{taxAmount.toFixed(2)}</span>
                               </div>
                            )}
                            <div className="h-px bg-zinc-100" />
                            <div className="flex justify-between items-center py-3 px-4 rounded-xl text-white" style={{ backgroundColor: data.themeColor }}>
                               <span className="font-black uppercase text-[10px] tracking-widest">Total</span>
                               <span className="text-xl font-black">{CURRENCIES.find(c => c.code === data.currency)?.symbol}{total.toFixed(2)}</span>
                            </div>
                         </div>
                      </div>

                      {/* Footer Watermark */}
                      {!isPro && (
                         <div className="absolute bottom-8 left-0 w-full text-center">
                            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-200">Generated by Lumora AI</p>
                         </div>
                      )}
                   </div>
                </div>
             </div>
          </section>
        </main>
      </div>

      {/* Atmospheric Background */}
      <div className="fixed top-0 right-0 -z-10 w-[800px] h-[800px] bg-indigo-600/[0.04] blur-[160px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-purple-600/[0.03] blur-[160px] rounded-full pointer-events-none" />
      
      <style jsx global>{`
        .color-scheme-dark::-webkit-calendar-picker-indicator {
          filter: invert(1);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
