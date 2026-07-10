import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Activity } from 'lucide-react';

interface Props {
  onSyncFrame?: (data: string) => void;
  onSyncParams?: (bass: number, mid: number, high: number) => void;
}

export const AudioVisualizer: React.FC<Props> = ({ onSyncParams }) => {
  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestFrameRef = useRef<number>(0);
  
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      
      const analyzer = audioCtx.createAnalyser();
      analyzer.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyzer);
      analyzerRef.current = analyzer;
      
      setIsListening(true);
      analyzeAudio();
    } catch (err) {
      console.error("Microphone access denied", err);
    }
  };

  const stopListening = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    cancelAnimationFrame(requestFrameRef.current);
    setIsListening(false);
  };

  const analyzeAudio = () => {
    if (!analyzerRef.current) return;
    const bufferLength = analyzerRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const update = () => {
      analyzerRef.current!.getByteFrequencyData(dataArray);
      
      // Calculate bass, mid, high
      let bass = 0, mid = 0, high = 0;
      for (let i = 0; i < 10; i++) bass += dataArray[i];
      for (let i = 10; i < 50; i++) mid += dataArray[i];
      for (let i = 50; i < 120; i++) high += dataArray[i];
      
      bass = bass / 10 / 255;
      mid = mid / 40 / 255;
      high = high / 70 / 255;
      
      if (onSyncParams) {
         onSyncParams(bass, mid, high);
      }
      
      requestFrameRef.current = requestAnimationFrame(update);
    };
    update();
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  return (
    <div className="bg-[#0c0e15] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-fuchsia-400" />
        <h3 className="text-[13px] font-black text-slate-200 tracking-widest uppercase">Live Audio Sync</h3>
      </div>
      <p className="text-[11px] text-slate-400">
        Sync hologram lights to music or ambient sounds using your device microphone.
      </p>
      
      <div className="flex gap-3">
        {!isListening ? (
          <button 
            onClick={startListening}
            className="flex-1 bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 hover:bg-fuchsia-500/30 py-3 rounded-xl font-bold text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 transition"
          >
            <Mic className="w-4 h-4" /> Start Mic Sync
          </button>
        ) : (
          <button 
            onClick={stopListening}
            className="flex-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 py-3 rounded-xl font-bold text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 transition"
          >
            <Square className="w-4 h-4 fill-current" /> Stop Sync
          </button>
        )}
      </div>
    </div>
  );
};
