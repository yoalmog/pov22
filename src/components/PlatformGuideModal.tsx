import React from 'react';
import { X, Smartphone, Globe, Cloud, Sparkles, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onClose: () => void;
}

export const PlatformGuideModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#050608]/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-[#0c0e15] border border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800/50 bg-slate-900/30">
          <div className="flex items-center gap-2 text-indigo-400 font-black tracking-widest uppercase text-sm">
            <Smartphone className="w-4 h-4" />
            Mobile Platform Guide
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex flex-col gap-2">
            <span className="text-rose-400 font-bold tracking-widest uppercase text-xs">Current Limitations</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Google Chrome's built-in <strong>Prompt API for Gemini Nano</strong> is currently only supported on Desktop operating systems (Mac, Windows, Linux, ChromeOS). It is not yet available on mobile devices (Android/iOS).
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-slate-200 font-black tracking-widest uppercase text-xs flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" /> Alternatives & Workarounds
            </h4>
            
            <div className="bg-slate-900/50 border border-slate-800/60 p-4 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-pink-400 font-bold tracking-widest uppercase text-[10px]">
                <Cloud className="w-3.5 h-3.5" /> 1. Use Cloud Gemini Engine
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                You can switch to the <strong>Cloud Gemini</strong> engine in the AI Effect Studio. This offloads the AI generation to secure Google servers via standard API endpoints, working seamlessly on mobile.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800/60 p-4 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold tracking-widest uppercase text-[10px]">
                <Cpu className="w-3.5 h-3.5" /> 2. Local NLP Semantic Compiler
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                The <strong>Local NLP</strong> engine parses natural language patterns without a heavyweight LLM. It's lightning-fast, works 100% offline, and is fully supported on mobile.
              </p>
            </div>
            
            <div className="bg-slate-900/50 border border-slate-800/60 p-4 rounded-2xl flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold tracking-widest uppercase text-[10px]">
                <Sparkles className="w-3.5 h-3.5" /> 3. WebLLM (Coming Soon)
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                We are actively developing a wrapper for browser-compatible local AI libraries like <strong>WebLLM</strong>. This will allow downloading smaller, optimized WebGPU models directly to your mobile browser as a fallback for the native Prompt API.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
