import React, { useEffect, useState, useMemo } from "react";
import { Activity, Cpu, Lightbulb, RotateCcw, Wifi, Thermometer, Zap, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export function HardwareHealth({ 
  apiUrl = "/status", 
  externalData = null,
  powerLimits = { currentLimit: 5.0, tempWarning: 45 }
}: { 
  apiUrl?: string;
  externalData?: any;
  powerLimits?: { currentLimit: number; tempWarning: number };
}) {
  const [internalHealthData, setInternalHealthData] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  // Use external data if provided, otherwise use internal polling
  const healthData = externalData || internalHealthData;

  useEffect(() => {
    if (healthData) {
      setHistory(prev => {
        const newData = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          current: healthData.current !== undefined ? healthData.current : (Math.random() * 2 + 1), // Mock if missing for demo
          temp: healthData.temp !== undefined ? healthData.temp : (30 + Math.random() * 10), // Mock if missing for demo
        };
        const updated = [...prev, newData];
        if (updated.length > 20) return updated.slice(updated.length - 20);
        return updated;
      });
    }
  }, [healthData]);

  useEffect(() => {
    if (!isPolling || externalData) return;

    const fetchHealth = async () => {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(id);
        if (res.ok) {
          const data = await res.json();
          setInternalHealthData(data);
        }
      } catch (err) {
        // Silent fail on polling to avoid jitter
        setInternalHealthData(null);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 3000);
    return () => clearInterval(interval);
  }, [isPolling, apiUrl, externalData]);

  const currentVal = healthData?.current !== undefined ? healthData.current : (history.length > 0 ? history[history.length - 1].current : 0);
  const tempVal = healthData?.temp !== undefined ? healthData.temp : (history.length > 0 ? history[history.length - 1].temp : 0);

  const isTempCritical = tempVal >= powerLimits.tempWarning;
  const isCurrentCritical = currentVal >= powerLimits.currentLimit;

  const getActivityColor = (status: string) => {
    switch (status) {
      case "ok":
      case "ready": 
      case "healthy": return "text-emerald-400";
      case "warning": return "text-amber-400";
      case "error": return "text-red-500";
      default: return "text-slate-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ok":
      case "ready":
      case "healthy": return "OK";
      case "warning": return "WARN";
      case "error": return "ERR";
      default: return "N/A";
    }
  };

  const hallStatus = healthData ? (healthData.rpm !== undefined ? "ok" : "unknown") : "unknown";
  const ledStatus = healthData ? (healthData.sync ? "calibrated" : "ok") : "unknown";
  const motorStatus = healthData ? (healthData.status === "ready" || healthData.rpm > 0 ? "ok" : "unknown") : "unknown";
  const rssi = healthData?.rssi;

  const getRssiColor = (val: number) => {
    if (val > -60) return "text-emerald-400";
    if (val > -80) return "text-amber-400";
    return "text-red-500";
  };

  return (
    <div className="w-full bg-[#050608] border border-slate-800 rounded-2xl p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center mb-1">
        <h4 className="text-white text-xs font-bold tracking-widest uppercase flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#a855f7]" />
          System Telemetry
        </h4>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${healthData ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-600'} animate-pulse`} />
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">{healthData ? 'Live' : 'Waiting'}</span>
        </div>
      </div>

      {/* Critical Alerts */}
      {(isTempCritical || isCurrentCritical) && (
        <div className="bg-red-500/10 border border-red-500/30 p-2 rounded-xl flex items-center gap-3 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <div className="flex-1">
            <p className="text-[10px] font-black text-red-500 uppercase tracking-tighter leading-none mb-1">CRITICAL THRESHOLD REACHED</p>
            <p className="text-[9px] text-red-400/80 leading-none">
              {isTempCritical && `Temp: ${tempVal.toFixed(1)}°C (Limit: ${powerLimits.tempWarning}°C)`}
              {isTempCritical && isCurrentCritical && " | "}
              {isCurrentCritical && `Current: ${currentVal.toFixed(2)}A (Limit: ${powerLimits.currentLimit}A)`}
            </p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Hall Sensor */}
        <div className="bg-[#0b0d14] rounded-xl p-3 border border-slate-800/80 flex flex-col items-center justify-center gap-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-1">
             <div className={`w-1.5 h-1.5 rounded-full ${hallStatus === 'ok' ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-slate-600'}`}></div>
          </div>
          <Activity className={`w-6 h-6 ${getActivityColor(hallStatus)}`} />
          <div className="text-center">
            <div className="text-[10px] font-bold text-white uppercase tracking-widest">Hall Sensor</div>
            <div className={`text-[9px] font-mono mt-0.5 ${getActivityColor(hallStatus)}`}>{getStatusText(hallStatus)}</div>
          </div>
        </div>

        {/* Leds */}
        <div className="bg-[#0b0d14] rounded-xl p-3 border border-slate-800/80 flex flex-col items-center justify-center gap-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-1">
             <div className={`w-1.5 h-1.5 rounded-full ${ledStatus === 'ok' || ledStatus === 'calibrated' ? 'bg-[#00b4d8] shadow-[0_0_5px_#00b4d8]' : 'bg-slate-600'}`}></div>
          </div>
          <Lightbulb className={`w-6 h-6 ${getActivityColor(ledStatus)}`} />
          <div className="text-center">
            <div className="text-[10px] font-bold text-white uppercase tracking-widest">LED Strip</div>
            <div className={`text-[9px] font-mono mt-0.5 ${getActivityColor(ledStatus)}`}>{getStatusText(ledStatus)}</div>
          </div>
        </div>

        {/* Motor */}
        <div className="bg-[#0b0d14] rounded-xl p-3 border border-slate-800/80 flex flex-col items-center justify-center gap-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-1">
             <div className={`w-1.5 h-1.5 rounded-full ${motorStatus === 'ok' ? 'bg-[#a855f7] shadow-[0_0_5px_#a855f7]' : 'bg-slate-600'}`}></div>
          </div>
          <RotateCcw className={`w-6 h-6 ${getActivityColor(motorStatus)}`} />
          <div className="text-center">
            <div className="text-[10px] font-bold text-white uppercase tracking-widest">Motor</div>
            <div className={`text-[9px] font-mono mt-0.5 ${getActivityColor(motorStatus)}`}>{getStatusText(motorStatus)}</div>
          </div>
        </div>

        {/* WiFi RSSI */}
        <div className="bg-[#0b0d14] rounded-xl p-3 border border-slate-800/80 flex flex-col items-center justify-center gap-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-1 flex gap-0.5 items-end h-2">
             {[1, 2, 3, 4].map(i => (
               <div key={i} className={`w-0.5 rounded-full ${rssi !== undefined && rssi > -100 && (rssi > -90 + i*10) ? 'bg-sky-400' : 'bg-slate-800'}`} style={{ height: `${i*25}%` }}></div>
             ))}
          </div>
          <Wifi className={`w-6 h-6 ${rssi !== undefined ? getRssiColor(rssi) : 'text-slate-700'}`} />
          <div className="text-center">
            <div className="text-[10px] font-bold text-white uppercase tracking-widest">Signal</div>
            <div className={`text-[9px] font-mono mt-0.5 ${rssi !== undefined ? getRssiColor(rssi) : 'text-slate-600'}`}>
              {rssi !== undefined && rssi > -100 ? `${rssi} dBm` : 'OFF'}
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-32 mt-2">
        <div className="bg-[#0b0d14] rounded-xl border border-slate-800/80 p-3 relative flex flex-col">
           <div className="flex justify-between items-center mb-1">
             <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
               <Zap className={`w-3 h-3 ${isCurrentCritical ? 'text-red-500' : 'text-amber-300'}`} />
               Current Draw
             </div>
             <span className={`text-[11px] font-mono ${isCurrentCritical ? 'text-red-500' : 'text-slate-300'}`}>{currentVal.toFixed(2)}A</span>
           </div>
           <div className="flex-1 min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isCurrentCritical ? "#ef4444" : "#f59e0b"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={isCurrentCritical ? "#ef4444" : "#f59e0b"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="current" stroke={isCurrentCritical ? "#ef4444" : "#f59e0b"} fillOpacity={1} fill="url(#colorCurrent)" isAnimationActive={false} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-[#0b0d14] rounded-xl border border-slate-800/80 p-3 relative flex flex-col">
           <div className="flex justify-between items-center mb-1">
             <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
               <Thermometer className={`w-3 h-3 ${isTempCritical ? 'text-red-500' : 'text-emerald-400'}`} />
               Core Temperature
             </div>
             <span className={`text-[11px] font-mono ${isTempCritical ? 'text-red-500' : 'text-slate-300'}`}>{tempVal.toFixed(1)}°C</span>
           </div>
           <div className="flex-1 min-h-0">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isTempCritical ? "#ef4444" : "#10b981"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={isTempCritical ? "#ef4444" : "#10b981"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="temp" stroke={isTempCritical ? "#ef4444" : "#10b981"} fillOpacity={1} fill="url(#colorTemp)" isAnimationActive={false} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
}
