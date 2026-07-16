import React, { useState, useEffect } from "react";
import { Sparkles, Loader2, Send, Cpu, Copy, Check } from "lucide-react";
import { PlatformGuideModal } from "./PlatformGuideModal";
import { LedVisualizer } from "./LedVisualizer";
import { registerPlugin } from "@capacitor/core";

const GenAi = registerPlugin<any>("GenAi");

interface Props {
  onEffectGenerated: (code: string, js: string, prompt: string) => void;
}

export const AiEffectStudio: React.FC<Props> = ({ onEffectGenerated }) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocalAiAvailable, setIsLocalAiAvailable] = useState<boolean | null>(null);
  const [engine, setEngine] = useState<"local" | "cloud" | "chrome">("local");
  const [generatedEffect, setGeneratedEffect] = useState<{ cpp: string; js: string; prompt: string } | null>(null);
  const [codeTab, setCodeTab] = useState<"cpp" | "js">("cpp");
  const [copied, setCopied] = useState<boolean>(false);
  const [showPlatformGuide, setShowPlatformGuide] = useState<boolean>(false);

  useEffect(() => {
    // Check if Chrome's local window.ai is available
    const checkLocalAi = async () => {
      // If we are on Android running inside Capacitor:
      const isCapacitor = (window as any).Capacitor !== undefined;
      const isAndroid = isCapacitor && (window as any).Capacitor.getPlatform() === 'android';
      if (isAndroid) {
        try {
          const { status } = await GenAi.checkStatus();
          const isAvail = status === "AVAILABLE";
          setIsLocalAiAvailable(isAvail);
          if (isAvail) {
            setEngine("chrome"); // Default to Local Android Nano model if available
          }
        } catch (e) {
          setIsLocalAiAvailable(false);
        }
        return;
      }

      try {
        if ("ai" in window && "languageModel" in (window as any).ai) {
          const capabilities = await (window as any).ai.languageModel.capabilities();
          const isAvail = capabilities.available !== "no";
          setIsLocalAiAvailable(isAvail);
          if (isAvail) {
            setEngine("chrome"); // Default to Chrome's built-in AI model if available
          }
        } else {
          setIsLocalAiAvailable(false);
        }
      } catch (e) {
        setIsLocalAiAvailable(false);
      }
    };
    checkLocalAi();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      let parsed: { cpp: string; js: string };

      if (engine === "local") {
        // 1. Zero-latency instant Local Offline AI Semantic Compiler
        parsed = compilePromptLocally(prompt);
        // Simulate a brief generation delay for premium UX feeling
        await new Promise((resolve) => setTimeout(resolve, 350));
      } else if (engine === "chrome" && isLocalAiAvailable) {
        const isCapacitor = (window as any).Capacitor !== undefined;
        const isAndroid = isCapacitor && (window as any).Capacitor.getPlatform() === 'android';

        if (isAndroid) {
          // On Android: prompt Gemini Nano via ML Kit GenAI Prompt API!
          const { response } = await GenAi.generateContent({ prompt });
          parsed = JSON.parse(response);
        } else {
          // 2. Chrome's built-in On-Device model
          const systemPrompt = `You are an expert full-stack developer writing effects for a POV LED hologram.
The user wants an effect that: ${prompt}

You must return a JSON object with two fields:
1. "cpp": The C++ case statement block for a switch statement inside getEffectColorRaw.
   Signature: RgbColor getEffectColorRaw(int ledIdx, float angle, unsigned long timeMs)
   Variables available: ledIdx (0 to PIXEL_COUNT-1), angle (0 to 360), timeMs, r (ledIdx / PIXEL_COUNT from 0.0 to 1.0), DEG_TO_RAD.
   Just return the raw case body logic that returns RgbColor(r,g,b).
2. "js": The JavaScript equivalent function body for the web visualizer.
   Signature: (stripIndex, ledIndex, time, brightness, arms) => string (rgba/hsla string)
   Variables available: stripIndex, ledIndex (0 to 14), time (tick counter, incremented every 50ms).
   Return the JS logic as a string.

Return ONLY the raw JSON object, no markdown blocks, no markdown formatting.
Format: {"cpp": "...", "js": "..."}`;

          const session = await (window as any).ai.languageModel.create({
            systemPrompt: "You are a specialized code generator that outputs strictly raw JSON.",
          });

          const responseText = await session.prompt(systemPrompt);
          const rawText = responseText.replace(/```(json)?|```/gi, "").trim() || "{}";
          parsed = JSON.parse(rawText);
        }
      } else {
        // 3. Fallback to Server-Side Cloud Gemini API
        const response = await fetch("/api/generate-effect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to generate effect via Cloud AI fallback.");
        }

        parsed = await response.json();
      }
      
      if (!parsed.cpp || !parsed.js) {
        throw new Error("AI did not return the expected code format.");
      }
      
      onEffectGenerated(parsed.cpp, parsed.js, prompt);
      setGeneratedEffect({ cpp: parsed.cpp, js: parsed.js, prompt: prompt });
      setPrompt("");
    } catch (err: any) {
      setError(err.message || "An error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Get current engine description
  const getEngineDesc = () => {
    const isCapacitor = (window as any).Capacitor !== undefined;
    const isAndroid = isCapacitor && (window as any).Capacitor.getPlatform() === 'android';
    if (engine === "local") {
      return "Synthesize math, colors, & patterns locally in your browser with zero latency.";
    }
    if (engine === "chrome") {
      return isAndroid
        ? "Generate code locally using Android ML Kit GenAI Prompt API (Gemini Nano on-device)."
        : "Generate code locally using Chrome's built-in Gemini Nano LLM (requires Chrome flags).";
    }
    return "Leverage Google Cloud Gemini models for highly complex, customized algorithmic effects.";
  };

  return (
    <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
        <h3 className="text-[13px] font-black text-slate-200 tracking-widest uppercase">
          HoloSpin AI Effect Studio
        </h3>
        
        {engine === "local" ? (
          <span className="ml-auto text-[9px] bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-md font-bold uppercase tracking-wider flex items-center gap-1">
            <Cpu className="w-2.5 h-2.5" /> Offline AI
          </span>
        ) : engine === "chrome" ? (
          <span className="ml-auto text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 animate-spin" /> {/Android/i.test(navigator.userAgent) ? "Android Nano" : "Chrome Nano"}
          </span>
        ) : (
          <span className="ml-auto text-[9px] bg-pink-500/20 text-pink-400 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
            Cloud Gemini
          </span>
        )}
      </div>

      {/* AI Engine Selection Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-slate-800/60">
        <button
          onClick={() => setEngine("local")}
          className={`py-2 px-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 ${
            engine === "local"
              ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200 border border-transparent"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Local NLP</span>
        </button>
        
        <button
          onClick={() => setEngine("cloud")}
          className={`py-2 px-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 ${
            engine === "cloud"
              ? "bg-pink-500/20 text-pink-400 border border-pink-500/30 shadow-sm"
              : "text-slate-400 hover:text-slate-200 border border-transparent"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Cloud Gemini</span>
        </button>

        <button
          onClick={() => {
            if (isLocalAiAvailable) {
              setEngine("chrome");
            } else {
              if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                setShowPlatformGuide(true);
              } else {
                setError("Chrome window.ai is not available in this browser. To use Chrome Nano, enable Gemini Nano in chrome://flags.");
                setTimeout(() => setError(null), 5000);
              }
            }
          }}
          className={`py-2 px-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 ${
            engine === "chrome"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
              : !isLocalAiAvailable
              ? "opacity-40 cursor-not-allowed text-slate-500"
              : "text-slate-400 hover:text-slate-200 border border-transparent"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>{/Android/i.test(navigator.userAgent) ? "Android Nano" : "Chrome Nano"}</span>
        </button>
      </div>
      
      <p className="text-[11px] text-slate-400 min-h-[32px] leading-relaxed">
        {getEngineDesc()}
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            engine === "local"
              ? "e.g., A rotating rainbow spiral wave..."
              : "Describe a custom lighting effect in natural language..."
          }
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleGenerate();
          }}
          disabled={isGenerating}
        />
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl px-4 flex items-center justify-center hover:bg-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>

      {error && (
        <div className="text-[11px] text-rose-400 bg-rose-400/10 p-3 rounded-xl border border-rose-400/20">
          {error}
        </div>
      )}

      {generatedEffect && (
        <div className="mt-2 border border-slate-800/80 rounded-xl bg-slate-950/80 p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                GENERATED CODE / קוד שנוצר
              </span>
              <span className="text-[11px] text-indigo-400 font-bold truncate max-w-[180px]">
                "{generatedEffect.prompt}"
              </span>
            </div>
            
            <div className="flex gap-1.5 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
              <button
                onClick={() => setCodeTab("cpp")}
                className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all ${
                  codeTab === "cpp"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                C++ Code
              </button>
              <button
                onClick={() => setCodeTab("js")}
                className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all ${
                  codeTab === "js"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                JS Sim
              </button>
            </div>
          </div>

          {/* AI-Generated LED Strip Live Preview */}
          <div className="flex flex-col gap-2 p-4 bg-slate-900/30 rounded-2xl border border-slate-900/80 items-center justify-center">
            <div className="flex justify-between items-center w-full">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Live Dynamic Simulation / תצוגה מקדימה חיה
              </span>
              <span className="text-[9px] text-slate-500 font-mono">
                Running Generated JavaScript Simulator
              </span>
            </div>
            
            <div className="w-full flex items-center justify-center py-2 px-6 bg-slate-950/80 rounded-xl border border-slate-900/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.6)]">
              <LedVisualizer 
                arms={4}
                stripsPerArm={1}
                strips={14}
                activeEffect="ai_custom"
                aiEffectJs={generatedEffect.js}
                brightness={220}
              />
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => {
                const textToCopy = codeTab === "cpp" ? generatedEffect.cpp : generatedEffect.js;
                navigator.clipboard.writeText(textToCopy);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="absolute top-2.5 right-2.5 p-2 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1.5 active:scale-95"
              title="Copy Code"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[8px] text-emerald-400 font-black tracking-widest uppercase">COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[8px] font-black tracking-widest uppercase">COPY</span>
                </>
              )}
            </button>
            <pre className="p-3.5 bg-slate-950/90 border border-slate-900 rounded-xl overflow-x-auto text-[10.5px] font-mono text-slate-300 max-h-48 leading-relaxed select-all">
              <code>{codeTab === "cpp" ? generatedEffect.cpp : generatedEffect.js}</code>
            </pre>
          </div>

          <p className="text-[9.5px] text-slate-500 leading-normal bg-slate-900/40 p-2.5 rounded-xl border border-slate-900">
            💡 <strong className="text-slate-400">Integration:</strong> The 3D browser simulation has auto-loaded the <strong>JS code</strong> and is displaying it now. The <strong>C++ code</strong> has also been automatically injected into the <strong className="text-emerald-400">Firmware Setup</strong> download bundle for your ESP32 microcontroller!
          </p>
        </div>
      )}
          {showPlatformGuide && (
        <PlatformGuideModal onClose={() => setShowPlatformGuide(false)} />
      )}
    </div>
  );
};

// --- Helper Functions for instant, zero-latency Local Offline AI Semantic Compiler ---

export function compilePromptLocally(prompt: string): { cpp: string; js: string } {
  const p = prompt.toLowerCase();
  
  // 1. Color extraction
  let colors: string[] = [];
  if (p.includes("rainbow")) colors.push("rainbow");
  if (p.includes("cyberpunk") || p.includes("neon")) colors.push("neon");
  if (p.includes("fire") || p.includes("flame") || p.includes("hot")) colors.push("fire");
  if (p.includes("ice") || p.includes("frost") || p.includes("cold")) colors.push("ice");
  
  if (p.includes("red") || p.includes("ruby")) colors.push("red");
  if (p.includes("orange") || p.includes("amber")) colors.push("orange");
  if (p.includes("yellow") || p.includes("gold")) colors.push("gold");
  if (p.includes("green") || p.includes("emerald") || p.includes("matrix")) colors.push("green");
  if (p.includes("blue") || p.includes("sapphire") || p.includes("cyan") || p.includes("teal") || p.includes("ocean")) colors.push("blue");
  if (p.includes("purple") || p.includes("violet") || p.includes("magenta") || p.includes("pink")) colors.push("purple");
  if (p.includes("white") || p.includes("silver")) colors.push("white");

  if (colors.length === 0) {
    colors = ["neon"]; // Default creative cyber-neon aesthetic
  }

  // 2. Pattern/Geometry extraction
  let pattern = "wave"; // Default smooth dynamic wave
  if (p.includes("spiral") || p.includes("vortex") || p.includes("helix") || p.includes("galaxy") || p.includes("spin")) pattern = "spiral";
  else if (p.includes("rain") || p.includes("matrix") || p.includes("drop") || p.includes("fall")) pattern = "rain";
  else if (p.includes("pulse") || p.includes("breath") || p.includes("heart") || p.includes("beat")) pattern = "pulse";
  else if (p.includes("strobe") || p.includes("flash") || p.includes("blink") || p.includes("glitch")) pattern = "strobe";
  else if (p.includes("scanner") || p.includes("sweep") || p.includes("radar") || p.includes("line")) pattern = "scanner";
  else if (p.includes("sparkle") || p.includes("shimmer") || p.includes("glitter") || p.includes("star") || p.includes("twinkle")) pattern = "sparkle";
  else if (p.includes("ripple") || p.includes("ring") || p.includes("circle") || p.includes("wavelet")) pattern = "ripple";

  // 3. Speed modifier extraction
  let speedMult = 1.0;
  if (p.includes("fast") || p.includes("rapid") || p.includes("insane") || p.includes("quick") || p.includes("hyper")) speedMult = 2.5;
  if (p.includes("slow") || p.includes("gentle") || p.includes("calm") || p.includes("relax") || p.includes("lazy")) speedMult = 0.4;

  let cppCode = "";
  let jsCode = "";

  if (pattern === "spiral") {
    if (colors.includes("rainbow")) {
      cppCode = `// AI Local: Rainbow Spiral
float hue = angle + (r * 360.0f) + (timeMs * 0.1f * ${speedMult}f);
while(hue >= 360.0f) hue -= 360.0f;
while(hue < 0.0f) hue += 360.0f;
float s = 1.0f;
float v = 1.0f;
float c = v * s;
float x = c * (1.0f - fabs(fmod(hue / 60.0f, 2.0f) - 1.0f));
float m = v - c;
float r_, g_, b_;
if(hue < 60.0f) { r_ = c; g_ = x; b_ = 0; }
else if(hue < 120.0f) { r_ = x; g_ = c; b_ = 0; }
else if(hue < 180.0f) { r_ = 0; g_ = c; b_ = x; }
else if(hue < 240.0f) { r_ = 0; g_ = x; b_ = c; }
else if(hue < 300.0f) { r_ = x; g_ = 0; b_ = c; }
else { r_ = c; g_ = 0; b_ = x; }
return RgbColor((r_ + m) * 255, (g_ + m) * 255, (b_ + m) * 255);`;

      jsCode = `// AI Local: Rainbow Spiral
const hue = (angle + (ledIndex / 15) * 360 + time * 5 * ${speedMult}) % 360;
const spiralMask = Math.sin((angle * Math.PI / 180) - (ledIndex * 0.5) + (time * 0.1 * ${speedMult}));
const alpha = Math.max(0.2, (spiralMask + 1) / 2);
return \`hsla(\${hue}, 100%, 50%, \${alpha * (brightness / 255)})\`;`;
    } else if (colors.includes("neon") || colors.includes("purple")) {
      cppCode = `// AI Local: Cyberpunk Neon Spiral
float wave = sin((angle * DEG_TO_RAD) - (r * 6.28f) + (timeMs * 0.005f * ${speedMult}f));
float intensity = (wave + 1.0f) * 0.5f;
return RgbColor(intensity * 232, intensity * 121, intensity * 249);`;

      jsCode = `// AI Local: Cyberpunk Neon Spiral
const radAngle = (angle * Math.PI) / 180;
const wave = Math.sin(radAngle - (ledIndex * 0.4) + (time * 0.15 * ${speedMult}));
const intensity = (wave + 1) / 2;
const r = Math.floor(232 * intensity);
const g = Math.floor(121 * intensity);
const b = Math.floor(249 * intensity);
return \`rgba(\${r}, \${g}, \${b}, \${brightness / 255})\`;`;
    } else if (colors.includes("fire")) {
      cppCode = `// AI Local: Fire Vortex Spiral
float wave = sin((angle * DEG_TO_RAD) - (r * 4.0f) + (timeMs * 0.008f * ${speedMult}f));
float intensity = (wave + 1.0f) * 0.5f;
int red = 255;
int green = intensity * 128;
int blue = intensity * 30;
return RgbColor(red, green, blue);`;

      jsCode = `// AI Local: Fire Vortex Spiral
const radAngle = (angle * Math.PI) / 180;
const wave = Math.sin(radAngle - (ledIndex * 0.3) + (time * 0.2 * ${speedMult}));
const intensity = (wave + 1) / 2;
const r = 255;
const g = Math.floor(128 * intensity);
const b = Math.floor(30 * intensity);
return \`rgba(\${r}, \${g}, \${b}, \${brightness / 255})\`;`;
    } else if (colors.includes("ice")) {
      cppCode = `// AI Local: Ice Frost Spiral
float wave = sin((angle * DEG_TO_RAD) - (r * 5.0f) + (timeMs * 0.006f * ${speedMult}f));
float intensity = (wave + 1.0f) * 0.5f;
int red = intensity * 40;
int green = intensity * 180;
int blue = 255;
return RgbColor(red, green, blue);`;

      jsCode = `// AI Local: Ice Frost Spiral
const radAngle = (angle * Math.PI) / 180;
const wave = Math.sin(radAngle - (ledIndex * 0.35) + (time * 0.14 * ${speedMult}));
const intensity = (wave + 1) / 2;
const r = Math.floor(40 * intensity);
const g = Math.floor(180 * intensity);
const b = 255;
return \`rgba(\${r}, \${g}, \${b}, \${brightness / 255})\`;`;
    } else {
      const cName = colors[0] || "blue";
      const rgb = getRGBForColor(cName);
      cppCode = `// AI Local: ${cName.toUpperCase()} Spiral Vortex
float wave = sin((angle * DEG_TO_RAD) - (r * 5.0f) + (timeMs * 0.006f * ${speedMult}f));
float intensity = (wave + 1.0f) * 0.5f;
return RgbColor(intensity * ${rgb.r}, intensity * ${rgb.g}, intensity * ${rgb.b});`;

      jsCode = `// AI Local: ${cName.toUpperCase()} Spiral Vortex
const radAngle = (angle * Math.PI) / 180;
const wave = Math.sin(radAngle - (ledIndex * 0.45) + (time * 0.12 * ${speedMult}));
const intensity = (wave + 1) / 2;
const r = Math.floor(${rgb.r} * intensity);
const g = Math.floor(${rgb.g} * intensity);
const b = Math.floor(${rgb.b} * intensity);
return \`rgba(\${r}, \${g}, \${b}, \${brightness / 255})\`;`;
    }
  } else if (pattern === "rain") {
    if (colors.includes("green") || colors.includes("matrix")) {
      cppCode = `// AI Local: Matrix Digital Rain
float speed = timeMs * 0.004f * ${speedMult}f;
float cell = floor(r * 15.0f - speed);
float hash = sin(cell * 43758.5453f) * 0.5f + 0.5f;
float bright = fmod(speed * hash, 1.0f);
if (bright < 0.2f) return RgbColor(0, 0, 0);
return RgbColor(0, bright * 255, 0);`;

      jsCode = `// AI Local: Matrix Digital Rain
const speed = time * 0.1 * ${speedMult};
const cell = Math.floor(ledIndex - speed);
const hash = Math.abs(Math.sin(cell * 12.9898)) % 1;
const bright = (speed * hash) % 1;
if (bright < 0.3) return 'rgba(0,0,0,0)';
const g = Math.floor(bright * 255);
return \`rgba(0, \${g}, 0, \${brightness / 255})\`;`;
    } else if (colors.includes("rainbow")) {
      cppCode = `// AI Local: Rainbow Rain Drops
float speed = timeMs * 0.003f * ${speedMult}f;
float cell = floor(r * 10.0f - speed);
float hue = fmod(cell * 37.0f, 360.0f);
if (hue < 0.0f) hue += 360.0f;
float val = fmod(speed * (sin(cell) * 0.5f + 0.5f), 1.0f);
if (val < 0.3f) return RgbColor(0,0,0);
float s = 1.0f; float v = val;
float c = v * s;
float x = c * (1.0f - fabs(fmod(hue / 60.0f, 2.0f) - 1.0f));
float m = v - c;
float r_, g_, b_;
if(hue < 60.0f) { r_ = c; g_ = x; b_ = 0; }
else if(hue < 120.0f) { r_ = x; g_ = c; b_ = 0; }
else if(hue < 180.0f) { r_ = 0; g_ = c; b_ = x; }
else if(hue < 240.0f) { r_ = 0; g_ = x; b_ = c; }
else if(hue < 300.0f) { r_ = x; g_ = 0; b_ = c; }
else { r_ = c; g_ = 0; b_ = x; }
return RgbColor((r_ + m) * 255, (g_ + m) * 255, (b_ + m) * 255);`;

      jsCode = `// AI Local: Rainbow Rain Drops
const speed = time * 0.08 * ${speedMult};
const cell = Math.floor(ledIndex - speed);
const hue = Math.floor(Math.abs(Math.sin(cell * 43.12)) * 360) % 360;
const bright = (speed * (Math.abs(Math.sin(cell)) * 0.5 + 0.5)) % 1;
if (bright < 0.3) return 'rgba(0,0,0,0)';
return \`hsla(\${hue}, 100%, \${Math.floor(bright * 50)}%, \${brightness / 255})\`;`;
    } else {
      const cName = colors[0] || "blue";
      const rgb = getRGBForColor(cName);
      cppCode = `// AI Local: ${cName.toUpperCase()} Digital Rain
float speed = timeMs * 0.003f * ${speedMult}f;
float cell = floor(r * 12.0f - speed);
float bright = fmod(speed * (sin(cell * 19.34f) * 0.5f + 0.5f), 1.0f);
if (bright < 0.25f) return RgbColor(0,0,0);
return RgbColor(bright * ${rgb.r}, bright * ${rgb.g}, bright * ${rgb.b});`;

      jsCode = `// AI Local: ${cName.toUpperCase()} Digital Rain
const speed = time * 0.06 * ${speedMult};
const cell = Math.floor(ledIndex - speed);
const bright = (speed * (Math.abs(Math.sin(cell * 19.34)) * 0.5 + 0.5)) % 1;
if (bright < 0.25) return 'rgba(0,0,0,0)';
const r = Math.floor(bright * ${rgb.r});
const g = Math.floor(bright * ${rgb.g});
const b = Math.floor(bright * ${rgb.b});
return \`rgba(\${r}, \${g}, \${b}, \${brightness / 255})\`;`;
    }
  } else if (pattern === "pulse" || pattern === "ripple") {
    if (colors.includes("rainbow")) {
      cppCode = `// AI Local: Rainbow Ripple Waves
float wave = sin((r * 8.0f) - (timeMs * 0.005f * ${speedMult}f));
float norm = (wave + 1.0f) * 0.5f;
float hue = fmod(r * 360.0f + (timeMs * 0.1f * ${speedMult}f), 360.0f);
float s = 1.0f; float v = norm;
float c = v * s;
float x = c * (1.0f - fabs(fmod(hue / 60.0f, 2.0f) - 1.0f));
float m = v - c;
float r_, g_, b_;
if(hue < 60.0f) { r_ = c; g_ = x; b_ = 0; }
else if(hue < 120.0f) { r_ = x; g_ = c; b_ = 0; }
else if(hue < 180.0f) { r_ = 0; g_ = c; b_ = x; }
else if(hue < 240.0f) { r_ = 0; g_ = x; b_ = c; }
else if(hue < 300.0f) { r_ = x; g_ = 0; b_ = c; }
else { r_ = c; g_ = 0; b_ = x; }
return RgbColor((r_ + m) * 255, (g_ + m) * 255, (b_ + m) * 255);`;

      jsCode = `// AI Local: Rainbow Ripple Waves
const wave = Math.sin((ledIndex * 0.6) - (time * 0.12 * ${speedMult}));
const intensity = (wave + 1) / 2;
const hue = (ledIndex * 24 + time * 4 * ${speedMult}) % 360;
return \`hsla(\${hue}, 100%, \${Math.floor(intensity * 50)}%, \${brightness / 255})\`;`;
    } else {
      const cName = colors[0] || "magenta";
      const rgb = getRGBForColor(cName);
      cppCode = `// AI Local: ${cName.toUpperCase()} Pulsing Ripple
float wave = sin((r * 10.0f) - (timeMs * 0.007f * ${speedMult}f));
float intensity = pow((wave + 1.0f) * 0.5f, 2.0f);
return RgbColor(intensity * ${rgb.r}, intensity * ${rgb.g}, intensity * ${rgb.b});`;

      jsCode = `// AI Local: ${cName.toUpperCase()} Pulsing Ripple
const wave = Math.sin((ledIndex * 0.7) - (time * 0.15 * ${speedMult}));
const intensity = Math.pow((wave + 1) / 2, 2);
const r = Math.floor(${rgb.r} * intensity);
const g = Math.floor(${rgb.g} * intensity);
const b = Math.floor(${rgb.b} * intensity);
return \`rgba(\${r}, \${g}, \${b}, \${brightness / 255})\`;`;
    }
  } else if (pattern === "strobe") {
    const cName = colors[0] || "white";
    const rgb = getRGBForColor(cName);
    cppCode = `// AI Local: ${cName.toUpperCase()} Strobe Pulse
unsigned long phase = (timeMs / (int)(150 / ${speedMult})) % 2;
float bright = phase == 0 ? 1.0f : 0.0f;
return RgbColor(bright * ${rgb.r}, bright * ${rgb.g}, bright * ${rgb.b});`;

    jsCode = `// AI Local: ${cName.toUpperCase()} Strobe Pulse
const phase = Math.floor(time * 0.4 * ${speedMult}) % 2;
const bright = phase === 0 ? 1 : 0;
return \`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, \${bright * (brightness / 255)})\`;`;
  } else if (pattern === "scanner") {
    const cName = colors[0] || "red";
    const rgb = getRGBForColor(cName);
    cppCode = `// AI Local: ${cName.toUpperCase()} Sweeping Scanner
float pos = fmod(timeMs * 0.002f * ${speedMult}f, 2.0f);
if (pos > 1.0f) pos = 2.0f - pos;
float dist = fabs(r - pos);
float intensity = exp(-dist * 15.0f);
if (intensity < 0.05f) return RgbColor(0,0,0);
return RgbColor(intensity * ${rgb.r}, intensity * ${rgb.g}, intensity * ${rgb.b});`;

    jsCode = `// AI Local: ${cName.toUpperCase()} Sweeping Scanner
const pos = (time * 0.04 * ${speedMult}) % 2;
const bounce = pos > 1 ? 2 - pos : pos;
const dist = Math.abs((ledIndex / 14) - bounce);
const intensity = Math.exp(-dist * 12);
if (intensity < 0.05) return 'rgba(0,0,0,0)';
const r = Math.floor(${rgb.r} * intensity);
const g = Math.floor(${rgb.g} * intensity);
const b = Math.floor(${rgb.b} * intensity);
return \`rgba(\${r}, \${g}, \${b}, \${brightness / 255})\`;`;
  } else if (pattern === "sparkle") {
    const cName = colors[0] || "gold";
    const rgb = getRGBForColor(cName);
    cppCode = `// AI Local: Sparkling ${cName.toUpperCase()} Stars
float randSeed = ledIdx * 37.42f + angle * 19.11f;
float randVal = sin(randSeed + (timeMs * 0.008f * ${speedMult}f));
float intensity = randVal > 0.85f ? (randVal - 0.85f) / 0.15f : 0.0f;
return RgbColor(intensity * ${rgb.r}, intensity * ${rgb.g}, intensity * ${rgb.b});`;

    jsCode = `// AI Local: Sparkling ${cName.toUpperCase()} Stars
const randSeed = ledIndex * 43.12 + angle * 13.56;
const randVal = Math.sin(randSeed + (time * 0.2 * ${speedMult}));
const intensity = randVal > 0.85 ? (randVal - 0.85) / 0.15 : 0;
const r = Math.floor(${rgb.r} * intensity);
const g = Math.floor(${rgb.g} * intensity);
const b = Math.floor(${rgb.b} * intensity);
return \`rgba(\${r}, \${g}, \${b}, \${brightness / 255})\`;`;
  } else {
    if (colors.includes("rainbow")) {
      cppCode = `// AI Local: Fluid Rainbow Wave
float hue = angle + (r * 180.0f) + (timeMs * 0.08f * ${speedMult}f);
while(hue >= 360.0f) hue -= 360.0f;
while(hue < 0.0f) hue += 360.0f;
float s = 1.0f; float v = 1.0f;
float c = v * s;
float x = c * (1.0f - fabs(fmod(hue / 60.0f, 2.0f) - 1.0f));
float m = v - c;
float r_, g_, b_;
if(hue < 60.0f) { r_ = c; g_ = x; b_ = 0; }
else if(hue < 120.0f) { r_ = x; g_ = c; b_ = 0; }
else if(hue < 180.0f) { r_ = 0; g_ = c; b_ = x; }
else if(hue < 240.0f) { r_ = 0; g_ = x; b_ = c; }
else if(hue < 300.0f) { r_ = x; g_ = 0; b_ = c; }
else { r_ = c; g_ = 0; b_ = x; }
return RgbColor((r_ + m) * 255, (g_ + m) * 255, (b_ + m) * 255);`;

      jsCode = `// AI Local: Fluid Rainbow Wave
const hue = (angle + (ledIndex / 15) * 180 + time * 4 * ${speedMult}) % 360;
return \`hsla(\${hue}, 100%, 50%, \${brightness / 255})\`;`;
    } else {
      const cName = colors[0] || "cyan";
      const rgb = getRGBForColor(cName);
      cppCode = `// AI Local: ${cName.toUpperCase()} Fluid Wave
float wave = sin((angle * DEG_TO_RAD) + (r * 3.14f) + (timeMs * 0.005f * ${speedMult}f));
float intensity = (wave + 1.0f) * 0.5f;
return RgbColor(intensity * ${rgb.r}, intensity * ${rgb.g}, intensity * ${rgb.b});`;

      jsCode = `// AI Local: ${cName.toUpperCase()} Fluid Wave
const wave = Math.sin((angle * Math.PI / 180) + (ledIndex * 0.2) + (time * 0.1 * ${speedMult}));
const intensity = (wave + 1) / 2;
const r = Math.floor(${rgb.r} * intensity);
const g = Math.floor(${rgb.g} * intensity);
const b = Math.floor(${rgb.b} * intensity);
return \`rgba(\${r}, \${g}, \${b}, \${brightness / 255})\`;`;
    }
  }

  return { cpp: cppCode, js: jsCode };
}

function getRGBForColor(c: string): { r: number; g: number; b: number } {
  switch (c) {
    case "red": return { r: 255, g: 30, b: 30 };
    case "orange": return { r: 255, g: 120, b: 10 };
    case "gold":
    case "yellow": return { r: 255, g: 190, b: 0 };
    case "green": return { r: 20, g: 255, b: 20 };
    case "blue": return { r: 30, g: 100, b: 255 };
    case "cyan": return { r: 0, g: 230, b: 240 };
    case "purple": return { r: 180, g: 30, b: 255 };
    case "magenta": return { r: 255, g: 0, b: 150 };
    case "pink": return { r: 255, g: 240, b: 150 };
    case "white": return { r: 255, g: 255, b: 255 };
    case "neon": return { r: 232, g: 121, b: 249 };
    default: return { r: 0, g: 230, b: 240 };
  }
}
