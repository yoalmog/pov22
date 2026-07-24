import React from "react";
import { Radio, RefreshCw, AlertCircle, Wifi, WifiOff } from "lucide-react";

interface RssiIndicatorProps {
  rssi?: number | null;
  isConnected: boolean;
  isReconnecting?: boolean;
  reconnectAttemptCount?: number;
  onReconnectClick?: () => void;
  className?: string;
  compact?: boolean;
}

export function RssiIndicator({
  rssi,
  isConnected,
  isReconnecting = false,
  reconnectAttemptCount = 0,
  onReconnectClick,
  className = "",
  compact = false
}: RssiIndicatorProps) {
  // Determine Signal Quality and Colors based on dBm
  const getSignalMeta = (rssiVal?: number | null) => {
    if (!isConnected || rssiVal === undefined || rssiVal === null) {
      return {
        bars: 0,
        quality: "OFFLINE",
        colorClass: "text-slate-500",
        bgClass: "bg-slate-900/60 border-slate-800",
        badgeBg: "bg-slate-800/80 text-slate-400 border-slate-700",
        barColor: "bg-slate-700"
      };
    }

    if (rssiVal >= -60) {
      return {
        bars: 4,
        quality: "EXCELLENT",
        colorClass: "text-[#22c55e]",
        bgClass: "bg-[#22c55e]/10 border-[#22c55e]/30 shadow-[0_0_15px_rgba(34,197,94,0.15)]",
        badgeBg: "bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/40",
        barColor: "bg-[#22c55e]"
      };
    } else if (rssiVal >= -72) {
      return {
        bars: 3,
        quality: "GOOD",
        colorClass: "text-[#00b4d8]",
        bgClass: "bg-[#00b4d8]/10 border-[#00b4d8]/30 shadow-[0_0_15px_rgba(0,180,216,0.15)]",
        badgeBg: "bg-[#00b4d8]/20 text-[#00b4d8] border-[#00b4d8]/40",
        barColor: "bg-[#00b4d8]"
      };
    } else if (rssiVal >= -85) {
      return {
        bars: 2,
        quality: "FAIR",
        colorClass: "text-amber-400",
        bgClass: "bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]",
        badgeBg: "bg-amber-500/20 text-amber-400 border-amber-500/40",
        barColor: "bg-amber-400"
      };
    } else {
      return {
        bars: 1,
        quality: "WEAK",
        colorClass: "text-rose-400",
        bgClass: "bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]",
        badgeBg: "bg-rose-500/20 text-rose-400 border-rose-500/40",
        barColor: "bg-rose-400"
      };
    }
  };

  const meta = getSignalMeta(rssi);
  const displayRssi = isConnected && typeof rssi === "number" ? `${rssi} dBm` : "N/A";

  if (compact) {
    return (
      <div 
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold transition-all ${meta.bgClass} ${className}`}
        title={`BLE RSSI Signal: ${displayRssi} (${meta.quality})`}
      >
        <div className="flex items-end gap-0.5 h-3 shrink-0">
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              className={`w-0.75 rounded-xs transition-all duration-300 ${
                bar <= meta.bars ? meta.barColor : "bg-slate-700/60"
              }`}
              style={{ height: `${bar * 25}%` }}
            />
          ))}
        </div>
        <span className={meta.colorClass}>{displayRssi}</span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-2xl border backdrop-blur-md flex items-center justify-between gap-4 transition-all ${meta.bgClass} ${className}`}>
      {/* Left: Signal Bar Graphic + Status */}
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${meta.badgeBg}`}>
          {isReconnecting ? (
            <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
          ) : isConnected ? (
            <Radio className={`w-4 h-4 ${meta.colorClass} animate-pulse`} />
          ) : (
            <WifiOff className="w-4 h-4 text-slate-500" />
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              BLE Signal Strength (RSSI)
            </span>
            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${meta.badgeBg}`}>
              {isReconnecting ? `Reconnecting (${reconnectAttemptCount})` : meta.quality}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-mono font-extrabold text-white tracking-tight">
              {displayRssi}
            </span>
            {isConnected && (
              <span className="text-[9px] font-mono text-slate-400">
                (Bluetooth LE Telemetry)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: 4-Bar Visual Indicator & Reconnect Action */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-end gap-1 h-5 px-2 py-1 bg-slate-950/60 border border-slate-800/80 rounded-lg">
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              className={`w-1 rounded-sm transition-all duration-300 ${
                bar <= meta.bars ? meta.barColor : "bg-slate-800"
              }`}
              style={{ height: `${bar * 25}%` }}
            />
          ))}
        </div>

        {(!isConnected || isReconnecting) && onReconnectClick && (
          <button
            onClick={onReconnectClick}
            className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-[10px] font-black uppercase tracking-wider transition active:scale-95 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${isReconnecting ? "animate-spin" : ""}`} />
            Reconnect
          </button>
        )}
      </div>
    </div>
  );
}
