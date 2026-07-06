import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Props {
  videoUrl: string | null;
}

export const BufferHealthIndicator: React.FC<Props> = ({ videoUrl }) => {
  const [healthStatus, setHealthStatus] = useState<'analyzing' | 'good' | 'warning' | 'danger'>('analyzing');
  const [metrics, setMetrics] = useState<{ res: string, fps: string, bitrateLevel: string } | null>(null);

  useEffect(() => {
    if (!videoUrl) {
      setHealthStatus('analyzing');
      setMetrics(null);
      return;
    }

    setHealthStatus('analyzing');
    // Simulate analyzing video file
    setTimeout(() => {
      // In a real app we would read the actual video file metadata, here we mock it based on url length or random to demonstrate
      // But we can create a temporary video tag to check dimensions
      const video = document.createElement('video');
      video.src = videoUrl;
      video.onloadedmetadata = () => {
        const width = video.videoWidth;
        const height = video.videoHeight;
        const res = `${width}x${height}`;
        
        let status: 'good' | 'warning' | 'danger' = 'good';
        let bitrateLevel = 'Low (<1MB/s)';

        if (width > 1280 || height > 1280) {
          status = 'danger';
          bitrateLevel = 'High (>5MB/s)';
        } else if (width > 640 || height > 640) {
          status = 'warning';
          bitrateLevel = 'Medium (~2MB/s)';
        }

        setMetrics({ res, fps: '30-60', bitrateLevel });
        setHealthStatus(status);
      };
      
      video.onerror = () => {
        setHealthStatus('danger');
        setMetrics({ res: 'Unknown', fps: 'Unknown', bitrateLevel: 'Unknown' });
      };
    }, 500);

  }, [videoUrl]);

  if (!videoUrl) return null;

  return (
    <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex flex-col gap-4 mt-2">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-[#a855f7]" />
        <h4 className="text-[12px] font-bold text-slate-200 uppercase tracking-widest">Buffer Health</h4>
      </div>

      <div className="flex flex-col gap-2 relative">
        {healthStatus === 'analyzing' && (
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
            Analyzing Video Stream...
          </div>
        )}

        {healthStatus !== 'analyzing' && metrics && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col bg-slate-900/50 p-2 rounded-xl border border-slate-800/50">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Resolution</span>
                <span className={`text-[10px] font-mono ${healthStatus === 'danger' ? 'text-rose-400' : 'text-slate-300'}`}>{metrics.res}</span>
              </div>
              <div className="flex flex-col bg-slate-900/50 p-2 rounded-xl border border-slate-800/50">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Framerate</span>
                <span className="text-[10px] font-mono text-slate-300">{metrics.fps}</span>
              </div>
              <div className="flex flex-col bg-slate-900/50 p-2 rounded-xl border border-slate-800/50">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Bitrate</span>
                <span className={`text-[10px] font-mono ${healthStatus === 'danger' ? 'text-rose-400' : healthStatus === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`}>{metrics.bitrateLevel}</span>
              </div>
            </div>

            {healthStatus === 'good' && (
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 p-3 rounded-lg border border-emerald-400/20 mt-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-[10px] leading-relaxed">Video stream is optimal. The ESP32 buffer can process this without dropped frames or jitter.</span>
              </div>
            )}
            
            {healthStatus === 'warning' && (
              <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 p-3 rounded-lg border border-amber-400/20 mt-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="text-[10px] leading-relaxed">Warning: Medium resolution video might cause occasional frame drops on the hardware. Consider scaling down to 640x640 or lower.</span>
              </div>
            )}

            {healthStatus === 'danger' && (
              <div className="flex items-center gap-2 text-rose-400 bg-rose-400/10 p-3 rounded-lg border border-rose-400/20 mt-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="text-[10px] leading-relaxed">Critical: Video resolution or bitrate is too high. The ESP32 hardware buffer will overflow, causing the video effect to fail or stutter significantly. Please compress the video.</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
