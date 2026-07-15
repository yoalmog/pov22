import React, { useEffect, useState, useMemo } from "react";
import { 
  Activity, 
  Cpu, 
  Lightbulb, 
  RotateCcw, 
  Wifi, 
  Thermometer, 
  Zap, 
  AlertTriangle, 
  FileText, 
  Download, 
  GripVertical, 
  Battery, 
  RefreshCw,
  Info
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar 
} from 'recharts';

export function HardwareHealth({ 
  apiUrl = "/status", 
  externalData = null,
  powerLimits = { currentLimit: 5.0, tempWarning: 45 },
  brightness = 128,
  motorSpeed = 50,
  isSyncEnabled = true
}: { 
  apiUrl?: string;
  externalData?: any;
  powerLimits?: { currentLimit: number; tempWarning: number };
  brightness?: number;
  motorSpeed?: number;
  isSyncEnabled?: boolean;
}) {
  const [internalHealthData, setInternalHealthData] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  // Layout order of dashboards with localStorage persistence
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem("pov_widget_order");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 3) {
          return parsed;
        }
      } catch (e) {}
    }
    return ["efficiency", "thermal", "battery"];
  });

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragEnabledId, setDragEnabledId] = useState<string | null>(null);

  // Use external data if provided, otherwise use internal polling
  const healthData = externalData || internalHealthData;

  useEffect(() => {
    if (healthData) {
      setHistory(prev => {
        const rpm = healthData.rpm !== undefined ? healthData.rpm : (Math.random() * 200 + 1000);
        const newData = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          current: healthData.current !== undefined ? healthData.current : (Math.random() * 2 + 1), // Mock if missing for demo
          temp: healthData.temp !== undefined ? healthData.temp : (30 + Math.random() * 10), // Mock if missing for demo
          voltage: healthData.voltage !== undefined ? healthData.voltage : (11.5 + Math.random() * 1.0),
          rpm: rpm,
          duty: (rpm / 3000) * 100 // Simulated duty cycle %
        };
        const updated = [...prev, newData];
        if (updated.length > 20) return updated.slice(updated.length - 20);
        return updated;
      });
    }
  }, [healthData]);

  useEffect(() => {
    if (!isPolling || externalData || !isSyncEnabled) return;
    const fetchHealth = async () => {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 2000);
        
        // Use proxy-friendly URL if on dev server
        const fetchUrl = apiUrl.includes("192.168.4.1") && window.location.hostname !== "192.168.4.1" 
          ? "/status" 
          : apiUrl;

        
        const isHttps = window.location.protocol === 'https:';
        let finalFetchUrl = fetchUrl;
        if (isHttps && fetchUrl.startsWith('http://') && !fetchUrl.includes('localhost') && !fetchUrl.includes('127.0.0.1')) {
           // We're on HTTPS and trying to hit HTTP local IP. This will fail with mixed content.
           // In AI Studio, we fallback to relative if we know it's a mock, but if it's a real IP, it just fails.
        }
        const res = await fetch(finalFetchUrl, { signal: controller.signal });
        clearTimeout(id);
        if (res.ok) {
          const data = await res.json();
          setInternalHealthData(data);
        }
      } catch (e) {
        // Silently fail if not connected
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 1000);
    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [apiUrl, isPolling, externalData, isSyncEnabled]);

  const currentVal = healthData?.current !== undefined ? healthData.current : (history.length > 0 ? history[history.length - 1].current : 0);
  const tempVal = healthData?.temp !== undefined ? healthData.temp : (history.length > 0 ? history[history.length - 1].temp : 35);
  const voltageVal = healthData?.voltage !== undefined ? healthData.voltage : (history.length > 0 ? history[history.length - 1].voltage : 11.8);
  const rpmVal = healthData?.rpm !== undefined ? healthData.rpm : (history.length > 0 ? history[history.length - 1].rpm : 0);
  
  const isTempCritical = tempVal > powerLimits.tempWarning;
  const isCurrentCritical = currentVal > powerLimits.currentLimit;

  // Battery metrics computation
  const currentDraw = (brightness / 255) * 1.5 + (motorSpeed > 0 ? 0.5 : 0) + 0.1; 
  const capacityAh = 2.0; 
  const hoursLeft = capacityAh / currentDraw;
  const battVolts = 11.1 - (currentDraw * 0.1); 
  const battPercent = Math.max(0, Math.min(100, ((battVolts - 9.6) / (12.6 - 9.6)) * 100));

  const getActivityColor = (status: string) => {
    if (status === "ok") return "text-emerald-400";
    if (status === "calibrated") return "text-[#00b4d8]";
    if (status === "error") return "text-red-500";
    return "text-slate-600";
  };

  const getStatusText = (status: string) => {
    if (status === "ok") return "ONLINE";
    if (status === "calibrated") return "CALIBRATED";
    if (status === "error") return "ERROR";
    return "OFFLINE";
  };

  const hallStatus = healthData ? (healthData.status === "ready" ? "ok" : "unknown") : "unknown";
  const ledStatus = healthData ? (healthData.status === "ready" ? "calibrated" : "unknown") : "unknown";
  const motorStatus = healthData ? (healthData.status === "ready" || healthData.rpm > 0 ? "ok" : "unknown") : "unknown";
  const rssi = healthData?.rssi;

  const getRssiColor = (val: number) => {
    if (val > -60) return "text-emerald-400";
    if (val > -80) return "text-amber-400";
    return "text-red-500";
  };

  const handleExportReport = () => {
    let reportContent = `--- HARDWARE DIAGNOSTICS REPORT ---\n`;
    reportContent += `Generated: ${new Date().toLocaleString()}\n\n`;
    reportContent += `[ STATUS SUMMARY ]\n`;
    reportContent += `Temperature: ${tempVal.toFixed(1)}°C\n`;
    reportContent += `Voltage: ${voltageVal.toFixed(2)}V\n`;
    reportContent += `Current Draw: ${currentVal.toFixed(2)}A\n`;
    reportContent += `Motor RPM: ${Math.round(rpmVal)}\n`;
    reportContent += `WiFi Signal (RSSI): ${rssi !== undefined ? rssi + ' dBm' : 'N/A'}\n\n`;
    reportContent += `[ TELEMETRY HISTORY ]\n`;
    history.forEach((h, i) => {
      reportContent += `[${h.time}] Temp: ${h.temp?.toFixed(1)}C, Volt: ${h.voltage?.toFixed(2)}V, Curr: ${h.current?.toFixed(2)}A, RPM: ${Math.round(h.rpm)}\n`;
    });

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `POV_Diagnostics_${new Date().getTime()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Drag and Drop Event Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const currentIdx = widgetOrder.indexOf(draggedId);
    const targetIdx = widgetOrder.indexOf(targetId);

    const newOrder = [...widgetOrder];
    newOrder.splice(currentIdx, 1);
    newOrder.splice(targetIdx, 0, draggedId);

    setWidgetOrder(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragEnabledId(null);
    localStorage.setItem("pov_widget_order", JSON.stringify(widgetOrder));
  };

  const handleResetLayout = () => {
    const defaultOrder = ["efficiency", "thermal", "battery"];
    setWidgetOrder(defaultOrder);
    localStorage.setItem("pov_widget_order", JSON.stringify(defaultOrder));
  };

  const renderWidget = (id: string) => {
    switch (id) {
      case "efficiency":
        return (
          <div 
            key="efficiency"
            id="efficiency-widget"
            draggable={dragEnabledId === "efficiency"}
            onDragStart={(e) => handleDragStart(e, "efficiency")}
            onDragOver={(e) => handleDragOver(e, "efficiency")}
            onDragEnd={handleDragEnd}
            className={`bg-[#0b0d14] rounded-xl border transition-all duration-200 p-3 relative flex flex-col h-44 ${
              draggedId === "efficiency" 
                ? "opacity-30 border-dashed border-sky-500 bg-sky-500/5 scale-95 z-10" 
                : "border-slate-800/80 hover:border-slate-700/80"
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1">
                <div 
                  className="cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-slate-300 transition-colors"
                  onMouseDown={() => setDragEnabledId("efficiency")}
                  onMouseLeave={() => setDragEnabledId(null)}
                  onTouchStart={() => setDragEnabledId("efficiency")}
                  onTouchEnd={() => setDragEnabledId(null)}
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <RotateCcw className="w-3 h-3 text-[#00b4d8]" />
                  Motor Efficiency
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-300">{Math.round(rpmVal)} RPM</span>
            </div>

            {/* Area Chart */}
            <div className="flex-1 min-h-0 mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorRpm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00b4d8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00b4d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDuty" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} itemStyle={{ fontSize: '10px' }} labelStyle={{ display: 'none' }} />
                  <Area type="monotone" dataKey="rpm" stroke="#00b4d8" fillOpacity={1} fill="url(#colorRpm)" isAnimationActive={false} />
                  <Area type="monotone" dataKey="duty" stroke="#a855f7" fillOpacity={1} fill="url(#colorDuty)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Footer */}
            <div className="flex gap-4 mt-2 px-1 justify-between items-center">
              <div className="flex gap-3">
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#00b4d8]"></div><span className="text-[7px] text-slate-400 uppercase">RPM</span></div>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-[#a855f7]"></div><span className="text-[7px] text-slate-400 uppercase">Duty %</span></div>
              </div>
              <span className="text-[7px] text-slate-500 font-mono">DRAG TO REORDER</span>
            </div>
          </div>
        );

      case "thermal":
        return (
          <div 
            key="thermal"
            id="thermal-widget"
            draggable={dragEnabledId === "thermal"}
            onDragStart={(e) => handleDragStart(e, "thermal")}
            onDragOver={(e) => handleDragOver(e, "thermal")}
            onDragEnd={handleDragEnd}
            className={`bg-[#0b0d14] rounded-xl border transition-all duration-200 p-3 relative flex flex-col h-44 ${
              draggedId === "thermal" 
                ? "opacity-30 border-dashed border-rose-500 bg-rose-500/5 scale-95 z-10" 
                : "border-slate-800/80 hover:border-slate-700/80"
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1">
                <div 
                  className="cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-slate-300 transition-colors"
                  onMouseDown={() => setDragEnabledId("thermal")}
                  onMouseLeave={() => setDragEnabledId(null)}
                  onTouchStart={() => setDragEnabledId("thermal")}
                  onTouchEnd={() => setDragEnabledId(null)}
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <Thermometer className="w-3 h-3 text-rose-400" />
                  Thermal & Voltage
                </div>
              </div>
              <span className={`text-[11px] font-mono ${isTempCritical ? 'text-red-500' : 'text-slate-300'}`}>{tempVal.toFixed(1)}°C</span>
            </div>

            {/* Bar Chart */}
            <div className="flex-1 min-h-0 mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history}>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} itemStyle={{ fontSize: '10px' }} labelStyle={{ display: 'none' }} />
                  <Bar dataKey="temp" fill="#f43f5e" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                  <Bar dataKey="voltage" fill="#eab308" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Footer */}
            <div className="flex gap-4 mt-2 px-1 justify-between items-center">
              <div className="flex gap-3">
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div><span className="text-[7px] text-slate-400 uppercase">Temp</span></div>
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div><span className="text-[7px] text-slate-400 uppercase">Volts</span></div>
              </div>
              <span className="text-[7px] text-slate-500 font-mono">DRAG TO REORDER</span>
            </div>
          </div>
        );

      case "battery":
        return (
          <div 
            key="battery"
            id="battery-widget"
            draggable={dragEnabledId === "battery"}
            onDragStart={(e) => handleDragStart(e, "battery")}
            onDragOver={(e) => handleDragOver(e, "battery")}
            onDragEnd={handleDragEnd}
            className={`bg-[#0b0d14] rounded-xl border transition-all duration-200 p-3 relative flex flex-col h-44 ${
              draggedId === "battery" 
                ? "opacity-30 border-dashed border-emerald-500 bg-emerald-500/5 scale-95 z-10" 
                : "border-slate-800/80 hover:border-slate-700/80"
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1">
                <div 
                  className="cursor-grab active:cursor-grabbing p-1 text-slate-500 hover:text-slate-300 transition-colors"
                  onMouseDown={() => setDragEnabledId("battery")}
                  onMouseLeave={() => setDragEnabledId(null)}
                  onTouchStart={() => setDragEnabledId("battery")}
                  onTouchEnd={() => setDragEnabledId(null)}
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <Battery className="w-3.5 h-3.5 text-emerald-400" />
                  Battery Monitor
                </div>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">{battPercent.toFixed(0)}%</span>
            </div>

            {/* Battery Status Layout */}
            <div className="flex-1 flex gap-3 mt-1 items-center">
              {/* Battery left side details */}
              <div className="flex flex-col gap-1 w-2/5 justify-center">
                <div className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                  {battVolts.toFixed(1)}V
                </div>
                
                {/* Battery progress cylinder */}
                <div className="w-full h-3 bg-[#050608] rounded-sm p-[1px] border border-slate-700/50 flex">
                  <div 
                    className={`h-full rounded-[1px] ${battPercent > 20 ? 'bg-emerald-500' : 'bg-red-500'} transition-all`} 
                    style={{ width: `${battPercent}%` }}
                  ></div>
                </div>

                <div className="text-[7px] text-slate-400 tracking-wider font-semibold mt-0.5">
                  {hoursLeft.toFixed(1)}H RUNTIME
                </div>
                
                <div className="text-[7px] text-slate-500 leading-tight">
                  Cons: {currentDraw.toFixed(2)}A
                </div>
              </div>

              {/* Battery right side: Voltage decay graph */}
              <div className="flex-1 h-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} itemStyle={{ fontSize: '9px' }} labelStyle={{ display: 'none' }} />
                    <Line type="monotone" dataKey="voltage" stroke="#10b981" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center mt-2 px-1">
              <span className="text-[7px] text-slate-400 uppercase">Voltage Decay Trend</span>
              <span className="text-[7px] text-slate-500 font-mono">DRAG TO REORDER</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-[#050608] border border-slate-800 rounded-2xl p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center mb-1">
        <h4 className="text-white text-xs font-bold tracking-widest uppercase flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#a855f7]" />
          System Telemetry & Custom Grid
        </h4>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleResetLayout} 
            className="flex items-center gap-1 text-[8px] text-slate-500 hover:text-white bg-slate-800/20 hover:bg-slate-800/60 px-2 py-1 rounded border border-slate-800 transition"
            title="Reset to default layout"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            RESET GRID
          </button>
          <button onClick={handleExportReport} className="flex items-center gap-1.5 text-[9px] text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 px-2 py-1 rounded transition">
            <Download className="w-3 h-3" />
            EXPORT LOG
          </button>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${healthData ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-600'} animate-pulse`} />
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">{healthData ? 'Live' : 'Waiting'}</span>
          </div>
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

      {/* Sync Disabled Warning */}
      {!isSyncEnabled && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl flex items-center gap-3">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-tighter leading-none mb-1">REAL-TIME SYNC PAUSED</p>
            <p className="text-[9px] text-amber-400/80 leading-none">Telemetry polling and parameter sync are disabled to save bandwidth and power.</p>
          </div>
        </div>
      )}

      {/* Four Status Cards */}
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
             <div className={`w-1.5 h-1.5 rounded-full ${ledStatus === 'calibrated' ? 'bg-[#00b4d8] shadow-[0_0_5px_#00b4d8]' : 'bg-slate-600'}`}></div>
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

      {/* Helper Tips */}
      <div className="text-[8.5px] text-slate-500 font-medium tracking-wide border-t border-slate-800/40 pt-2.5 flex items-center gap-1.5">
        <span className="text-[#a855f7] font-bold">💡 TIP:</span>
        Drag widgets by the grip handles (<GripVertical className="inline w-2.5 h-2.5" />) to reorder your workspace. Your custom layout is saved automatically.
      </div>

      {/* Drag-and-Drop Customizable Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgetOrder.map(id => renderWidget(id))}
      </div>
      
    </div>
  );
}
