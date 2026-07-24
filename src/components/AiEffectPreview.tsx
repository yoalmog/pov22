import React, { useRef, useEffect } from "react";
import { Sparkles, Info } from "lucide-react";
import { compilePromptLocally } from "./AiEffectStudio";

interface AiEffectPreviewProps {
  prompt: string;
  aiEffectJs?: string | null;
  brightness?: number;
}

export const AiEffectPreview: React.FC<AiEffectPreviewProps> = ({
  prompt,
  aiEffectJs = null,
  brightness = 180,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use compiled JS code, or fall back to local compiler
    let jsCode = aiEffectJs;
    if (!jsCode && prompt) {
      try {
        const compiled = compilePromptLocally(prompt);
        jsCode = compiled.js;
      } catch (e) {
        console.warn("Could not locally compile preview:", e);
      }
    }

    // High DPI Canvas support
    const size = 150;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const maxRadius = size / 2 - 8;

    // Background
    ctx.fillStyle = "#030712";
    ctx.fillRect(0, 0, size, size);

    // Subtle holographic mesh grid background
    ctx.strokeStyle = "rgba(56, 189, 248, 0.04)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < size; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    if (!jsCode) {
      // Draw a sleek placeholder
      ctx.strokeStyle = "rgba(99, 102, 241, 0.15)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, maxRadius * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(148, 163, 184, 0.4)";
      ctx.font = "bold 8px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("WAITING FOR AI", cx, cy);
      return;
    }

    // Compile dynamic evaluation function
    let evalFunc: Function | null = null;
    try {
      // eslint-disable-next-line no-new-func
      evalFunc = new Function('stripIndex', 'ledIndex', 'time', 'brightness', 'arms', jsCode);
    } catch (e) {
      console.error("Preview evaluation compilation error:", e);
    }

    if (!evalFunc) {
      ctx.fillStyle = "rgba(239, 68, 68, 0.5)";
      ctx.font = "bold 8px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("COMPILATION ERROR", cx, cy);
      return;
    }

    const bMult = brightness / 255;
    const arms = 4;
    const timeVal = 12; // Static time snapshot index

    // Sweep polar coordinates to build a static POV projection
    for (let angle = 0; angle < 360; angle += 1.8) {
      const rad = (angle * Math.PI) / 180;
      
      // Select appropriate stripIndex based on angle sector
      const numStrips = 14;
      const stripIndex = Math.floor((angle / 360) * numStrips) % numStrips;

      for (let ledIndex = 0; ledIndex < 15; ledIndex++) {
        // Distance mapping
        const r = (ledIndex / 14) * maxRadius;

        let color = "rgba(0,0,0,0)";
        try {
          color = evalFunc(stripIndex, ledIndex, timeVal, brightness, arms);
        } catch (e) {
          // ignore
        }

        if (color && color !== "rgba(0,0,0,0)" && color !== "transparent" && !color.includes("rgba(0,0,0,0)")) {
          const px = cx + Math.cos(rad) * r;
          const py = cy + Math.sin(rad) * r;

          ctx.fillStyle = color;
          
          // Draw glowing pixel dot
          ctx.beginPath();
          ctx.arc(px, py, 1.25, 0, Math.PI * 2);
          ctx.fill();

          // Add a very subtle surrounding bloom/glow for brighter pixels
          if (ledIndex % 3 === 0) {
            ctx.fillStyle = color.replace(/rgba?\((.*?)\)/, (match, g) => {
              const parts = g.split(",");
              if (parts.length >= 3) {
                return `rgba(${parts[0].trim()}, ${parts[1].trim()}, ${parts[2].trim()}, 0.06)`;
              }
              return match;
            });
            ctx.beginPath();
            ctx.arc(px, py, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Draw holographic diagnostic HUD overlay lines
    ctx.strokeStyle = "rgba(14, 165, 233, 0.25)";
    ctx.lineWidth = 0.5;

    // Circular concentric range rings
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius * 0.35, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(14, 165, 233, 0.15)";
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius * 0.98, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs lines
    ctx.beginPath();
    ctx.moveTo(cx - maxRadius, cy);
    ctx.lineTo(cx + maxRadius, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - maxRadius);
    ctx.lineTo(cx, cy + maxRadius);
    ctx.stroke();

  }, [prompt, aiEffectJs, brightness]);

  return (
    <div className="relative group">
      <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500/30 to-cyan-500/30 rounded-full blur-md opacity-75 group-hover:opacity-100 transition duration-500"></div>
      <div className="relative flex items-center justify-center bg-slate-950 p-1.5 rounded-full border border-slate-800/80 shadow-inner">
        <canvas
          ref={canvasRef}
          style={{ width: "150px", height: "150px" }}
          className="rounded-full shadow-2xl block"
        />
        {/* Decorative HUD crosshair rings */}
        <div className="absolute inset-2 border border-dashed border-sky-500/10 rounded-full pointer-events-none animate-spin-slow"></div>
      </div>
    </div>
  );
};
