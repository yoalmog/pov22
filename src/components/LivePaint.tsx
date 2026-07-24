import * as React from 'react';
import { useRef, useState, useEffect } from 'react';
import { 
  PenTool, 
  Eraser, 
  Trash2, 
  RotateCw, 
  Sparkles, 
  Play, 
  Pause, 
  Eye, 
  Download,
  Info,
  Check,
  RefreshCw,
  Zap
} from 'lucide-react';

interface Props {
  onFrameUpdate: (data: string) => void;
}

const NEON_PRESETS = [
  '#00b4d8', // Neon Blue
  '#00f5d4', // Neon Teal
  '#70e000', // Neon Green
  '#ffee32', // Neon Yellow
  '#ff9f1c', // Neon Orange
  '#ff007f', // Neon Pink
  '#9b5de5', // Neon Purple
  '#ffffff', // Cool White
];

export const LivePaint: React.FC<Props> = ({ onFrameUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const miniCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#00b4d8');
  const [brushSize, setBrushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);
  
  // Preview configuration
  const [fanSpeed, setFanSpeed] = useState(80);
  const [isFanSpinning, setIsFanSpinning] = useState(true);
  const [showLedTracks, setShowLedTracks] = useState(true);
  const [glowIntensity, setGlowIntensity] = useState(15);

  // Sync and Mini Overlay configuration
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [isAutoSync, setIsAutoSync] = useState(false);
  const [miniPos, setMiniPos] = useState<'br' | 'bl' | 'tl' | 'tr' | 'hidden'>('br');

  const getMiniPosClass = () => {
    switch (miniPos) {
      case 'br': return 'bottom-3 right-3';
      case 'bl': return 'bottom-3 left-3';
      case 'tl': return 'top-3 left-3';
      case 'tr': return 'top-3 right-3';
      default: return 'bottom-3 right-3';
    }
  };

  const cycleMiniPos = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setMiniPos(prev => {
      if (prev === 'br') return 'bl';
      if (prev === 'bl') return 'tl';
      if (prev === 'tl') return 'tr';
      if (prev === 'tr') return 'hidden';
      return 'br';
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
         ctx.fillStyle = 'black';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  // Real-time Holographic POV Fan Simulation
  useEffect(() => {
    const previewCanvas = previewCanvasRef.current;
    const drawingCanvas = canvasRef.current;
    if (!previewCanvas || !drawingCanvas) return;

    const pCtx = previewCanvas.getContext('2d');
    if (!pCtx) return;

    // High DPI Canvas support
    const dpr = window.devicePixelRatio || 1;
    previewCanvas.width = 256 * dpr;
    previewCanvas.height = 256 * dpr;
    pCtx.scale(dpr, dpr);

    let animFrameId: number;
    let rotation = 0;

    const render = () => {
      const w = 256;
      const h = 256;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(cx, cy) * 0.95;

      // Persistence of Vision Fade effect (creates beautiful light trails)
      const speedNormalized = isFanSpinning ? fanSpeed / 100 : 0;
      const fadeAlpha = speedNormalized === 0 ? 1.0 : Math.max(0.015, 0.18 - speedNormalized * 0.13);

      pCtx.save();
      pCtx.globalCompositeOperation = 'destination-out';
      pCtx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
      pCtx.fillRect(0, 0, w, h);
      pCtx.restore();

      // Rotate blade
      if (isFanSpinning && fanSpeed > 0) {
        rotation += (fanSpeed / 100) * 0.16;
      }

      // Drawing state:
      if (speedNormalized > 0) {
        // Draw the spinning blade mask (propeller)
        pCtx.save();
        pCtx.translate(cx, cy);
        pCtx.rotate(rotation);

        pCtx.beginPath();
        const bladeW = 9; // Simulated LED strip blade width
        pCtx.rect(-radius, -bladeW / 2, radius * 2, bladeW);
        pCtx.rect(-bladeW / 2, -radius, bladeW, radius * 2);
        pCtx.restore();

        pCtx.save();
        pCtx.clip(); // Apply the rotating propeller clip

        // Render stationary source image inside the clipped blade
        pCtx.globalCompositeOperation = 'screen';
        pCtx.shadowBlur = glowIntensity;
        pCtx.shadowColor = color; // Dynamic neon aura based on brush color
        pCtx.drawImage(drawingCanvas, 0, 0, w, h);
        pCtx.restore();

        // Simulated LED concentric gaps / tracks
        if (showLedTracks) {
          pCtx.save();
          pCtx.globalCompositeOperation = 'destination-out';
          pCtx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
          pCtx.lineWidth = 1;
          pCtx.beginPath();
          for (let r = 12; r < radius; r += 3) {
            pCtx.moveTo(cx + r, cy);
            pCtx.arc(cx, cy, r, 0, Math.PI * 2);
          }
          pCtx.stroke();
          pCtx.restore();
        }
      } else {
        // Static preview mode: show entire canvas with slight transparency, overlaying the stopped blades
        pCtx.save();
        pCtx.globalCompositeOperation = 'source-over';
        // Background canvas outline
        pCtx.drawImage(drawingCanvas, 0, 0, w, h);

        // Draw static propeller on top in translucent black/gray
        pCtx.translate(cx, cy);
        pCtx.rotate(rotation);
        pCtx.fillStyle = 'rgba(21, 23, 32, 0.75)';
        pCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        pCtx.lineWidth = 1;
        const bladeW = 10;
        pCtx.fillRect(-radius, -bladeW / 2, radius * 2, bladeW);
        pCtx.strokeRect(-radius, -bladeW / 2, radius * 2, bladeW);
        pCtx.fillRect(-bladeW / 2, -radius, bladeW, radius * 2);
        pCtx.strokeRect(-bladeW / 2, -radius, bladeW, radius * 2);

        // Draw small yellow/cyan LEDs on the static blade
        pCtx.fillStyle = '#ffee32';
        for (let x = 12; x < radius - 5; x += 6) {
          pCtx.fillRect(x, -1, 2, 2);
          pCtx.fillRect(-x, -1, 2, 2);
          pCtx.fillRect(-1, x, 2, 2);
          pCtx.fillRect(-1, -x, 2, 2);
        }

        pCtx.restore();
      }

      // Draw the central motor hub
      pCtx.save();
      const hubGrad = pCtx.createLinearGradient(cx - 14, cy - 14, cx + 14, cy + 14);
      hubGrad.addColorStop(0, '#3e3f46');
      hubGrad.addColorStop(0.5, '#131417');
      hubGrad.addColorStop(1, '#24252b');
      pCtx.fillStyle = hubGrad;
      pCtx.beginPath();
      pCtx.arc(cx, cy, 14, 0, Math.PI * 2);
      pCtx.fill();

      // Hub inner dark bezel
      pCtx.fillStyle = '#06070a';
      pCtx.beginPath();
      pCtx.arc(cx, cy, 9, 0, Math.PI * 2);
      pCtx.fill();

      // Shiny center screw rivet
      const centerGrad = pCtx.createRadialGradient(cx, cy, 0, cx, cy, 4);
      centerGrad.addColorStop(0, '#777');
      centerGrad.addColorStop(1, '#111');
      pCtx.fillStyle = centerGrad;
      pCtx.beginPath();
      pCtx.arc(cx, cy, 4, 0, Math.PI * 2);
      pCtx.fill();
      pCtx.restore();

      // Render to miniaturized preview canvas if available
      const miniCanvas = miniCanvasRef.current;
      if (miniCanvas) {
        const mCtx = miniCanvas.getContext('2d');
        if (mCtx) {
          const mdpr = window.devicePixelRatio || 1;
          const mw = 80;
          const mh = 80;
          if (miniCanvas.width !== mw * mdpr) {
            miniCanvas.width = mw * mdpr;
            miniCanvas.height = mh * mdpr;
            mCtx.scale(mdpr, mdpr);
          }
          const mcx = mw / 2;
          const mcy = mh / 2;
          const mradius = Math.min(mcx, mcy) * 0.95;

          mCtx.save();
          mCtx.globalCompositeOperation = 'destination-out';
          mCtx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
          mCtx.fillRect(0, 0, mw, mh);
          mCtx.restore();

          if (speedNormalized > 0) {
            mCtx.save();
            mCtx.translate(mcx, mcy);
            mCtx.rotate(rotation);

            mCtx.beginPath();
            const mbladeW = 3.5;
            mCtx.rect(-mradius, -mbladeW / 2, mradius * 2, mbladeW);
            mCtx.rect(-mbladeW / 2, -mradius, mbladeW, mradius * 2);
            mCtx.restore();

            mCtx.save();
            mCtx.clip();

            mCtx.globalCompositeOperation = 'screen';
            mCtx.shadowBlur = glowIntensity / 2;
            mCtx.shadowColor = color;
            mCtx.drawImage(drawingCanvas, 0, 0, mw, mh);
            mCtx.restore();

            if (showLedTracks) {
              mCtx.save();
              mCtx.globalCompositeOperation = 'destination-out';
              mCtx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
              mCtx.lineWidth = 0.5;
              mCtx.beginPath();
              for (let r = 4; r < mradius; r += 2) {
                mCtx.moveTo(mcx + r, mcy);
                mCtx.arc(mcx, mcy, r, 0, Math.PI * 2);
              }
              mCtx.stroke();
              mCtx.restore();
            }
          } else {
            mCtx.save();
            mCtx.globalCompositeOperation = 'source-over';
            mCtx.drawImage(drawingCanvas, 0, 0, mw, mh);

            mCtx.translate(mcx, mcy);
            mCtx.rotate(rotation);
            mCtx.fillStyle = 'rgba(21, 23, 32, 0.8)';
            mCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            mCtx.lineWidth = 0.5;
            const mbladeW = 4;
            mCtx.fillRect(-mradius, -mbladeW / 2, mradius * 2, mbladeW);
            mCtx.strokeRect(-mradius, -mbladeW / 2, mradius * 2, mbladeW);
            mCtx.fillRect(-mbladeW / 2, -mradius, mbladeW, mradius * 2);
            mCtx.strokeRect(-mbladeW / 2, -mradius, mbladeW, mradius * 2);

            mCtx.fillStyle = '#ffee32';
            for (let x = 4; x < mradius - 2; x += 3) {
              mCtx.fillRect(x, -0.5, 1, 1);
              mCtx.fillRect(-x, -0.5, 1, 1);
              mCtx.fillRect(-0.5, x, 1, 1);
              mCtx.fillRect(-0.5, -x, 1, 1);
            }

            mCtx.restore();
          }

          mCtx.save();
          mCtx.fillStyle = '#131417';
          mCtx.beginPath();
          mCtx.arc(mcx, mcy, 4, 0, Math.PI * 2);
          mCtx.fill();
          mCtx.restore();
        }
      }

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [isFanSpinning, fanSpeed, showLedTracks, glowIntensity, color]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDraw = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.beginPath();
      if (isAutoSync) {
        onFrameUpdate(canvas.toDataURL('image/jpeg', 0.5));
      }
    }
  };

  const handleSyncToDevice = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsSyncing(true);
    setSyncSuccess(false);

    // High fidelity synchronization pipeline
    setTimeout(() => {
      onFrameUpdate(canvas.toDataURL('image/jpeg', 0.5));
      setIsSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2000);
    }, 600);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getPos(e);

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? 'black' : color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        onFrameUpdate(canvas.toDataURL('image/jpeg', 0.5));
      }
    }
  };

  const handleDownloadArt = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `POV_Art_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div id="live-paint-module" className="bg-[#0c0e15] border border-slate-800 rounded-3xl p-6 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
      
      {/* Decorative backdrop elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#00b4d8]/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Title block */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <PenTool className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white tracking-wider uppercase leading-none">Holographic Live Paint</h3>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-1 inline-block">Real-time POV Fan Synthesis</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDownloadArt} 
            className="p-2 bg-slate-800/60 hover:bg-slate-700/60 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-700/50"
            title="Download Canvas Image"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={clearCanvas} 
            className="p-2 bg-slate-800/60 hover:bg-rose-950/40 rounded-xl text-slate-400 hover:text-rose-400 transition-all border border-slate-700/50 hover:border-rose-900/30"
            title="Clear Canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main split-screen grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Left Column: Drawing Workspace */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">1. Draw on Canvas</span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-slate-500">Brush Size: {brushSize}px</span>
              <div 
                className="rounded-full bg-slate-200 border border-slate-700/50" 
                style={{ width: Math.max(4, brushSize / 2), height: Math.max(4, brushSize / 2), backgroundColor: isEraser ? '#000' : color }}
              />
            </div>
          </div>

          {/* Interactive Canvas Container */}
          <div className="flex justify-center border-2 border-slate-800/80 rounded-2xl overflow-hidden bg-black touch-none relative group hover:border-slate-700 transition">
            <canvas 
              ref={canvasRef}
              width={256}
              height={256}
              className="w-full max-w-[256px] aspect-square cursor-crosshair"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
            {/* Real-time Miniaturized Preview Overlay */}
            {miniPos !== 'hidden' && (
              <div 
                onClick={cycleMiniPos}
                className={`absolute ${getMiniPosClass()} w-20 h-20 rounded-full border border-[#00b4d8]/40 bg-black/90 overflow-hidden shadow-[0_0_15px_rgba(0,180,216,0.35)] select-none pointer-events-auto cursor-pointer flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 group/mini`}
                title="Mini POV Preview. Click to cycle corners or hide."
              >
                <canvas 
                  ref={miniCanvasRef}
                  className="w-full h-full rounded-full"
                  style={{ mixBlendMode: 'screen' }}
                />
                <div className="absolute inset-0 rounded-full border border-[#00b4d8]/10 pointer-events-none"></div>
                {/* Mini tag indicator */}
                <div className="absolute bottom-1 bg-black/85 px-1 py-0.5 rounded border border-[#00b4d8]/20 scale-75 origin-bottom pointer-events-none opacity-80 group-hover/mini:opacity-100 transition-opacity">
                  <span className="text-[6px] font-black text-[#00b4d8] uppercase tracking-widest leading-none">LIVE POV</span>
                </div>
              </div>
            )}
            {/* Soft grid helper overlays (barely visible) */}
            <div className="absolute inset-0 pointer-events-none border border-white/[0.02]"></div>
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/[0.03] pointer-events-none"></div>
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/[0.03] pointer-events-none"></div>
          </div>

          {/* Real-time Miniaturized Preview Overlay & Device Sync Panel */}
          <div className="flex flex-col gap-3 bg-[#0d1527]/30 p-4 rounded-2xl border border-[#00b4d8]/20 shadow-[0_0_15px_rgba(0,180,216,0.02)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#00b4d8]" />
                <span className="text-[10px] font-black text-slate-300 tracking-wider uppercase">ESP32 Sync Controller</span>
              </div>
              {/* Optional Mini Overlay Restorer Button */}
              {miniPos === 'hidden' && (
                <button
                  onClick={() => setMiniPos('br')}
                  className="text-[8px] font-bold text-[#00b4d8] hover:underline uppercase tracking-wider bg-[#00b4d8]/5 px-2 py-0.5 rounded border border-[#00b4d8]/15 cursor-pointer"
                >
                  Show Mini Preview
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Sync Trigger Button */}
              <button
                onClick={handleSyncToDevice}
                disabled={isSyncing}
                className={`flex-1 py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  syncSuccess
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                    : isSyncing
                    ? 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#00b4d8]/20 to-indigo-500/10 hover:from-[#00b4d8]/30 hover:to-indigo-500/20 border-[#00b4d8]/40 hover:border-[#00b4d8]/60 text-white shadow-[0_4px_12px_rgba(0,180,216,0.1)] active:scale-95'
                }`}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#00b4d8]" />
                    <span>Syncing Canvas...</span>
                  </>
                ) : syncSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400 stroke-[3px]" />
                    <span>Synced to POV!</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-[#00b4d8]" />
                    <span>Apply Frame Buffer</span>
                  </>
                )}
              </button>

              {/* Auto Sync Toggle */}
              <label className="flex items-center justify-between sm:justify-start gap-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl cursor-pointer select-none transition">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-wide">Auto-Sync</span>
                  <span className="text-[7px] text-slate-500 leading-none mt-0.5">Push on every stroke</span>
                </div>
                <input
                  type="checkbox"
                  checked={isAutoSync}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsAutoSync(checked);
                    // Automatically push once if they turn it ON
                    if (checked) {
                      const canvas = canvasRef.current;
                      if (canvas) {
                        onFrameUpdate(canvas.toDataURL('image/jpeg', 0.5));
                      }
                    }
                  }}
                  className="w-4 h-4 rounded-md bg-slate-950 border-slate-800 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer accent-emerald-500"
                />
              </label>
            </div>
            {/* Short helper hint */}
            <p className="text-[8px] text-slate-500 leading-normal">
              Verify your painting using the rotating <strong className="text-slate-400 font-bold">Mini POV Overlay</strong> inside the canvas area, then tap <strong className="text-[#00b4d8] font-bold">Apply</strong> to push to the ESP32 fan memory.
            </p>
          </div>

          {/* Brush Painting Controls */}
          <div className="flex flex-col gap-3 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
            {/* Presets and Custom Color Picker */}
            <div className="flex flex-col gap-2">
              <span className="text-[8px] font-black text-slate-500 tracking-wider uppercase">Select Color Palette</span>
              <div className="flex flex-wrap items-center gap-2">
                {/* Custom Color Input Wrapper */}
                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center cursor-pointer hover:border-slate-500 transition">
                  <input 
                    type="color" 
                    value={color}
                    onChange={(e) => { setColor(e.target.value); setIsEraser(false); }}
                    className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                  />
                  <div className="w-5 h-5 rounded-md border border-white/20" style={{ backgroundColor: color }}></div>
                </div>

                {/* Preset circles */}
                {NEON_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => { setColor(preset); setIsEraser(false); }}
                    className={`w-7 h-7 rounded-lg border-2 transition-all ${
                      color === preset && !isEraser 
                        ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.2)]' 
                        : 'border-transparent hover:scale-105 hover:border-slate-600'
                    }`}
                    style={{ backgroundColor: preset }}
                  />
                ))}

                {/* Eraser */}
                <button 
                  onClick={() => setIsEraser(!isEraser)}
                  className={`ml-auto p-2 rounded-xl border transition-all flex items-center justify-center ${
                    isEraser 
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]' 
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                  title="Toggle Eraser"
                >
                  <Eraser className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Brush Size Range Slider */}
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex justify-between items-center text-[8px] font-black text-slate-500 tracking-wider uppercase">
                <span>Brush Thickness</span>
                <span className="font-mono text-slate-400">{brushSize}px</span>
              </div>
              <input 
                type="range"
                min="2"
                max="30"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Holographic POV Preview */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black text-[#00b4d8] tracking-widest uppercase flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 animate-pulse" />
              2. POV Hologram Fan Preview
            </span>
            <div className="flex items-center gap-1">
              <span className={`text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${isFanSpinning && fanSpeed > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                {isFanSpinning && fanSpeed > 0 ? 'Spinning' : 'Stopped'}
              </span>
            </div>
          </div>

          {/* Glowing POV Fan Canvas container */}
          <div className="flex justify-center border-2 border-slate-800/80 rounded-2xl overflow-hidden bg-black/90 relative p-4 group hover:border-slate-700 transition">
            {/* Spinning background grid aura */}
            <div className="absolute inset-0 rounded-full border border-white/[0.01] pointer-events-none scale-90"></div>
            <div className="absolute inset-6 rounded-full border border-white/[0.01] pointer-events-none scale-75"></div>
            
            <canvas 
              ref={previewCanvasRef}
              className="w-full max-w-[256px] aspect-square rounded-full shadow-[0_0_30px_rgba(0,180,216,0.05)]"
              style={{ mixBlendMode: 'screen' }}
            />
          </div>

          {/* Hologram / Propeller controls */}
          <div className="flex flex-col gap-3 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
            
            {/* Speed & Play/Pause */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFanSpinning(!isFanSpinning)}
                className={`p-2.5 rounded-xl border transition-all ${
                  isFanSpinning 
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' 
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}
                title={isFanSpinning ? "Pause Propeller Rotation" : "Spin Propeller"}
              >
                {isFanSpinning ? <Pause className="w-4 h-4 fill-emerald-400/20" /> : <Play className="w-4 h-4 fill-slate-400/20" />}
              </button>

              <div className="flex-1 flex flex-col gap-1">
                <div className="flex justify-between items-center text-[8px] font-black text-slate-500 tracking-wider uppercase">
                  <span>Fan Motor Speed</span>
                  <span className="font-mono text-slate-400">{isFanSpinning ? fanSpeed : 0}%</span>
                </div>
                <input 
                  type="range"
                  min="10"
                  max="100"
                  value={fanSpeed}
                  disabled={!isFanSpinning}
                  onChange={(e) => setFanSpeed(Number(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#00b4d8] disabled:opacity-30 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Quick Toggle Settings */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/40 mt-1">
              {/* LED Tracks Toggle */}
              <button
                onClick={() => setShowLedTracks(!showLedTracks)}
                className={`py-1.5 px-2.5 rounded-xl border text-[9px] font-black tracking-wider uppercase transition-all ${
                  showLedTracks 
                    ? 'bg-slate-800 border-slate-700 text-slate-300' 
                    : 'bg-slate-950 border-slate-900 text-slate-600'
                }`}
              >
                {showLedTracks ? 'LED tracks: ON' : 'LED tracks: OFF'}
              </button>

              {/* Glow Intensity Adjustment */}
              <button
                onClick={() => setGlowIntensity(prev => prev === 25 ? 5 : prev === 15 ? 25 : 15)}
                className="py-1.5 px-2.5 rounded-xl border border-slate-700 bg-slate-800 text-[9px] font-black tracking-wider uppercase text-slate-300 hover:bg-slate-700 transition-all"
              >
                Glow: {glowIntensity === 25 ? 'High' : glowIntensity === 15 ? 'Medium' : 'Low'}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Info Tip footer */}
      <div className="flex items-start gap-2 border-t border-slate-800/40 pt-4 text-[9px] text-slate-500 leading-normal">
        <Info className="w-3.5 h-3.5 text-[#00b4d8] shrink-0 mt-0.5" />
        <p>
          The POV hologram preview simulates how your drawing lights up on a real physical 2-blade spinning LED fan. It models the persistence of vision (POV) trails and discrete LED concentric pixel tracks. Use vibrant neon colors for the best holographic results.
        </p>
      </div>

    </div>
  );
};
