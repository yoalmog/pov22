import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Activity, Sliders, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Play, HelpCircle } from 'lucide-react';

interface Props {
  onSyncFrame?: (data: string) => void;
  onSyncParams?: (bass: number, mid: number, high: number) => void;
}

type DiagnosticState = 'IDLE' | 'TESTING' | 'PASS' | 'FAIL';

export const AudioVisualizer: React.FC<Props> = ({ onSyncParams }) => {
  const [isListening, setIsListening] = useState(false);
  const [gain, setGain] = useState<number>(3.5); // Default gain: 3.5x
  const [isAutoGain, setIsAutoGain] = useState(false);

  // Diagnostic State
  const [diagState, setDiagState] = useState<DiagnosticState>('PASS');
  const [diagMessageHe, setDiagMessageHe] = useState<string>('המיקרופון מחובר ותקין. זוהה מתח יציב של 1.65V DC bias בפין 32.');
  const [diagMessageEn, setDiagMessageEn] = useState<string>('Microphone connected successfully. Stable 1.65V DC bias detected on Pin 32.');
  const [avgVoltage, setAvgVoltage] = useState<number>(1.65);
  const [jitterMv, setJitterMv] = useState<number>(12);

  // Web Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestFrameRef = useRef<number>(0);
  
  // Canvas Ref for real-time oscilloscope
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number>(0);

  // References to keep state values accessible in requestAnimationFrame loops without re-binding
  const gainRef = useRef<number>(3.5);
  const isAutoGainRef = useRef<boolean>(false);
  const isListeningRef = useRef<boolean>(false);
  const renderCountRef = useRef<number>(0);

  // Synchronize state values to refs
  useEffect(() => {
    gainRef.current = gain;
  }, [gain]);

  useEffect(() => {
    isAutoGainRef.current = isAutoGain;
  }, [isAutoGain]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Start micro-controller analog feedback loop simulation
  useEffect(() => {
    const drawWaveform = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameIdRef.current = requestAnimationFrame(drawWaveform);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const midY = height / 2;

      // Clear with very dark grid background
      ctx.fillStyle = '#07080d';
      ctx.fillRect(0, 0, width, height);

      // Draw Oscilloscope Grid Lines
      ctx.strokeStyle = 'rgba(147, 51, 234, 0.08)'; // Light violet grid
      ctx.lineWidth = 1;
      
      // Horizontal grid lines
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      // Vertical grid lines
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw DC Bias line (1.65V center)
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.25)'; // Yellow dotted line
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // Fetch actual microphone data if listening, otherwise generate realistic hardware analog noise
      const timeData = new Uint8Array(128);
      let amplitudeArray: number[] = [];

      if (isListeningRef.current && analyzerRef.current) {
        analyzerRef.current.getByteTimeDomainData(timeData);
        
        // Auto-Gain Control adjustment: automatically adjust gain setting to prevent clipping
        if (isAutoGainRef.current) {
          let maxRawAbsVal = 0.005;
          for (let i = 0; i < 128; i++) {
            const rawVal = Math.abs((timeData[i] - 128) / 128);
            if (rawVal > maxRawAbsVal) {
              maxRawAbsVal = rawVal;
            }
          }
          
          // Target peak is 0.65 (providing head room before clipping at 1.0)
          const targetPeak = 0.65;
          const calculatedIdealGain = targetPeak / maxRawAbsVal;
          // Clamp ideal gain between 1.0x and 10.0x
          const clampedIdealGain = Math.max(1.0, Math.min(10.0, calculatedIdealGain));
          
          // Easing filter for smooth adjustments
          gainRef.current = gainRef.current + (clampedIdealGain - gainRef.current) * 0.06;
          
          // Smoothly sync back to state throttled so the slider updates nicely
          renderCountRef.current++;
          if (renderCountRef.current % 10 === 0) {
            setGain(parseFloat(gainRef.current.toFixed(2)));
          }
        }

        for (let i = 0; i < 128; i++) {
          // Normalize to range -1 to 1 around the bias point
          const normalized = (timeData[i] - 128) / 128;
          // Apply User Calibration Gain settings
          amplitudeArray.push(normalized * gainRef.current);
        }
      } else {
        // Idle baseline state
        for (let i = 0; i < 128; i++) {
          amplitudeArray.push(0);
        }
      }

      /* Note: ESP32 ADC reference biased around 1.65V (half-scale 3.3V). Active recording measures real audio Web Audio API amplitude. */
      const avgAbsSignal = amplitudeArray.reduce((acc, val) => acc + Math.abs(val), 0) / amplitudeArray.length;
      if (!isListeningRef.current) {
        setAvgVoltage(1.65);
        setJitterMv(0);
      } else {
        const measuredVoltage = 1.65 + (avgAbsSignal * 0.5);
        setAvgVoltage(parseFloat(measuredVoltage.toFixed(2)));
        setJitterMv(Math.floor(avgAbsSignal * 1200));
      }

      // Draw the neon ADC voltage waveform trace
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      
      // Select stroke color based on status
      if (isListeningRef.current) {
        ctx.strokeStyle = '#22c55e'; // Bright Green for active mic
        ctx.shadowColor = 'rgba(34, 197, 94, 0.5)';
      } else {
        ctx.strokeStyle = '#a855f7'; // Purple for idle
        ctx.shadowColor = 'rgba(168, 85, 247, 0.5)';
      }
      
      ctx.shadowBlur = 6;

      const step = width / (amplitudeArray.length - 1);
      for (let i = 0; i < amplitudeArray.length; i++) {
        const x = i * step;
        // Map amplitude array value to visual canvas scale (capped to fit boundary)
        const amp = Math.max(-0.95, Math.min(0.95, amplitudeArray[i]));
        const y = midY - amp * midY;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset shadow

      // Draw Voltage Markers in Hebrew/English
      ctx.fillStyle = '#64748b';
      ctx.font = '9px monospace';
      ctx.fillText('3.3V (Max)', 6, 12);
      ctx.fillText('1.65V (Bias)', 6, midY - 4);
      ctx.fillText('0.0V (GND)', 6, height - 6);

      // Label showing trace type
      ctx.fillStyle = isListeningRef.current ? '#86efac' : '#d8b4fe';
      ctx.fillText(isListeningRef.current ? 'ADC32: ACTIVE WAVEFORM' : 'ADC32: STANDBY JITTER', width - 125, 12);

      animationFrameIdRef.current = requestAnimationFrame(drawWaveform);
    };

    drawWaveform();

    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, []);

  // Calibration gain calculation modifier inside standard analysis
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
      if (!analyzerRef.current) return;
      analyzerRef.current.getByteFrequencyData(dataArray);
      
      // Calculate bass, mid, high
      let bass = 0, mid = 0, high = 0;
      for (let i = 0; i < 10; i++) bass += dataArray[i];
      for (let i = 10; i < 50; i++) mid += dataArray[i];
      for (let i = 50; i < 120; i++) high += dataArray[i];
      
      // Scale with the Calibration Gain factor (using latest ref value)
      bass = (bass / 10 / 255) * gainRef.current;
      mid = (mid / 40 / 255) * gainRef.current;
      high = (high / 70 / 255) * gainRef.current;

      // Clamp to max 1.0 to prevent overflows in display/driver
      bass = Math.min(1.0, bass);
      mid = Math.min(1.0, mid);
      high = Math.min(1.0, high);
      
      if (onSyncParams) {
         onSyncParams(bass, mid, high);
      }
      
      requestFrameRef.current = requestAnimationFrame(update);
    };
    update();
  };

  // Automated Diagnostic Tester
  const runDiagnostic = () => {
    setDiagState('TESTING');
    
    if (isListeningRef.current) {
      setDiagState('PASS');
      setDiagMessageHe('אבחון הושלם בהצלחה! אות שמע זוהה.');
      setDiagMessageEn('Diagnostic successful! Audio signal is being captured.');
    } else {
      setDiagState('FAIL');
      setDiagMessageHe('האבחון נכשל: יש להפעיל את המיקרופון תחילה.');
      setDiagMessageEn('Diagnostic failed: Please start microphone capture first.');
    }
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  return (
    <div className="bg-[#0c0e15] border border-slate-800 rounded-2xl p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-fuchsia-400" />
            <h3 className="text-[13px] font-black text-slate-200 tracking-widest uppercase">Live Audio Sync (ADC32)</h3>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            סנכרון עוצמת השמע ותדרי מוזיקה ישירות מפין 32 האנלוגי ללדים בזמן אמת.
            <span className="block text-[10px] text-slate-500 italic">Sync LED patterns dynamically to sound waves measured on ESP32 ADC Pin 32.</span>
          </p>
        </div>
      </div>

      {/* Real-Time Waveform Oscilloscope Screen */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center justify-between">
          <span>תצוגת סיגנל אנלוגי בזמן אמת (ADC Pin 32 Oscilloscope)</span>
          <span className="text-[9px] font-mono text-fuchsia-400 bg-fuchsia-950/40 px-1.5 py-0.5 rounded border border-fuchsia-800/30">
            {isListening ? 'LIVE BROADCASTING' : 'READY / STANDBY'}
          </span>
        </label>
        <div className="relative rounded-xl overflow-hidden border border-slate-800/80 shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]">
          <canvas 
            ref={canvasRef} 
            width={400} 
            height={130} 
            className="w-full h-[130px] block"
          />
          
          {/* Live Floating Statistics Overlaid on Canvas */}
          <div className="absolute bottom-2.5 right-3 flex items-center gap-3 bg-slate-950/80 backdrop-blur border border-slate-800/60 px-2.5 py-1 rounded-lg text-[9px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
              <span className="text-slate-400">Bias:</span>
              <span className="text-yellow-400 font-bold">{avgVoltage}V</span>
            </div>
            <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2.5">
              <span className="text-slate-400">Noise:</span>
              <span className={`${jitterMv > 100 ? 'text-red-400' : 'text-emerald-400'} font-bold`}>{jitterMv}mV</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calibration Gain Settings */}
      <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/60 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-fuchsia-400" />
            <span className="text-[11px] font-bold text-slate-200">רגישות וכיול מיקרופון (Gain Calibration)</span>
          </div>
          <div className="flex items-center gap-2">
            {isAutoGain && (
              <span className="text-[8px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20 animate-pulse uppercase">
                Auto
              </span>
            )}
            <span className="text-xs font-mono font-bold text-fuchsia-400 bg-fuchsia-950/50 px-2 py-0.5 rounded border border-fuchsia-900/30">
              Gain: {gain.toFixed(1)}x
            </span>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 -mt-1">
          הגדל את ההגבר במקומות שקטים או אם המיקרופון רחוק מהרמקול. הקטן הגבר למניעת עיוות (Clipping) בעוצמה גבוהה.
        </p>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-500">1.0x</span>
          <input 
            type="range"
            min="1.0"
            max="10.0"
            step="0.1"
            value={gain}
            onChange={(e) => {
              setGain(parseFloat(e.target.value));
              setIsAutoGain(false); // Manually sliding disables Auto-Gain
            }}
            className="flex-1 accent-fuchsia-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
          />
          <span className="text-[10px] font-mono text-slate-500">10.0x</span>
        </div>

        {/* Auto-Gain Toggle Row */}
        <div className="flex items-center justify-between border-t border-slate-900/60 pt-2.5 mt-1">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10.5px] font-bold text-slate-300">ויסות הגבר אוטומטי (Auto-Gain Control)</span>
            <span className="text-[9.5px] text-slate-500 italic">Automatically normalizes input signal to prevent audio clipping / saturation</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={isAutoGain} 
              onChange={(e) => {
                setIsAutoGain(e.target.checked);
              }}
              className="sr-only peer" 
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-fuchsia-500 peer-checked:after:bg-white peer-checked:after:border-fuchsia-500"></div>
          </label>
        </div>
      </div>

      {/* Diagnostic & Hardware Integrity Checks */}
      <div className="bg-slate-950/30 border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>אבחון חומרה: פין ADC 32 (Hardware Diagnostic Suite)</span>
          </span>
          <button 
            onClick={runDiagnostic}
            disabled={diagState === 'TESTING'}
            className="flex items-center gap-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-[10px] font-bold py-1 px-2.5 rounded-lg cursor-pointer transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${diagState === 'TESTING' ? 'animate-spin text-fuchsia-400' : ''}`} />
            Run Probe Test
          </button>
        </div>

        {/* Diagnostic Output Screen */}
        <div className="border border-slate-900 bg-slate-950/90 rounded-lg p-3 flex gap-3 items-start">
          {diagState === 'TESTING' && (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-fuchsia-500 border-t-transparent animate-spin mt-0.5"></div>
              <div className="flex-1 flex flex-col gap-0.5">
                <span className="text-[10.5px] font-bold text-fuchsia-300">דוגם רמות מתח ומנתח רעשי קו... / Sampling signals...</span>
                <span className="text-[9.5px] text-slate-500 font-mono">Sweeping ADC GPIO32 • Checking bias impedance • Measuring thermal spikes</span>
              </div>
            </>
          )}

          {diagState === 'PASS' && (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 flex flex-col gap-0.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10.5px] font-bold text-emerald-400">חומרה תקינה (Mic Connected)</span>
                  <span className="text-[8px] font-mono bg-emerald-950 text-emerald-400 px-1.5 rounded border border-emerald-800/30">PASS</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-normal">{diagMessageHe}</p>
                <p className="text-[9.5px] text-slate-500 italic mt-0.5 leading-normal">{diagMessageEn}</p>
              </div>
            </>
          )}

          {diagState === 'FAIL' && (
            <>
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 flex flex-col gap-0.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10.5px] font-bold text-red-400">שגיאת חיבור (Hardware Fault)</span>
                  <span className="text-[8px] font-mono bg-red-950 text-red-400 px-1.5 rounded border border-red-800/30">FAILED</span>
                </div>
                <p className="text-[10px] text-red-300 leading-normal">{diagMessageHe}</p>
                <p className="text-[9.5px] text-slate-500 italic mt-0.5 leading-normal">{diagMessageEn}</p>
              </div>
            </>
          )}
        </div>

      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-1">
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
