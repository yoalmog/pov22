import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Play, 
  Check, 
  HelpCircle,
  Eye,
  Hand,
  Upload,
  Activity
} from "lucide-react";

interface TourStep {
  targetId?: string;
  title: string;
  titleHe: string;
  description: string;
  descriptionHe: string;
  tab?: string;
  subPage?: string | null;
}

interface AppWalkthroughProps {
  activeTab: string;
  subPage: string | null;
  onNavigate: (tab: string, subPage: string | null) => void;
  onClose: () => void;
}

export const AppWalkthrough: React.FC<AppWalkthroughProps> = ({
  activeTab,
  subPage,
  onNavigate,
  onClose,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  
  const steps: TourStep[] = [
    {
      title: "Welcome to Holospin Studio!",
      titleHe: "ברוכים הבאים ל-Holospin Studio!",
      description: "Welcome! Let's take a quick 1-minute interactive tour to get familiar with the key components of the ultimate DIY POV Hologram controller.",
      descriptionHe: "ברוכים הבאים! בואו נעבור סיור אינטראקטיבי קצר של דקה אחת כדי להכיר את המרכיבים המרכזיים של בקר הולוגרמת ה-POV האולטימטיבי שלכם.",
      placement: "center"
    } as any,
    {
      targetId: "tour-simulator",
      title: "POV Hologram Simulator",
      titleHe: "סימולטור הולוגרמת POV",
      description: "This real-time simulator visualizes the active POV pattern, rotation velocity, text animations, and image tinting. Watch it spin in real-time as you tweak values!",
      descriptionHe: "סימולטור אינטראקטיבי המציג בזמן אמת את דפוסי ה-POV, מהירות הסיבוב, אנימציות הטקסט ושינויי הצבעים. צפו בו מסתובב בזמן אמת כשאתם משנים ערכים!",
      tab: "controller",
      subPage: null,
    },
    {
      targetId: "tour-gesture-btn",
      title: "AI Hand Gesture Controller",
      titleHe: "בקר מחוות ידיים AI",
      description: "Tap this to turn on the camera and control your physical hologram using computer vision gestures. Swipe vertically to adjust LED brightness, and horizontally to control fan speed!",
      descriptionHe: "הפעילו את המצלמה כדי לשלוט במאוורר ההולוגרמה באמצעות מחוות ידיים! תנועה אנכית תשנה את בהירות הלדים, ותנועה אופקית תשלוט במהירות הסיבוב של המנוע.",
      tab: "controller",
      subPage: null,
    },
    {
      targetId: "tour-firmware",
      title: "Direct Firmware Flashing",
      titleHe: "צריבת קושחה ישירה (פלאש)",
      description: "Just like ArduinoDroid, you can flash compiled firmware binaries directly to your ESP32. We support wireless Wi-Fi OTA and wired USB OTG flashing without needing a computer!",
      descriptionHe: "בדיוק כמו ב-ArduinoDroid, תוכלו לצרוב את קושחת המכשיר ישירות ל-ESP32. אנחנו תומכים בעדכון אלחוטי (Wi-Fi OTA) ובעדכון חוטי (USB OTG) ללא צורך במחשב!",
      tab: "settings",
      subPage: "firmware",
    },
    {
      targetId: "tour-sync-group",
      title: "Status Indicators & Telemetry",
      titleHe: "מחווני מצב וטלמטריה",
      description: "Monitor real-time system metrics at a glance. See estimated battery runtime voltage, real-time wireless synchronization status, and active Bluetooth/Wi-Fi links.",
      descriptionHe: "עקבו אחר מדדי המערכת בזמן אמת במבט חטוף. ראו את מתח הסוללה וזמן העבודה הנותר המשוער, מצב סנכרון אלחוטי, וקישוריות Bluetooth ו-Wi-Fi פעילה.",
      tab: "controller",
      subPage: null,
    },
    {
      title: "You're all set!",
      titleHe: "אתם מוכנים לצאת לדרך!",
      description: "Congratulations! You've mastered the interface. Go ahead and start customizing patterns, lighting up LEDs, and crafting beautiful hologram effects!",
      descriptionHe: "מזל טוב! הכרתם את כל הכלים המרכזיים. כעת תוכלו להתחיל להתאים אישית תבניות, להאיר לדים וליצור אפקטים הולוגרפיים מדהימים!",
      placement: "center"
    } as any
  ];

  const currentStep = steps[currentStepIndex];

  // Auto-navigate to correct tab/subpage when entering a step
  useEffect(() => {
    if (currentStep.tab !== undefined) {
      const currentTab = currentStep.tab;
      const currentSub = currentStep.subPage !== undefined ? currentStep.subPage : null;
      if (activeTab !== currentTab || subPage !== currentSub) {
        onNavigate(currentTab, currentSub);
      }
    }
  }, [currentStepIndex, currentStep, onNavigate, activeTab, subPage]);

  // Measure target position
  const updateCoords = () => {
    if (!currentStep.targetId) {
      setCoords(null);
      return;
    }

    const element = document.getElementById(currentStep.targetId);
    if (element) {
      // If element is not in viewport or recently mounted, scroll it into view
      const rect = element.getBoundingClientRect();
      const inViewport = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );

      if (!inViewport) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Recalculate coordinates after scrolling settles
        setTimeout(() => {
          const updatedRect = element.getBoundingClientRect();
          setCoords({
            top: updatedRect.top,
            left: updatedRect.left,
            width: updatedRect.width,
            height: updatedRect.height,
          });
        }, 300);
      } else {
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
      }
    } else {
      setCoords(null);
    }
  };

  // Re-measure on step index changes, navigation, resize, scroll
  useEffect(() => {
    // Wait slightly for tab changes or DOM layout changes to stabilize
    const timer = setTimeout(() => {
      updateCoords();
    }, 400);

    // Debounced resize handler to ensure popover follows elements correctly on orientation changes
    let resizeTimer: any;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateCoords, 150);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", updateCoords, { passive: true });

    return () => {
      clearTimeout(timer);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", updateCoords);
    };
  }, [currentStepIndex, activeTab, subPage]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      localStorage.setItem("holospin_tour_completed", "true");
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("holospin_tour_completed", "true");
    onClose();
  };

  // Calculate position styles for tour popover
  const getPopoverStyle = (): React.CSSProperties => {
    if (coords) {
      const isBottomHalf = coords.top + coords.height / 2 > window.innerHeight / 2;
      const isRightHalf = coords.left + coords.width / 2 > window.innerWidth / 2;
      
      const width = Math.min(320, window.innerWidth - 32);
      
      let left = coords.left + coords.width / 2 - width / 2;
      // Prevent going off left/right edges
      left = Math.max(16, Math.min(window.innerWidth - width - 16, left));

      if (isBottomHalf) {
        return {
          position: "fixed",
          left: `${left}px`,
          bottom: `${window.innerHeight - coords.top + 14}px`,
          width: `${width}px`,
        };
      } else {
        return {
          position: "fixed",
          left: `${left}px`,
          top: `${coords.top + coords.height + 14}px`,
          width: `${width}px`,
        };
      }
    }

    // Default centered style
    const centerWidth = Math.min(350, window.innerWidth - 32);
    return {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: `${centerWidth}px`,
    };
  };

  const popoverStyle = getPopoverStyle();
  const isBottomHalf = coords ? (coords.top + coords.height / 2 > window.innerHeight / 2) : false;

  return (
    <div className="fixed inset-0 z-[10000] overflow-hidden pointer-events-none">
      {/* SVG Spotlight Mask */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-auto"
        style={{ width: "100vw", height: "100vh" }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {coords && (
              <rect
                x={coords.left - 8}
                y={coords.top - 8}
                width={coords.width + 16}
                height={coords.height + 16}
                rx="16"
                ry="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        
        {/* Dark dim backdrop */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(3, 4, 6, 0.82)"
          mask="url(#tour-spotlight-mask)"
          onClick={handleSkip}
          className="cursor-pointer"
        />
      </svg>

      {/* Spotlight pulse indicator overlay */}
      {coords && (
        <div 
          className="absolute border-[2px] border-sky-400 rounded-2xl pointer-events-none animate-pulse shadow-[0_0_20px_rgba(14,165,233,0.6)]"
          style={{
            top: `${coords.top - 10}px`,
            left: `${coords.left - 10}px`,
            width: `${coords.width + 20}px`,
            height: `${coords.height + 20}px`,
            transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        />
      )}

      {/* Popover Step Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, scale: 0.95, y: isBottomHalf ? 10 : -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={popoverStyle}
          className="pointer-events-auto bg-[#090a10] border border-slate-800 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col gap-4 relative z-[10001]"
        >
          {/* Visual Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-900 rounded-t-3xl overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-sky-400 to-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          {/* Arrow indicator for spotlight */}
          {coords && (
            <div 
              className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-[#090a10] border-slate-800 ${
                isBottomHalf 
                  ? "border-r border-b -bottom-2" 
                  : "border-t border-l -top-2"
              }`}
            />
          )}

          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
                {currentStepIndex === 0 || currentStepIndex === steps.length - 1 ? (
                  <Sparkles className="w-4 h-4 text-sky-400 animate-pulse" />
                ) : currentStepIndex === 1 ? (
                  <Eye className="w-4 h-4 text-sky-400" />
                ) : currentStepIndex === 2 ? (
                  <Hand className="w-4 h-4 text-sky-400" />
                ) : currentStepIndex === 3 ? (
                  <Upload className="w-4 h-4 text-sky-400" />
                ) : (
                  <Activity className="w-4 h-4 text-sky-400" />
                )}
              </div>
              <div>
                <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-400 font-mono">
                  STEP {currentStepIndex + 1} OF {steps.length}
                </h3>
                <h2 className="text-sm font-black text-white uppercase tracking-wider mt-0.5">
                  {currentStep.title}
                </h2>
              </div>
            </div>
            
            <button
              onClick={handleSkip}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-900/50 transition"
              title="Skip Tour / דלג על הסיור"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex flex-col gap-2.5">
            <div className="text-xs text-slate-200 leading-relaxed font-sans">
              {currentStep.description}
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed font-sans border-t border-slate-900/50 pt-2.5 text-right" dir="rtl">
              {currentStep.descriptionHe}
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-slate-900 pt-3.5 mt-1.5 gap-3">
            {/* Dots */}
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStepIndex 
                      ? "w-4 bg-sky-400" 
                      : "w-1.5 bg-slate-800"
                  }`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-950/50 hover:bg-slate-950 text-slate-400 hover:text-white rounded-xl transition flex items-center justify-center cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:shadow-[0_0_20px_rgba(14,165,233,0.45)] transition duration-200 flex items-center gap-1.5 cursor-pointer"
              >
                {currentStepIndex === steps.length - 1 ? (
                  <>
                    <span>Finish / סיום</span>
                    <Check className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Next / הבא</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
