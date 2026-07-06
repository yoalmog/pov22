import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings2, RotateCw, Activity, Zap, Grid, Circle } from 'lucide-react';

interface Props {
  onUpdate: (category: string, value: any) => void;
  config: any;
  telemetry: any;
}

export const CalibrationPanel: React.FC<Props> = ({ onUpdate, config, telemetry }) => {
  const [activePattern, setActivePattern] = useState('none');

  const patterns = [
    { id: 'grid', label: 'Alignment Grid', icon: <Grid className="w-4 h-4" /> },
    { id: 'circle', label: 'Concentric Circles', icon: <Circle className="w-4 h-4" /> },
    { id: 'sync', label: 'RPM Sync Check', icon: <Activity className="w-4 h-4" /> },
    { id: 'bars', label: 'Gamma Bars', icon: <Zap className="w-4 h-4" /> }
  ];

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Real-time Sync Diagnostics */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-[#38bdf8]" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Sync Diagnostics</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-black/40 rounded-xl border border-slate-800/50">
            <span className="text-[10px] text-slate-500 uppercase block mb-1">State</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${telemetry?.sync ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 animate-pulse'}`}></div>
              <span className="text-sm font-mono font-bold text-white uppercase">{telemetry?.sync ? 'Locked' : 'Searching'}</span>
            </div>
          </div>
          <div className="p-3 bg-black/40 rounded-xl border border-slate-800/50">
            <span className="text-[10px] text-slate-500 uppercase block mb-1">Jitter</span>
            <span className="text-sm font-mono font-bold text-white">{telemetry?.jitter || '0.2'}ms</span>
          </div>
        </div>
      </div>

      {/* Alignment Controls */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-6">
          <RotateCw className="w-4 h-4 text-[#fbbf24]" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Rotational Alignment</h3>
        </div>

        <div className="space-y-8">
          <SliderControl 
            label="Phase Offset (Arm B)" 
            value={config?.phaseOffset || 180} 
            min={170} 
            max={190} 
            step={0.1}
            unit="°"
            onChange={(v: number) => onUpdate('phaseOffset', v)}
          />
          <SliderControl 
            label="Angular Correction" 
            value={config?.angularCorrection || 0} 
            min={-10} 
            max={10} 
            step={0.05}
            unit="°"
            onChange={(v: number) => onUpdate('angularCorrection', v)}
          />
          <SliderControl 
            label="Gamma Correction" 
            value={config?.gamma || 2.2} 
            min={1.0} 
            max={3.0} 
            step={0.1}
            unit=""
            onChange={(v: number) => onUpdate('gamma', v)}
          />
        </div>
      </div>

      {/* Diagnostic Patterns */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Diagnostic Patterns</h3>
        <div className="grid grid-cols-2 gap-3">
          {patterns.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActivePattern(p.id);
                onUpdate('pattern', p.id);
              }}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                activePattern === p.id 
                  ? 'bg-[#38bdf8]/10 border-[#38bdf8] text-[#38bdf8]' 
                  : 'bg-black/20 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {p.icon}
              <span className="text-xs font-bold">{p.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const SliderControl = ({ label, value, min, max, step, unit, onChange }: any) => (
  <div className="relative">
    <div className="flex justify-between items-center mb-4">
      <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{label}</label>
      <span className="text-xs font-mono font-bold text-[#38bdf8] bg-[#38bdf8]/10 px-2 py-0.5 rounded border border-[#38bdf8]/20">
        {value}{unit}
      </span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step} 
      value={value} 
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#38bdf8]"
    />
    <div className="flex justify-between mt-2">
      <span className="text-[9px] text-slate-600 font-mono">{min}{unit}</span>
      <span className="text-[9px] text-slate-600 font-mono">{max}{unit}</span>
    </div>
  </div>
);
