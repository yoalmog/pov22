import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { Eye, Ruler, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface GestureControllerProps {
  active: boolean;
  sensitivity?: number; // 1-100
  neutralCenter?: { x: number; y: number };
  onVerticalSwipe: (delta: number) => void;
  onHorizontalSwipe: (delta: number) => void;
  onMove?: (x: number, y: number) => void;
  onGesture?: (gesture: string) => void;
  onHandDetected?: (isDetected: boolean, strength: number, position?: { x: number; y: number }) => void;
}

export const GestureController: React.FC<GestureControllerProps> = ({
  active,
  sensitivity = 20,
  neutralCenter = { x: 0.5, y: 0.5 },
  onVerticalSwipe,
  onHorizontalSwipe,
  onMove,
  onGesture,
  onHandDetected,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [modelReady, setModelReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const lastHandPos = useRef<{ x: number; y: number } | null>(null);
  const lastMovePos = useRef<{ x: number; y: number } | null>(null);
  const lastVideoTime = useRef(-1);

  // Hand distance & tracking state diagnostic telemetry
  const [handDistance, setHandDistance] = useState<number | null>(null);
  const [distanceStatus, setDistanceStatus] = useState<'TOO_FAR' | 'TOO_CLOSE' | 'OPTIMAL' | 'OUT_OF_ZONE' | 'NO_HAND'>('NO_HAND');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('Place hand in active tracking area');
  const lastStateUpdateTime = useRef<number>(0);

  // Clear current gesture text
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (currentGesture) {
      timeout = setTimeout(() => setCurrentGesture(null), 1000);
    }
    return () => clearTimeout(timeout);
  }, [currentGesture]);

  // Init Mediapipe
  useEffect(() => {
    let active = true;
    async function initModel() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        if (!active) return;
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        if (!active) return;
        handLandmarkerRef.current = landmarker;
        setModelReady(true);
      } catch (err) {
        console.error("Failed to load Mediapipe model:", err);
      }
    }
    initModel();
    return () => {
      active = false;
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
    };
  }, []);

  const handleResults = useCallback((results: any) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    
    const canvasW = canvasRef.current.width;
    const canvasH = canvasRef.current.height;

    ctx.clearRect(0, 0, canvasW, canvasH);
    
    // Draw Active Tracking Zone Guide
    const marginX = canvasW * 0.15;
    const marginY = canvasH * 0.15;
    const boxW = canvasW - (marginX * 2);
    const boxH = canvasH - (marginY * 2);
    
    let isHandInZone = false;
    let handPos = { x: 0, y: 0 };

    if (results.landmarks && results.landmarks.length > 0) {
      const hand = results.landmarks[0];
      handPos = { x: hand[8].x, y: hand[8].y };
      
      // Check if index finger (or palm center) is within optimal bounds
      // Note: x is inverted because we flip the coordinates during draw
      if (handPos.x >= 0.15 && handPos.x <= 0.85 && 
          handPos.y >= 0.15 && handPos.y <= 0.85) {
        isHandInZone = true;
      }
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(marginX, marginY, boxW, boxH);
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    if (isHandInZone) {
      ctx.strokeStyle = "rgba(16, 185, 129, 0.6)"; // Emerald for optimal location
      ctx.fillStyle = "rgba(16, 185, 129, 0.05)";
    } else {
      ctx.strokeStyle = "rgba(0, 180, 216, 0.3)"; // Blue idle state
      ctx.fillStyle = "rgba(0, 180, 216, 0.02)";
    }
    ctx.fill();
    ctx.stroke();
    // Add corner markers
    ctx.setLineDash([]);
    const cornerSize = 10;
    
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(marginX, marginY + cornerSize);
    ctx.lineTo(marginX, marginY);
    ctx.lineTo(marginX + cornerSize, marginY);
    ctx.stroke();
    // Top-Right
    ctx.beginPath();
    ctx.moveTo(marginX + boxW - cornerSize, marginY);
    ctx.lineTo(marginX + boxW, marginY);
    ctx.lineTo(marginX + boxW, marginY + cornerSize);
    ctx.stroke();
    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(marginX, marginY + boxH - cornerSize);
    ctx.lineTo(marginX, marginY + boxH);
    ctx.lineTo(marginX + cornerSize, marginY + boxH);
    ctx.stroke();
    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(marginX + boxW, marginY + boxH - cornerSize);
    ctx.lineTo(marginX + boxW, marginY + boxH);
    ctx.lineTo(marginX + boxW - cornerSize, marginY + boxH);
    ctx.stroke();
    ctx.restore();

    if (results.landmarks && results.landmarks.length > 0) {
      const hand = results.landmarks[0];
      const score = results.handedness && results.handedness[0] ? (results.handedness[0][0].score || 0.8) : 0.8;
      const pos = { x: hand[8].x, y: hand[8].y };
      
      if (onHandDetected) onHandDetected(true, score, pos);

      // Estimate physical hand distance
      const wrist = hand[0];
      const middleMcp = hand[9];
      const dxDist = wrist.x - middleMcp.x;
      const dyDist = wrist.y - middleMcp.y;
      const distance2d = Math.sqrt(dxDist * dxDist + dyDist * dyDist);
      
      let calculatedDistCm = Math.round(6.2 / (distance2d || 0.01));
      calculatedDistCm = Math.max(10, Math.min(120, calculatedDistCm));

      // Bounding box cutoff check to see if hand is too close or partially outside
      let isCutOff = false;
      for (const lm of hand) {
        if (lm.x < 0.01 || lm.x > 0.99 || lm.y < 0.01 || lm.y > 0.99) {
          isCutOff = true;
          break;
        }
      }

      // Determine status and message
      let status: 'TOO_FAR' | 'TOO_CLOSE' | 'OPTIMAL' | 'OUT_OF_ZONE' | 'NO_HAND' = 'OPTIMAL';
      let message = 'Optimal distance. Perform gestures!';

      if (isCutOff) {
        status = 'TOO_CLOSE';
        message = 'Hand cut off at edge! Move back slightly.';
      } else if (calculatedDistCm < 18) {
        status = 'TOO_CLOSE';
        message = 'Too close! Move hand 20–45 cm away.';
      } else if (calculatedDistCm > 48) {
        status = 'TOO_FAR';
        message = 'Too far! Move hand closer (20–45 cm).';
      } else if (!isHandInZone) {
        status = 'OUT_OF_ZONE';
        message = 'Hand outside tracking bounds! Center your hand.';
      }

      const nowTime = Date.now();
      if (nowTime - lastStateUpdateTime.current > 120) {
        lastStateUpdateTime.current = nowTime;
        setHandDistance(calculatedDistCm);
        setDistanceStatus(status);
        setFeedbackMessage(message);
      }

      // Gesture Recognition
      const isFingerUp = (tipIdx: number, baseIdx: number) => hand[tipIdx].y < hand[baseIdx].y - 0.05;
      const indexUp = isFingerUp(8, 6);
      const middleUp = isFingerUp(12, 10);
      const ringUp = isFingerUp(16, 14);
      const pinkyUp = isFingerUp(20, 18);
      
      // Thumb detection is a bit different (x-axis distance)
      const thumbUp = Math.abs(hand[4].x - hand[2].x) > 0.05 && hand[4].y < hand[2].y;

      let detected = "None";
      if (indexUp && middleUp && !ringUp && !pinkyUp) {
        detected = "peace";
      } else if (indexUp && middleUp && ringUp && pinkyUp) {
        detected = "palm";
      } else if (!indexUp && !middleUp && !ringUp && !pinkyUp && !thumbUp) {
        detected = "fist";
      } else if (thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp) {
        detected = "thumbs_up";
      } else if (indexUp && !middleUp && !ringUp && !pinkyUp) {
        detected = "point_up";
      } else if (indexUp && pinkyUp && !middleUp && !ringUp) {
        detected = "rock_on";
      }

      if (detected !== "None" && onGesture) {
        onGesture(detected);
      }

      // Draw Skeleton Overlay
      const drawLine = (startIdx: number, endIdx: number) => {
        const p1 = hand[startIdx];
        const p2 = hand[endIdx];
        ctx.beginPath();
        ctx.moveTo((1 - p1.x) * canvasW, p1.y * canvasH);
        ctx.lineTo((1 - p2.x) * canvasW, p2.y * canvasH);
        ctx.strokeStyle = "rgba(0, 180, 216, 0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
      };

      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // thumb
        [0, 5], [5, 6], [6, 7], [7, 8], // index
        [5, 9], [9, 10], [10, 11], [11, 12], // middle
        [9, 13], [13, 14], [14, 15], [15, 16], // ring
        [13, 17], [17, 18], [18, 19], [19, 20], // pinky
        [0, 17] // palm bottom
      ];

      connections.forEach(([start, end]) => drawLine(start, end));

      // Draw landmark dots
      hand.forEach((lm: any, i: number) => {
        const x = (1 - lm.x) * canvasW;
        const y = lm.y * canvasH;
        ctx.beginPath();
        ctx.arc(x, y, i === 8 ? 6 : 3, 0, Math.PI * 2);
        ctx.fillStyle = i === 8 ? "#00b4d8" : "#fef08a";
        ctx.fill();
        ctx.strokeStyle = i === 8 ? "white" : "rgba(0,0,0,0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      if (onMove) {
        const moveThreshold = 0.005;
        if (!lastMovePos.current || 
            Math.abs(pos.x - lastMovePos.current.x) > moveThreshold || 
            Math.abs(pos.y - lastMovePos.current.y) > moveThreshold) {
          onMove(pos.x, pos.y);
          lastMovePos.current = pos;
        }
      }

      if (lastHandPos.current) {
        const dx = pos.x - lastHandPos.current.x;
        const dy = pos.y - lastHandPos.current.y;
        const threshold = Math.max(0.002, 0.4 / sensitivity);

        if (Math.abs(dy) > threshold && Math.abs(dy) > Math.abs(dx)) {
          onVerticalSwipe(-dy * 200); 
          setCurrentGesture(dy > 0 ? "DIMMING..." : "BRIGHTENING...");
        } else if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) {
          onHorizontalSwipe(dx * 200);
          setCurrentGesture(dx > 0 ? "SLOWER..." : "FASTER...");
        }
      }
      lastHandPos.current = pos;
    } else {
      if (onHandDetected) onHandDetected(false, 0);
      lastHandPos.current = null;
      lastMovePos.current = null;

      const nowTime = Date.now();
      if (nowTime - lastStateUpdateTime.current > 120) {
        lastStateUpdateTime.current = nowTime;
        setHandDistance(null);
        setDistanceStatus('NO_HAND');
        setFeedbackMessage('Place hand in active tracking area');
      }
    }
  }, [onHandDetected, onGesture, onMove, onVerticalSwipe, onHorizontalSwipe, sensitivity]);

  useEffect(() => {
    let localStream: MediaStream | null = null;
    let animationId: number | null = null;

    async function startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera API not supported in this browser.");
        return;
      }

      try {
        localStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 320, 
                height: 240,
                facingMode: "user" 
            } 
        });
        setCameraError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            animationId = requestAnimationFrame(predictLoop);
          };
        }
      } catch (err: any) {
        console.warn("Camera check issue:", err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError("Camera access denied. Please setup in browser settings or open in full window.");
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraError("No camera found on this device.");
        } else {
          setCameraError("Camera unavailable. Check if another app is using it.");
        }
      }
    }

    async function predictLoop() {
      if (videoRef.current && handLandmarkerRef.current && modelReady && active) {
        const videoTime = videoRef.current.currentTime;
        if (videoTime !== lastVideoTime.current && videoRef.current.readyState >= 2) {
          lastVideoTime.current = videoTime;
          try {
            const results = handLandmarkerRef.current.detectForVideo(videoRef.current, performance.now());
            handleResults(results);
          } catch (err) {
            console.warn("Frame analysis failed", err);
          }
        }
        animationId = requestAnimationFrame(predictLoop);
      } else if (active) {
        animationId = requestAnimationFrame(predictLoop);
      }
    }

    if (active && modelReady) {
      startCamera();
    } 

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [active, modelReady, handleResults, retryTrigger]);

  const handleRetryCamera = () => {
    setCameraError(null);
    setRetryTrigger(prev => prev + 1);
  };

  if (!active) return null;

  return (
    <div className="fixed bottom-24 right-5 z-50 flex flex-col gap-2 items-end">
      {cameraError && (
        <div className="flex flex-col gap-1 items-end">
          <div className="bg-rose-500/90 text-white text-[8px] px-2 py-1 rounded-full animate-pulse uppercase tracking-widest font-black">
            {cameraError}
          </div>
          <button 
            onClick={handleRetryCamera}
            className="bg-slate-800 text-[#00b4d8] text-[7px] px-2 py-0.5 rounded border border-slate-700 uppercase font-bold hover:bg-slate-700 transition-colors"
          >
            Retry Camera
          </button>
        </div>
      )}
      <div className="relative w-48 rounded-xl border-2 border-[#00b4d8] bg-[#0c0e15]/95 backdrop-blur-md overflow-hidden shadow-[0_0_30px_rgba(0,180,216,0.25)] flex flex-col">
        <div className="relative w-full h-36 bg-black">
          <video 
            ref={videoRef} 
            className="w-full h-full object-cover scale-x-[-1]" 
            muted 
            autoPlay
            playsInline 
          />
          <canvas 
            ref={canvasRef}
            width={240}
            height={180}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#00b4d8]/95 text-[#0c0e15] text-[7px] font-black rounded uppercase tracking-wider">
            Gesture {modelReady ? "Ready" : "Loading"}
          </div>
          {modelReady && !cameraError && (
            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-emerald-500 text-[#0c0e15] text-[7px] font-black rounded uppercase tracking-wider animate-pulse">
              Active
            </div>
          )}
          {currentGesture && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none transition-all">
              <span className="text-[10px] font-black text-white bg-[#00b4d8] border border-cyan-400 px-2 py-1 rounded shadow-lg animate-pulse uppercase tracking-wider">
                {currentGesture}
              </span>
            </div>
          )}
        </div>

        <div className="w-full p-2.5 bg-slate-950/90 border-t border-slate-800/80 text-left flex flex-col gap-2">
          {/* Distance Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Ruler className={`w-3.5 h-3.5 ${
                distanceStatus === 'OPTIMAL' ? 'text-emerald-400' :
                distanceStatus === 'NO_HAND' ? 'text-slate-500' : 'text-amber-400'
              }`} />
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Sensor Dist:</span>
            </div>
            <span className={`text-[11px] font-mono font-black ${
              distanceStatus === 'OPTIMAL' ? 'text-emerald-400' :
              distanceStatus === 'NO_HAND' ? 'text-slate-500' : 'text-rose-400'
            }`}>
              {handDistance !== null ? `${handDistance} cm` : '---'}
            </span>
          </div>

          {/* Distance Bar Visualizer */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[7px] text-slate-500 font-bold uppercase tracking-tight">
              <span>Too Close</span>
              <span className="text-emerald-500">Optimal (20-45cm)</span>
              <span>Too Far</span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full relative overflow-hidden flex border border-slate-800/40">
              {/* Segment 1: Too Close (0% to 15%) */}
              <div className="h-full w-[15%] bg-rose-500/20 border-r border-rose-500/10" />
              {/* Segment 2: Optimal (15% to 65%) */}
              <div className="h-full w-[50%] bg-emerald-500/10 border-r border-emerald-500/10" />
              {/* Segment 3: Too Far (65% to 100%) */}
              <div className="h-full w-[35%] bg-amber-500/15" />

              {/* Indicator Dot */}
              {handDistance !== null && (
                <div 
                  className={`absolute top-0.5 w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-150 ${
                    distanceStatus === 'OPTIMAL' ? 'bg-emerald-400 shadow-emerald-400' :
                    distanceStatus === 'TOO_CLOSE' ? 'bg-rose-500 shadow-rose-500 animate-pulse' : 'bg-amber-400 shadow-amber-400'
                  }`}
                  style={{ 
                    left: `${Math.min(95, Math.max(2, ((handDistance - 10) / 70) * 100))}%`,
                    transform: 'translateX(-50%)'
                  }}
                />
              )}
            </div>
          </div>

          {/* Live Actionable Diagnostic Feedback */}
          <div className={`flex items-start gap-1.5 p-1.5 rounded-md border ${
            distanceStatus === 'OPTIMAL' ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' :
            distanceStatus === 'NO_HAND' ? 'bg-slate-900/10 border-slate-800/40 text-slate-400' :
            distanceStatus === 'OUT_OF_ZONE' ? 'bg-yellow-950/20 border-yellow-500/20 text-yellow-400' :
            'bg-rose-950/25 border-rose-500/20 text-rose-300'
          }`}>
            <div className="mt-0.5 flex-shrink-0">
              {distanceStatus === 'OPTIMAL' && <CheckCircle2 className="w-3 h-3 text-emerald-400 animate-pulse" />}
              {distanceStatus === 'NO_HAND' && <Eye className="w-3 h-3 text-slate-500" />}
              {distanceStatus !== 'OPTIMAL' && distanceStatus !== 'NO_HAND' && <AlertTriangle className="w-3 h-3 text-amber-400 animate-bounce" />}
            </div>
            <p className="text-[8.5px] font-bold leading-snug tracking-tight">
              {feedbackMessage}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

