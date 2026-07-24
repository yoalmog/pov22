import * as React from "react";
import { useState } from "react";
import { Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Props {
  text: string;
  title?: string;
}

export const InfoTooltip: React.FC<Props> = ({ text, title }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-flex items-center ml-1.5 cursor-help group"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Info className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
      
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl pointer-events-none"
          >
            {title && (
              <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">
                {title}
              </div>
            )}
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              {text}
            </p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[6px] border-transparent border-t-slate-800" />
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] border-[6px] border-transparent border-t-slate-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
