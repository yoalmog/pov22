import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

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
      <div className="relative w-24 h-18 rounded-xl border-2 border-[#00b4d8] bg-black overflow-hidden shadow-2xl">
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
          height={160}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
        <div className="absolute top-1 left-1 px-1 bg-[#00b4d8]/80 text-[#0c0e15] text-[6px] font-black rounded uppercase">
          Gesture {modelReady ? "Ready" : "Loading"}
        </div>
        {modelReady && !cameraError && (
          <div className="absolute top-1 right-1 px-1 bg-emerald-500/80 text-[#0c0e15] text-[5px] font-black rounded uppercase animate-pulse">
            Active
          </div>
        )}
        {currentGesture && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
            <span className="text-[7px] font-black text-white bg-[#00b4d8]/90 px-1 rounded animate-pulse">
              {currentGesture}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

