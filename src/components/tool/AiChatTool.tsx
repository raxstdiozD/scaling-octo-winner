"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Send, 
  Paperclip, 
  X, 
  MessageSquare, 
  Trash2, 
  Copy, 
  Check, 
  User, 
  Sparkles, 
  Cpu, 
  Zap, 
  Globe, 
  Terminal,
  History,
  Settings,
  Share2,
  Menu,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowUp,
  FileText,
  RefreshCw,
  Code2,
  Database,
  Palette,
  Microscope,
  Lightbulb,
  PenTool,
  Rocket,
  Search,
  ChartBar,
  Crown
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { createClient } from "@/utils/supabase/client";
import { useCredits } from "@/hooks/useCredits";
import GradientText from "../ui/GradientText";
import GradientHeading from "../ui/GradientHeading";

// --- Types & Interfaces ---
interface Message {
  role: "user" | "assistant";
  content: string;
  attachments?: { type: string, data: string, name?: string }[];
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
}

// --- Constants ---
const STARTER_CARDS = [
  { title: "System Architecture", desc: "Design a scalable cloud infrastructure.", icon: <Cpu className="text-purple-400" size={24} />, prompt: "Design a scalable cloud architecture for a high-traffic application using microservices." },
  { title: "Market Analysis", desc: "Explore the world of smart AI.", icon: <Globe className="text-cyan-400" size={24} />, prompt: "Analyze the current market landscape for autonomous AI agents." },
  { title: "Code Refactoring", desc: "Optimize complex algorithms for speed.", icon: <Terminal className="text-emerald-400" size={24} />, prompt: "Optimize this sorting algorithm for better time complexity." },
  { title: "Creative Concepting", desc: "Brainstorm unique branding strategies.", icon: <Zap className="text-orange-400" size={24} />, prompt: "Brainstorm 5 unique branding concepts for a new luxury tech brand." },
  { title: "Database Design", desc: "Schema for a real-time chat app.", icon: <Database className="text-blue-400" size={24} />, prompt: "Design a PostgreSQL database schema for a real-time messaging application." },
  { title: "UI/UX Review", desc: "Critique and improve interface flows.", icon: <Palette className="text-pink-400" size={24} />, prompt: "What are the best practices for designing an intuitive mobile onboarding flow?" },
  { title: "Data Science", desc: "Create a smart prediction tool.", icon: <Microscope className="text-indigo-400" size={24} />, prompt: "Write a Python script using PyTorch to train a simple predictive model." },
  { title: "Startup Ideas", desc: "Generate SaaS ideas for 2026.", icon: <Lightbulb className="text-yellow-400" size={24} />, prompt: "Generate 5 innovative B2B SaaS startup ideas that leverage generative AI." },
  { title: "Content Strategy", desc: "Plan a viral marketing campaign.", icon: <PenTool className="text-rose-400" size={24} />, prompt: "Create a 30-day viral content marketing strategy for a new tech product." },
  { title: "Growth Hacking", desc: "Strategies for zero-to-one scaling.", icon: <Rocket className="text-red-400" size={24} />, prompt: "What are the most effective zero-to-one growth hacking strategies for bootstrapped startups?" },
  { title: "Deep Research", desc: "Summarize complex research papers.", icon: <Search className="text-teal-400" size={24} />, prompt: "Summarize the latest advancements in quantum computing from recent academic papers." },
  { title: "Financial Modeling", desc: "Build a 3-year revenue projection.", icon: <ChartBar className="text-green-400" size={24} />, prompt: "Create a 3-year financial projection model for a subscription-based software company." },
  { title: "API Development", desc: "Build a robust RESTful backend.", icon: <Code2 className="text-sky-400" size={24} />, prompt: "Write a robust Express.js REST API with authentication and rate limiting." },
  { title: "Cybersecurity", desc: "Audit smart contract vulnerabilities.", icon: <Check className="text-violet-400" size={24} />, prompt: "What are the most common vulnerabilities in Solidity smart contracts?" },
  { title: "Copywriting", desc: "Write a high-converting landing page.", icon: <FileText className="text-fuchsia-400" size={24} />, prompt: "Write compelling, high-converting copy for a landing page selling premium AI tools." },
  { title: "Code Review", desc: "Analyze React performance bottlenecks.", icon: <Sparkles className="text-amber-400" size={24} />, prompt: "How can I identify and resolve performance bottlenecks in a large React application?" }
];

const SLASH_COMMANDS = [
  { id: 'new', icon: <Plus size={16} className="text-cyan-400" />, label: 'New Conversation', desc: 'Start a fresh creative session' },
  { id: 'clear', icon: <Trash2 size={16} className="text-red-400" />, label: 'Clear Chat', desc: 'Remove all messages from this view' },
  { id: 'summarize', icon: <FileText size={16} className="text-emerald-400" />, label: 'Summarize Chat', desc: 'Generate a brief summary of the conversation' },
  { id: 'export', icon: <Share2 size={16} className="text-orange-400" />, label: 'Export Chat', desc: 'Save this conversation as a document' },
];

const LumoraLogo = ({ size = 48, className = "", innerClassName = "" }: { size?: number, className?: string, innerClassName?: string }) => {
  const outerRadius = size / 3;
  const innerRadius = outerRadius - 2;
  
  return (
    <div className={cn("relative group", className)}>
      <div 
        className="premium-gradient flex items-center justify-center p-[2px] shadow-[0_0_30px_rgba(124,58,237,0.3)] group-hover:rotate-6 transition-transform"
        style={{ width: size, height: size, borderRadius: outerRadius }}
      >
        <div 
          className={cn("w-full h-full bg-zinc-950 flex items-center justify-center", innerClassName)}
          style={{ borderRadius: innerRadius }}
        >
          <span className="text-white font-black font-mono leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" style={{ fontSize: size * 0.5 }}>L</span>
        </div>
      </div>
      <div className="absolute -inset-2 bg-accent-purple/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full animate-pulse-glow" />
    </div>
  );
};

export function AiChatTool() {
  // --- State ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, sessionId: string | null }>({ isOpen: false, sessionId: null });
  const [attachments, setAttachments] = useState<{ id: string, name: string, type: string, data: string, preview: string }[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [agentStatus, setAgentStatus] = useState("Ready to help");
  const [showCommands, setShowCommands] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<any[]>([]);
  const [isRerolling, setIsRerolling] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const [session, setSession] = useState<any>(null);
  const { consumeMessage, messagesUsed, plan, isPro, notification, toast } = useCredits();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // --- Effects ---
  useEffect(() => {
    rollSuggestions();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    
    fetchSessions();
    const checkScreenSize = () => {
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      setAgentStatus("System Ready");
      return;
    }
    const statuses = ["Thinking...", "Working...", "Writing...", "Polishing..."];
    let i = 0;
    const interval = setInterval(() => {
      setAgentStatus(statuses[i % statuses.length]);
      i++;
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  // --- Logic ---
  const fetchSessions = async () => {
    try {
      const res = await axios.get('/api/tools/ai/chat');
      setSessions(res.data.sessions || []);
    } catch (e) {}
  };

  const rollSuggestions = () => {
    setIsRerolling(true);
    setTimeout(() => {
      const shuffled = [...STARTER_CARDS].sort(() => 0.5 - Math.random());
      setCurrentSuggestions(shuffled.slice(0, 8));
      setIsRerolling(false);
    }, 400); // Small delay for animation
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    // Show commands if input starts with / and it's not just a standalone space
    if (val.startsWith('/')) {
      setShowCommands(true);
    } else {
      setShowCommands(false);
    }
  };

  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  const executeCommand = (cmdId: string) => {
    setShowCommands(false);
    setInput('');
    setSelectedCommandIndex(0);
    
    if (cmdId === 'new') {
      startNewChat();
    } else if (cmdId === 'clear') {
      if (messages.length === 0) {
         toast("Nothing to clear. Start a conversation first.", "warning");
         return;
      }
      setShowClearConfirm(true);
    } else if (cmdId === 'summarize') {
      if (messages.length < 3) {
         toast("Not enough messages to summarize yet. Keep chatting!", "warning");
         return;
      }
      handleSend("Please provide a concise, professional summary of our conversation so far, highlighting key decisions or insights.");
    } else if (cmdId === 'export') {
      if (messages.length === 0) {
         toast("Nothing to export. Start a conversation first.", "warning");
         return;
      }
      const text = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n---\n\n');
      const blob = new Blob([`LUMORA CHAT EXPORT\nGenerated: ${new Date().toLocaleString()}\n\n${text}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lumora-chat-${new Date().getTime()}.txt`;
      a.click();
      toast("Chat Exported Successfully", "success");
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast("Link Copied to Clipboard!", "success");
    }
  };

  const handleSend = async (content: string = input) => {
    console.log("DEBUG: handleSend triggered with:", content);
    if (!content.trim() || isLoading) {
      console.log("DEBUG: handleSend blocked: empty or loading");
      return;
    }

    const userMsg: Message = { 
      role: "user", 
      content: content.trim(),
      attachments: attachments.map(a => ({ type: a.type, data: a.data, name: a.name }))
    };
    
    // IMMEDIATELY update UI for zero-latency feel
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setError(null);
    setAttachments([]);

    console.log("DEBUG: Checking credits/limits in background...");
    const canSend = await consumeMessage();
    if (!canSend && !session) {
        toast("Please sign in to save your chat history.", "info");
        // We still allow them to proceed as per the "Unlimited" policy
    }

    try {
      console.log("DEBUG: Calling API /api/tools/ai/chat");
      const res = await axios.post("/api/tools/ai/chat", {
        messages: [...messages, userMsg],
        sessionId,
        attachments: userMsg.attachments
      });
      
      console.log("DEBUG: API Response success:", res.data);
      setMessages(prev => [...prev, { role: "assistant", content: res.data.message || "No response." }]);
      setSessionId(res.data.id);
      fetchSessions();
    } catch (e: any) {
      const msg = e.response?.data?.error || e.message || "Connection lost";
      console.error("DEBUG: API Error:", msg);
      setError(msg);
      toast(msg, "warning");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async (id: string) => {
    if (isLoading || id === sessionId) return;
    try {
      setIsLoading(true);
      setMessages([]);
      const res = await axios.get(`/api/tools/ai/chat/${id}`);
      setMessages(res.data.messages || []);
      setSessionId(res.data.id);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    } catch (e) {
      setError("Failed to get your chat.");
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setError(null);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const confirmDeleteSession = async () => {
    if (!deleteModal.sessionId) return;
    const id = deleteModal.sessionId;
    
    try {
      await axios.delete(`/api/tools/ai/chat/${id}`);
      if (sessionId === id) startNewChat();
      fetchSessions();
      setDeleteModal({ isOpen: false, sessionId: null });
    } catch (e) {}
  };

  const openDeleteModal = (id: string) => {
    setDeleteModal({ isOpen: true, sessionId: id });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (f) => {
        setAttachments(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          data: f.target?.result as string,
          preview: file.type.startsWith('image/') ? f.target?.result as string : ""
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return days === 1 ? 'Yesterday' : `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  // --- Render Helpers ---
  const renderMessageContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const match = part.match(/```([\w]*)\n([\s\S]*?)```/);
        const lang = match ? match[1] : 'text';
        const code = match ? match[2] : part.replace(/```/g, '');
        return (
          <div key={i} className="my-6 rounded-2xl overflow-x-auto border border-white/5 bg-[#0a0a0a] shadow-2xl custom-scrollbar">
            <div className="px-5 py-3 bg-[#111] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-cyan-400" />
                 <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{lang || 'code'}</span>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  setCopiedId(i);
                  setTimeout(() => setCopiedId(null), 2000);
                }} 
                className="text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg flex items-center gap-2 text-[10px] font-bold bg-white/5 hover:bg-white/10"
              >
                {copiedId === i ? <Check size={12} /> : <Copy size={12} />}
                {copiedId === i ? 'Copied' : 'Copy'}
              </button>
            </div>
            <SyntaxHighlighter language={lang} style={vscDarkPlus} customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent', fontSize: '14px', lineHeight: '1.6', fontFamily: '"JetBrains Mono", monospace' }}>
              {code.trim()}
            </SyntaxHighlighter>
          </div>
        );
      }
      
      // Improved markdown-like formatting for headings, bolding, and lists
      return part.split('\n').map((line, li) => {
        if (!line.trim()) return <div key={li} className="h-4" />;
        
        // Headings
        if (line.startsWith('###### ')) {
          return <h6 key={li} className="text-sm font-black text-white mt-4 mb-2 uppercase tracking-widest">{line.slice(7)}</h6>;
        }
        if (line.startsWith('##### ')) {
          return <h5 key={li} className="text-base font-black text-white mt-5 mb-2 tracking-tight">{line.slice(6)}</h5>;
        }
        if (line.startsWith('#### ')) {
          return <h4 key={li} className="text-lg font-black text-white mt-6 mb-3 tracking-tight">{line.slice(5)}</h4>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={li} className="text-2xl font-black text-white mt-8 mb-4 tracking-tight">{line.slice(4)}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={li} className="text-3xl font-black text-white mt-10 mb-5 tracking-tighter">{line.slice(3)}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={li} className="text-4xl font-black text-white mt-12 mb-6 tracking-tighter">{line.slice(2)}</h1>;
        }

        // Lists
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          return (
            <div key={li} className="flex gap-4 mb-4 ml-2 group/list">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan mt-2.5 shrink-0 shadow-[0_0_10px_#00ffff] group-hover/list:scale-125 transition-transform" />
              <div className="flex-1">
                {line.trim().slice(2).split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g).map((token, ti) => {
                  if (token.startsWith('**') && token.endsWith('**')) return <strong key={ti} className="text-white font-black tracking-tight">{token.slice(2, -2)}</strong>;
                  if (token.startsWith('*') && token.endsWith('*')) return <strong key={ti} className="text-white font-black tracking-tight">{token.slice(1, -1)}</strong>;
                  if (token.startsWith('`') && token.endsWith('`')) return <code key={ti} className="bg-white/10 px-2 py-0.5 rounded-lg text-accent-cyan font-mono text-sm border border-white/5">{token.slice(1, -1)}</code>;
                  return token;
                })}
              </div>
            </div>
          );
        }
        
        return (
          <p key={li} className="mb-4 last:mb-0 text-zinc-300 leading-relaxed">
            {line.split(/(!\[.*?\]\(.*?\))|(\*\*.*?\*\*|\*.*?\*|`.*?`)/g).map((token, ti) => {
              if (!token) return null;
              
              // Markdown Image: ![alt](url)
              if (token.startsWith('![') && token.includes('](')) {
                const match = token.match(/!\[(.*?)\]\((.*?)\)/);
                if (match) {
                  const alt = match[1];
                  const url = match[2];
                  return (
                    <div key={ti} className="my-6 relative group/img">
                      <div className="absolute -inset-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-xl opacity-0 group-hover/img:opacity-100 transition-opacity rounded-[2rem]" />
                      <img 
                        src={url} 
                        alt={alt} 
                        className="rounded-[2rem] border border-white/10 shadow-2xl max-w-full h-auto object-cover relative z-10 hover:scale-[1.02] transition-transform duration-500" 
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.classList.add('animate-in', 'fade-in', 'zoom-in', 'duration-700');
                        }}
                      />
                      <div className="absolute top-4 right-4 z-20 opacity-0 group-hover/img:opacity-100 transition-opacity">
                         <a 
                           href={url} 
                           target="_blank" 
                           rel="noreferrer"
                           className="p-3 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-black/80 transition-all block"
                         >
                            <ArrowUp className="rotate-45" size={18} />
                         </a>
                      </div>
                    </div>
                  );
                }
              }

              if (token.startsWith('**') && token.endsWith('**')) return <strong key={ti} className="text-white font-black tracking-tight">{token.slice(2, -2)}</strong>;
              if (token.startsWith('*') && token.endsWith('*')) return <strong key={ti} className="text-white font-black tracking-tight">{token.slice(1, -1)}</strong>;
              if (token.startsWith('`') && token.endsWith('`')) return <code key={ti} className="bg-white/10 px-2 py-0.5 rounded-lg text-accent-cyan font-mono text-[14px] border border-white/5">{token.slice(1, -1)}</code>;
              return token;
            })}
          </p>
        );
      });
    });
  };

  return (
    <div suppressHydrationWarning className="fixed inset-0 bg-[#050505] text-zinc-300 font-sans selection:bg-purple-500/30 overflow-hidden flex flex-col z-[200]">
      
      {/* --- Ambient Background Glows --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[60%] h-[60%] bg-cyan-600/10 blur-[150px] rounded-full" />
      </div>

      {/* --- Main App Layout --- */}
      <div className="flex-1 flex overflow-hidden relative z-10 w-full">
        
        {/* --- Left Sidebar --- */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Mobile overlay */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden" />
              
              <motion.aside 
                initial={{ x: -300 }} 
                animate={{ x: 0 }} 
                exit={{ x: -300 }} 
                transition={{ type: "spring", damping: 25, stiffness: 200 }} 
                className="absolute md:relative z-[70] w-72 lg:w-80 h-full bg-[#080808]/90 backdrop-blur-3xl border-r border-white/5 flex flex-col shrink-0"
              >
                <div className="p-6 flex flex-col h-full">
                  <button onClick={startNewChat} className="w-full py-4 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 mb-8 hover:bg-zinc-200 transition-all active:scale-95 shadow-xl">
                    <Plus size={18} strokeWidth={3} />
                    New Conversation
                  </button>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    <div className="px-4 mb-4 text-zinc-600 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <History size={14} className="text-zinc-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">History</span>
                      </div>
                      <span className="text-[9px] font-bold text-zinc-800 uppercase tracking-widest">{sessions.length} Chats</span>
                    </div>

                    {sessions.length === 0 ? (
                       <div className="flex flex-col items-center justify-center py-10 px-6 text-center space-y-4 opacity-40">
                          <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-white/5 flex items-center justify-center text-zinc-700">
                             <MessageSquare size={20} />
                          </div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">No conversations yet.<br/>Start chatting!</p>
                       </div>
                    ) : (
                       sessions.map(s => (
                         <div key={s.id} className="group relative px-2">
                           <button 
                             onClick={() => loadSession(s.id)} 
                             className={cn(
                               "w-full text-left p-4 rounded-3xl transition-all flex flex-col gap-2 border group-hover:scale-[1.02] active:scale-[0.98]",
                               sessionId === s.id 
                                 ? "bg-white/10 border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.4)]" 
                                 : "bg-transparent border-transparent hover:bg-white/[0.04] hover:border-white/5"
                             )}
                           >
                             <div className="flex items-center justify-between gap-2">
                                <span className={cn(
                                  "truncate text-[13px] font-black tracking-tight flex-1",
                                  sessionId === s.id ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                                )}>
                                  {s.title || "Untitled Chat"}
                                </span>
                                <span className="text-[9px] font-medium text-zinc-600 shrink-0 uppercase tracking-tighter group-hover:opacity-0 transition-opacity duration-200">
                                  {formatTimeAgo(s.updatedAt || s.createdAt)}
                                </span>
                             </div>
                             
                             <p className={cn(
                               "text-[10px] font-medium line-clamp-1 leading-relaxed transition-colors",
                               sessionId === s.id ? "text-zinc-400" : "text-zinc-600 group-hover:text-zinc-500"
                             )}>
                               {s.lastMessage || "No messages yet"}
                             </p>

                             {/* Active Glow Indicator */}
                             {sessionId === s.id && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent-purple rounded-r-full shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
                             )}
                           </button>
                           
                           <button 
                             onClick={(e) => { e.stopPropagation(); openDeleteModal(s.id); }} 
                             className="absolute right-6 top-6 p-2 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded-xl"
                           >
                             <Trash2 size={14} />
                           </button>
                         </div>
                       ))
                    )}
                  </div>

                  {/* Clean User Info at bottom */}
                  <div className="p-6 mt-auto border-t border-white/5 bg-[#080808]">
                     <div className="relative group rounded-[2rem] p-[1px] overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]">
                        {/* Animated Border Glow */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(168,85,247,0.4),rgba(34,211,238,0.4),rgba(168,85,247,0.4))] opacity-0 group-hover:opacity-100 animate-spin-slow transition-opacity duration-700" />
                        
                        <div className="relative bg-zinc-950/80 rounded-[2rem] p-3 flex items-center gap-3 border border-white/5">
                           <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
                           
                           <div className="relative shrink-0 ml-1">
                              <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl relative z-10">
                                 {session?.user?.user_metadata?.avatar_url ? (
                                    <img src={session.user.user_metadata.avatar_url} alt={session?.user?.user_metadata?.full_name || "User"} className="w-full h-full object-cover" />
                                 ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-accent-purple to-accent-cyan flex items-center justify-center">
                                      <span className="text-lg font-black text-white">
                                         {(session?.user?.user_metadata?.full_name || session?.user?.email || "G")[0].toUpperCase()}
                                      </span>
                                    </div>
                                 )}
                              </div>
                              {/* Cinematic Ring */}
                              <div className="absolute -inset-1 border border-accent-purple/30 rounded-[1.2rem] opacity-0 group-hover:opacity-100 transition-opacity animate-pulse-glow" />
                              
                              {isPro && (
                                 <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-purple rounded-full border-[3px] border-[#09090b] shadow-[0_0_15px_rgba(168,85,247,0.8)] z-20" />
                              )}
                           </div>
                           
                           <div className="flex-1 min-w-0 pr-1">
                              <div className="flex items-center">
                                 <GradientText className="text-sm font-black text-white truncate tracking-tight leading-none">
                                    {session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "Explorer"}
                                 </GradientText>
                              </div>
                              <div className="flex items-center mt-1.5">
                                 {isPro ? (
                                   <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                                      <Crown size={8} className="text-purple-400 shrink-0" />
                                      <span className="text-[7px] font-black uppercase tracking-[0.15em] text-purple-400 whitespace-nowrap">Lumora Elite</span>
                                   </div>
                                 ) : (
                                   <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest group-hover:text-zinc-400 transition-colors">Free Explorer</span>
                                 )}
                              </div>
                           </div>

                           <Link 
                              href="/account/settings" 
                              className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-zinc-600 hover:text-white hover:bg-white/10 transition-all border border-white/5 group/settings shrink-0 relative z-20"
                           >
                              <Settings size={16} className="group-hover/settings:rotate-90 transition-transform duration-500" />
                           </Link>
                        </div>
                     </div>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* --- Main Chat Area --- */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          
          {/* Header */}
          <header className="h-20 px-6 md:px-8 border-b border-white/5 flex items-center justify-between bg-transparent shrink-0 z-50">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-400 hover:text-white transition-all active:scale-95">
                {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
              </button>
              
              {/* Big Lumora AI logo + title at top (only show when sidebar is closed or on mobile) */}
              {(!isSidebarOpen || window.innerWidth < 768) && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 ml-4">
                  <LumoraLogo size={36} />
                  <h1 className="text-xl font-black text-white tracking-tighter mt-1">Lumora <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-purple to-accent-cyan">AI</span></h1>
                </motion.div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
               <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{agentStatus}</span>
               </div>
               <button 
                 onClick={handleShare}
                 className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-400 hover:text-white transition-all active:scale-95"
               >
                 <Share2 size={18} />
               </button>
            </div>
          </header>

          {/* Messages Container */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 custom-scrollbar relative">
             <div className="max-w-4xl mx-auto min-h-full flex flex-col pt-8">
                {messages.length === 0 ? (
                  // --- Beautiful Centered Welcome ---
                  <div className="flex-1 flex flex-col items-center justify-center pb-32 text-center">
                     <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8 mb-16">
                        <LumoraLogo size={80} className="mx-auto" />
                        <div className="space-y-4 mt-8 flex flex-col items-center">
                          <GradientHeading size="2xl" className="text-center">
                            Unlimited <br className="hidden md:block" /> Creativity.
                          </GradientHeading>
                          <p className="text-zinc-500 text-lg font-medium max-w-xl mx-auto drop-shadow-md">Define the Future. What shall we build today?</p>
                        </div>
                     </motion.div>

                     {/* 8 dynamic suggestion cards with reroll header */}
                     <div className="w-full max-w-5xl mt-4">
                        <div className="flex items-center justify-between mb-6 px-2">
                           <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Suggested Workflows</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                           <AnimatePresence mode="wait">
                              {!isRerolling && currentSuggestions.map((card, i) => (
                                <motion.button 
                                   key={card.title} 
                                   initial={{ opacity: 0, y: 20, scale: 0.95 }} 
                                   animate={{ opacity: 1, y: 0, scale: 1 }} 
                                   exit={{ opacity: 0, scale: 0.95 }}
                                   transition={{ delay: 0.05 * i, duration: 0.4, ease: "easeOut" }}
                                   onClick={() => handleSend(card.prompt)} 
                                   className="group p-5 rounded-3xl bg-[#09090b]/80 backdrop-blur-xl border border-white/5 hover:bg-[#121216] transition-all duration-500 text-left flex flex-col gap-4 relative overflow-hidden shadow-2xl hover:shadow-[0_20px_40px_-15px_rgba(168,85,247,0.3)] hover:-translate-y-1.5 active:scale-[0.98]"
                                >
                                   {/* Animated Gradient Border on Hover */}
                                   <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/0 via-accent-purple/10 to-accent-cyan/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                   
                                   {/* Subtle inner top highlight */}
                                   <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                                   <div className="w-12 h-12 rounded-2xl bg-[#050505] border border-white/5 flex items-center justify-center shrink-0 group-hover:border-accent-purple/50 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-500 relative z-10">
                                      {card.icon}
                                   </div>
                                   <div className="flex flex-col relative z-10">
                                      <h4 className="text-white font-bold text-[15px] mb-1.5 leading-tight">{card.title}</h4>
                                      <p className="text-zinc-500 text-xs leading-relaxed group-hover:text-zinc-400 transition-colors">{card.desc}</p>
                                   </div>
                                </motion.button>
                              ))}
                           </AnimatePresence>
                        </div>
                     </div>
                  </div>
                ) : (
                  // --- Clean, Spacious Message Area ---
                  <div className="space-y-14 pb-40">
                    {messages.map((msg, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 30, scale: 0.98 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1], delay: 0.05 }}
                        className={cn("flex gap-6 w-full group/message", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}
                      >
                        {/* Avatar / Icon Terminal */}
                        <div className="flex flex-col items-center gap-2 mt-1">
                          {msg.role === 'assistant' ? (
                            <div className="relative shrink-0">
                               <div className="w-12 h-12 rounded-2xl bg-[#0c0c0e] border border-white/10 flex items-center justify-center shadow-2xl relative z-10 group-hover/message:border-accent-purple/50 transition-colors">
                                  <span className="text-white font-black text-sm">L</span>
                               </div>
                               <div className="absolute -inset-2 bg-accent-purple/20 blur-xl opacity-0 group-hover/message:opacity-100 transition-opacity" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden shadow-xl shrink-0">
                               {session?.user?.user_metadata?.avatar_url ? (
                                  <img src={session.user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                               ) : (
                                  <div className="w-full h-full bg-linear-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
                                    <User size={20} className="text-zinc-600" />
                                  </div>
                               )}
                            </div>
                          )}
                        </div>
                        
                        {/* Message Content Bubble */}
                        <div className={cn(
                          "flex flex-col space-y-3 max-w-[85%] md:max-w-[75%]", 
                          msg.role === 'user' ? "items-end" : "items-start"
                        )}>
                          <div className={cn(
                            "relative px-8 py-7 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] transition-all duration-500",
                            msg.role === 'user' 
                              ? "bg-linear-to-br from-accent-purple to-accent-cyan text-white rounded-[2.5rem] rounded-tr-lg border border-white/10" 
                              : "bg-[#0c0c0e]/80 backdrop-blur-3xl border border-white/5 text-zinc-100 rounded-[2.5rem] rounded-tl-lg hover:border-white/10 hover:shadow-accent-purple/5"
                          )}>
                             {/* Ambient Inner Highlight */}
                             <div className="absolute inset-0 bg-linear-to-b from-white/[0.05] to-transparent pointer-events-none" />
                             
                             <div className="relative z-10 text-[17px] leading-[1.8] font-medium tracking-tight whitespace-pre-wrap">
                                {renderMessageContent(msg.content)}
                             </div>

                             {/* Interaction Toolbar (AI Only) */}
                             {msg.role === 'assistant' && (
                               <div className="absolute -bottom-10 left-4 opacity-0 group-hover/message:opacity-100 transition-opacity flex items-center gap-3">
                                  <button onClick={() => { navigator.clipboard.writeText(msg.content); toast.success("Copied to clipboard"); }} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-500 hover:text-white transition-all">
                                    <Copy size={12} />
                                  </button>
                                  <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-500 hover:text-white transition-all">
                                    <RefreshCw size={12} />
                                  </button>
                               </div>
                             )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-6">
                         <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center animate-pulse border border-white/5 shadow-lg">
                            <Sparkles size={20} className="text-purple-500" />
                         </div>
                         <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" />
                               <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:200ms]" />
                               <div className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:400ms]" />
                            </div>
                         </div>
                      </motion.div>
                    )}
                  </div>
                )}
             </div>
          </div>

          {/* --- Compact, Premium Input Bar --- */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-50 pointer-events-none">
             <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent pointer-events-none -z-10" />
             <div className="max-w-4xl mx-auto relative group/input pointer-events-auto">
                
                 {/* Ultra-smooth Glow behind input */}
                 <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/10 via-cyan-500/5 to-purple-500/10 rounded-[3rem] blur-3xl opacity-0 group-focus-within/input:opacity-100 transition-all duration-1000 -z-10" />
                 
                 <div className={cn(
                    "bg-[#0c0c0e]/90 backdrop-blur-3xl border border-white/10 group-focus-within/input:border-white/20 rounded-[2.5rem] p-2 flex items-center gap-4 shadow-[0_30px_70px_-10px_rgba(0,0,0,0.8)] transition-all duration-500 relative",
                    "group-focus-within/input:shadow-[0_0_40px_rgba(168,85,247,0.15)]"
                 )}>
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent rounded-[2.5rem] pointer-events-none" />
                    
                    {/* Attach Icon */}
                    <div className="relative z-10 pl-2">
                       <button 
                         onClick={() => fileInputRef.current?.click()} 
                         className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all hover:scale-105 active:scale-95 group/attach"
                       >
                        <Paperclip size={20} className="group-hover/attach:rotate-12 transition-transform duration-300" />
                      </button>
                      <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />
                   </div>
 
                   <div className="flex-1 relative min-h-[48px] flex items-center">
                       <AnimatePresence>
                        {showCommands && (
                          <motion.div 
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            className="absolute bottom-full left-0 mb-6 w-full md:w-[380px] bg-[#0c0c0e]/98 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-2 shadow-[0_30px_70px_rgba(0,0,0,1)] z-[9999] overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />
                            <div className="px-4 py-2.5 border-b border-white/5 mb-2 flex items-center justify-between relative z-10">
                              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Smart Commands</p>
                              <div className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 text-[8px] font-bold text-zinc-600">ESC</div>
                            </div>
                            <div className="flex flex-col gap-1 relative z-10">
                              {SLASH_COMMANDS.map((cmd, idx) => (
                                <button 
                                  key={cmd.id}
                                  onClick={() => executeCommand(cmd.id)}
                                  onMouseEnter={() => setSelectedCommandIndex(idx)}
                                  className={cn(
                                    "flex items-center gap-3 w-full text-left p-3 rounded-xl transition-all group/cmd active:scale-95 border border-transparent",
                                    selectedCommandIndex === idx ? "bg-white/10 border-white/10" : "hover:bg-white/5"
                                  )}
                                >
                                    <div className={cn(
                                      "w-10 h-10 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0 transition-all",
                                      selectedCommandIndex === idx && "scale-110 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                                    )}>
                                      {cmd.icon}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className={cn("text-sm font-black transition-colors", selectedCommandIndex === idx ? "text-purple-400" : "text-white")}>{cmd.label}</span>
                                      <span className="text-[10px] font-medium text-zinc-500 group-hover/cmd:text-zinc-400">{cmd.desc}</span>
                                    </div>
                                    {selectedCommandIndex === idx && (
                                       <div className="ml-auto">
                                          <ArrowUp className="rotate-90 text-purple-500/40" size={14} />
                                       </div>
                                    )}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="flex-col w-full">
                        <AnimatePresence>
                          {attachments.length > 0 && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="flex gap-3 pb-3 overflow-x-auto no-scrollbar">
                               {attachments.map(at => (
                                 <div key={at.id} className="relative group/at shrink-0">
                                   {at.preview ? <img src={at.preview} className="w-16 h-16 rounded-xl object-cover border border-white/10 shadow-lg" alt="" /> : <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-white/10 flex flex-col items-center justify-center text-[9px] font-bold text-zinc-500 uppercase px-2"><FileText size={18} className="mb-1 text-cyan-400" /><span className="truncate w-full text-center">{at.name}</span></div>}
                                   <button onClick={() => setAttachments(prev => prev.filter(a => a.id !== at.id))} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white opacity-0 group-hover/at:opacity-100 transition-all shadow-xl active:scale-90 border border-black"><X size={12} /></button>
                                 </div>
                               ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <textarea 
                           value={input} 
                           onChange={(e) => {
                             handleInputChange(e);
                             const target = e.target as HTMLTextAreaElement;
                             target.style.height = 'auto';
                             target.style.height = `${Math.min(target.scrollHeight, 300)}px`;
                           }}
                           onKeyDown={(e) => { 
                              if (showCommands) {
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  setSelectedCommandIndex(prev => (prev + 1) % SLASH_COMMANDS.length);
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  setSelectedCommandIndex(prev => (prev - 1 + SLASH_COMMANDS.length) % SLASH_COMMANDS.length);
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  executeCommand(SLASH_COMMANDS[selectedCommandIndex].id);
                                } else if (e.key === 'Escape') {
                                  setShowCommands(false);
                                }
                              } else {
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } 
                                if (e.key === 'Escape') setShowCommands(false);
                              }
                           }} 
                           placeholder="Ask anything... or press '/' for commands" 
                           className="w-full bg-transparent border-0 ring-0 outline-none focus:ring-0 focus:outline-none focus:border-transparent text-[16px] text-white placeholder-zinc-600 py-3.5 px-1 min-h-[48px] max-h-[300px] resize-none overflow-y-auto no-scrollbar font-medium relative z-10 leading-snug"
                           rows={1}
                        />
                      </div>
                   </div>
 
                   {/* Send Button */}
                   <div className="relative z-10 pr-2">
                      <button 
                        onClick={() => handleSend()} 
                        disabled={!input.trim() || isLoading} 
                        className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 shrink-0",
                            input.trim() && !isLoading 
                                ? "bg-white text-black shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-105 active:scale-95" 
                                : "bg-white/5 text-zinc-700 border border-white/5 cursor-not-allowed"
                        )}
                      >
                         {isLoading ? <div className="w-5 h-5 border-[3px] border-zinc-400 border-t-black rounded-full animate-spin" /> : <ArrowUp size={24} strokeWidth={3} />}
                      </button>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* --- Notification Toast --- */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={cn(
              "fixed bottom-32 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl z-[1000] flex items-center gap-3 min-w-[200px] justify-center",
              notification.type === 'warning' ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-white/5 border-white/10 text-white"
            )}
          >
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              notification.type === 'warning' ? "bg-amber-500" : "bg-accent-purple"
            )} />
            <span className="text-xs font-black uppercase tracking-widest">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Lumora Style Alert Box (Delete Modal) --- */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setDeleteModal({ isOpen: false, sessionId: null })}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative w-full max-w-md bg-[#0c0c0e] border border-white/10 rounded-[2.5rem] p-10 shadow-[0_50px_100px_rgba(0,0,0,1)] overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-red-500/10 blur-[60px] rounded-full pointer-events-none" />
              
              <div className="relative z-10 text-center space-y-8">
                <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500 shadow-2xl">
                   <Trash2 size={32} />
                </div>
                
                <div className="space-y-3">
                   <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Delete Chat?</h3>
                   <p className="text-zinc-500 font-medium leading-relaxed">
                     This conversation will be permanently removed from your history. This action <span className="text-red-400 font-bold italic">cannot be undone</span>.
                   </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <button 
                     onClick={() => setDeleteModal({ isOpen: false, sessionId: null })}
                     className="px-8 py-5 rounded-2xl bg-white/5 border border-white/5 text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all active:scale-95"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={confirmDeleteSession}
                     className="px-8 py-5 rounded-2xl bg-red-500 text-white font-black text-[10px] uppercase tracking-widest shadow-[0_15px_40px_-10px_rgba(239,68,68,0.5)] hover:bg-red-400 transition-all active:scale-95"
                   >
                     Confirm Delete
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* --- Clear Chat Confirmation Modal --- */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowClearConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative w-full max-w-md bg-[#0c0c0e] border border-white/10 rounded-[2.5rem] p-10 shadow-[0_50px_100px_rgba(0,0,0,1)] overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-red-500/10 blur-[60px] rounded-full pointer-events-none" />
              
              <div className="relative z-10 text-center space-y-8">
                <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500 shadow-2xl">
                   <RefreshCw size={32} />
                </div>
                
                <div className="space-y-3">
                   <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Clear Chat?</h3>
                   <p className="text-zinc-500 font-medium leading-relaxed">
                     This will remove all messages from the current view. This action <span className="text-red-400 font-bold italic">cannot be undone</span>.
                   </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <button 
                     onClick={() => setShowClearConfirm(false)}
                     className="px-8 py-5 rounded-2xl bg-white/5 border border-white/5 text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all active:scale-95"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={() => {
                        setMessages([]);
                        setShowClearConfirm(false);
                        toast("Chat cleared successfully", "success");
                     }}
                     className="px-8 py-5 rounded-2xl bg-red-500 text-white font-black text-[10px] uppercase tracking-widest shadow-[0_15px_40px_-10px_rgba(239,68,68,0.5)] hover:bg-red-400 transition-all active:scale-95"
                   >
                     Confirm Clear
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
