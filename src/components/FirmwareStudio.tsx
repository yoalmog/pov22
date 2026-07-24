import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Code2, Play, Upload, Save, FileCode, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";

interface FirmwareStudioProps {
  onFlash: () => void;
  selectedModel: string;
}

export const FirmwareStudio: React.FC<FirmwareStudioProps> = ({ onFlash, selectedModel }) => {
  const [activeFile, setActiveFile] = useState("main.ino");
  const [inoCode, setInoCode] = useState("");
  const [hCode, setHCode] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [buildSuccess, setBuildSuccess] = useState(false);

  useEffect(() => {
    // Load initial code from project
    const loadCode = async () => {
      try {
        const inoRes = await fetch("/Holospin3D/Holospin3D.ino");
        const inoText = await inoRes.text();
        setInoCode(inoText);

        const hRes = await fetch("/Holospin3D/Config.h");
        const hText = await hRes.text();
        setHCode(hText);
      } catch (e) {
        console.error("Failed to load firmware code", e);
      }
    };
    loadCode();
  }, []);

  const handleSave = async () => {
    try {
      // Save INO (Holospin3D.ino)
      await fetch(`/api/write-file?filename=Holospin3D/Holospin3D.ino`, {
        method: "POST",
        body: inoCode
      });
      // Save Config.h
      await fetch(`/api/write-file?filename=Holospin3D/Config.h`, {
        method: "POST",
        body: hCode
      });
      setIsSaved(true);
    } catch (e) {
      alert("Failed to save files");
    }
  };

  const handleCompile = async () => {
    if (!isSaved) await handleSave();
    
    setIsCompiling(true);
    setBuildSuccess(false);
    setShowLogs(true);
    setLogs(["[STUDIO] Initializing build environment..."]);

    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel })
      });
      const data = await res.json();
      
      if (data.status === "success") {
        setLogs(prev => [...prev, ...data.logs]);
        setBuildSuccess(true);
      } else {
        setLogs(prev => [...prev, `[ERROR] ${data.error}`]);
      }
    } catch (e) {
      setLogs(prev => [...prev, "[ERROR] Compilation server unreachable."]);
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#090a10] rounded-2xl border border-slate-800/50 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0c0e15]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Code2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200 tracking-tight">FIRMWARE STUDIO</h3>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
              Target: <span className="text-indigo-400">{selectedModel || "ESP32 WROOM 32D"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleSave}
            disabled={isSaved}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${isSaved ? 'text-slate-600 bg-slate-800/50' : 'text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20'}`}
          >
            <Save className="w-3.5 h-3.5" />
            {isSaved ? "Saved" : "Save Changes"}
          </button>
          
          <button 
            onClick={handleCompile}
            disabled={isCompiling}
            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold uppercase transition-all shadow-lg shadow-indigo-500/20"
          >
            {isCompiling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            Compile
          </button>

          {buildSuccess && (
            <button 
              onClick={onFlash}
              className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase transition-all shadow-lg shadow-emerald-500/20 animate-pulse"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload to Hardware
            </button>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 bg-[#0c0e15] border-r border-slate-800/50 p-4 flex flex-col gap-2">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 block px-2">Project Files</span>
          
          <button 
            onClick={() => setActiveFile("main.ino")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeFile === "main.ino" ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <FileCode className="w-4 h-4" />
            main.ino
          </button>

          <button 
            onClick={() => setActiveFile("Config.h")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeFile === "Config.h" ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <FileCode className="w-4 h-4 text-orange-400" />
            Config.h
          </button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative flex flex-col">
          <textarea
            value={activeFile === "main.ino" ? inoCode : hCode}
            onChange={(e) => {
              if (activeFile === "main.ino") setInoCode(e.target.value);
              else setHCode(e.target.value);
              setIsSaved(false);
            }}
            spellCheck={false}
            className="w-full h-full p-6 bg-transparent text-slate-300 font-mono text-sm leading-relaxed outline-none resize-none selection:bg-indigo-500/30"
            placeholder="Write your firmware code here..."
          />

          {/* Logs Overlay */}
          <AnimatePresence>
            {showLogs && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="absolute bottom-0 left-0 w-full h-1/3 bg-[#0c0e15] border-t border-slate-800 shadow-2xl flex flex-col"
              >
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isCompiling ? 'bg-indigo-400 animate-pulse' : buildSuccess ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Build Output</span>
                  </div>
                  <button onClick={() => setShowLogs(false)} className="text-slate-500 hover:text-slate-300 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 p-4 font-mono text-[11px] overflow-y-auto text-slate-400 scrollbar-hide">
                  {logs.map((log, i) => (
                    <div key={i} className={`mb-1 ${log.includes("[ERROR]") ? 'text-rose-400' : log.includes("SUCCESS") ? 'text-emerald-400' : ''}`}>
                      {log}
                    </div>
                  ))}
                  {isCompiling && (
                    <div className="flex items-center gap-2 mt-2 text-indigo-400 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Linking assets and optimizing binary...
                    </div>
                  )}
                  <div id="log-end" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 bg-[#0c0e15]/80 border-t border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Platform:</span>
            <span className="text-[9px] text-slate-300 font-mono">Espressif 32</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Compiler:</span>
            <span className="text-[9px] text-slate-300 font-mono">GCC-9.2.1</span>
          </div>
        </div>
        <div className="text-[9px] text-slate-500 font-mono">
          {activeFile} • {(activeFile === "main.ino" ? inoCode.length : hCode.length)} bytes
        </div>
      </div>
    </div>
  );
};
