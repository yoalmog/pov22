import React, { useState, useRef, useEffect } from 'react';
import { Type, Play, Square } from 'lucide-react';

interface Props {
  onFrameUpdate: (data: string) => void;
}

export const TextMarquee: React.FC<Props> = ({ onFrameUpdate }) => {
  const [text, setText] = useState("HOLOSPIN");
  const [color, setColor] = useState("#00b4d8");
  const [speed, setSpeed] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);

  const drawFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = color;
    ctx.font = 'bold 40px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    // Rotate text based on offset to simulate 3D/Marquee spin
    ctx.rotate(offsetRef.current * Math.PI / 180);
    ctx.fillText(text, 0, 0);
    ctx.restore();

    onFrameUpdate(canvas.toDataURL('image/jpeg', 0.5));
  };

  const animate = () => {
    offsetRef.current += speed;
    drawFrame();
    animRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isPlaying) {
      animRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animRef.current);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, text, color, speed]);

  useEffect(() => {
    if (!isPlaying) drawFrame();
  }, [text, color]);

  return (
    <div className="bg-[#0c0e15] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Type className="w-5 h-5 text-amber-400" />
        <h3 className="text-[13px] font-black text-slate-200 tracking-widest uppercase">3D Floating Text</h3>
      </div>
      
      <input 
        type="text" 
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="bg-[#050608] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-amber-400/50"
        placeholder="Enter text..."
      />
      
      <div className="flex items-center gap-4">
        <input 
          type="color" 
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0 p-0"
        />
        <div className="flex-1 flex flex-col gap-1">
          <span className="text-[9px] text-slate-500 uppercase font-bold">Rotation Speed</span>
          <input 
            type="range"
            min="-15"
            max="15"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex-1 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition ${isPlaying ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}
        >
          {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          {isPlaying ? 'Stop Spin' : 'Start Spin'}
        </button>
      </div>

      <canvas ref={canvasRef} width={256} height={256} className="hidden" />
    </div>
  );
};
