import React from "react";

interface Props {
  arms: number;
  stripsPerArm: number;
  strips: number;
  pins?: string;
  activeEffect?: string;
  colorMode?: "solid" | "random";
  baseColor?: string;
  brightness?: number;
  aiEffectJs?: string | null;
}

export const LedVisualizer: React.FC<Props> = React.memo(({ 
  arms, 
  stripsPerArm, 
  strips, 
  pins = "",
  activeEffect = "rainbow",
  colorMode = "solid",
  baseColor = "#00b4d8",
  brightness = 150,
  aiEffectJs = null
}) => {
  const pinArray = pins ? pins.split(",").map(p => p.trim()) : [];
  const [time, setTime] = React.useState(0);

  const aiFunctionRef = React.useRef<Function | null>(null);

  React.useEffect(() => {
    if (aiEffectJs) {
      try {
        // eslint-disable-next-line no-new-func
        aiFunctionRef.current = new Function('stripIndex', 'ledIndex', 'time', 'brightness', 'arms', aiEffectJs);
      } catch (e) {
        console.error("Failed to compile AI effect JS", e);
        aiFunctionRef.current = null;
      }
    } else {
      aiFunctionRef.current = null;
    }
  }, [aiEffectJs]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTime(t => t + 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const getLedColor = (stripIndex: number, ledIndex: number) => {
    // Basic brightness multiplier
    const bMult = brightness / 255;
    
    if (activeEffect === "ai_custom" && aiFunctionRef.current) {
      try {
        return aiFunctionRef.current(stripIndex, ledIndex, time, bMult, arms);
      } catch (e) {
         // fallback on error
      }
    }
    
    // Simple simulation logic for effects
    if (activeEffect === "rainbow") {
      const hue = (time * 5 + stripIndex * 20 + ledIndex * 5) % 360;
      return `hsla(${hue}, 80%, 50%, ${bMult})`;
    }
    
    if (activeEffect === "fire") {
      const wave = Math.sin(time * 0.2 + ledIndex * 0.3) * 0.5 + 0.5;
      const g = Math.floor(wave * 100);
      return `rgba(255, ${g}, 0, ${bMult})`;
    }
    
    if (activeEffect === "matrix") {
      const drop = (time + stripIndex * 10) % 50;
      const dist = Math.abs(ledIndex - drop);
      const alpha = dist < 5 ? (1 - dist/5) * bMult : 0;
      return `rgba(0, 255, 70, ${alpha})`;
    }

    if (activeEffect === "clock") {
       const isTick = (ledIndex % 10 === 0);
       return isTick ? `rgba(255, 255, 255, ${bMult})` : `rgba(30, 41, 59, 0.2)`;
    }
    
    if (colorMode === "solid") {
      const flicker = Math.sin(time * 0.1 + stripIndex) * 0.1 + 0.9;
      return `${baseColor}${Math.floor(bMult * flicker * 255).toString(16).padStart(2, '0')}`;
    }
    
    return `rgba(0, 180, 216, ${bMult})`;
  };

  const renderArm = (armIndex: number) => {
    const angle = (armIndex * 360) / arms;
    const armColor = armIndex % 2 === 0 ? "#06b6d4" : "#d97706";
    
    return (
      <g key={armIndex} transform={`rotate(${angle}, 200, 75)`}>
        {/* Arm base */}
        <rect x="225" y="70" width="150" height="10" fill={armColor} rx="2" opacity="0.3" />
        
        {/* Strips on this arm */}
        {Array.from({ length: stripsPerArm }).map((_, sIdx) => {
          const globalStripIndex = armIndex * stripsPerArm + sIdx;
          if (globalStripIndex >= strips) return null;
          
          const yOffset = (sIdx - (stripsPerArm - 1) / 2) * 8;
          const yPos = 73 + yOffset;
          
          return (
            <g key={sIdx}>
              {/* Individual LEDs Simulation */}
              {Array.from({ length: 15 }).map((_, lIdx) => {
                const color = getLedColor(globalStripIndex, lIdx);
                return (
                  <rect 
                    key={lIdx}
                    x={235 + lIdx * 8}
                    y={yPos}
                    width="6"
                    height="4"
                    fill={color}
                    rx="1"
                    className="transition-colors duration-100"
                    style={{ filter: "blur(0.5px)" }}
                  />
                );
              })}
              
              <text 
                x="300"
                y={yPos - 4}
                fill="#94a3b8"
                className="text-[3px] font-bold opacity-60"
                textAnchor="middle"
              >
                S{globalStripIndex + 1} (Pin {pinArray[globalStripIndex] || "-"})
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <div className="w-full h-56 bg-slate-950/50 rounded-2xl border border-slate-800 relative flex items-center justify-center p-4">
      <svg viewBox="0 0 400 150" className="w-full h-full overflow-visible">
        {/* Central Hub */}
        <circle cx="200" cy="75" r="35" fill="#1e293b" />
        <circle cx="200" cy="75" r="30" fill="black" />
        <circle cx="200" cy="75" r="10" fill="#334155" />
        
        {/* Mechanical Arms */}
        {Array.from({ length: arms }).map((_, i) => renderArm(i))}
        
        {/* Info Overlay */}
        <text x="20" y="20" fill="#94a3b8" className="text-[8px] font-mono uppercase tracking-widest">
          {arms} ARMS / {stripsPerArm} STRIPES PER ARM
        </text>
      </svg>
    </div>
  );
});
