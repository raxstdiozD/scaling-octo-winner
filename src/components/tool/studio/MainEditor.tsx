"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Editor, { Monaco, OnMount, DiffEditor } from "@monaco-editor/react";
import { useIdeStore } from "./store";
import { X, Code2, Sparkles, Plus, Play, Info, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function EditorTabs() {
  const { files, openFileIds, activeFileId, setActiveFileId, closeFile, toggleOpenFile } = useIdeStore();
  const openFiles = useMemo(() => files.filter(f => openFileIds.includes(f.id)), [files, openFileIds]);

  return (
    <div className="h-10 flex bg-[#0a0a0a] border-b border-white/5 overflow-x-auto no-scrollbar scroll-smooth">
      <AnimatePresence initial={false}>
        {openFiles.length === 0 ? (
          <div className="flex items-center px-4 text-[9px] font-black text-zinc-700 uppercase tracking-[0.2em] italic">
            Engine Standby
          </div>
        ) : (
          openFiles.map(file => (
            <motion.div 
              key={file.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, width: 0 }}
              onClick={() => toggleOpenFile(file.id, true)}
              className={cn(
                "flex-shrink-0 flex items-center px-4 gap-3 text-[11px] transition-all cursor-pointer border-r border-white/5 relative h-full group",
                activeFileId === file.id 
                  ? "bg-[#050505] text-white" 
                  : "text-zinc-500 hover:text-zinc-300 bg-[#0a0a0a] hover:bg-[#0d0d0d]"
              )}
            >
              {activeFileId === file.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-blue shadow-[0_0_10px_rgba(0,242,255,0.5)]" 
                />
              )}
              
              <span className="truncate max-w-[120px] font-medium tracking-tight">{file.name}</span>
              
              <button 
                onClick={(e) => { e.stopPropagation(); closeFile(file.id); }}
                className={cn(
                  "p-0.5 rounded-md transition-colors", 
                  activeFileId === file.id ? "text-zinc-500 hover:bg-white/10 hover:text-white" : "text-transparent group-hover:text-zinc-600 hover:text-white"
                )}
              >
                <X size={10} />
              </button>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}

export function MainEditor() {
  const { 
    files, 
    activeFileId, 
    updateFileContent, 
    addFile, 
    activeTab, 
    fileContents, 
    diffCode, 
    setDiffCode,
    setActiveTab 
  } = useIdeStore();
  
  const activeFile = useMemo(() => files.find(f => f.id === activeFileId), [files, activeFileId]);
  const content = activeFile ? fileContents[activeFile.id] || "" : "";
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    monaco.editor.defineTheme('antigravity', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
        { token: 'keyword', foreground: '8be9fd' },
        { token: 'identifier', foreground: 'f8f8f2' },
        { token: 'string', foreground: '50fa7b' },
      ],
      colors: {
        'editor.background': '#050505',
        'editor.foreground': '#f8f8f2',
        'editorLineNumber.foreground': '#333',
        'editorLineNumber.activeForeground': '#00f2ff',
        'editor.lineHighlightBackground': '#ffffff05',
        'editorCursor.foreground': '#00f2ff',
        'scrollbarSlider.background': '#ffffff05',
        'scrollbarSlider.hoverBackground': '#ffffff10',
        'scrollbarSlider.activeBackground': '#ffffff15',
      }
    });

    monaco.editor.setTheme('antigravity');
  };

  const handleApplyDiff = async () => {
    if (diffCode && activeFileId) {
      await updateFileContent(activeFileId, diffCode.modified);
      setDiffCode(null);
      setActiveTab('code');
    }
  };

  if (activeTab === 'preview') {
    return (
      <div className="flex-1 bg-white relative flex flex-col">
        <div className="h-10 bg-[#0a0a0a] border-b border-white/5 flex items-center px-4 gap-4 justify-between">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Live Preview Active</span>
           </div>
           <div className="flex-1 max-w-xl bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-[10px] text-zinc-500 font-mono truncate">
              https://lumoraai.online/preview
           </div>
        </div>
        <iframe src="about:blank" className="flex-1 w-full border-none bg-white" title="Studio Preview" />
      </div>
    );
  }

  if (activeTab === 'diff' && diffCode) {
    return (
      <div className="flex-1 flex flex-col bg-[#050505]">
        <div className="h-10 bg-[#0a0a0a] border-b border-white/5 flex items-center px-4 justify-between">
           <span className="text-[10px] font-black text-accent-blue uppercase tracking-widest">Review AI Changes</span>
           <div className="flex items-center gap-2">
              <button 
                onClick={() => { setDiffCode(null); setActiveTab('code'); }}
                className="px-3 py-1 rounded-lg text-[10px] font-bold text-zinc-400 hover:text-white transition-colors"
              >
                <RotateCcw size={12} className="inline mr-1" /> Discard
              </button>
              <button 
                onClick={handleApplyDiff}
                className="px-3 py-1 rounded-lg bg-accent-blue text-white text-[10px] font-bold hover:bg-accent-blue/80 transition-colors"
              >
                <Check size={12} className="inline mr-1" /> Apply Changes
              </button>
           </div>
        </div>
        <div className="flex-1">
          <DiffEditor
            original={diffCode.original}
            modified={diffCode.modified}
            language={activeFile?.language || 'typescript'}
            theme="antigravity"
            options={{
              fontSize: 13,
              fontFamily: 'JetBrains Mono, monospace',
              renderSideBySide: true,
              readOnly: true,
              minimap: { enabled: false },
              automaticLayout: true,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#050505] relative overflow-hidden">
      <EditorTabs />
      
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {activeFile ? (
            <motion.div 
              key={activeFile.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <Editor
                height="100%"
                language={activeFile.language || "typescript"}
                value={content}
                theme="antigravity"
                onMount={handleEditorDidMount}
                onChange={(value) => updateFileContent(activeFile.id, value || "")}
                options={{
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono, monospace',
                  minimap: { enabled: false },
                  scrollbar: { vertical: 'visible', horizontal: 'visible', useShadows: false, verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
                  lineNumbersMinChars: 3,
                  automaticLayout: true,
                  padding: { top: 16 },
                  wordWrap: 'on',
                }}
              />
            </motion.div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-[#050505]">
               {/* Same empty state as before but ensure functional buttons */}
               <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-4 text-center">Studio Ready</h2>
               <p className="text-zinc-600 text-sm mb-8 text-center max-w-xs font-medium">Open a file from the explorer or let the AI Agent build your next feature.</p>
               <button 
                 onClick={() => addFile({ name: 'App.tsx', type: 'file', parentId: null, language: 'typescript' }, 'export default function App() {\n  return <div>Hello World</div>\n}')}
                 className="px-6 py-3 bg-accent-blue/10 border border-accent-blue/20 text-accent-blue text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-accent-blue hover:text-white transition-all"
               >
                 Initialize Project
               </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
