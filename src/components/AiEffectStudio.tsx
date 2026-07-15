import React, { useState, useEffect } from "react";
import { Sparkles, Loader2, Send, Cpu } from "lucide-react";

interface Props {
  onEffectGenerated: (code: string, js: string) => void;
}

export const AiEffectStudio: React.FC<Props> = ({ onEffectGenerated }) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocalAiAvailable, setIsLocalAiAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if Chrome's local window.ai is available
    const checkLocalAi = async () => {
      try {
        if ('ai' in window && 'languageModel' in (window as any).ai) {
          const capabilities = await (window as any).ai.languageModel.capabilities();
          setIsLocalAiAvailable(capabilities.available !== 'no');
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

      if (isLocalAiAvailable) {
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
      } else {
        // Fallback to Server-Side Cloud Gemini API
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
      
      onEffectGenerated(parsed.cpp, parsed.js);
      setPrompt("");
    } catch (err: any) {
      setError(err.message || "An error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
        <h3 className="text-[13px] font-black text-slate-200 tracking-widest uppercase">
          HoloSpin AI Effect Studio
        </h3>
        {isLocalAiAvailable === true ? (
          <span className="ml-auto text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
            On-Device AI
          </span>
        ) : (
          <span className="ml-auto text-[9px] bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
            Cloud Gemini AI
          </span>
        )}
      </div>
      
      <p className="text-[11px] text-slate-400">
        Describe a custom lighting effect. Our AI engine will generate the optimized C++ and JS code in real-time.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A rotating galaxy with purple and gold stars..."
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
      
      {isLocalAiAvailable === false && (
        <div className="text-[10px] text-slate-400 bg-slate-900/50 p-3 rounded-xl border border-slate-800/60 leading-relaxed">
          ✨ <strong className="text-slate-300">Tip:</strong> Operating in <strong className="text-indigo-400 font-bold">Cloud Gemini AI Mode</strong> since your browser does not support on-device models. Generation is fully enabled!
        </div>
      )}

      {error && (
        <div className="text-[11px] text-rose-400 bg-rose-400/10 p-3 rounded-xl border border-rose-400/20">
          {error}
        </div>
      )}
    </div>
  );
};
