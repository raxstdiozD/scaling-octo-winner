"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  User, 
  Briefcase, 
  GraduationCap, 
  Wrench, 
  Plus, 
  Trash2, 
  Download, 
  Eye, 
  Layout, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  Settings,
  Mail,
  Phone,
  MapPin,
  Globe,
  PlusCircle,
  GripVertical,
  Zap,
  CheckCircle2,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePro } from "@/hooks/usePro";

interface Experience {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  period: string;
}

interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    summary: string;
  };
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: { id: string; name: string; description: string; link: string }[];
}

const INITIAL_DATA: ResumeData = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    summary: "",
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
};

const TEMPLATES = [
  { id: "modern", name: "Modern Minimal", color: "bg-zinc-900" },
  { id: "executive", name: "Executive Pro", color: "bg-blue-900" },
  { id: "creative", name: "Creative Bold", color: "bg-violet-900" },
  { id: "classic", name: "Classic ATS", color: "bg-slate-700" },
];

export function ResumeBuilder() {
  const { isPro } = usePro();
  const [data, setData] = useState<ResumeData>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<"content" | "design" | "preview">("content");
  const [activeSection, setActiveSection] = useState<"personal" | "experience" | "education" | "skills" | "projects">("personal");
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [accentColor, setAccentColor] = useState("#7c3aed");
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const updatePersonalInfo = (field: keyof ResumeData["personalInfo"], value: string) => {
    setData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const addExperience = () => {
    const newExp: Experience = { id: Math.random().toString(36).substr(2, 9), company: "", role: "", period: "", description: "" };
    setData(prev => ({ ...prev, experience: [...prev.experience, newExp] }));
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    setData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
    }));
  };

  const removeExperience = (id: string) => {
    setData(prev => ({ ...prev, experience: prev.experience.filter(exp => exp.id !== id) }));
  };

  const addEducation = () => {
    const newEdu: Education = { id: Math.random().toString(36).substr(2, 9), school: "", degree: "", period: "" };
    setData(prev => ({ ...prev, education: [...prev.education, newEdu] }));
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setData(prev => ({
      ...prev,
      education: prev.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu)
    }));
  };

  const removeEducation = (id: string) => {
    setData(prev => ({ ...prev, education: prev.education.filter(edu => edu.id !== id) }));
  };

  const addProject = () => {
    const newProj = { id: Math.random().toString(36).substr(2, 9), name: "", description: "", link: "" };
    setData(prev => ({ ...prev, projects: [...prev.projects, newProj] }));
  };

  const updateProject = (id: string, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const removeProject = (id: string) => {
    setData(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
  };

  const addSkill = (skill: string) => {
    if (!skill || data.skills.includes(skill)) return;
    setData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
  };

  const removeSkill = (skill: string) => {
    setData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const handleSave = () => {
    localStorage.setItem("resume_data", JSON.stringify({ data, selectedTemplate, accentColor }));
    alert("Progress saved to local storage!");
  };

  useEffect(() => {
    const saved = localStorage.getItem("resume_data");
    if (saved) {
      try {
        const { data: savedData, selectedTemplate: tpl, accentColor: clr } = JSON.parse(saved);
        setData(savedData);
        setSelectedTemplate(tpl);
        setAccentColor(clr);
      } catch (e) {
        console.error("Failed to load saved resume", e);
      }
    }
  }, []);

  const formatBullets = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      const cleanLine = line.replace(/^\*|\-|\d+\./, '').trim();
      if (!cleanLine) return null;
      return <li key={i} className="mb-1">{cleanLine}</li>;
    });
  };

  const generateWithAI = async (section: string, role: string, context: string, id?: string) => {
    setIsGenerating(id || section);
    try {
      const response = await fetch("/api/tools/ai/resume-suggest", {
        method: "POST",
        body: JSON.stringify({ section, role, context }),
      });
      const result = await response.json();
      if (result.success) {
        if (section === "summary") {
          updatePersonalInfo("summary", result.suggestion);
        } else if (section === "experience" && id) {
          updateExperience(id, "description", result.suggestion);
        } else if (section === "skills") {
          // AI might return conversational text, try to extract comma-separated list
          const text = result.suggestion;
          
          const forbiddenPhrases = ["here are", "provide some", "based on", "note that", "specific skills", "professional suggestions", "i'll provide"];
          
          const newSkills = text
            .split(/[,\n]/)
            .map((s: string) => s.trim().replace(/^[\d\.\-\*]+/, '').trim())
            .filter((s: string) => {
              const lower = s.toLowerCase();
              return s.length > 0 && 
                     s.length < 35 && 
                     !forbiddenPhrases.some(phrase => lower.includes(phrase)) &&
                     !s.includes('.') && // No sentences
                     s.split(' ').length <= 4; // Max 4 words per skill
            });
          
          setData(prev => ({ ...prev, skills: [...new Set([...prev.skills, ...newSkills])] }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(null);
    }
  };

  // Client-side check for react-pdf to prevent SSR issues
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [PDFRenderer, setPDFRenderer] = useState<any>(null);
  const [ResumePDF, setResumePDF] = useState<any>(null);

  useEffect(() => {
    if (isClient) {
      import('./ResumePDF').then(mod => setResumePDF(() => mod.default));
      import('@react-pdf/renderer').then(mod => setPDFRenderer(mod));
    }
  }, [isClient]);

  const handleExport = async () => {
    if (!ResumePDF || !PDFRenderer) return;
    
    try {
      setIsGenerating('exporting');
      const blob = await PDFRenderer.pdf(<ResumePDF data={data} accentColor={accentColor} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(data.personalInfo.fullName || 'BMR').replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsGenerating(null);
    }
  };

  const handleExportPDF = () => {};

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 pb-32 h-[calc(100vh-100px)] flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
        
        <div className="lg:col-span-5 flex flex-col h-full space-y-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-4 backdrop-blur-3xl flex items-center justify-between no-print">
            <div className="flex items-center gap-2 px-2">
               <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-violet-500 border-2 border-black flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest ml-4">Resume Studio</span>
            </div>
            
            <div className="flex bg-black/40 p-1 rounded-2xl gap-1 no-print">
               <button onClick={handleSave} className="p-2.5 rounded-xl text-zinc-500 hover:text-emerald-400 transition-all group relative">
                  <CheckCircle2 className="w-4 h-4" />
               </button>
               <div className="w-[1px] h-4 bg-white/10 self-center mx-1" />
               {[
                 { id: "content", icon: User },
                 { id: "design", icon: Layout },
                 { id: "preview", icon: Eye }
               ].map((tab) => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={cn(
                     "p-2.5 rounded-xl transition-all",
                     activeTab === tab.id ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"
                   )}
                 >
                   <tab.icon className="w-4 h-4" />
                 </button>
               ))}
            </div>
          </div>

          <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col backdrop-blur-3xl shadow-4xl">
            {activeTab === "content" && (
              <div className="flex h-full">
                <div className="w-20 border-r border-white/5 flex flex-col items-center py-8 gap-6 bg-black/20">
                   {[
                     { id: "personal", icon: User },
                     { id: "experience", icon: Briefcase },
                     { id: "education", icon: GraduationCap },
                     { id: "skills", icon: Wrench },
                     { id: "projects", icon: Trophy }
                   ].map((sec) => (
                     <button
                       key={sec.id}
                       onClick={() => setActiveSection(sec.id as any)}
                       className={cn(
                         "p-3 rounded-2xl transition-all relative group",
                         activeSection === sec.id ? "bg-violet-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.3)]" : "text-zinc-600 hover:text-zinc-300"
                       )}
                     >
                       <sec.icon className="w-5 h-5" />
                     </button>
                   ))}
                </div>

                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                   <AnimatePresence mode="wait">
                      {activeSection === "personal" && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                           <h4 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500 mb-8">Personal Details</h4>
                           <div className="grid grid-cols-1 gap-4">
                              <input 
                                type="text" 
                                placeholder="Full Name" 
                                value={data.personalInfo.fullName}
                                onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm focus:outline-none focus:border-violet-500/50 transition-all"
                              />
                              <div className="grid grid-cols-2 gap-4">
                                <input 
                                  type="email" 
                                  placeholder="Email Address" 
                                  value={data.personalInfo.email}
                                  onChange={(e) => updatePersonalInfo("email", e.target.value)}
                                  className="bg-white/5 border border-white/5 rounded-2xl p-4 text-sm focus:outline-none"
                                />
                                <input 
                                  type="text" 
                                  placeholder="Phone" 
                                  value={data.personalInfo.phone}
                                  onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                                  className="bg-white/5 border border-white/5 rounded-2xl p-4 text-sm focus:outline-none"
                                />
                              </div>
                              <div className="relative group">
                                <textarea 
                                  placeholder="Professional Summary" 
                                  value={data.personalInfo.summary}
                                  onChange={(e) => updatePersonalInfo("summary", e.target.value)}
                                  className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm min-h-[140px] focus:outline-none resize-none"
                                />
                                <button 
                                  onClick={() => generateWithAI("summary", data.personalInfo.fullName, data.personalInfo.summary)}
                                  className="absolute top-4 right-4 p-2 rounded-xl bg-violet-600 text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                >
                                  {isGenerating === "summary" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                </button>
                              </div>
                           </div>
                        </motion.div>
                      )}

                      {activeSection === "experience" && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                           <div className="flex items-center justify-between mb-8">
                             <h4 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500">Work Experience</h4>
                             <button onClick={addExperience} className="p-2 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all border border-white/5">
                                <Plus className="w-4 h-4" />
                             </button>
                           </div>
                           
                           {data.experience.map((exp: any) => (
                             <div key={exp.id} className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4 relative group">
                               <button onClick={() => removeExperience(exp.id)} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500/20 text-red-500 border border-red-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                  <Trash2 className="w-4 h-4" />
                               </button>
                               <div className="grid grid-cols-2 gap-4">
                                  <input 
                                    placeholder="Company" 
                                    value={exp.company} 
                                    onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                                    className="bg-black/20 border border-white/5 rounded-xl p-3 text-sm focus:outline-none"
                                  />
                                  <input 
                                    placeholder="Role" 
                                    value={exp.role} 
                                    onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                                    className="bg-black/20 border border-white/5 rounded-xl p-3 text-sm focus:outline-none"
                                  />
                               </div>
                               <input 
                                 placeholder="Period (e.g. 2020 - Present)" 
                                 value={exp.period} 
                                 onChange={(e) => updateExperience(exp.id, "period", e.target.value)}
                                 className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm focus:outline-none"
                               />
                               <div className="relative group/desc">
                                 <textarea 
                                   placeholder="Description & Achievements" 
                                   value={exp.description} 
                                   onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                                   className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm min-h-[100px] focus:outline-none resize-none"
                                 />
                                 <button 
                                   onClick={() => generateWithAI("experience", exp.role, exp.company, exp.id)}
                                   className="absolute top-3 right-3 p-2 rounded-xl bg-violet-600 text-white opacity-0 group-hover/desc:opacity-100 transition-all shadow-lg"
                                 >
                                   {isGenerating === exp.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                 </button>
                               </div>
                             </div>
                           ))}
                        </motion.div>
                      )}

                      {activeSection === "education" && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                           <div className="flex items-center justify-between mb-8">
                             <h4 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500">Education</h4>
                             <button onClick={addEducation} className="p-2 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all border border-white/5">
                                <Plus className="w-4 h-4" />
                             </button>
                           </div>
                           
                           {data.education.map((edu: any) => (
                             <div key={edu.id} className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4 relative group">
                               <button onClick={() => removeEducation(edu.id)} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500/20 text-red-500 border border-red-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                  <Trash2 className="w-4 h-4" />
                               </button>
                               <input 
                                 placeholder="School / University" 
                                 value={edu.school} 
                                 onChange={(e) => updateEducation(edu.id, "school", e.target.value)}
                                 className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm focus:outline-none"
                               />
                               <div className="grid grid-cols-2 gap-4">
                                  <input 
                                    placeholder="Degree" 
                                    value={edu.degree} 
                                    onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                                    className="bg-black/20 border border-white/5 rounded-xl p-3 text-sm focus:outline-none"
                                  />
                                  <input 
                                    placeholder="Period" 
                                    value={edu.period} 
                                    onChange={(e) => updateEducation(edu.id, "period", e.target.value)}
                                    className="bg-black/20 border border-white/5 rounded-xl p-3 text-sm focus:outline-none"
                                  />
                               </div>
                             </div>
                           ))}
                        </motion.div>
                      )}

                      {activeSection === "skills" && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                           <h4 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500 mb-8">Skills & Expertise</h4>
                           <div className="relative group mb-8">
                             <input 
                               type="text" 
                               placeholder="Type a skill and press Enter..." 
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') {
                                   addSkill(e.currentTarget.value);
                                   e.currentTarget.value = '';
                                 }
                               }}
                               className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm focus:outline-none pr-12"
                             />
                             <button 
                               onClick={() => generateWithAI("skills", data.personalInfo.fullName, data.skills.join(', '))}
                               className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-violet-600 text-white shadow-lg"
                             >
                               {isGenerating === "skills" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                             </button>
                           </div>
                           <div className="flex flex-wrap gap-2">
                              {data.skills.map((skill, i) => (
                                <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 group hover:border-violet-500/50 transition-all cursor-default">
                                   <span className="text-[10px] font-black uppercase tracking-widest">{skill}</span>
                                   <button onClick={() => removeSkill(skill)} className="text-zinc-600 hover:text-red-400">
                                      <X className="w-3 h-3" />
                                   </button>
                                </div>
                              ))}
                           </div>
                        </motion.div>
                      )}

                      {activeSection === "projects" && (
                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                           <div className="flex items-center justify-between mb-8">
                             <h4 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500">Notable Projects</h4>
                             <button onClick={addProject} className="p-2 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all border border-white/5">
                                <Plus className="w-4 h-4" />
                             </button>
                           </div>
                           
                           {data.projects.map((proj: any) => (
                             <div key={proj.id} className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4 relative group">
                               <button onClick={() => removeProject(proj.id)} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500/20 text-red-500 border border-red-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                  <Trash2 className="w-4 h-4" />
                               </button>
                               <div className="grid grid-cols-2 gap-4">
                                  <input 
                                    placeholder="Project Name" 
                                    value={proj.name} 
                                    onChange={(e) => updateProject(proj.id, "name", e.target.value)}
                                    className="bg-black/20 border border-white/5 rounded-xl p-3 text-sm focus:outline-none"
                                  />
                                  <input 
                                    placeholder="Role / Title" 
                                    value={proj.role} 
                                    onChange={(e) => updateProject(proj.id, "role", e.target.value)}
                                    className="bg-black/20 border border-white/5 rounded-xl p-3 text-sm focus:outline-none"
                                  />
                               </div>
                               <input 
                                 placeholder="Project Link (Optional)" 
                                 value={proj.link} 
                                 onChange={(e) => updateProject(proj.id, "link", e.target.value)}
                                 className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm focus:outline-none"
                               />
                               <textarea 
                                 placeholder="Description" 
                                 value={proj.description} 
                                 onChange={(e) => updateProject(proj.id, "description", e.target.value)}
                                 className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-sm min-h-[80px] focus:outline-none resize-none"
                               />
                             </div>
                           ))}
                        </motion.div>
                      )}
                   </AnimatePresence>
                </div>
              </div>
            )}

            {activeTab === "design" && (
              <div className="p-8 space-y-12">
                 <div>
                    <h4 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500 mb-8">Templates</h4>
                    <div className="grid grid-cols-2 gap-4">
                       {templates.map(tpl => (
                         <button 
                           key={tpl.id}
                           onClick={() => setSelectedTemplate(tpl.id)}
                           className={cn(
                             "group relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all",
                             selectedTemplate === tpl.id ? "border-violet-600 shadow-[0_0_30px_rgba(124,58,237,0.3)]" : "border-white/5 hover:border-white/20"
                           )}
                         >
                            <img src={tpl.preview} alt={tpl.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                            <span className="absolute bottom-4 left-4 text-[10px] font-black uppercase tracking-widest text-white">{tpl.name}</span>
                         </button>
                       ))}
                    </div>
                 </div>

                 <div>
                    <h4 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500 mb-8">Accent Color</h4>
                    <div className="flex flex-wrap gap-4">
                       {colors.map(color => (
                         <button 
                           key={color}
                           onClick={() => setAccentColor(color)}
                           className={cn(
                             "w-10 h-10 rounded-2xl transition-all hover:scale-110 active:scale-95",
                             accentColor === color ? "ring-2 ring-white ring-offset-4 ring-offset-black" : "opacity-60 hover:opacity-100"
                           )}
                           style={{ backgroundColor: color }}
                         />
                       ))}
                    </div>
                 </div>
              </div>
            )}
          </div>

          <button 
             onClick={handleExport}
             disabled={!isClient || !ResumePDF || !PDFRenderer || isGenerating === 'exporting'}
             className="w-full h-20 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl group disabled:opacity-50 no-print"
          >
             {isGenerating === 'exporting' ? (
               <>
                 <RefreshCw className="w-5 h-5 animate-spin" />
                 Generating CV...
               </>
             ) : (!isClient || !ResumePDF || !PDFRenderer) ? (
               <>
                 <RefreshCw className="w-5 h-5 animate-spin" />
                 Initializing...
               </>
             ) : (
               <>
                 <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                 Download PDF
               </>
             )}
          </button>
        </div>

        <div className="lg:col-span-7 h-full bg-[#121214] rounded-[3.5rem] border border-white/10 shadow-4xl overflow-hidden relative flex flex-col group">
           <div className="absolute top-6 right-8 z-30 pointer-events-none no-print">
              <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/5 text-[8px] font-black uppercase tracking-[0.2em] text-violet-400/60 flex items-center gap-2">
                 <div className="w-1 h-1 rounded-full bg-violet-500/50 animate-pulse" />
                  Synced
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed" id="resume-content-wrapper">
             <div 
               id="resume-content"
               className={cn(
                 "bg-white shadow-2xl mx-auto origin-top transition-all duration-500 relative p-16 space-y-12 text-black",
                 selectedTemplate === "creative" ? "font-sans" : "font-serif",
                 selectedTemplate === "modern" && "p-20"
               )}
               style={{ 
                 width: '100%', 
                 maxWidth: '800px', 
                 minHeight: '1122px', 
                 padding: '2.5cm',
                 transform: activeTab === 'design' ? 'scale(0.95)' : 'scale(1)'
               }}
             >
               {/* Accent Top Bar */}
               <div className="absolute top-0 left-0 right-0 h-2" style={{ backgroundColor: accentColor }} />

               {/* Header Section */}
               <header className="mb-12 border-b-2 border-zinc-100 pb-8">
                 <h1 className="text-6xl font-black uppercase tracking-tighter mb-4 text-black leading-[0.9]">
                    {data.personalInfo.fullName.split(' ').map((word: string, i: number) => (
                      <span key={i} style={{ color: i === 0 ? accentColor : 'inherit' }} className="block">{word}</span>
                    ))}
                 </h1>
                 <div className="flex flex-wrap gap-x-8 gap-y-2">
                    {data.personalInfo.email && (
                      <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                         <Mail className="w-3 h-3" style={{ color: accentColor }} />
                         {data.personalInfo.email}
                      </div>
                    )}
                    {data.personalInfo.phone && (
                      <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                         <Phone className="w-3 h-3" style={{ color: accentColor }} />
                         {data.personalInfo.phone}
                      </div>
                    )}
                 </div>
               </header>

               {/* Professional Summary */}
                    {data.personalInfo.summary && (
                      <section className="space-y-4">
                         <h2 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-400" style={{ color: selectedTemplate === "creative" ? accentColor : '' }}>Professional Profile</h2>
                         <p className={cn(
                           "text-[15px] leading-relaxed text-zinc-800 font-medium",
                           selectedTemplate === "modern" ? "italic" : ""
                         )}>
                           {data.personalInfo.summary}
                         </p>
                      </section>
                    )}

                    {/* Experience */}
                    {data.experience.length > 0 && (
                      <section className="space-y-8">
                         <h2 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-400" style={{ color: selectedTemplate === "creative" ? accentColor : '' }}>Employment History</h2>
                         <div className="space-y-12">
                            {data.experience.map((exp) => (
                              <div key={exp.id} className="group/item relative pl-8 border-l-2 transition-colors" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                                 <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-zinc-200 transition-all" style={{ borderColor: accentColor }} />
                                 <div className="flex justify-between items-baseline mb-2">
                                    <h3 className="font-black text-xl tracking-tight uppercase">{exp.company || "Company"}</h3>
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{exp.period}</span>
                                 </div>
                                 <p className="text-sm font-black uppercase tracking-[0.2em] mb-4" style={{ color: accentColor }}>{exp.role || "Role"}</p>
                                 <div className="text-[14px] text-zinc-700 leading-relaxed font-medium">
                                   <ul className="list-disc list-inside space-y-1">
                                      {formatBullets(exp.description)}
                                   </ul>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </section>
                    )}

                    {/* Education */}
                    {data.education.length > 0 && (
                      <section className="space-y-6">
                         <h2 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-400" style={{ color: selectedTemplate === "creative" ? accentColor : '' }}>Education</h2>
                         <div className="grid grid-cols-1 gap-6">
                            {data.education.map((edu) => (
                              <div key={edu.id} className="flex justify-between items-baseline">
                                 <div>
                                    <h3 className="font-bold text-lg">{edu.school || "University"}</h3>
                                    <p className="text-sm font-medium text-zinc-600 uppercase tracking-wide">{edu.degree || "Degree"}</p>
                                 </div>
                                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{edu.period}</span>
                              </div>
                            ))}
                         </div>
                      </section>
                    )}

                    {/* Skills */}
                    {data.skills.length > 0 && (
                      <section className="space-y-4">
                         <h2 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-400" style={{ color: selectedTemplate === "creative" ? accentColor : '' }}>Core Competencies</h2>
                         <div className="flex flex-wrap gap-2">
                            {data.skills.map((skill) => (
                              <span key={skill} className="px-3 py-1 bg-zinc-100 rounded text-[11px] font-bold text-zinc-800 uppercase tracking-tight">
                                 {skill}
                              </span>
                            ))}
                         </div>
                      </section>
                    )}

                    {/* Projects */}
                    {data.projects.length > 0 && (
                      <section className="space-y-6">
                         <h2 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-400" style={{ color: selectedTemplate === "creative" ? accentColor : '' }}>Key Projects</h2>
                         <div className="grid grid-cols-1 gap-8">
                            {data.projects.map((proj) => (
                              <div key={proj.id} className="space-y-2 group/proj relative">
                                 <div className="flex justify-between items-center">
                                    <h3 className="font-black text-xl tracking-tight uppercase leading-none">{proj.name || "Project Name"}</h3>
                                    {proj.link && (
                                      <div className="px-3 py-1 bg-zinc-100 rounded-full flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:bg-black hover:text-white transition-all cursor-pointer">
                                         <Globe size={10} />
                                         {proj.link.replace(/^https?:\/\//, '')}
                                      </div>
                                    )}
                                 </div>
                                 <p className="text-[14px] text-zinc-600 leading-relaxed font-medium pt-1">
                                   {proj.description}
                                 </p>
                              </div>
                            ))}
                         </div>
                      </section>
                    )}
                 </div>
              </div>
            </div>

           <style jsx global>{`
              @media print {
                /* Hide everything */
                body * {
                  visibility: hidden !important;
                  display: none !important;
                }
                
                /* Show ONLY the resume content and its specific parents */
                #resume-content, #resume-content * {
                  visibility: visible !important;
                  display: block !important;
                }

                /* Re-enable the lineage for visibility pass-through */
                html, body, main, #__next, 
                #resume-content-wrapper, 
                div:has(> #resume-content),
                .lg\\:col-span-7 {
                  visibility: visible !important;
                  display: block !important;
                  background: white !important;
                  height: auto !important;
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow: visible !important;
                  border: none !important;
                  box-shadow: none !important;
                  position: static !important;
                }

                #resume-content {
                  width: 100% !important;
                  padding: 1.5cm !important;
                  position: relative !important;
                }

                #resume-content * {
                  -webkit-print-color-adjust: exact;
                }

                @page {
                  margin: 0;
                  size: auto;
                }
              }
           `}</style>
        </div>
      </div>
  );
}

function RefreshCw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}
