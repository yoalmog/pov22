import React, { useState, useEffect } from "react";
import { Cpu, Download, CheckCircle, Trash2, ArrowLeft, Loader2, RefreshCw, AlertTriangle, HelpCircle, FileText, Smartphone } from "lucide-react";
import { PlatformGuideModal } from "./PlatformGuideModal";

interface AiModelInstallerProps {
  onBack: () => void;
}

export const AiModelInstaller: React.FC<AiModelInstallerProps> = ({ onBack }) => {
  const [gestureModelStatus, setGestureModelStatus] = useState<"checking" | "not_installed" | "installed">("checking");
  const [chromeAiStatus, setChromeAiStatus] = useState<"checking" | "not_installed" | "installed">("checking");
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);
  const [isTestingChromeAi, setIsTestingChromeAi] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPlatformGuide, setShowPlatformGuide] = useState(false);

  const modelUrl = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
  const cacheName = "holospin-ai-models";

  useEffect(() => {
    checkModels();
  }, []);

  const checkModels = async () => {
    // 1. Check if MediaPipe gesture model is in the browser Cache Storage
    try {
      if ("caches" in window) {
        const cache = await caches.open(cacheName);
        const matched = await cache.match(modelUrl);
        if (matched) {
          setGestureModelStatus("installed");
        } else {
          setGestureModelStatus("not_installed");
        }
      } else {
        setGestureModelStatus("not_installed");
      }
    } catch (e) {
      setGestureModelStatus("not_installed");
    }

    // 2. Check if Chrome window.ai is available
    try {
      if ("ai" in window && "languageModel" in (window as any).ai) {
        const capabilities = await (window as any).ai.languageModel.capabilities();
        if (capabilities.available !== "no") {
          setChromeAiStatus("installed");
        } else {
          setChromeAiStatus("not_installed");
        }
      } else {
        setChromeAiStatus("not_installed");
      }
    } catch (e) {
      setChromeAiStatus("not_installed");
    }
  };

  const handleInstallGestureModel = async () => {
    if (!("caches" in window)) {
      setError("This browser does not support local Cache Storage. Please use standard Chrome or Safari.");
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    setError(null);

    try {
      // Fetch with progress tracking
      const response = await fetch(modelUrl);
      if (!response.ok) throw new Error("Failed to download model from Google Cloud CDN.");

      const contentLength = response.headers.get("content-length");
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 5600000; // approx 5.6MB
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error("ReadableStream not supported on this connection.");

      let receivedBytes = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        chunks.push(value);
        receivedBytes += value.length;
        setDownloadProgress(Math.round((receivedBytes / totalBytes) * 100));
      }

      // Combine chunks and cache the result
      const blob = new Blob(chunks as any);
      const cacheResponse = new Response(blob, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Length": totalBytes.toString()
        }
      });

      const cache = await caches.open(cacheName);
      await cache.put(modelUrl, cacheResponse);

      setGestureModelStatus("installed");
    } catch (err: any) {
      setError(err.message || "Failed to download and install local AI model.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleUninstallGestureModel = async () => {
    try {
      if ("caches" in window) {
        const cache = await caches.open(cacheName);
        await cache.delete(modelUrl);
        setGestureModelStatus("not_installed");
      }
    } catch (err: any) {
      setError("Failed to uninstall local model cache.");
    }
  };

  const handleTestChromeAi = async () => {
    if (!("ai" in window) || !("languageModel" in (window as any).ai)) {
      setError("Chrome built-in AI is not available in this browser environment.");
      return;
    }

    setIsTestingChromeAi(true);
    setDiagnosticResult(null);
    try {
      const session = await (window as any).ai.languageModel.create({
        systemPrompt: "You are a friendly hardware assistant. Keep responses under 15 words."
      });
      const response = await session.prompt("Say hello to the HoloSpin user and tell them if your synaptic pathways are active!");
      setDiagnosticResult(response);
    } catch (err: any) {
      setDiagnosticResult(`Error running local inference: ${err.message || err}`);
    } finally {
      setIsTestingChromeAi(false);
    }
  };

  return (
    <div className="px-5 pt-2 pb-28 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header Row */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 border border-slate-800 rounded-xl bg-slate-900/50 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h3 className="text-[13px] text-slate-200 font-black tracking-widest uppercase flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            AI Core Model Installer / התקנת מודלים
          </h3>
          <p className="text-[10px] text-slate-500">Enable zero-latency, full offline artificial intelligence</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-2xl flex gap-3 text-rose-400 text-[11px] leading-relaxed">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Model 1: MediaPipe Gesture Tracker */}
      <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800/60 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-black tracking-widest uppercase text-slate-200">
              MediaPipe Gesture Recognition Model
            </span>
            <span className="text-[9px] text-slate-400">
              Weights: 5.6 MB • On-Device Hand Tracking and Gesture Analysis
            </span>
          </div>

          {gestureModelStatus === "checking" ? (
            <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
          ) : gestureModelStatus === "installed" ? (
            <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-400 px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 border border-emerald-500/20">
              <CheckCircle className="w-3 h-3" /> Offline Installed
            </span>
          ) : (
            <span className="text-[9px] font-bold bg-amber-500/15 text-amber-400 px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 border border-amber-500/20 animate-pulse">
              Network Loaded
            </span>
          )}
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          By default, the 3D hand landmarks tracker loads the required 5.6 MB machine learning model from Google's CDN. Pre-installing caches it directly in your browser's persistent sandbox, making gesture controls work 100% offline with zero load delay.
        </p>

        {isDownloading ? (
          <div className="flex flex-col gap-2 p-4 bg-slate-950/60 border border-slate-800/50 rounded-2xl">
            <div className="flex justify-between items-center text-[10px] font-bold tracking-wider uppercase text-indigo-400">
              <span>Downloading weights...</span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800/30">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-150"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex gap-2.5 mt-1">
            {gestureModelStatus === "installed" ? (
              <button
                onClick={handleUninstallGestureModel}
                className="flex-1 py-3 px-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[9.5px] font-bold tracking-widest text-rose-400 hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                UNINSTALL MODEL CACHE
              </button>
            ) : (
              <button
                onClick={handleInstallGestureModel}
                className="flex-1 py-3 px-4 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl text-[9.5px] font-bold tracking-widest text-indigo-400 hover:bg-indigo-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 animate-bounce" />
                INSTALL FOR FULL OFFLINE SUPPORT (5.6 MB)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Model 2: Google Chrome Gemini Nano */}
      <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800/60 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-black tracking-widest uppercase text-slate-200">
              Chrome Gemini Nano (Local LLM API)
            </span>
            <span className="text-[9px] text-slate-400">
              Size: ~1.5 GB • On-Device Generative AI Text-to-Pattern Engine
            </span>
          </div>

          {chromeAiStatus === "checking" ? (
            <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
          ) : chromeAiStatus === "installed" ? (
            <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-400 px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 border border-emerald-500/20">
              <CheckCircle className="w-3 h-3" /> API Active
            </span>
          ) : (
            <span className="text-[9px] font-bold bg-rose-500/15 text-rose-400 px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 border border-rose-500/20">
              Requires Install
            </span>
          )}
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Google Chrome features built-in Gemini Nano on-device models. Enabling this API allows you to synthesize creative LED visualizer code instantly right inside your browser, completely bypass cloud quotas, and preserve full data privacy.
        </p>

        {chromeAiStatus !== "installed" ? (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
            <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              Installation & Configuration Steps:
            </span>
            <ol className="text-[10px] text-slate-400 list-decimal pl-4 space-y-2 leading-relaxed">
              <li>
                Open a new browser tab and enter <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">chrome://flags</code> in the search bar.
              </li>
              <li>
                Search for <strong className="text-slate-200">Prompt API for Gemini Nano</strong> (on Desktop) or <strong className="text-slate-200">Prompt API for Gemini Nano with Multimodal Input</strong> (on Mobile) and set it to <strong className="text-emerald-400">Enabled</strong>.
              </li>
              <li>
                Search for <strong className="text-slate-200">Enables optimization guide on device</strong> and select <strong className="text-emerald-400">Enabled BypassperfRequirement</strong>.
              </li>
              <li>
                Relaunch Google Chrome to apply settings.
              </li>
              <li>
                Go to <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">chrome://components</code>, find <strong className="text-slate-200">Optimization Guide On Device Model</strong>, and click <strong className="text-[#8b5cf6]">Check for update</strong> to download the local model weights (~1.5GB).
              </li>
              <li>
                Refresh this application once the download finishes!
              </li>
            </ol>
            
            {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
              <button 
                onClick={() => setShowPlatformGuide(true)}
                className="mt-2 w-full py-2.5 px-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-[9.5px] font-bold tracking-widest text-indigo-400 hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-3.5 h-3.5" />
                READ MOBILE PLATFORM GUIDE
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              onClick={handleTestChromeAi}
              disabled={isTestingChromeAi}
              className="w-full py-3 px-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-[9.5px] font-bold tracking-widest text-emerald-400 hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2"
            >
              {isTestingChromeAi ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  RUNNING INFERENCE...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  RUN ON-DEVICE DIAGNOSTIC TEST
                </>
              )}
            </button>
            {diagnosticResult && (
              <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl flex flex-col gap-1.5">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <FileText className="w-3 h-3 text-cyan-400" /> Model Diagnostic Response:
                </span>
                <p className="text-[11px] font-mono text-emerald-300 italic">
                  "{diagnosticResult}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {showPlatformGuide && (
        <PlatformGuideModal onClose={() => setShowPlatformGuide(false)} />
      )}
    </div>
  );
};
