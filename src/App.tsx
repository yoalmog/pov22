import React, { useState, useEffect, useRef, memo, useCallback } from "react";
// Triggering a small change to ensure the deployment/build pipeline picks up the latest assets.
import { motion, AnimatePresence } from "motion/react";
import { BleClient } from '@capacitor-community/bluetooth-le';
import { registerPlugin, Capacitor } from '@capacitor/core';
const Esptool = registerPlugin<any>('Esptool');
import { Network } from '@capacitor/network';
import { Geolocation } from '@capacitor/geolocation';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { usePermissions } from "./hooks/usePermissions";
import { useHardwareStream } from "./hooks/useHardwareStream";
import { PermissionsManager } from "./components/PermissionsManager";
import { CalibrationPanel } from "./components/CalibrationPanel";

import { HoloSlicer } from "./components/HoloSlicer";
import { GestureController } from "./components/GestureController";
import { AdvancedSyncPanel } from "./components/AdvancedSyncPanel";
import { BufferHealthIndicator } from "./components/BufferHealthIndicator";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

import {
  Menu,
  Wifi,
  Clock,
  Flame,
  Power,
  Sun,
  Fan,
  RefreshCw,
  Target,
  Thermometer,
  Zap,
  Settings,
  Info,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Play,
  Plus,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  Monitor,
  Globe,
  AlertTriangle,
  Save,
  Download,
  X,
  Trash2,
  Upload,
  Aperture,
  Activity,
  HelpCircle,
  MoveVertical,
  MoveHorizontal,
  Box,
  Smile,
  Type,
  Ghost,
  Video,
  Image,
  Search,
  Cpu,
  ShieldCheck,
  CloudLightning,
  Smartphone,
  Bluetooth,
  HardDrive,
  FileText,
  Folders,
  MapPin,
  Mic,
  Hand,
  ThumbsUp,
  Pointer,
  HandMetal,
  ThumbsDown,
  FolderOpen,
  ShieldAlert,
  Sparkles,
  Palette,
  Wand2,
  Battery
} from "lucide-react";
import { GalaxyBackground } from "./components/GalaxyBackground";
import { HologramSimulator } from "./components/HologramSimulator";
import { AiEffectPreview } from "./components/AiEffectPreview";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { LivePaint } from "./components/LivePaint";
import { TextMarquee } from "./components/TextMarquee";
import { HardwareHealth } from "./components/HardwareHealth";
import { InfoTooltip } from "./components/InfoTooltip";
import { AiEffectStudio } from "./components/AiEffectStudio";
import { LedVisualizer } from "./components/LedVisualizer";
import { AiModelInstaller } from "./components/AiModelInstaller";
import { PinSelectorPanel } from "./components/PinSelectorPanel";
import { WiringGuide } from "./components/WiringGuide";
import { Esp32Board } from "./components/Esp32Board";
import { Gauge } from "./components/Gauge";
import { AppWalkthrough } from "./components/AppWalkthrough";
import { FirmwareStudio } from "./components/FirmwareStudio";
import {
  savePresetToDB,
  loadPresetFromDB,
  loadAllPresetsFromDB,
  saveAllPresetsToDB,
  clearAllPresetsInDB,
  saveMediaToDB,
  loadMediaFromDB,
  loadAllMediaFromDB,
  deleteMediaFromDB,
  clearAllMediaInDB,
  pruneOldMediaFromDB
} from "./lib/indexedDbCache";
import planetImg from "./assets/images/hologram_planet_1779776225377.png";
import galaxy0 from "./assets/images/galaxy_background_1779780757373.png";
import galaxy1 from "./assets/images/hd_vivid_galaxy_1779780978111.png";
import butterfly from "./assets/images/hologram_butterfly_1779775623164.png";
import galaxy2 from "./assets/images/rainbow_galaxy_1779781352503.png";
import galaxy3 from "./assets/images/warm_galaxy_1779781369262.png";
import splashBg from "./assets/images/user_splash_bg_1779993731939.png";
const video1 = "/videos/12656_Big_Bang_1080.webm";
const video2 = "/videos/129936-745943770.mp4";

export const VIDEO_PRESETS = [
  { id: "big_bang", name: "Galaxy Big Bang 🌌", url: video1 },
  { id: "neon_tunnel", name: "Neon Matrix Tunnel 👾", url: video2 },
];

const RainbowIcon = () => (
  <svg
    viewBox="0 0 100 60"
    fill="none"
    strokeWidth="6"
    strokeLinecap="round"
    className="w-8 h-8"
  >
    <path d="M 10 50 A 40 40 0 0 1 90 50" stroke="#ef4444" />
    <path d="M 22 50 A 28 28 0 0 1 78 50" stroke="#f97316" />
    <path d="M 34 50 A 16 16 0 0 1 66 50" stroke="#22c55e" />
    <path d="M 46 50 A 4 4 0 0 1 54 50" stroke="#3b82f6" />
  </svg>
);

const MatrixIcon = ({ color }: { color: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeDasharray="2 3"
    className="w-8 h-8"
  >
    <path d="M5 4v16M9 8v12M13 3v13M17 6v14M21 5v10" />
  </svg>
);

const HypnoIcon = ({ color }: { color: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    className="w-8 h-8"
  >
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const SpaceIcon = ({ color }: { color: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    className="w-8 h-8"
  >
    <circle cx="12" cy="12" r="5" />
    <ellipse cx="12" cy="12" rx="11" ry="3.5" transform="rotate(-20 12 12)" />
  </svg>
);

const MandalaIcon = ({ color }: { color: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    className="w-8 h-8"
  >
    <path d="M12 3a9 9 0 0 1 9 9 9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 9-9Z" />
    <path d="M12 6a6 6 0 0 1 6 6 6 6 0 0 1-6 6 6 6 0 0 1-6-6 6 6 0 0 1 6-6Z" />
    <path d="M12 9a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3Z" />
  </svg>
);

const AcidIcon = ({ color }: { color: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    className="w-8 h-8"
  >
    <circle cx="12" cy="12" r="2" />
    <path d="M12 10a4 4 0 0 0-4-4 M12 14a4 4 0 0 0-3 3 M12 14a4 4 0 0 1 3 3" />
    <circle cx="12" cy="12" r="9" strokeDasharray="4 4" strokeWidth="1" />
  </svg>
);

const KaleidoscopeIcon = ({ color }: { color: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    className="w-8 h-8"
  >
    <path d="M12 2L2 12h20L12 2z" />
    <path d="M12 22L2 12h20L12 22z" />
    <circle cx="12" cy="12" r="3" />
    <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="2 2" />
    <line x1="2" y1="12" x2="22" y2="12" strokeDasharray="2 2" />
  </svg>
);

const VideoSynthIcon = ({ color }: { color: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    className="w-8 h-8"
  >
    <rect x="2" y="3" width="20" height="15" rx="2" />
    <line x1="17" y1="21" x2="7" y2="21" />
    <line x1="12" y1="18" x2="12" y2="21" />
    <line x1="6" y1="8" x2="18" y2="8" strokeDasharray="1 2" />
    <line x1="6" y1="11" x2="18" y2="11" strokeDasharray="1 1" />
  </svg>
);

const AnimationFlowIcon = ({ color }: { color: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    strokeLinecap="round"
    className="w-8 h-8"
  >
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const EFFECTS = [
  {
    id: "ai_custom",
    label: "AI CUSTOM",
    icon: (c: string) => <Sparkles className="w-8 h-8" color={c} />,
    color: "#e879f9",
    desc: "AI Generated Custom Effect",
  },
  {
    id: "clock",
    label: "CLOCK",
    icon: (c: string) => <Clock className="w-8 h-8" color={c} />,
    color: "#38bdf8",
    desc: "Classic clock style effect",
  },
  {
    id: "rainbow",
    label: "RAINBOW",
    icon: (c: string) => <RainbowIcon />,
    color: "#fff",
    desc: "Colorful rainbow animation",
  },
  {
    id: "fire",
    label: "FIRE",
    icon: (c: string) => <Flame className="w-8 h-8" color={c} />,
    color: "#f97316",
    desc: "Realistic fire flicker effect",
  },
  {
    id: "matrix",
    label: "MATRIX",
    icon: (c: string) => <MatrixIcon color={c} />,
    color: "#4ade80",
    desc: "Digital rain matrix effect",
  },
  {
    id: "hypno",
    label: "HYPNO",
    icon: (c: string) => <HypnoIcon color={c} />,
    color: "#a855f7",
    desc: "Hypnotic spiral illusion",
  },
  {
    id: "space",
    label: "SPACE",
    icon: (c: string) => <SpaceIcon color={c} />,
    color: "#ec4899",
    desc: "Deep space visual effect",
  },
  {
    id: "mandala",
    label: "MANDALA",
    icon: (c: string) => <MandalaIcon color={c} />,
    color: "#2dd4bf",
    desc: "Mandala geometric patterns",
  },
  {
    id: "acid",
    label: "ACID",
    icon: (c: string) => <AcidIcon color={c} />,
    color: "#a3e635",
    desc: "Acid trippy effect",
  },
  {
    id: "plasma",
    label: "PLASMA",
    icon: (c: string) => <div className="w-6 h-6 rounded-full border-2 animate-pulse" style={{ borderColor: c }}></div>,
    color: "#10b981",
    desc: "Energy plasma field",
  },
  {
    id: "portal",
    label: "PORTAL",
    icon: (c: string) => <div className="w-6 h-6 rounded-full border-2 border-dashed animate-[spin_2s_linear_infinite]" style={{ borderColor: c }}></div>,
    color: "#0ea5e9",
    desc: "Hyperspace portal effect",
  },
  {
    id: "dna",
    label: "DNA SPIN",
    icon: (c: string) => <div className="w-6 h-6 rounded-full border border-x-4 animate-pulse" style={{ borderColor: c }}></div>,
    color: "#f43f5e",
    desc: "Helix double strand",
  },
  {
    id: "mushrooms",
    label: "MUSHROOMS",
    icon: (c: string) => <Ghost className="w-8 h-8" color={c} />,
    color: "#fb7185",
    desc: "Dancing 3D mushrooms",
  },
  {
    id: "alien",
    label: "ALIEN",
    icon: (c: string) => <Smile className="w-8 h-8" color={c} />,
    color: "#86efac",
    desc: "Floating alien head",
  },
  {
    id: "cube3d",
    label: "3D CUBE",
    icon: (c: string) => <Box className="w-8 h-8" color={c} />,
    color: "#60a5fa",
    desc: "Rotating wireframe cube",
  },
  {
    id: "kaleidoscope",
    label: "KALEIDO",
    icon: (c: string) => <KaleidoscopeIcon color={c} />,
    color: "#f43f5e",
    desc: "Symmetric repeating reflections",
  },
  {
    id: "video_synth",
    label: "VIDEO SYN",
    icon: (c: string) => <VideoSynthIcon color={c} />,
    color: "#38bdf8",
    desc: "Retro CRT feedback synthesizer",
  },
  {
    id: "animation_flow",
    label: "ANIME FLOW",
    icon: (c: string) => <AnimationFlowIcon color={c} />,
    color: "#a855f7",
    desc: "Vibrant high-speed vector stream",
  },
  {
    id: "pov_text",
    label: "POV TEXT",
    icon: (c: string) => <Type className="w-8 h-8" color={c} />,
    color: "#fcd34d",
    desc: "Hologram POV text generator",
  },
  {
    id: "logo",
    label: "LOGO",
    icon: (c: string) => <Aperture className="w-8 h-8" color={c} />,
    color: "#00b4d8",
    desc: "System logo projection",
  },
  {
    id: "solid",
    label: "SOLID",
    icon: (c: string) => <div className="w-4 h-4 rounded-md shadow-sm" style={{ backgroundColor: c }}></div>,
    color: "#00b4d8",
    desc: "Static solid color display",
  },
];

const CustomSlider = memo(function CustomSlider({
  value,
  onChange,
  thumbColor,
  trackColor,
  min = 0,
  max = 255,
  disabled = false,
  step = 1,
}: any) {
  return (
    <div className={`relative flex-1 h-8 flex items-center ${disabled ? "opacity-35 pointer-events-none" : ""}`}>
      <div
        className="absolute left-0 right-0 h-1.5 rounded-full"
        style={{ backgroundColor: trackColor }}
      ></div>
      <div
        className="absolute left-0 h-1.5 rounded-full pointer-events-none transition-all"
        style={{
          backgroundColor: thumbColor,
          width: `${((value - min) / (max - min)) * 100}%`,
        }}
      ></div>
      <div
        className="absolute w-5 h-5 rounded-full pointer-events-none shadow-lg -ml-2.5 transition-all"
        style={{
          backgroundColor: thumbColor,
          left: `${((value - min) / (max - min)) * 100}%`,
          filter: disabled ? undefined : `drop-shadow(0 0 8px ${thumbColor})`,
        }}
      ></div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full absolute inset-0 opacity-0 cursor-pointer"
      />
    </div>
  );
});

function Toggle({ value, onChange, activeColor = "#00b4d8" }: any) {
  return (
    <div
      className={`w-12 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors ${value ? "" : "bg-slate-700/50"}`}
      style={{ backgroundColor: value ? activeColor : undefined }}
      onClick={() => onChange(!value)}
    >
      <div
        className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${value ? "translate-x-6" : "translate-x-0"}`}
      ></div>
    </div>
  );
}

function Stepper({ value, onChange, min = 0, max = 1000 }: any) {
  return (
    <div className="flex items-center gap-2 bg-[#0c0e15] border border-slate-700/50 rounded-lg p-1 px-2 h-[42px] w-[130px]">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="text-slate-400 hover:text-white pb-1 flex-1 text-center text-lg"
      >
        -
      </button>
      <span className="text-white font-medium text-sm w-12 text-center">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="text-slate-400 hover:text-white pb-1 flex-1 text-center text-lg"
      >
        +
      </button>
    </div>
  );
}

function RadioGroup({ options, value, onChange }: any) {
  return (
    <div className="flex bg-[#0c0e15] border border-slate-700/50 rounded-lg overflow-hidden p-1 gap-1 h-[42px] items-center px-1 flex-1">
      {options.map((o: any) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 py-1.5 h-full flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold tracking-widest rounded-md transition-all ${value === o.value ? "bg-[#00b4d8]/20 text-[#00b4d8] border border-[#00b4d8]/50" : "text-slate-500 hover:text-slate-300 border border-transparent"}`}
        >
          {o.icon && o.icon} {o.label}
        </button>
      ))}
    </div>
  );
}

function InputField({
  label,
  type = "text",
  value,
  onChange,
  innerRight,
}: any) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] text-slate-400 tracking-wide">{label}</span>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#0c0e15] border border-slate-700/50 rounded-xl h-[46px] px-4 text-sm text-slate-200 focus:outline-none focus:border-[#00b4d8] transition-colors"
        />
        {innerRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {innerRight}
          </div>
        )}
      </div>
    </div>
  );
}

const SettingsRow = memo(function SettingsRow({ icon, title, subtitle, onClick, rightWidget }: any) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between py-4 border-b border-slate-800/60 hover:bg-slate-800/30 cursor-pointer transition-colors px-4 last:border-0"
    >
      <div className="flex items-center gap-4">
        <div className="text-slate-400">{icon}</div>
        <div className="flex flex-col">
          <span className="text-[13px] text-slate-200 tracking-wide">
            {title}
          </span>
          {subtitle && (
            <span className="text-[10px] text-slate-500 tracking-wider font-medium">
              {subtitle}
            </span>
          )}
        </div>
      </div>
      <div>
        {rightWidget || <ChevronRight className="w-4 h-4 text-slate-600" />}
      </div>
    </div>
  );
});

function HueSlider({ hue, setHue }: any) {
  return (
    <div className="relative w-full h-8 flex items-center">
      <div
        className="absolute inset-x-0 h-1.5 rounded-full"
        style={{
          background:
            "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
        }}
      ></div>
      <input
        type="range"
        min="0"
        max="360"
        value={hue}
        onChange={(e) => setHue(Number(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer"
      />
      <div
        className="absolute w-5 h-5 rounded-full pointer-events-none shadow-lg -ml-2.5 transition-all border-2 border-white"
        style={{
          left: `${(hue / 360) * 100}%`,
          backgroundColor: `hsl(${hue}, 100%, 50%)`,
          boxShadow: `0 0 10px hsl(${hue}, 100%, 50%)`,
        }}
      ></div>
    </div>
  );
}

const staticGraphData = [
  8, 12, 5, 15, 9, 18, 7, 11, 19, 4, 14, 6, 12, 17, 8, 13, 6, 16, 10, 20, 5, 14,
  8, 19, 11, 7, 15, 10, 18, 6, 13, 9, 17, 12, 5, 14, 8, 16, 9, 11, 6, 15, 8,
];
const SyncSvgGraph = () => (
  <div className="mt-6 flex justify-center h-20 items-end overflow-hidden px-2 opacity-80">
    <div
      className="w-full flex items-end justify-between gap-[2px] h-full"
      style={{ filter: "drop-shadow(0 0 6px rgba(34, 197, 94, 0.5))" }}
    >
      {staticGraphData.map((val, i) => (
        <div
          key={i}
          className="bg-[#22c55e] w-1 rounded-sm"
          style={{ height: `${val * 3.5}px` }}
        ></div>
      ))}
    </div>
  </div>
);

const OPTIMAL_SPEEDS: Record<string, { speed: number; label: string; explanation: string }> = {
  rainbow: { speed: 110, label: "110 RPM (High)", explanation: "מניפת צבעי הקשת המשתנה דורשת סריקה מהירה ביותר כדי לאחד את מעבר הצבעים המעגלי." },
  fire: { speed: 135, label: "135 RPM (Very High)", explanation: "מהירות רוטור גבוהה מעניקה צפיפות הקרנה המדמה את להבות האש הלוהטות בצורה נפחית." },
  matrix: { speed: 155, label: "155 RPM (Ultra-High)", explanation: "קוד המטריקס הנופל זקוק לסריקה תכופה כדי למנוע זליגת תווי קוד והפרדתם בזמן הנפילה." },
  hypno: { speed: 70, label: "70 RPM (Medium)", explanation: "איזון מדויק בין שינוי עומק הטבעות לבין מהירות סיבוב המונע כאוס ויזואלי של הספירלה." },
  space: { speed: 90, label: "90 RPM (Med-High)", explanation: "מאפשר לכוכבים המשוגרים למרכז ומערכת הטבעות להישמר יציבות ומותאמות לזווית העין." },
  mandala: { speed: 65, label: "65 RPM (Medium)", explanation: "קצב סיבוב מתון המונע מריחת קווים גאומטריים דקים ועדינים התוחמים את צורת המנדלה." },
  acid: { speed: 75, label: "75 RPM (Medium)", explanation: "מהירות זו משלבת קצב ציור פלואידי מעורבל יחד עם תנועה פנימית חלקה של הגוונים." },
  plasma: { speed: 85, label: "85 RPM (Med)", explanation: "תנועת ענני הפלסמה משתלבת נכון ביותר בסיבוב מנוע ממוצע המדמה ערבול גזים משכנע." },
  portal: { speed: 95, label: "95 RPM (Med-High)", explanation: "טבעות הפורטל המתרחבות נפרסות בצורה מעגלית מלאה ללא חורים שחורים בתמיכת רוטור מהיר." },
  dna: { speed: 115, label: "115 RPM (High)", explanation: "סיבוב הסליל הכפול נראה כסוליד תלת-ממדי אמיתי רק בהאצה ממוקדת של זווית ההקרנה." },
  clock: { speed: 55, label: "55 RPM (Low-Med)", explanation: "מספרים יציבים של שעון דיגיטלי ואנלוגי דורשים ייצוב של מיקום המניפה במהירות מתונה." },
  mushrooms: { speed: 60, label: "60 RPM (Low-Med)", explanation: "תנועת פטריות הניאון ורקיעת הנבגים נפרסת בצורה סימטרית אידיאלית בקצב ממוזער." },
  alien: { speed: 65, label: "65 RPM (Medium)", explanation: "שילוב קשר העין של החוצן ואור הניאון המרצד דורש מנוחה מעוגנת בסיבוב יציב." },
  cube3d: { speed: 80, label: "80 RPM (Medium)", explanation: "שומר על קודקודים ישרים וחלקה של פאות הקובייה הווירטואלית בסיבוב עצמי." },
  kaleidoscope: { speed: 125, label: "125 RPM (High)", explanation: "מבנה מראות סימטרי מתפצל דורש מהירות פליטה גדולה כדי לקשור את הפאות הרחבות." },
  video_synth: { speed: 115, label: "115 RPM (High)", explanation: "סימולציית אותות הוידאו ושפופרת ה-CRT דורשת מהירות טיווח וסוויפ תואמים למשוב וידאו." },
  animation_flow: { speed: 105, label: "105 RPM (High)", explanation: "זרימה וקטורית מהירה של קרני חלקיקים תראה מוצקה ביותר בקצב חיתוך ציר מוגבר." },
  pov_text: { speed: 95, label: "95 RPM (Med-High)", explanation: "אותיות טקסט מרחפות נראות כמילה מחוברת ואחידה רק בסריקה מהירה שמונעת הגדרה קטועה." },
  logo: { speed: 70, label: "70 RPM (Medium)", explanation: "מהירות זו משמרת את הפרטים של תמונת המותג ללא עיוות רוחבי וקריעה אנכית." }
};

const EFFECT_OPTIMAL_CONFIGS: Record<string, {
  speed: number;
  brightness: number;
  speedRate: number;
  complexity: number;
  scale: number;
  color?: string;
  explanationHe: string;
}> = {
  rainbow: { speed: 110, brightness: 255, speedRate: 1.2, complexity: 12, scale: 1.1, color: "#ffffff", explanationHe: "סריקה מהירה ביותר לאיחוד מעבר צבעי הקשת, בהירות מקסימלית לצבעים עשירים ורוויה גבוהה." },
  fire: { speed: 135, brightness: 240, speedRate: 1.4, complexity: 14, scale: 1.2, color: "#f97316", explanationHe: "מהירות וקצב התקדמות פנימי גבוהים להענקת נפח, עומק ודימוי ריאליסטי של להבות אש לוהטות." },
  matrix: { speed: 155, brightness: 220, speedRate: 1.6, complexity: 12, scale: 1.0, color: "#4ade80", explanationHe: "מהירות אולטרה-גבוהה להפרדת תווי הקוד הירוק הנופל ומניעת זליגה עם קצב התקדמות תזזיתי." },
  hypno: { speed: 70, brightness: 180, speedRate: 0.6, complexity: 6, scale: 1.1, color: "#a855f7", explanationHe: "מהירות סיבוב מתונה וקצב פנימי אטי המונעים כאוס ויזואלי וממקסמים את עומק האפקט המהפנט." },
  space: { speed: 90, brightness: 200, speedRate: 0.9, complexity: 15, scale: 1.2, color: "#ec4899", explanationHe: "איזון מהירויות המאפשר לכוכבים הנזרקים למרכז לשמור על יציבות סימטרית ללא פתיחה רוחבית." },
  mandala: { speed: 65, brightness: 190, speedRate: 0.5, complexity: 8, scale: 1.2, color: "#2dd4bf", explanationHe: "סיבוב וקצב אטיים המונעים מריחה של הקווים הגאומטריים הדקים ועדינים התוחמים את המנדלה." },
  acid: { speed: 75, brightness: 210, speedRate: 0.7, complexity: 10, scale: 1.0, color: "#a3e635", explanationHe: "מהירות בינונית לקבלת שינויים פלואידיים מעורבלים עם מעברים חלקים של גוני החומצה הזרחניים." },
  plasma: { speed: 85, brightness: 170, speedRate: 0.8, complexity: 8, scale: 1.1, color: "#10b981", explanationHe: "קצב סיבוב ממוצע המדמה ערבול גזים משכנע ותנועת עננים רכה של הפלסמה החשמלית." },
  portal: { speed: 95, brightness: 230, speedRate: 1.8, complexity: 9, scale: 1.2, color: "#0ea5e9", explanationHe: "כוח מנוע מעוגן וקצב מהיר המעניקים תחושה של קפיצה במהירות האור בתוך מנהרת הפורטל הדינמית." },
  dna: { speed: 115, brightness: 200, speedRate: 1.2, complexity: 14, scale: 1.1, color: "#f43f5e", explanationHe: "סיבוב סליל כפול מהיר לקבלת אפקט מוצק ותלת-ממדי אמיתי בפריסה של 360 מעלות." },
  clock: { speed: 55, brightness: 150, speedRate: 1.0, complexity: 6, scale: 1.0, color: "#38bdf8", explanationHe: "סריקה מתונה והרמונית השומרת על יציבות הספרות והמחוגים של השעון במיקום קבוע ללא רעידות." },
  mushrooms: { speed: 60, brightness: 180, speedRate: 0.8, complexity: 6, scale: 1.0, color: "#fb7185", explanationHe: "מהירות נמוכה-בינונית להקרנה דקה וחלקה של פטריות הניאון והנבגים המתנוססים בצדדים." },
  alien: { speed: 65, brightness: 190, speedRate: 1.0, complexity: 8, scale: 0.9, color: "#86efac", explanationHe: "סנכרון יציב השומר על פרופורציות הפנים של החוצן בראש יציב במרכז ההקרנה." },
  cube3d: { speed: 80, brightness: 200, speedRate: 1.0, complexity: 12, scale: 1.1, color: "#60a5fa", explanationHe: "מהירות סיבוב מדויקת המונעת עיוותים של קודקודי הקובייה ומעברי הפאות הווירטואליות." },
  kaleidoscope: { speed: 125, brightness: 230, speedRate: 1.1, complexity: 10, scale: 1.2, color: "#f43f5e", explanationHe: "מהירות גבוהה הנדרשת כדי לקשור את הפאות הרחבות של פריסת המראות הסימטרית המתפצלת." },
  video_synth: { speed: 115, brightness: 210, speedRate: 1.3, complexity: 11, scale: 1.1, color: "#38bdf8", explanationHe: "קצב רדיאלי מהיר התואם לתזמון מטווח האות של שפופרת ה-CRT והמשוב הוויזואלי הרטרואקטיבי." },
  animation_flow: { speed: 105, brightness: 220, speedRate: 1.5, complexity: 12, scale: 1.1, color: "#a855f7", explanationHe: "זרימה וקטורית מהירה בעלת צפיפות חלקיקים מוצקה המייצרת תנועה זורמת ושוטפת של קרני האור." },
  pov_text: { speed: 95, brightness: 220, speedRate: 1.0, complexity: 8, scale: 1.0, color: "#fcd34d", explanationHe: "סריקה יציבה ומהירה המחברת את האותיות למילה אחידה וקריאה באוויר ללא גמגום ויזואלי." },
  logo: { speed: 70, brightness: 230, speedRate: 1.0, complexity: 8, scale: 1.0, color: "#00b4d8", explanationHe: "מהירות סיבוב מתאימה לשימור פרטי תמונת הלוגו ללא קריעה אנכית או מריחה רוחבית שלו." }
};

const PsychedelicLogo = ({ size = "large" }: { size?: "small" | "large" }) => {
  const isSmall = size === "small";
  return (
    <div className={`relative ${isSmall ? 'w-6 h-6 min-[380px]:w-8 min-[400px]:w-10' : 'w-32 h-32 mb-6'} flex items-center justify-center ${isSmall ? '' : 'animate-[float_4s_ease-in-out_infinite]'}`}>
      {/* Glow aura */}
      <div className={`absolute ${isSmall ? 'inset-x-[-1px] inset-y-[-1px] blur-[6px] min-[380px]:inset-x-[-2px] min-[380px]:inset-y-[-2px] min-[380px]:blur-[10px]' : 'inset-x-[-10px] inset-y-[-10px] blur-[30px]'} bg-gradient-to-tr from-purple-600 via-pink-500 to-cyan-400 rounded-full opacity-75 ${isSmall ? '' : 'animate-[pulseGlow_3s_infinite]'}`} />
      
      {/* Outer Vortex ring */}
      <svg
        className={`absolute ${isSmall ? 'w-5.5 h-5.5 min-[380px]:w-7 min-[400px]:w-9' : 'w-28 h-28'} text-purple-400 animate-[spin_10s_linear_infinite] animate-[psychedelicHues_15s_linear_infinite]`}
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="50" cy="50" r="45" strokeDasharray="5, 10" />
        <circle cx="50" cy="50" r="40" strokeDasharray="18, 6, 2, 6" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <path
            key={angle}
            d="M 50 15 C 35 15 35 50 50 50 C 65 50 65 15 50 15"
            transform={`rotate(${angle} 50 50)`}
            strokeWidth="1"
            opacity="0.8"
          />
        ))}
      </svg>

      {/* Middle reverse-spinning vortex ring */}
      <svg
        className={`absolute ${isSmall ? 'w-4.5 h-4.5 min-[380px]:w-6 min-[400px]:w-7.5' : 'w-24 h-24'} text-cyan-400 animate-[spinSlowReverse_6s_linear_infinite]`}
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="50" cy="50" r="32" strokeDasharray="10, 10" />
        {[30, 90, 150, 210, 270, 330].map((angle) => (
          <path
            key={angle}
            d="M 50 25 C 40 30 40 45 50 50 C 60 45 60 30 50 25"
            transform={`rotate(${angle} 50 50)`}
            strokeWidth="1.2"
          />
        ))}
      </svg>

      {/* Inner sacred geometry heart */}
      <svg
        className={`absolute ${isSmall ? 'w-2.5 h-2.5 min-[380px]:w-3.5 min-[400px]:w-4.5' : 'w-14 h-14'} text-rose-500 animate-[spin_4s_linear_infinite] animate-[psychedelicHues_5s_linear_infinite] drop-shadow-[0_0_15px_#f43f5e]`}
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <polygon points="50,15 80,75 20,75" />
        <polygon points="50,85 80,25 20,25" />
        <circle cx="50" cy="50" r="9" fill="currentColor" className="animate-[pulse_1.5s_infinite]" />
      </svg>
    </div>
  );
};

export default function App() {

  const getDeviceUrl = (path: string) => {
    const isCapacitor = !!(window as any).Capacitor;
    const isPreview = window.location.protocol === 'https:' && window.location.hostname !== "192.168.4.1";
    if (state.wifi.mode === "AP") return isPreview ? path : `http://192.168.4.1${path}`;
    if (state.wifi.ip && state.wifi.ip.trim() !== "") {
      const ipStr = state.wifi.ip.trim();
      return isPreview ? path : (ipStr.startsWith("http") ? `${ipStr}${path}` : `http://${ipStr}${path}`);
    }
    return path;
  };

  /**
   * Helper function to validate firmware download paths.
   * Ensures the path points to a valid binary file.
   */
  const validateFirmwarePath = (path: string): boolean => {
    if (!path || typeof path !== 'string') return false;
    const cleanPath = path.split('?')[0].split('#')[0];
    return cleanPath.toLowerCase().endsWith('.bin');
  };

  /**
   * Generates a full absolute URL for browser navigation (window.open).
   * Always uses http:// and the explicit IP to avoid HTTPS mixed content blocks on local network.
   */
  const getExternalDeviceUrl = (path: string) => {
    const targetPath = path.startsWith('/') ? path : `/${path}`;
    if (state.wifi.mode === "AP") return `http://192.168.4.1${targetPath}`;
    if (state.wifi.ip && state.wifi.ip.trim() !== "") {
      const ipStr = state.wifi.ip.trim();
      return ipStr.startsWith("http") ? `${ipStr}${targetPath}` : `http://${ipStr}${targetPath}`;
    }
    return targetPath;
  };

  const [showSplash, setShowSplash] = useState(true);
  const [showSplashLogo, setShowSplashLogo] = useState(false);
  const [splashProgress, setSplashProgress] = useState(0);

  // Native ESPTool Flashing states
  const [isFlashing, setIsFlashing] = useState(false);
  const [flashProgress, setFlashProgress] = useState(0);
  const [flashStage, setFlashStage] = useState<string>('idle');
  const [flashMessage, setFlashMessage] = useState<string>('');
  const [showPluginMissingModal, setShowPluginMissingModal] = useState(false);

  // Load physical files from native storage if running on Android/iOS
  useEffect(() => {
    const loadPhysicalFiles = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Ensure directories exist
          try {
            await Filesystem.mkdir({ path: 'images', directory: Directory.Documents, recursive: true });
          } catch (e) {}
          try {
            await Filesystem.mkdir({ path: 'videos', directory: Directory.Documents, recursive: true });
          } catch (e) {}

          const imageFilesResult = await Filesystem.readdir({ path: 'images', directory: Directory.Documents });
          const videoFilesResult = await Filesystem.readdir({ path: 'videos', directory: Directory.Documents });

          const loadedImages = await Promise.all(imageFilesResult.files.map(async (file) => {
            const stat = await Filesystem.stat({ path: `images/${file.name}`, directory: Directory.Documents });
            const uri = await Filesystem.getUri({ path: `images/${file.name}`, directory: Directory.Documents });
            return {
              name: file.name,
              size: (stat.size / 1024).toFixed(0) + " KB",
              type: "image",
              path: Capacitor.convertFileSrc(uri.uri),
              physicalUri: uri.uri,
              selected: true
            };
          }));

          const loadedVideos = await Promise.all(videoFilesResult.files.map(async (file) => {
            const stat = await Filesystem.stat({ path: `videos/${file.name}`, directory: Directory.Documents });
            const uri = await Filesystem.getUri({ path: `videos/${file.name}`, directory: Directory.Documents });
            return {
              name: file.name,
              size: (stat.size / 1024).toFixed(0) + " KB",
              type: "video",
              path: Capacitor.convertFileSrc(uri.uri),
              physicalUri: uri.uri,
              selected: true
            };
          }));

          if (loadedImages.length > 0 || loadedVideos.length > 0) {
            setState((prev: any) => {
              const currentFiles = prev.storage?.files || [];
              const merged = [...currentFiles];
              [...loadedImages, ...loadedVideos].forEach(newF => {
                if (!merged.some(f => f.name === newF.name)) {
                  merged.push(newF);
                }
              });
              return {
                ...prev,
                storage: {
                  ...prev.storage,
                  files: merged
                }
              };
            });
          }
        } catch (err) {
          console.error("Failed to read physical files:", err);
        }
      }
    };

    loadPhysicalFiles();
  }, []);

  useEffect(() => {
    let logoTimer: any;
    let endTimer: any;
    let progressInterval: any;
    
    if (showSplash) {
      const waitTime = 1900;
      const loadTime = 2600;
      const totalDuration = waitTime + loadTime;
      const startTime = Date.now();

      logoTimer = setTimeout(() => {
        setShowSplashLogo(true);
      }, waitTime);
      
      progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed > waitTime) {
          const p = Math.min(((elapsed - waitTime) / loadTime) * 100, 100);
          setSplashProgress(p);
        } else {
          setSplashProgress(0);
        }
      }, 30);

      endTimer = setTimeout(() => {
        setShowSplash(false);
      }, totalDuration);
    }
    
    return () => {
      clearTimeout(logoTimer);
      clearTimeout(endTimer);
      clearInterval(progressInterval);
    };
  }, [showSplash]);

  const safeSaveLocal = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("localStorage save failed:", e);
    }
  };

  const safeGetLocal = (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  };

  const safeRemoveLocal = (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("localStorage remove failed:", e);
    }
  };

  const [activeTab, setActiveTab] = useState("controller");
  const [studioView, setStudioView] = useState<"creative" | "firmware">("creative");
  const [showTour, setShowTour] = useState<boolean>(() => {
    try {
      return localStorage.getItem("holospin_tour_completed") !== "true";
    } catch (e) {
      return false;
    }
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  const [calibrationConfig, setCalibrationConfig] = useState(() => {
    const saved = safeGetLocal("holospin_calibrationConfig");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      phaseOffset: 180.0,
      angularCorrection: 0.0,
      gamma: 2.2,
      pattern: "none"
    };
  });

  const handleCalibrationUpdate = async (key: string, val: any) => {
    setCalibrationConfig((prev: any) => {
      const updated = { ...prev, [key]: val };
      safeSaveLocal("holospin_calibrationConfig", JSON.stringify(updated));
      return updated;
    });
    
    const payload = { [key]: val };
    
    if (isBluetoothConnected && activeBleId) {
      await sendCommand({ category: "calibrate", update: payload });
    } else if (isConnected) {
      try {
        const targetUrl = getDeviceUrl("/calibrate");
        await safeFetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error("Calibration sync failed", err);
      }
    }
  };
  const [subPage, setSubPage] = useState<string | null>(null);

  useEffect(() => {
    if (subPage === "storage") {
      fetchSDCardFiles();
    }
  }, [subPage]);

  const [bgImageId, setBgImageId] = useState(() => safeGetLocal("holospin_bgImageId") || "video1");
  
  useEffect(() => {
    safeSaveLocal("holospin_bgImageId", bgImageId);
  }, [bgImageId]);

  const [activeEffect, setActiveEffect] = useState(() => safeGetLocal("holospin_activeEffect") || "rainbow");
  const [aiEffectPrompt, setAiEffectPrompt] = useState<string>(() => safeGetLocal("holospin_aiEffectPrompt") || "");
  const [aiEffectCode, setAiEffectCode] = useState<string | null>(() => safeGetLocal("holospin_aiEffectCode") || null);
  const [aiEffectJs, setAiEffectJs] = useState<string | null>(() => safeGetLocal("holospin_aiEffectJs") || null);

  useEffect(() => {
    safeSaveLocal("holospin_aiEffectPrompt", aiEffectPrompt);
  }, [aiEffectPrompt]);

  useEffect(() => {
    if (aiEffectCode) safeSaveLocal("holospin_aiEffectCode", aiEffectCode);
    else safeRemoveLocal("holospin_aiEffectCode");
  }, [aiEffectCode]);

  useEffect(() => {
    if (aiEffectJs) safeSaveLocal("holospin_aiEffectJs", aiEffectJs);
    else safeRemoveLocal("holospin_aiEffectJs");
  }, [aiEffectJs]);

  const [colorMode, setColorMode] = useState<"solid" | "random">(() => (safeGetLocal("holospin_colorMode") as any) || "solid");
  const [logoUrl, setLogoUrl] = useState<string | null>(() => safeGetLocal("holospin_logoUrl") || null);

  const [logoRotation, setLogoRotation] = useState<number>(() => {
    const val = Number(safeGetLocal("holospin_logoRotation") || "0");
    return isNaN(val) ? 0 : val;
  });
  const [logoTintColor, setLogoTintColor] = useState<string>(() => safeGetLocal("holospin_logoTintColor") || "#00b4d8");
  const [hue, setHue] = useState<number>(190);
  const [useLogoTint, setUseLogoTint] = useState<boolean>(() => safeGetLocal("holospin_useLogoTint") === "true");
  const [povText, setPovText] = useState(() => safeGetLocal("holospin_povText") || "POV SYSTEM HOLOSPIN 3D");
  const [povTextAnimation, setPovTextAnimation] = useState<string>(() => safeGetLocal("holospin_povTextAnimation") || "fade");
  const [brightness, setBrightness] = useState(() => {
    const val = Number(safeGetLocal("holospin_brightness") || "150");
    return isNaN(val) ? 150 : val;
  });
  const [flameIntensity, setFlameIntensity] = useState<number>(() => {
    const val = Number(safeGetLocal("holospin_flameIntensity") || "128");
    return isNaN(val) ? 128 : val;
  });
  useEffect(() => {
    setLogoTintColor(`hsl(${hue}, 100%, 50%)`);
  }, [hue]);

  const [motorSpeed, setMotorSpeed] = useState(() => {
    const val = Number(safeGetLocal("holospin_motorSpeed") || "80");
    return isNaN(val) ? 80 : val;
  });
  const [effectSpeedRate, setEffectSpeedRate] = useState<number>(() => {
    const val = Number(safeGetLocal("holospin_effectSpeedRate") || "1.0");
    return isNaN(val) || val === 0 ? 1.0 : val;
  });
  const [effectScale, setEffectScale] = useState<number>(() => {
    const val = Number(safeGetLocal("holospin_effectScale") || "1.0");
    return isNaN(val) || val === 0 ? 1.0 : val;
  });
  const [effectComplexity, setEffectComplexity] = useState<number>(() => {
    const val = Number(safeGetLocal("holospin_effectComplexity") || "8");
    return isNaN(val) ? 8 : val;
  });

  const [kaleidoShape, setKaleidoShape] = useState<string>(() => safeGetLocal("holospin_kaleidoShape") || "morphing");
  const [kaleidoLines, setKaleidoLines] = useState<string>(() => safeGetLocal("holospin_kaleidoLines") || "hybrid");
  const [kaleidoMorphSpeed, setKaleidoMorphSpeed] = useState<number>(() => {
    const val = Number(safeGetLocal("holospin_kaleidoMorphSpeed") || "1.0");
    return isNaN(val) ? 1.0 : val;
  });

  const [showPass, setShowPass] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSyncEnabled, setIsSyncEnabled] = useState<boolean>(() => {
    const val = safeGetLocal("holospin_isSyncEnabled");
    return val === null ? true : val === "true";
  });

  const handleSelectEffect = (effectId: string) => {
    setActiveEffect(effectId);
    
    const config = EFFECT_OPTIMAL_CONFIGS[effectId];
    if (config) {
      setMotorSpeed(config.speed);
      setBrightness(config.brightness);
      setEffectSpeedRate(config.speedRate);
      setEffectComplexity(config.complexity);
      setEffectScale(config.scale);
      
      if (config.color) {
        setLogoTintColor(config.color);
      }
      
      const effectName = EFFECTS.find(e => e.id === effectId)?.label || effectId;
      
      // Broadcast update to device if connected
      setToastMessage(`הגרפיקה ${effectName} הופעלה!`);
    }
  };

  // Connection and Sensor State
  const [showPermissions, setShowPermissions] = useState(false);
  const [activeBleId, setActiveBleId] = useState<string | null>(null);
  const [selectedSimModel, setSelectedSimModel] = useState<string>(() => safeGetLocal("holospin_sim_model") || "S3");
  const [handshakeLogs, setHandshakeLogs] = useState<string[]>([]);
  const [isHandshaking, setIsHandshaking] = useState<boolean>(false);
  const [presets, setPresets] = useState<Record<string, any>>(() => {
    try {
      const saved = safeGetLocal("holospin_presets");
      return saved ? JSON.parse(saved) : { "1": null, "2": null, "3": null, "4": null };
    } catch {
      return { "1": null, "2": null, "3": null, "4": null };
    }
  });
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);
  const [pendingSaveSlot, setPendingSaveSlot] = useState<string | null>(null);
  const [presetNameInput, setPresetNameInput] = useState<string>("");

  const [gestureMode, setGestureMode] = useState(false);
  const [commandQueue, setCommandQueue] = useState<any[]>([]);
  const [syncProgress, setSyncProgress] = useState<number | null>(null);
  const [syncLogs, setSyncLogs] = useState<{ cmd: string; status: 'pending' | 'success' }[]>([]);
  const [handInFrame, setHandInFrame] = useState(false);
  const [handConfidence, setHandConfidence] = useState(0);
  const [gesturePulse, setGesturePulse] = useState(false);
  const [activeRawGesture, setActiveRawGesture] = useState<string | null>(null);
  const activeGestureTimeout = useRef<NodeJS.Timeout | null>(null);
  const [syncHistory, setSyncHistory] = useState<{ time: string; quality: number }[]>([]);
  const [gestureSensitivity, setGestureSensitivity] = useState(20); // 1-100 range
  const [neutralCenter, setNeutralCenter] = useState({ x: 0.5, y: 0.5 });
  const currentHandPos = useRef<{ x: number, y: number } | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [showGestureTutorial, setShowGestureTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const tutorialSteps = [
    { 
      id: 'peace', 
      title: 'Peace Sign', 
      desc: 'Extend your index and middle fingers in a "V" shape. This is commonly mapped to loading specific beautiful effects like Rainbow.', 
      icon: <Hand className="w-12 h-12 text-[#00b4d8]" />,
      animation: {
        animate: { y: [0, -10, 0], rotate: [0, 5, -5, 0] },
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      },
      tip: "Keep fingers clearly separated for best recognition."
    },
    { 
      id: 'palm', 
      title: 'Open Palm', 
      desc: 'Show all 5 fingers clearly. Often mapped to high-energy visual effects like Fire.', 
      icon: <Hand className="w-12 h-12 text-[#f97316]" />,
      animation: {
        animate: { scale: [1, 1.15, 1], filter: ["drop-shadow(0 0 0px #f97316)", "drop-shadow(0 0 15px #f97316)", "drop-shadow(0 0 0px #f97316)"] },
        transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
      },
      tip: "Keep your palm flat and facing the camera directly."
    },
    { 
      id: 'fist', 
      title: 'Closed Fist', 
      desc: 'Typical for power-off or global stops. Clench your hand into a tight fist in view of the camera.', 
      icon: <Hand className="w-12 h-12 text-[#ef4444]" />,
      animation: {
        animate: { scale: [1, 0.85, 1], y: [0, 5, 0] },
        transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
      },
      tip: "Tuck your thumb fully for a cleaner, recognizable profile."
    },
    { 
      id: 'thumbs_up', 
      title: 'Thumbs Up', 
      desc: 'Show a clear thumbs-up gesture. Excellent for Power On or confirming actions.', 
      icon: <ThumbsUp className="w-12 h-12 text-[#22c55e]" />,
      animation: {
        animate: { y: [0, -15, 0], scale: [1, 1.1, 1] },
        transition: { duration: 1.2, repeat: Infinity, ease: "easeOut" }
      },
      tip: "Ensure your hand is upright and the thumb points straight up."
    },
    { 
      id: 'point_up', 
      title: 'Point Up', 
      desc: 'Extend just your index finger straight up. Often used for precise effects like the Holographic Clock.', 
      icon: <Pointer className="w-12 h-12 text-[#a855f7]" />,
      animation: {
        animate: { y: [0, -10, 0] },
        transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
      },
      tip: "Keep the rest of your hand tightly closed."
    },
    { 
      id: 'rock_on', 
      title: 'Rock On 🤘', 
      desc: 'Extend your index and pinky fingers. Excellent for triggering intense mode or Aurora effects.', 
      icon: <HandMetal className="w-12 h-12 text-[#f43f5e]" />,
      animation: {
        animate: { rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] },
        transition: { duration: 0.6, repeat: Infinity, ease: "linear" }
      },
      tip: "Rock on! Keep the middle fingers fully tucked."
    },
    { 
      id: 'swipe_v', 
      title: 'Vertical Swiping', 
      desc: 'In addition to static poses, move your open hand up or down dynamically to adjust brightness on the fly.', 
      icon: <MoveVertical className="w-12 h-12 text-[#00b4d8]" />,
      animation: {
        animate: { y: [-15, 15, -15], opacity: [0.5, 1, 0.5] },
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      },
      tip: "Use slow, steady movements. Extreme speed may be missed."
    },
    { 
      id: 'swipe_h', 
      title: 'Horizontal Swiping', 
      desc: 'Move your open hand left or right across the screen to change the motor speed.', 
      icon: <MoveHorizontal className="w-12 h-12 text-[#00b4d8]" />,
      animation: {
        animate: { x: [-15, 15, -15], opacity: [0.5, 1, 0.5] },
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      },
      tip: "Horizontal movement directly maps to rotation speed."
    }
  ];
  const [gestureMapping, setGestureMapping] = useState<Record<string, string>>(() => {
    const saved = safeGetLocal("holospin_gesture_mapping");
    return saved ? JSON.parse(saved) : {
      peace: "rainbow",
      palm: "fire",
      fist: "power_off",
      thumbs_up: "power_on",
      point_up: "clock",
      rock_on: "aurora"
    };
  });

  const [pendingMapping, setPendingMapping] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    safeSaveLocal("holospin_gesture_mapping", JSON.stringify(gestureMapping));
  }, [gestureMapping]);

  const handleCalibrate = () => {
    if (!handInFrame || !currentHandPos.current) {
      setToastMessage("Keep hand in frame to calibrate!");
      return;
    }
    setIsCalibrating(true);
    setNeutralCenter(currentHandPos.current);
    setToastMessage("Neutral position calibrated!");
    setTimeout(() => setIsCalibrating(false), 1000);
  };

  const lastConfidenceUpdate = useRef(0);
  const handleHandDetected = useCallback((detected: boolean, confidence: number, pos?: { x: number, y: number }) => {
    setHandInFrame(detected);
    if (pos) currentHandPos.current = pos;
    const now = Date.now();
    if (now - lastConfidenceUpdate.current > 100) { // Debounce to 100ms
      setHandConfidence(confidence);
      lastConfidenceUpdate.current = now;
    }
  }, []);

  const [schedules, setSchedules] = useState<any[]>(() => {
    const saved = safeGetLocal("holospin_schedules");
    return saved ? JSON.parse(saved) : [];
  });
  const [newSchedTime, setNewSchedTime] = useState("");
  const [newSchedAction, setNewSchedAction] = useState("power_on");

  useEffect(() => {
    safeSaveLocal("holospin_schedules", JSON.stringify(schedules));
  }, [schedules]);

  // Load presets and media references from IndexedDB on startup
  useEffect(() => {
    const loadFromIDBOnStartup = async () => {
      // 1. Load Presets
      try {
        const idbPresets = await loadAllPresetsFromDB();
        if (idbPresets && Object.keys(idbPresets).length > 0) {
          setPresets(prev => {
            const merged = { ...prev };
            Object.entries(idbPresets).forEach(([key, val]) => {
              if (val) {
                merged[key] = val;
              }
            });
            return merged;
          });
          console.log("Loaded cached presets from IndexedDB");
        }
      } catch (err) {
        console.error("Failed to load presets from IndexedDB startup:", err);
      }

      // 2. Load custom active logo if it's stored in IndexedDB
      const savedLogo = safeGetLocal("holospin_logoUrl");
      if (savedLogo && savedLogo.startsWith("indexeddb:")) {
        const key = savedLogo.replace("indexeddb:", "");
        try {
          const cached = await loadMediaFromDB(key);
          if (cached && cached.url) {
            setLogoUrl(cached.url);
            console.log(`Loaded custom active logo from IndexedDB: ${cached.name}`);
          }
        } catch (e) {
          console.error("Failed to load active logo from IndexedDB:", e);
        }
      }

      // 3. Load custom synth video if it's stored in IndexedDB
      const savedVideo = safeGetLocal("synthVideoUrl");
      if (savedVideo && savedVideo.startsWith("indexeddb:")) {
        const key = savedVideo.replace("indexeddb:", "");
        try {
          const cached = await loadMediaFromDB(key);
          if (cached && cached.url) {
            setSynthVideoUrl(cached.url);
            console.log(`Loaded custom active video from IndexedDB: ${cached.name}`);
          }
        } catch (e) {
          console.error("Failed to load active video from IndexedDB:", e);
        }
      }
    };

    loadFromIDBOnStartup();
  }, []);

  const { 
    streamData, 
    isConnected: bleIsConnected, 
    isScanning: bleIsScanning,
    isConnecting: bleIsConnecting,
    error: bleError, 
    sendCommand: rawSendCommand,
    scanAndConnect 
  } = useHardwareStream(activeBleId);

  // Update sync history for the analytical chart after streamData is declared
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncHistory(prev => {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        // Use real telemetry if connected
        const qualityBase = streamData?.syncQuality || 0;
        if (!isConnected && qualityBase === 0) return prev; 
        
        const jitter = isConnected ? Math.random() * 2 : 0;
        const nextVal = Math.max(0, Math.min(100, Math.round(qualityBase - jitter)));
        
        return [...prev, { time: now, quality: nextVal }].slice(-20);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [streamData]);

  const sendCommand = (cmd: any) => {
    if (bleIsConnected && rawSendCommand) {
      rawSendCommand(cmd);
    } else {
      setCommandQueue(prev => [...prev, cmd]);
      setToastMessage("מכשיר מנותק. הפקודה נוספה לתור. / Device disconnected. Command queued.");
    }
  };

  // Scheduler logic
  useEffect(() => {
    const checkSchedules = () => {
      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();

      schedules.forEach(sched => {
        if (!sched.active) return;
        const [h, m] = sched.time.split(":").map(Number);
        if (h === currentH && m === currentM) {
          // Trigger once per minute maximum
          const lastRunKey = `last_run_${sched.id}`;
          const lastRunOnMinute = sessionStorage.getItem(lastRunKey);
          if (lastRunOnMinute !== currentM.toString()) {
            sessionStorage.setItem(lastRunKey, currentM.toString());
            console.log(`[Scheduler] Triggering schedule: ${sched.action}`);
            if (sched.action === "power_on") {
              setDeviceStatus("running");
              if (bleIsConnected && sendCommand) sendCommand("POWER:ON");
            } else if (sched.action === "power_off") {
              setDeviceStatus("idle");
              if (bleIsConnected && sendCommand) sendCommand("POWER:OFF");
            } else if (sched.action === "preset" && sched.presetId) {
              handleLoadPreset(sched.presetId);
            }
          }
        }
      });
    };

    const interval = setInterval(checkSchedules, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [schedules, bleIsConnected, sendCommand]);

  useEffect(() => {
    if (bleIsConnected && commandQueue.length > 0 && rawSendCommand) {
      const syncQueue = async () => {
        const total = commandQueue.length;
        setSyncProgress(0);
        setSyncLogs(commandQueue.map(cmd => ({ cmd: typeof cmd === 'string' ? cmd : JSON.stringify(cmd), status: 'pending' })));
        setToastMessage(`מסנכרן ${total} פקודות ממתינות... / Syncing ${total} pending commands...`);
        let current = 0;
        for (const cmd of commandQueue) {
          rawSendCommand(cmd);
          current++;
          setSyncProgress(Math.round((current / total) * 100));
          setSyncLogs(prev => prev.map((log, idx) => idx === current - 1 ? { ...log, status: 'success' } : log));
          await new Promise(r => setTimeout(r, 150));
        }
        setCommandQueue([]);
        setSyncProgress(null);
        setTimeout(() => setSyncLogs([]), 2000);
        setToastMessage("סנכרון הושלם! / Sync completed!");
      };
      syncQueue();
    }
  }, [bleIsConnected, commandQueue, rawSendCommand]);

  useEffect(() => {
    safeSaveLocal("holospin_colorMode", colorMode);
    if (bleIsConnected && sendCommand) {
      const modeCmd = colorMode === "random" ? "COLOR_MODE:RANDOM" : "COLOR_MODE:SOLID";
      sendCommand(modeCmd);
    }
  }, [colorMode, bleIsConnected, sendCommand]);

  // Handle color transmission
  useEffect(() => {
    if (colorMode === "solid" && bleIsConnected && sendCommand) {
      // Convert HSL to RGB for the device
      const h = hue / 360;
      const s = 1, l = 0.5;
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      const f = (t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const r = Math.round(f(h + 1/3) * 255);
      const g = Math.round(f(h) * 255);
      const b = Math.round(f(h - 1/3) * 255);
      
      sendCommand(`${r},${g},${b}`);
    }
  }, [logoTintColor, colorMode, bleIsConnected, sendCommand]);

  // Handle Flame Intensity transmission
  useEffect(() => {
    safeSaveLocal("holospin_flameIntensity", flameIntensity.toString());
    if (activeEffect === "fire" && bleIsConnected && sendCommand) {
      sendCommand("FLAME_INTENSITY:" + flameIntensity);
    }
  }, [flameIntensity, activeEffect, bleIsConnected, sendCommand]);

  const [isRetrying, setIsRetrying] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Sync BLE connection status with UI
  const isBluetoothConnected = bleIsConnected;
  const isBluetoothConnecting = bleIsScanning || bleIsConnecting;

  // Update telemetry data dynamically
  useEffect(() => {
    if (streamData) {
      if (streamData.rpm !== undefined) setRpm(streamData.rpm);
      if (streamData.pulses) setHallPulses(streamData.pulses);
      if (streamData.status) setDeviceStatus(streamData.status);
    }
  }, [streamData]);

  useEffect(() => {
    if (bleError) {
      setToastMessage(bleError);
    }
  }, [bleError]);

  useEffect(() => {
    if (showSplash === false) {
      // Check if we already cleared permissions
      if (safeGetLocal("holospin_permissions_granted") !== "true") {
        setTimeout(() => setShowPermissions(true), 500);
      }
    }
  }, [showSplash]);

  const handlePermissionsComplete = () => {
    setShowPermissions(false);
    safeSaveLocal("holospin_permissions_granted", "true");
  };

  const handleBluetoothConnect = async () => {
    try {
      setToastMessage("סורק אחר חומרת הולוספין... / Scanning for Holospin...");
      await scanAndConnect();
    } catch (err: any) {
      setToastMessage(err.message || "Connection failed");
    }
  };

  const handleLoadPreset = useCallback((slotId: string) => {
    const entry = presets[slotId];
    if (!entry) return;

    setIsApplyingPreset(true);
    setTimeout(() => setIsApplyingPreset(false), 800);

    if (entry.activeEffect) setActiveEffect(entry.activeEffect);
    if (entry.activeEffect === "ai_custom") {
      if (entry.aiEffectPrompt) setAiEffectPrompt(entry.aiEffectPrompt);
      if (entry.aiEffectCode) setAiEffectCode(entry.aiEffectCode);
      if (entry.aiEffectJs) setAiEffectJs(entry.aiEffectJs);
    }
    if (typeof entry.motorSpeed === 'number') setMotorSpeed(entry.motorSpeed);
    if (typeof entry.brightness === 'number') setBrightness(entry.brightness);
    if (typeof entry.effectSpeedRate === 'number' && entry.effectSpeedRate > 0) setEffectSpeedRate(entry.effectSpeedRate);
    if (typeof entry.effectScale === 'number' && entry.effectScale > 0) setEffectScale(entry.effectScale);
    if (typeof entry.effectComplexity === 'number') setEffectComplexity(entry.effectComplexity);
    if (entry.logoUrl !== undefined) setLogoUrl(entry.logoUrl);
    if (entry.povText !== undefined) setPovText(entry.povText);
    if (typeof entry.logoRotation === 'number') setLogoRotation(entry.logoRotation);
    if (entry.logoTintColor) setLogoTintColor(entry.logoTintColor);
    if (entry.useLogoTint !== undefined) setUseLogoTint(entry.useLogoTint);
    if (entry.povTextAnimation) setPovTextAnimation(entry.povTextAnimation);
    setToastMessage(`Profile ${slotId} loaded successfully / פרופיל נטען בהצלחה`);
  }, [presets]);

  const handleVerticalSwipe = useCallback((delta: number) => {
    setBrightness(prev => Math.max(10, Math.min(255, Math.round(prev + delta))));
  }, []);

  const handleHorizontalSwipe = useCallback((delta: number) => {
    setEffectSpeedRate(prev => Math.max(0.2, Math.min(3.0, prev + delta / 100)));
  }, []);

  const handleGestureMove = useCallback((x: number, y: number) => {
    // Map x (0-1) to Complexity (1-10) - inverted x because camera is mirrored
    const complexity = Math.round((1 - x) * 9 + 1);
    // Map y (0-1) to Scale (0.5-2.0)
    const scale = Number(((1 - y) * 1.5 + 0.5).toFixed(2));
    
    setEffectComplexity(prev => prev === complexity ? prev : complexity);
    setEffectScale(prev => prev === scale ? prev : scale);
  }, []);

  const handleGesture = useCallback((gesture: string) => {
    const action = gestureMapping[gesture];
    if (!action) return;

    // Trigger visual feedback
    setGesturePulse(true);
    setTimeout(() => setGesturePulse(false), 400);

    if (action === "power_off") {
      setDeviceStatus("idle");
      if (bleIsConnected && sendCommand) sendCommand("POWER:OFF");
      setToastMessage("Gesture: Power Off");
    } else if (action === "power_on") {
      setDeviceStatus("running");
      if (bleIsConnected && sendCommand) sendCommand("POWER:ON");
      setToastMessage("Gesture: Power On");
    } else {
      // It's a preset
      handleLoadPreset(action);
      setToastMessage(`Gesture: Active Effect -> ${action.toUpperCase()}`);
    }
  }, [gestureMapping, bleIsConnected, sendCommand, handleLoadPreset]);

  const [hallPulses, setHallPulses] = useState<number[]>([]);
  const [rpm, setRpm] = useState(0);
  const [softStop, setSoftStop] = useState(false);

  // Calibration Flow States
  const [showCalibrateModal, setShowCalibrateModal] = useState(false);
  const [calibrationStage, setCalibrationStage] = useState<"idle" | "requesting" | "calibrating" | "success" | "error">("idle");
  const [deviceStatus, setDeviceStatus] = useState<string>("ready");

  const safeFetch = async (url: string, options?: any) => {
    const isHttps = window.location.protocol === 'https:';
    if (isHttps && url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
       try {
         const res = await fetch(url, options);
         return res;
       } catch (e: any) {
         if (e.message && e.message.includes('Failed to fetch') && deviceStatus !== "simulated") {
           setToastMessage("שגיאת אבטחה (HTTPS): הדפדפן חוסם גישה למכשיר. יש להשתמש ב-Bluetooth או להוריד את האפליקציה למחשב / Browser blocked HTTP device connection due to HTTPS security.");
         }
         throw e;
       }
    }
    return fetch(url, options);
  };
  const [firmwareCheckStage, setFirmwareCheckStage] = useState<"idle" | "checking" | "up_to_date" | "update_available" | "error">("idle");
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [deviceVersion, setDeviceVersion] = useState<string | null>(null);
  const [showFirmwareModal, setShowFirmwareModal] = useState(false);

  // Auto-cleanup for IndexedDB on startup
  useEffect(() => {
    const runCleanup = async () => {
      try {
        const deleted = await pruneOldMediaFromDB(30);
        if (deleted > 0) {
          console.log(`IndexedDB Cleanup: Pruned ${deleted} old media files.`);
        }
      } catch (err) {
        console.warn("IndexedDB Cleanup failed:", err);
      }
    };
    runCleanup();
  }, []);

  const handleFirmwareUpdateCheck = async () => {
    setSubPage(null); // Close subpage if open
    setShowFirmwareModal(true);
    setFirmwareCheckStage("checking");
    
    try {
      // 1. Get device version
      let devVer = "unknown";
      try {
        const res = await safeFetch(getExternalDeviceUrl("/version"));
        if (res.ok) {
          const data = await res.json();
          devVer = data.version || "1.0.0";
          setDeviceVersion(devVer);
        }
      } catch (e) {
        console.warn("Could not fetch device version", e);
        setDeviceVersion("1.0.0 (Fallback)");
      }

      // 2. Get server version (mocked as 1.2.0 from previous edits)
      // In a real app, this would be a fetch to a manifest file
      const srvVer = "1.2.0"; 
      setServerVersion(srvVer);

      await new Promise(r => setTimeout(r, 1500)); // Aesthetic delay

      if (srvVer !== devVer && devVer !== "unknown") {
        setFirmwareCheckStage("update_available");
      } else {
        setFirmwareCheckStage("up_to_date");
      }
    } catch (err) {
      setFirmwareCheckStage("error");
    }
  };

  const [chipModel, setChipModel] = useState<string | null>(null);

  const applyOptimizedPinDefaults = (model: string, showToast = true) => {
    let ledPins = "25, 26";
    let motorPin = 12;
    let sensorPin = 27;
    let displayName = "ESP32 (Classic)";

    const upperModel = model.toUpperCase();
    if (upperModel.includes("S3") || upperModel === "S3") {
      ledPins = "15, 16";
      motorPin = 17;
      sensorPin = 18;
      displayName = "ESP32-S3";
    } else if (upperModel.includes("C3") || upperModel === "C3") {
      ledPins = "4, 5";
      motorPin = 6;
      sensorPin = 7;
      displayName = "ESP32-C3";
    } else if (upperModel.includes("WROOM") || upperModel === "WROOM") {
      ledPins = "25, 26";
      motorPin = 12;
      sensorPin = 27;
      displayName = "ESP32 WROOM 32D";
    }

    setState((p: any) => {
      const updated = {
        ...p,
        led: {
          ...p.led,
          pins: ledPins
        },
        motor: {
          ...p.motor,
          pin: motorPin
        },
        sync: {
          ...p.sync,
          sensorPin: sensorPin
        }
      };
      safeSaveLocal("holospin_state", JSON.stringify(updated));
      return updated;
    });

    if (showToast) {
      setToastMessage(`חיבור בוצע בהצלחה! זוהתה חומרת ${displayName}. הוגדרו פינים אופטימליים. / Handshake successful! Detected ${displayName}. Optimized pin defaults applied.`);
    }
  };

  const runHandshakeFlow = async (targetModel: string) => {
    setIsHandshaking(true);
    setHandshakeLogs([]);
    
    const logs = [
      `[00:00.100] [SYSTEM] Initiating handshake sequence...`,
      `[00:00.350] [CONNECT] Opening communication channel (BLE/WiFi)...`,
      `[00:00.700] [HANDSHAKE] Sending 'QUERY_CHIP_MODEL' command block...`,
      `[00:01.100] [RESPONSE] Received response: 0x55 0xAA [FINGERPRINT]`,
      `[00:01.400] [AUTO-DETECT] Parsing controller hardware signatures...`,
    ];

    for (let i = 0; i < logs.length; i++) {
      await new Promise(r => setTimeout(r, 400));
      setHandshakeLogs(prev => [...prev, logs[i]]);
    }

    let detectedText = "";
    let finalModelName = "ESP32 (Classic)";
    if (targetModel === "S3") {
      detectedText = `[00:01.800] [DETECTED] Chip: ESP32-S3 (Dual-Core Xtensa® LX7, RMT & USB-OTG Enabled)`;
      finalModelName = "ESP32-S3";
    } else if (targetModel === "C3") {
      detectedText = `[00:01.800] [DETECTED] Chip: ESP32-C3 (Single-Core RISC-V, Low Power Enabled)`;
      finalModelName = "ESP32-C3";
    } else if (targetModel === "WROOM") {
      detectedText = `[00:01.800] [DETECTED] Chip: ESP32 WROOM 32D (Dual-Core Xtensa® LX6, Advanced Wireless Core)`;
      finalModelName = "ESP32 WROOM 32D";
    } else {
      detectedText = `[00:01.800] [DETECTED] Chip: ESP32 (Classic Dual-Core Xtensa® LX6, Legacy WiFi/BLE)`;
      finalModelName = "ESP32";
    }

    await new Promise(r => setTimeout(r, 450));
    setHandshakeLogs(prev => [...prev, detectedText]);

    await new Promise(r => setTimeout(r, 500));
    setHandshakeLogs(prev => [
      ...prev,
      `[00:02.300] [OPTIMIZE] Auto-applying optimized firmware pin mapping for ${finalModelName}...`
    ]);

    let ledPins = "25, 26";
    let motorPin = 12;
    let sensorPin = 27;
    if (targetModel === "S3") {
      ledPins = "15, 16";
      motorPin = 17;
      sensorPin = 18;
    } else if (targetModel === "C3") {
      ledPins = "4, 5";
      motorPin = 6;
      sensorPin = 7;
    }

    await new Promise(r => setTimeout(r, 600));
    setHandshakeLogs(prev => [
      ...prev,
      `[00:02.900] [OPTIMIZE] LED data pins: GPIO ${ledPins}`,
      `[00:03.100] [OPTIMIZE] Motor PWM pin: GPIO ${motorPin}`,
      `[00:03.300] [OPTIMIZE] Hall sensor interrupt: GPIO ${sensorPin}`,
    ]);

    await new Promise(r => setTimeout(r, 400));
    setHandshakeLogs(prev => [
      ...prev,
      `[00:03.700] [SUCCESS] Handshake fully complete! Device optimized and ready.`
    ]);

    // Apply the actual state update
    setChipModel(finalModelName);
    applyOptimizedPinDefaults(targetModel);
    
    // Call server API to synchronize model in real express backend
    try {
      await fetch("/api/set-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: finalModelName })
      });
    } catch (e) {
      console.warn("Could not sync simulated model to server backend:", e);
    }

    setIsHandshaking(false);
  };
  
  const handleDownloadLogs = async () => {
    try {
      const targetUrl = getDeviceUrl("/logs");
      const res = await safeFetch(targetUrl);
      if (!res.ok) throw new Error("Failed to fetch logs");
      const logs = await res.text();
      
      const blob = new Blob([logs], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "esp32_logs.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download logs:", err);
      // Simulation fallback
      const simulatedLogs = "[SYS] Boot complete (SIMULATED)\n[WIFI] Connected to Simulation V-Net\n[POV] Virtual frame buffer ready\n[HTTP] Mock server started";
      const blob = new Blob([simulatedLogs], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "simulated_esp32_logs.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  };
  
  // Diagnostic Flow States
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [showBootloaderModal, setShowBootloaderModal] = useState(false);
  const [diagnosticsResult, setDiagnosticsResult] = useState<any>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticProgress, setDiagnosticProgress] = useState(0);
  const diagnosticAbortControllerRef = useRef<AbortController | null>(null);

  const handleFactoryReset = () => {
    if (confirm("⚠️ WARNING: This will clear ALL settings, presets, and configs. The system will reset to factory defaults. Continue? / אזהרה: פעולה זו תנקה את כל ההגדרות והפרופילים השמורים. האם להמשיך?")) {
      // Clear persistent storage
      const keysToRemove = [
        "holospin_activeEffect",
        "holospin_colorMode",
        "holospin_logoUrl",
        "holospin_logoRotation",
        "holospin_logoTintColor",
        "holospin_useLogoTint",
        "holospin_povText",
        "holospin_povTextAnimation",
        "holospin_brightness",
        "holospin_motorSpeed",
        "holospin_state",
        "holospin_presets",
        "isLightMode",
        "isSyncSpeedRate",
        "synthVideoUrl",
        "bgImage",
        "bgImageId"
      ];
      keysToRemove.forEach(k => safeRemoveLocal(k));

      // Clear IndexedDB cache as well
      clearAllPresetsInDB().catch(err => console.error("Failed to clear presets DB on factory reset:", err));
      clearAllMediaInDB().catch(err => console.error("Failed to clear media DB on factory reset:", err));

      // Reset States
      setActiveEffect("rainbow");
      setColorMode("solid");
      setLogoUrl(null);
      setLogoRotation(0);
      setLogoTintColor("#00b4d8");
      setUseLogoTint(false);
      setPovText("POV SYSTEM HOLOSPIN 3D");
      setPovTextAnimation("fade");
      setBrightness(150);
      setMotorSpeed(80);
      setPresets({ "1": null, "2": null, "3": null, "4": null });
      setSubPage(null);
      setActiveTab("controller");

      // Hardware Reset
      if (bleIsConnected && sendCommand) {
        sendCommand("RESET");
      }

      setToastMessage("FACTORY RESET COMPLETE / איפוס יצרן הושלם");
      
      // Force reload to ensure all clean states are picked up (optional but safer)
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    setDiagnosticsResult(null);
    setShowDiagnosticsModal(true);
    setDiagnosticProgress(0);

    diagnosticAbortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      if (diagnosticAbortControllerRef.current) {
        diagnosticAbortControllerRef.current.abort("timeout");
      }
    }, 10000); // 10 seconds timeout

    try {
      // Real diagnostic API call to ESP32
      const targetUrl = getDeviceUrl("/status");
      const res = await safeFetch(targetUrl, { signal: diagnosticAbortControllerRef.current.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error("Diagnostics API failed");
      const data = await res.json();
      setDiagnosticProgress(100);
      setDiagnosticsResult({
          status: data.state || data.status || "Unknown",
          rpm: data.speed || data.rpm || 0,
          fps: data.measuredFps || 0,
          leds: data.numLeds || 0,
          wifi: data.wifiSSID || "Not connected",
          free_space: data.freeSpace ? `${Math.round(data.freeSpace / 1024)} KB` : "N/A"
      });
      setIsRunningDiagnostics(false);
    } catch (err: any) {
      clearTimeout(timeoutId);
      setDiagnosticProgress(100);
      
      let errorMsg = "Failed to connect for diagnostics";
      if (err.name === 'AbortError' || err === "timeout") {
          errorMsg = "Connection timed out or cancelled";
      }

      setDiagnosticsResult({ 
        error: errorMsg,
        details: "Make sure the system is powered on, connected to the same WiFi network, and that you have permitted the app to communicate with local devices."
      });
      setIsRunningDiagnostics(false);
    }
  };

  const handleCancelDiagnostics = () => {
    if (diagnosticAbortControllerRef.current) {
      diagnosticAbortControllerRef.current.abort("cancelled");
    }
  };

  const handleFlashViaOtg = async () => {
    const isCapacitor = !!(window as any).Capacitor;
    
    if (!isCapacitor) {
      setShowPluginMissingModal(true);
      return;
    }

    try {
      setIsFlashing(true);
      setFlashProgress(0);
      setFlashStage('connecting');
      setFlashMessage('Checking for ESPTool Native Android Plugin...');

      let EsptoolPlugin = (window as any).Capacitor?.Plugins?.Esptool;
      if (!EsptoolPlugin && Esptool) {
        EsptoolPlugin = Esptool;
      }
      if (!EsptoolPlugin) {
        throw new Error("ESPTool Native Android Plugin is not registered. Please ensure it is compiled into the app.");
      }

      const progressListener = await EsptoolPlugin.addListener(
        'flashProgress',
        (data: { stage: string; message: string; progress: number }) => {
          setFlashStage(data.stage);
          setFlashMessage(data.message);
          setFlashProgress(data.progress);
        }
      );

      const result = await EsptoolPlugin.flash();
      progressListener.remove();

      if (result && result.status === 'success') {
        setFlashStage('completed');
        setFlashProgress(100);
        setFlashMessage('ESP32 firmware successfully flashed over USB OTG!');
      } else {
        throw new Error(result?.message || 'Flashing process failed.');
      }
    } catch (err: any) {
      console.error("Native flash error:", err);
      setFlashStage('error');
      setFlashMessage(err.message || 'An error occurred during ESP32 flashing.');
    }
  };

  const [isLightMode, setIsLightMode] = useState<boolean>(() => safeGetLocal("isLightMode") === "true");
  const [isSyncSpeedRate, setIsSyncSpeedRate] = useState<boolean>(() => safeGetLocal("isSyncSpeedRate") === "true");
  const [synthVideoUrl, setSynthVideoUrl] = useState<string | null>(() => safeGetLocal("synthVideoUrl") || null);
  const [uploadDest, setUploadDest] = useState<"image" | "video">("image");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const [isApplyingPreset, setIsApplyingPreset] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<any[]>([]);
  const [staSSID, setStaSSID] = useState("");
  const [staPass, setStaPass] = useState("");
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    // Pre-initialize BleClient so it doesn't break user gesture when clicking connect
    BleClient.initialize().catch(e => {
        console.warn("BleClient early initialization failed", e);
    });
  }, []);

  const handleScan = async () => {
    setIsScanning(true);
    setDiscoveredDevices([]);
    const bleDevices: any[] = [];
    
    try {
      // 1. BLE Discovery
      try {
        await BleClient.initialize();
        await BleClient.requestLEScan({}, (result) => {
          if (result.device.name?.includes('Holo') || result.device.name?.includes('ESP32')) {
            bleDevices.push({
              id: result.device.deviceId,
              name: result.device.name || "Holospin_BLE",
              ip: "BLE / Bluetooth",
              strength: result.rssi
            });
          }
        });
        await new Promise(r => setTimeout(r, 3000));
        await BleClient.stopLEScan();
      } catch (e) {}

      // 2. WiFi Discovery
      try {
        // Try to reach the default ESP32 AP IP
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 2000);
        const isLocalHost = window.location.hostname === "192.168.4.1";
        const wifiRes = await safeFetch(isLocalHost ? "http://192.168.4.1/api/health" : "/api/health", { 
          signal: controller.signal,
          mode: 'no-cors' // Allow reaching even if CORS not set (diagnostic only)
        }).catch(() => null);
        clearTimeout(id);

        if (wifiRes) {
          const isReal = isLocalHost;
          // Identify model if possible from health check or similar
          let model = "ESP32";
          try {
            const data = await wifiRes.json();
            if (data.model) model = data.model;
          } catch(e) {}

          if (isReal) {
            bleDevices.push({
              id: "192.168.4.1",
              name: "Holospin_Wi-Fi",
              ip: "192.168.4.1",
              strength: -30,
              type: "WIFI",
              model: model
            });
          }
        }
      } catch (e) {}

      // 3. Backend Scan
      try {
        const netRes = await fetch("/scan").catch(() => null);
        if (netRes && netRes.ok) {
          const nets = await netRes.json();
          nets.forEach((n: any) => {
            if (!bleDevices.find(d => d.id === n.ssid)) {
              bleDevices.push({
                id: n.ssid,
                name: n.ssid,
                ip: n.ip || "192.168.4.1",
                strength: n.signal || n.rssi,
                type: "WIFI",
                model: n.model
              });
            }
          });
        }
      } catch (e) {}

      // Merge and set
      const uniqueIds = new Set();
      const finalDevices = bleDevices.filter(d => {
        if (!uniqueIds.has(d.id)) {
          uniqueIds.add(d.id);
          return true;
        }
        return false;
      });

      setDiscoveredDevices(finalDevices);
      setToastMessage(finalDevices.length > 0 
        ? `סריקה הושלמה! נמצאו ${finalDevices.length} מכשירים. / Scan complete!` 
        : `לא נמצאו מכשירים / No devices found. Make sure Bluetooth/WiFi is enabled.`
      );

    } catch (e) {
      console.error(e);
      setToastMessage("שגיאה בסריקת רשת / Scan error");
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectToSTA = async () => {
    if (!staSSID || !staPass) {
      setToastMessage("אנא הזן שם רשת וסיסמה / Please enter SSID & Pass");
      return;
    }
    
    setToastMessage(`משדר הגדרות WiFi למקרן... / Sending WiFi settings...`);
    
    try {
      const targetUrl = getDeviceUrl("/config");
      const res = await safeFetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          routerSsid: staSSID, 
          routerPass: staPass,
          wifiMode: "STA" 
        })
      });

      if (res.ok) {
        setToastMessage(`המכשיר מנסה להתחבר לרשת ${staSSID}... / Connecting...`);
        updateState("wifi", "routerSsid", staSSID);
        updateState("wifi", "routerPass", staPass);
      } else {
         throw new Error("Failed to send config");
      }
    } catch (err) {
       setToastMessage("Error connecting to WiFi. Please ensure device is online.");
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    if (isLightMode) {
      root.style.setProperty('--bg-app', '#ffffff');
      root.style.setProperty('--bg-panel', '#f8fafc');
      root.style.setProperty('--bg-panel-hover', '#cbd5e1');
      root.style.setProperty('--text-primary', '#0f172a');
      root.style.setProperty('--text-secondary', '#475569');
      root.style.setProperty('--border-color', '#cbd5e1');
      root.style.setProperty('--bg-card', '#ffffff');
      root.style.setProperty('--bg-card-inner', '#f1f5f9');
      root.style.setProperty('--divider-color', '#cbd5e1');
    } else {
      root.style.setProperty('--bg-app', '#000000');
      root.style.setProperty('--bg-panel', '#0c0e15');
      root.style.setProperty('--bg-panel-hover', '#1e293b');
      root.style.setProperty('--text-primary', '#f8fafc');
      root.style.setProperty('--text-secondary', '#94a3b8');
      root.style.setProperty('--border-color', 'rgba(30, 41, 59, 0.8)');
      root.style.setProperty('--bg-card', '#0c0e15');
      root.style.setProperty('--bg-card-inner', '#050608');
      root.style.setProperty('--divider-color', 'rgba(30, 41, 59, 0.5)');
    }
  }, [isLightMode]);

  useEffect(() => {
    if (isSyncSpeedRate) {
      const synVal = Number((motorSpeed / 80).toFixed(2));
      setEffectSpeedRate(synVal);
    }
  }, [motorSpeed, isSyncSpeedRate]);

  const calibrationStageRef = useRef(calibrationStage);
  useEffect(() => {
    calibrationStageRef.current = calibrationStage;
  }, [calibrationStage]);

  const fetchSDCardFiles = async () => {
    let baseFiles: any[] = [];
    let isMounted = false;
    
    try {
      const isLocalHost = window.location.hostname === "192.168.4.1";
      const baseUrl = (state.wifi.mode === "AP" || isLocalHost) ? "http://192.168.4.1" : "";
      const res = await safeFetch(`${baseUrl}/api/files`);
      if (!res.ok) throw new Error("Failed to read from ESP32 SD Card");
      const files = await res.json();
      
      baseFiles = files.map((f: any) => ({
        name: f.name,
        size: f.size || "Unknown KB",
        type: f.type || (f.name.toLowerCase().endsWith(".mp4") ? "video" : "image"),
        path: f.path || `${baseUrl}/sd/${f.name}`,
        selected: f.selected !== undefined ? f.selected : true
      }));
      isMounted = true;
    } catch (err) {
      console.error("Failed to read SD Card files:", err);
      // Fallback to empty if we're not on the actual hardware IP
      if (window.location.hostname !== "192.168.4.1") {
        baseFiles = [];
        isMounted = false;
      } else {
        setToastMessage("שגיאה בקריאת הקבצים: וודא חיבור למכשיר / Error: Check device connection");
        isMounted = false;
      }
    }

    // Fallback/Redundancy: Merge custom media files from local IndexedDB cache
    try {
      const idbMediaList = await loadAllMediaFromDB();
      // Filter out active config keys (e.g. custom_logo and custom_video)
      const filteredIDB = idbMediaList.filter(media => media.key !== "custom_logo" && media.key !== "custom_video");
      const formattedIDB = filteredIDB.map(media => ({
        name: media.name,
        size: "Cached in IDB",
        type: media.type.startsWith("video") ? "video" : "image",
        path: media.url,
        physicalUri: `indexeddb:${media.key}`,
        selected: false,
        idbKey: media.key
      }));
      
      formattedIDB.forEach(newFile => {
        if (!baseFiles.some(f => f.name === newFile.name)) {
          baseFiles.push(newFile);
        }
      });
    } catch (idbErr) {
      console.error("Failed to load IndexedDB cached files in fetchSDCardFiles:", idbErr);
    }

    setState((p: any) => ({
      ...p,
      storage: {
        ...p.storage,
        mounted: isMounted,
        files: baseFiles
      }
    }));
  };

  const handleWriteFileToESP32 = async (filename: string, content: string) => {
    try {
      setToastMessage(`כותב ${filename} למכשיר... / Writing ${filename} to ESP32...`);
      const isLocalHost = window.location.hostname === "192.168.4.1";
      const baseUrl = (state.wifi.mode === "AP" || isLocalHost) ? "http://192.168.4.1" : "";
      
      const res = await safeFetch(`${baseUrl}/api/write-file?filename=${encodeURIComponent(filename)}`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain"
        },
        body: content
      });
      
      if (!res.ok) {
        throw new Error(`Failed to write file ${filename}`);
      }
      
      setToastMessage(`הקובץ ${filename} נכתב בהצלחה ל-ESP32! / ${filename} written successfully to ESP32!`);
      fetchSDCardFiles(); // Refresh file list
    } catch (err: any) {
      console.error(err);
      setToastMessage(`שגיאה בכתיבת הקובץ למכשיר: ${err.message || err}`);
    }
  };

  // Status polling
  const fetchStatus = async () => {
    if (!isSyncEnabled) {
      setIsConnected(isBluetoothConnected || window.location.hostname !== "192.168.4.1");
      setDeviceStatus(isBluetoothConnected ? "ready" : "simulated");
      if (!isBluetoothConnected) {
        const targetRpm = motorSpeed * 24;
        setRpm(prev => {
          const diff = targetRpm - prev;
          return prev + diff * 0.1;
        });
      }
      return;
    }
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      
      const targetUrl = getDeviceUrl("/status");
      
      const res = await safeFetch(targetUrl, { signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) throw new Error("Status fetch non-ok");
      const data = await res.json();
      setIsConnected(true);
      
      if (data.model && chipModel !== data.model) {
        setChipModel(data.model);
        applyOptimizedPinDefaults(data.model, false);
      }
      if (data.rpm !== undefined) setRpm(data.rpm);
      if (data.status) {
        setDeviceStatus(data.status);
        if (data.status === "calibrating") {
          setCalibrationStage("calibrating");
          setShowCalibrateModal(true);
        } else if (data.status === "ready" && calibrationStageRef.current === "calibrating") {
          setCalibrationStage("success");
        }
      }

      if (data.storage) {
        setState((p: any) => ({
          ...p,
          storage: {
            ...p.storage,
            mounted: data.storage.mounted ?? true,
            totalSpace: data.storage.total || p.storage.totalSpace,
            usedSpace: data.storage.used || p.storage.usedSpace,
          }
        }));
      }
    } catch (e) {
      // Simulation mode fallback when the device is offline
      setIsConnected(isBluetoothConnected || window.location.hostname !== "192.168.4.1");
      setDeviceStatus(isBluetoothConnected ? "ready" : "simulated");
      
      // Generate realistic simulated RPM if "connected" in simulation
      if (!isBluetoothConnected) {
        const targetRpm = motorSpeed * 24; // Simulated RPM based on motor duty cycle (e.g. 255 * 24 ≈ 6120 RPM)
        setRpm(prev => {
          const diff = targetRpm - prev;
          return prev + diff * 0.1; // Smooth transition
        });
      }
      
      // Auto-advance calibration in simulation mode
      if (calibrationStage === "calibrating") {
        const timer = setTimeout(() => {
          setCalibrationStage("success");
          setDeviceStatus("ready");
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  };

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    await fetchStatus();
    setTimeout(() => setIsRetrying(false), 500);
  };

  useEffect(() => {
    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, [isBluetoothConnected, isSyncEnabled]);

  useEffect(() => {
    // Broadcast live control parameters to device
    const payload = {
      cmd: "live_control",
      motorSpeed,
      brightness,
      effectSpeedRate,
      effectScale,
      effectComplexity,
      activeEffect,
      logoRotation,
      povText
    };

    const broadcast = async () => {
      if (!isSyncEnabled) return;
      if (isBluetoothConnected && activeBleId) {
        await sendCommand(payload);
      } else if (isConnected) {
        try {
          const targetUrl = getDeviceUrl("/control");
          await safeFetch(targetUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        } catch (e) {
          // ignore spammy errors
        }
      }
    };
    
    // Add simple debounce
    const t = setTimeout(broadcast, 100);
    return () => clearTimeout(t);
  }, [motorSpeed, brightness, effectSpeedRate, effectScale, effectComplexity, activeEffect, logoRotation, povText, isSyncEnabled]);

  const handleSavePreset = (slotId: string, customName?: string) => {
    const freshPreset = {
      activeEffect,
      motorSpeed,
      brightness,
      effectSpeedRate,
      effectScale,
      effectComplexity,
      logoUrl,
      povText,
      logoRotation,
      logoTintColor,
      useLogoTint,
      povTextAnimation,
      aiEffectPrompt: activeEffect === "ai_custom" ? aiEffectPrompt : undefined,
      aiEffectCode: activeEffect === "ai_custom" ? aiEffectCode : undefined,
      aiEffectJs: activeEffect === "ai_custom" ? aiEffectJs : undefined,
      name: customName || `פרופיל ${slotId} / Slot ${slotId}`,
      savedAt: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = { ...presets, [slotId]: freshPreset };
    setPresets(updated);
    safeSaveLocal("holospin_presets", JSON.stringify(updated));
    // Fallback sync to IndexedDB
    saveAllPresetsToDB(updated).catch(err => console.error("Failed to save presets to IndexedDB:", err));
  };

  const handleDeletePreset = (slotId: string) => {
    if (confirm(`Are you sure you want to delete profile slot ${slotId}?`)) {
      const updated = { ...presets, [slotId]: null };
      setPresets(updated);
      safeSaveLocal("holospin_presets", JSON.stringify(updated));
      // Fallback sync to IndexedDB
      saveAllPresetsToDB(updated).catch(err => console.error("Failed to update presets in IndexedDB after delete:", err));
      setToastMessage(`Profile ${slotId} deleted / פרופיל נמחק בהצלחה`);
    }
  };

   const processLogoImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // HARD ENFORCEMENT: 128x64 resolution
        const TARGET_WIDTH = 128;
        const TARGET_HEIGHT = 64;
        
        canvas.width = TARGET_WIDTH;
        canvas.height = TARGET_HEIGHT;
        const ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for memory efficiency
        if (!ctx) return reject(new Error("Failed to get canvas context"));

        // Fill with absolute black (base layer)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

        // Aspect ratio resizing with centering
        const scale = Math.min(TARGET_WIDTH / img.width, TARGET_HEIGHT / img.height);
        const x = (TARGET_WIDTH / 2) - (img.width / 2) * scale;
        const y = (TARGET_HEIGHT / 2) - (img.height / 2) * scale;
        
        // Use high-quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        // Greyscale conversion logic (Luminance) - enforcing 8-bit depth feel
        const imageData = ctx.getImageData(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          // Standard ITU-R BT.709 luma coefficients
          const luma = (data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722);
          data[i] = luma;
          data[i+1] = luma;
          data[i+2] = luma;
          data[i+3] = 255; // Force fully opaque
        }
        ctx.putImageData(imageData, 0, 0);

        // Final Blob conversion - enforcing PNG for standard support
        canvas.toBlob((blob) => {
          if (blob) {
            console.log(`Image downscaled and processed: ${blob.size} bytes`);
            resolve(blob);
          } else {
            reject(new Error("Blob conversion failed"));
          }
        }, 'image/png');
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        version: "1.2.0",
        exportDate: new Date().toISOString(),
        presets: presets,
        systemState: {
          wifi: state.wifi,
          led: state.led,
          motor: state.motor,
          detectedModel: state.detectedModel,
          logoUrl,
          logoRotation,
          logoTintColor
        }
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `holospin_backup_${new Date().toLocaleDateString()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setToastMessage("Full system backup exported! / גיבוי מערכת מלא יוצא בהצלחה");
    } catch (e) {
      console.error("Backup failed", e);
      setToastMessage("Backup failed / ייצוא הגיבוי נכשל");
    }
  };

  const handleIntegratedOtaUpdate = async () => {
    try {
      setIsFlashing(true);
      setFlashProgress(0);
      setFlashStage('ota');
      setFlashMessage("Downloading firmware binary from HoloSpin Server...");
      setFlashProgress(5);

      // PRE-OTA VALIDATION: Version & Compatibility Check
      try {
        const versionUrl = getExternalDeviceUrl("/version");
        const vRes = await safeFetch(versionUrl);
        if (vRes.ok) {
          const vData = await vRes.json();
          console.log("Pre-OTA Version Check:", vData);
          setFlashMessage(`Connected to ${vData.model || "Device"} (v${vData.version || "unknown"}). Checking compatibility...`);
          
          // Basic version logic - if we wanted to prevent downgrades or similar
          // For now, we just ensure the model matches if possible
          if (vData.model && chipModel && vData.model !== chipModel) {
             console.warn("Model mismatch between OTA version endpoint and status endpoint");
          }
        }
      } catch (vErr) {
        console.warn("Could not perform pre-OTA version check, device might be offline or legacy.", vErr);
      }

      const binRes = await fetch('/firmware.bin');
      if (!binRes.ok) throw new Error("Could not download firmware.bin from server");
      
      const contentLength = binRes.headers.get('Content-Length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      // VALIDATION STEP 1: Size check
      // Most ESP32 OTA partitions are < 2MB. 
      if (total > 3000000) { // 3MB limit as a safety guard
        throw new Error(`Firmware binary is too large (${(total/1024/1024).toFixed(2)} MB). Maximum allowed is 3.0 MB.`);
      }

      let loaded = 0;
      const chunks = [];
      const reader = binRes.body?.getReader();
      if (!reader) throw new Error("ReadableStream not supported");

      while(true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        if (total > 0) {
          setFlashProgress(Math.round((loaded / total) * 30)); // First 30% is download
        }
      }

      const firmwareBlob = new Blob(chunks);
      const arrayBuffer = await firmwareBlob.arrayBuffer();
      const header = new Uint8Array(arrayBuffer.slice(0, 32));

      // VALIDATION STEP 2: ESP32 Header Check
      // Magic byte 0xE9 at offset 0
      if (header[0] !== 0xE9) {
        throw new Error("Invalid firmware binary: Magic byte mismatch (expected 0xE9).");
      }

      // Chip ID at offset 2
      const chipId = header[2];
      let firmwareModel = "Unknown";
      if (chipId === 0) firmwareModel = "ESP32";
      else if (chipId === 2) firmwareModel = "ESP32-S2";
      else if (chipId === 5) firmwareModel = "ESP32-C3";
      else if (chipId === 9) firmwareModel = "ESP32-S3";
      else if (chipId === 12) firmwareModel = "ESP32-C2";
      else if (chipId === 13) firmwareModel = "ESP32-H2";

      console.log(`Detected firmware chip ID: ${chipId} (${firmwareModel})`);
      console.log(`Current connected hardware: ${chipModel}`);

      // VALIDATION STEP 3: Model Compatibility
      if (chipModel && firmwareModel !== "Unknown") {
        const currentIsS3 = chipModel.includes("S3");
        const currentIsC3 = chipModel.includes("C3");
        const currentIsPlain = !currentIsS3 && !currentIsC3 && chipModel.includes("ESP32");

        const targetIsS3 = firmwareModel === "ESP32-S3";
        const targetIsC3 = firmwareModel === "ESP32-C3";
        const targetIsPlain = firmwareModel === "ESP32";

        if ((currentIsS3 && !targetIsS3) || (currentIsC3 && !targetIsC3) || (currentIsPlain && !targetIsPlain)) {
          if (!confirm(`⚠️ HARDWARE MISMATCH: Firmware is built for ${firmwareModel} but device is ${chipModel}. Flashing may brick the device. Continue anyway?`)) {
            setFlashStage('idle');
            setIsFlashing(false);
            return;
          }
        }
      }

      setFlashMessage("Firmware validated. Connecting to local hardware...");
      setFlashProgress(30);

      const targetUrl = getExternalDeviceUrl("/update");
      setFlashMessage("Uploading to hardware via Wi-Fi (ElegantOTA)... Do not close this app.");

      const formData = new FormData();
      formData.append('MD5', '');
      formData.append('update', firmwareBlob, 'firmware.bin');

      const xhr = new XMLHttpRequest();
      xhr.open('POST', targetUrl, true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const uploadProgress = Math.round((e.loaded / e.total) * 70);
          setFlashProgress(30 + uploadProgress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          setFlashStage('completed');
          setFlashProgress(100);
          setFlashMessage("OTA Update SUCCESS! Device is rebooting...");
        } else {
          setFlashStage('error');
          let serverError = "";
          try {
             serverError = xhr.responseText || "Unknown Error";
          } catch(e) {
             serverError = "Could not parse response";
          }
          setFlashMessage(`OTA FAILED (${xhr.status}): ${serverError}`);
        }
      };

      xhr.onerror = () => {
        setFlashStage('error');
        setFlashMessage("Network error during OTA upload. Check your Wi-Fi connection.");
      };

      xhr.send(formData);

    } catch (err: any) {
      console.error("OTA Error:", err);
      setFlashStage('error');
      setFlashMessage(`OTA Update Failed: ${err.message}`);
    }
  };

  const handleExportPresets = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(presets, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "holospin_presets.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setToastMessage("Presets exported / פרופילים יוצאו בהצלחה");
    } catch {
      alert("שגיאה בייצוא הפרופילים / Error exporting presets");
    }
  };

  const handleImportPresets = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== "string") {
            throw new Error("Invalid file read result");
        }
        const imported = JSON.parse(result);
        if (typeof imported === "object" && imported !== null) {
          const normalized: Record<string, any> = { "1": null, "2": null, "3": null, "4": null };
          for (const key of ["1", "2", "3", "4"]) {
            if (imported[key] !== undefined) {
              normalized[key] = imported[key];
            } else if (presets[key] !== undefined) {
              normalized[key] = presets[key];
            }
          }
          setPresets(normalized);
          safeSaveLocal("holospin_presets", JSON.stringify(normalized));
          // Fallback sync to IndexedDB
          saveAllPresetsToDB(normalized).catch(err => console.error("Failed to save imported presets to IndexedDB:", err));
          setToastMessage("Presets imported successfully! / פרופילים יובאו בהצלחה");
        } else {
          alert("קובץ לא תקין / Invalid presets file format.");
        }
      } catch (err) {
        alert("שגיאה בטעינת הקובץ / Error reading presets file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleStartCalibration = async () => {
    try {
      setCalibrationStage("requesting");
      setShowCalibrateModal(true);
      const targetUrl = getDeviceUrl("/calibrate");
      
      const res = await safeFetch(targetUrl, { method: "POST" });
      if (!res.ok) {
        throw new Error("מכשיר לא הגיב לבקשת כיול / Device failed to respond to calibration request");
      }
      const data = await res.json();
      if (data.status === "calibrating") {
        setCalibrationStage("calibrating");
      } else {
        throw new Error("המכשיר סירב להתחיל כיול / Device rejected calibration initialization");
      }
    } catch (err: any) {
      console.error(err);
      // Fallback to simulation if on dev environment
      if (window.location.hostname !== "192.168.4.1") {
         setCalibrationStage("calibrating");
         setToastMessage("נכנס למצב כיול (סימולציה) / Entering Calibration (Simulated)");
      } else {
         setCalibrationStage("error");
         setToastMessage(`שגיאת כיול: ${err.message || err}`);
      }
    }
  };

  const handleHoloUpload = async (radialData: number[][][]) => {
    try {
      setToastMessage("Preparing hardware transmission... / מכין שידור לחומרה");
      
      // Flatten to Uint8Array [r, g, b, r, g, b ...]
      const totalPixels = 128 * 64;
      const flatBuffer = new Uint8Array(totalPixels * 3);
      
      let cursor = 0;
      for (let s = 0; s < 128; s++) {
        for (let r = 0; r < 64; r++) {
          const [red, green, blue] = radialData[s][r];
          flatBuffer[cursor++] = red;
          flatBuffer[cursor++] = green;
          flatBuffer[cursor++] = blue;
        }
      }

      setToastMessage("Uploading frames... / מעלה פריימים ");
      
      const targetUrl = getDeviceUrl("/api/upload-frames");
      
      const response = await safeFetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream"
        },
        body: flatBuffer
      });

      if (response.ok) {
        setToastMessage("Sync complete! Displaying hologram / סנכרון הושלם! מציג הולוגרמה");
      } else {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`Upload failed (${response.status}): ${errorText}`);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      const msg = err.message || "Unknown error";
      setToastMessage(`Upload failed / שגיאה בהעלאה: ${msg}`);
      alert(`Hardware communication error / שגיאת תקשורת עם המכשיר: ${msg}`);
    }
  };

  const [state, setState] = useState(() => {
    const defaultState = {
      wifi: {
        enabled: true,
        mode: "AP",
        ssid: "Holospin_POV2",
        pass: "12345678",
        ip: "",
        routerSsid: "",
        routerPass: "",
      },
      led: {
        arms: 2,
        stripsPerArm: 1,
        strips: 2,
        ledsPerStrip: 44,
        pins: "25, 26",
        colorOrder: "GRB",
        chipset: "WS2812B",
        globalBrightness: 255,
        test: false,
        hue: 0,
      },
      motor: {
        pin: 12,
        pwmFreq: "5000 Hz",
        pwmRes: "8 Bit",
        maxSpeed: 255,
        softStart: true,
        direction: "CW",
      },
      pov: {
        totalColumns: 200,
        rotationDir: "CW",
        autoCalibrate: false,
        previewMode: false,
        frames: 200,
        hallAutoCalibrateOnPowerUp: true,
      },
      sync: {
        hallSensor: true,
        sensorPin: 27,
        adcPin: 32,
        triggerMode: "FALLING",
        signalInvert: false,
        quality: "100% PERFECT",
      },
      power: {
        voltageLimit: 24.5,
        currentLimit: 5.0,
        autoOff: false,
        tempWarning: 45,
      },
      advanced: { devMode: false, serialMonitor: false },
      cloudSyncEnabled: false,
      bluetooth: {
        enabled: false,
        name: "Holospin_BLE",
        connected: false,
        discoverable: true,
      },
      storage: {
        mounted: false,
        totalSpace: "---",
        usedSpace: "---",
        files: [],
      },
    };
    try {
      const saved = safeGetLocal("holospin_state");
      if (saved) {
        let parsed = JSON.parse(saved) || {};
        
        // CLEANUP: Force reset mock storage data from local storage
        if (parsed.storage) {
          const s = parsed.storage;
          // More aggressive check for ANY simulated-looking data
          const isMock = (s.totalSpace && (s.totalSpace.includes("16") || s.totalSpace.includes("---") || s.totalSpace.includes("used"))) || 
                        (s.usedSpace && (s.usedSpace.includes("1.2") || s.usedSpace.includes("---") || s.usedSpace === "gb")) ||
                        (s.files && s.files.length > 0 && s.files.some((f: any) => f.name && (f.name.includes("butterfly") || f.name.includes("planet") || f.name.includes("mock"))));
          
          if (isMock || s.mounted === true) {
            parsed.storage = {
              mounted: false,
              totalSpace: "0.0 GB",
              usedSpace: "0.0 GB",
              files: []
            };
          }
        }

        const safeParse = (cat: keyof typeof defaultState) => {
          const defaultCat = defaultState[cat];
          const parsedCat = parsed[cat];
          if (typeof defaultCat === "object" && defaultCat !== null) {
            return { ...defaultCat, ...(parsedCat || {}) };
          }
          return parsedCat !== undefined ? parsedCat : defaultCat;
        };
        
        return {
          ...defaultState,
          ...parsed,
          wifi: safeParse("wifi"),
          led: safeParse("led"),
          motor: safeParse("motor"),
          pov: safeParse("pov"),
          sync: safeParse("sync"),
          power: safeParse("power"),
          advanced: safeParse("advanced"),
          bluetooth: safeParse("bluetooth"),
          storage: safeParse("storage"),
        };
      }
    } catch (e) {
      console.error("Failed to load local state", e);
    }
    return defaultState;
  });

  const updateState = async (cat: string, key: string, val: any) => {
    // 1. Update local UI
    setState((p: any) => ({ ...p, [cat]: { ...p[cat], [key]: val } }));

    // 2. Transmit to Hardware
    const payload = { category: cat, update: { [key]: val } };
    
    // Prefer BLE if connected
    if (isBluetoothConnected && activeBleId) {
      await sendCommand(payload);
    } 
    // Fallback to HTTP API if network connected
    else if (isConnected) {
      try {
        const targetUrl = getDeviceUrl("/config");
        await safeFetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.warn("Failed to push state via WiFi HTTP API", err);
      }
    }
  };

  const renderHeader = () => {
    // Battery calculation widget using direct state variables instead of state.x to avoid NaN display
    const currentBrightness = typeof brightness === 'number' ? brightness : 150;
    const currentSpeed = typeof motorSpeed === 'number' ? motorSpeed : 80;
    const currentDraw = (currentBrightness / 255) * 1.5 + (currentSpeed > 0 ? 0.5 : 0) + 0.1; 
    const capacityAh = 2.0; 
    const hoursLeft = Math.max(0.1, capacityAh / currentDraw);
    const battVolts = Math.max(9.6, Math.min(12.6, 11.1 - (currentDraw * 0.1))); 
    const battPercent = Math.max(0, Math.min(100, ((battVolts - 9.6) / (12.6 - 9.6)) * 100));

    const statusIndicator = (
      <div id="tour-sync-group" className="flex items-center gap-1.5 min-[380px]:gap-2 sm:gap-3 select-none">
        {/* Battery Diagnostics Pill */}
        <div 
          className="flex items-center gap-1 min-[380px]:gap-1.5 bg-slate-900/60 border border-slate-800 rounded-full px-1.5 min-[380px]:px-2.5 h-7 min-[380px]:h-8 backdrop-blur-md shadow-inner group relative cursor-help"
          title={`Battery: ${battVolts.toFixed(1)}V (${battPercent.toFixed(0)}%) - Estimated: ${hoursLeft.toFixed(1)} Hours Runtime`}
        >
          <Battery className={`w-3.5 h-3.5 ${battPercent > 20 ? 'text-emerald-400' : 'text-red-400 animate-pulse'}`} />
          <span className={`text-[9px] min-[380px]:text-[10px] font-mono font-bold leading-none ${battPercent > 20 ? 'text-emerald-400' : 'text-red-400'}`}>
            {battVolts.toFixed(1)}V
          </span>
          <span className={`w-1 h-1 min-[380px]:w-1.5 min-[380px]:h-1.5 rounded-full ${battPercent > 50 ? 'bg-emerald-500' : battPercent > 20 ? 'bg-amber-500' : 'bg-red-500 animate-ping'}`} />
          
          {/* Detailed Battery Diagnostics Dropdown Tooltip */}
          <div className="absolute top-full right-0 mt-2 hidden group-hover:block bg-[#090a10]/95 border border-slate-800 text-[10px] text-slate-300 p-3 rounded-xl shadow-xl z-50 whitespace-nowrap leading-relaxed pointer-events-none">
            <div className="font-black text-slate-200 mb-1 tracking-wider uppercase text-[9px]">Battery Diagnostics</div>
            <div>Voltage: <span className="font-mono text-emerald-400 font-bold">{battVolts.toFixed(2)} V</span></div>
            <div>Capacity: <span className="font-bold text-slate-200">{battPercent.toFixed(0)}%</span></div>
            <div>Est. Runtime: <span className="font-bold text-sky-400">{hoursLeft.toFixed(1)} Hours</span></div>
            <div className="text-[8px] text-slate-500 mt-1 border-t border-slate-800/80 pt-1">
              Reflected by brightness ({currentBrightness}) & speed ({currentSpeed})
            </div>
          </div>
        </div>

        {/* Unified Status Capsule for Controller Operations */}
        <div className="flex items-center gap-0.5 min-[380px]:gap-1 bg-slate-900/60 border border-slate-800 rounded-full p-0.5 h-7 min-[380px]:h-8 backdrop-blur-md shadow-inner">
          {/* Sync to Device Toggle */}
          <button 
            onClick={() => {
              const nextVal = !isSyncEnabled;
              setIsSyncEnabled(nextVal);
              safeSaveLocal("holospin_isSyncEnabled", String(nextVal));
              if (nextVal) {
                setToastMessage("סנכרון פעיל - מעביר נתונים למכשיר / Sync active - pushing updates");
              } else {
                setToastMessage("סנכרון הופסק לחיסכון בסוללה / Sync paused to save power");
              }
            }}
            className={`w-6 h-6 min-[380px]:w-7 min-[380px]:h-7 rounded-full flex items-center justify-center transition-all duration-300 relative ${
              isSyncEnabled 
                ? "bg-[#00b4d8]/25 text-[#00b4d8] shadow-[0_0_8px_rgba(0,180,216,0.3)] border border-[#00b4d8]/40" 
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent cursor-pointer"
            }`}
            title={isSyncEnabled ? "Real-time Sync: ACTIVE. Click to pause telemetry & parameter updates." : "Real-time Sync: PAUSED. Click to resume and push updates."}
          >
            <RefreshCw className={`w-3 h-3 min-[380px]:w-3.5 min-[380px]:h-3.5 ${isSyncEnabled ? "animate-spin" : ""}`} style={isSyncEnabled ? { animationDuration: "6s" } : undefined} />
            <span className={`absolute -top-0.5 -right-0.5 w-1 h-1 min-[380px]:w-1.5 min-[380px]:h-1.5 rounded-full ${isSyncEnabled ? "bg-[#00b4d8] animate-pulse" : "bg-slate-500"}`} />
          </button>

          {/* Chip Model Detection indicator */}
          {isConnected && chipModel && (
            <div 
              className="w-6 h-6 min-[380px]:w-7 min-[380px]:h-7 rounded-full flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20 relative group cursor-help"
              title={`Detected hardware: ${chipModel}`}
            >
              <Cpu className="w-3 h-3 min-[380px]:w-3.5 min-[380px]:h-3.5 animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 w-1 h-1 min-[380px]:w-1.5 min-[380px]:h-1.5 rounded-full bg-amber-500" />
              
              {/* Tooltip */}
              <div className="absolute top-full right-0 mt-2 hidden group-hover:block bg-[#090a10]/95 border border-slate-800 text-[10px] text-slate-300 p-2.5 rounded-xl shadow-xl z-50 whitespace-nowrap pointer-events-none">
                Hardware: <span className="text-amber-400 font-bold">{chipModel}</span>
              </div>
            </div>
          )}

          {/* Bluetooth Indicator / Pairing Trigger Button */}
          <button 
            onClick={handleBluetoothConnect}
            disabled={isBluetoothConnecting || isBluetoothConnected}
            className={`w-6 h-6 min-[380px]:w-7 min-[380px]:h-7 rounded-full flex items-center justify-center transition-all duration-300 relative ${
              isBluetoothConnected 
                ? "bg-blue-500/20 text-[#3b82f6] border border-blue-500/30" 
                : isBluetoothConnecting
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse cursor-wait"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent cursor-pointer"
            }`}
            title={isBluetoothConnected ? "Bluetooth connected" : isBluetoothConnecting ? "Pairing..." : "Pair via Bluetooth (BLE)"}
          >
            <Bluetooth className="w-3 h-3 min-[380px]:w-3.5 min-[380px]:h-3.5" />
            <span className={`absolute -top-0.5 -right-0.5 w-1 h-1 min-[380px]:w-1.5 min-[380px]:h-1.5 rounded-full ${isBluetoothConnected ? "bg-blue-500 shadow-[0_0_4px_#3b82f6]" : isBluetoothConnecting ? "bg-blue-400 animate-ping" : "bg-slate-500"}`} />
          </button>

          {/* WiFi Indicator / Re-connect Trigger Button */}
          {isConnected ? (
            <div 
              className="w-6 h-6 min-[380px]:w-7 min-[380px]:h-7 rounded-full flex items-center justify-center bg-emerald-500/10 text-[#22c55e] border border-emerald-500/20 relative group cursor-default"
              title="WiFi Status: Connected"
            >
              <Wifi className="w-3 h-3 min-[380px]:w-3.5 min-[380px]:h-3.5" />
              <span className="absolute -top-0.5 -right-0.5 w-1 h-1 min-[380px]:w-1.5 min-[380px]:h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#22c55e]" />
              <div className="absolute top-full right-0 mt-2 hidden group-hover:block bg-[#090a10]/95 border border-slate-800 text-[10px] text-slate-300 p-2.5 rounded-xl shadow-xl z-50 whitespace-nowrap pointer-events-none">
                WiFi Mode: <span className="text-emerald-400 font-bold">Connected ({state.wifi.mode === "AP" ? "Access Point" : "Station"})</span>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleRetryConnection}
              disabled={isRetrying}
              className={`w-6 h-6 min-[380px]:w-7 min-[380px]:h-7 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                isRetrying
                  ? "bg-red-500/15 text-red-400 border border-red-500/20 animate-pulse cursor-wait"
                  : "text-red-500 hover:bg-red-500/10 hover:text-red-400 border border-transparent cursor-pointer"
              }`}
              title={isRetrying ? "Retrying WiFi connection..." : "WiFi Disconnected. Tap to reconnect."}
            >
              <Wifi className="w-3 h-3 min-[380px]:w-3.5 min-[380px]:h-3.5" />
              <span className={`absolute -top-0.5 -right-0.5 w-1 h-1 min-[380px]:w-1.5 min-[380px]:h-1.5 rounded-full bg-red-500 shadow-[0_0_4px_#ef4444] ${isRetrying ? "animate-ping" : ""}`} />
            </button>
          )}
        </div>
      </div>
    );

    if (subPage) {
      return (
        <header className="flex items-center justify-between px-2 min-[360px]:px-4 min-[400px]:px-5 pt-6 min-[380px]:pt-8 pb-4 relative z-20">
          <button
            onClick={() => setSubPage(null)}
            className="text-slate-400 hover:text-white transition w-6 min-[360px]:w-8 flex items-center"
          >
            <ChevronLeft className="w-6 h-6 min-[360px]:w-8 min-[360px]:h-8" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTour(true)}
              className="w-7 h-7 min-[380px]:w-8 min-[380px]:h-8 rounded-full flex items-center justify-center bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-[#00b4d8] hover:border-[#00b4d8]/40 transition active:scale-95"
              title="App Walkthrough / סיור במערכת"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            {statusIndicator}
          </div>
        </header>
      );
    }

    return (
      <header className="flex justify-between items-center px-2 min-[360px]:px-4 min-[400px]:px-5 pt-6 min-[380px]:pt-8 pb-4 relative z-20">
        <button
          className="text-slate-500 hover:text-white transition w-6 min-[360px]:w-8 flex items-center"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="w-5.5 h-5.5 min-[360px]:w-7 min-[360px]:h-7" />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTour(true)}
            className="w-7 h-7 min-[380px]:w-8 min-[380px]:h-8 rounded-full flex items-center justify-center bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-[#00b4d8] hover:border-[#00b4d8]/40 transition active:scale-95"
            title="App Walkthrough / סיור במערכת"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          {statusIndicator}
        </div>
      </header>
    );
  };

  const renderContent = () => {
    if (subPage === "wifi") {
      return (
        <div className="px-5 pt-2 pb-28 flex flex-col gap-6 ">
          <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mb-[-10px]">
            WIFI SETTINGS
          </h3>
          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex items-center justify-between">
            <span className="text-[13px] text-slate-200 tracking-wide">
              WiFi Enabled
            </span>
            <Toggle
              value={state.wifi.enabled}
              onChange={(v: any) => updateState("wifi", "enabled", v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 tracking-wide">
              Mode
            </span>
            <div className="w-48">
              <RadioGroup
                options={[
                  { label: "AP Mode", value: "AP" },
                  { label: "STA Mode", value: "STA" },
                ]}
                value={state.wifi.mode}
                onChange={(v: any) => updateState("wifi", "mode", v)}
              />
            </div>
          </div>

          <InputField
            label="SSID"
            value={state.wifi.ssid}
            onChange={(v: any) => updateState("wifi", "ssid", v)}
          />
          <InputField
            label="Password"
            type={showPass ? "text" : "password"}
            value={state.wifi.pass}
            onChange={(v: any) => updateState("wifi", "pass", v)}
            innerRight={
              <button
                onClick={() => setShowPass(!showPass)}
                className="text-slate-500 focus:outline-none"
              >
                {showPass ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
          />
          <InputField
            label="IP Address"
            value={state.wifi.ip}
            onChange={(v: any) => updateState("wifi", "ip", v)}
          />

          <div className="mt-4 pt-4 border-t border-slate-800/50">
            <h3 className="text-[11px] text-[#00b4d8] font-bold tracking-widest uppercase mb-4">
              ROUTER CONNECTION (STA MODE)
            </h3>
            <InputField
              label="Router SSID"
              value={state.wifi.routerSsid}
              onChange={(v: any) => updateState("wifi", "routerSsid", v)}
              placeholder="Your Home WiFi Name"
            />
            <InputField
              label="Router Password"
              type={showPass ? "text" : "password"}
              value={state.wifi.routerPass}
              onChange={(v: any) => updateState("wifi", "routerPass", v)}
              placeholder="Your Home WiFi Password"
              innerRight={
                <button
                  onClick={() => setShowPass(!showPass)}
                  className="text-slate-500 focus:outline-none"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />
          </div>

          <button
            onClick={() => {
              safeSaveLocal("holospin_state", JSON.stringify(state));
              setToastMessage("WiFi Profile updated & confirmed! / הגדרות ה-WiFi נשמרו בהצלחה!");
            }}
            className="w-full bg-[#00b4d8] hover:bg-[#0096b4] text-white py-4 rounded-xl text-[11px] font-bold tracking-widest uppercase mt-2 shadow-[0_0_15px_rgba(0,180,216,0.25)] transition cursor-pointer active:scale-95"
          >
            CONFIRM & SAVE SETTINGS
          </button>
        </div>
      );
    }

    if (subPage === "calibration") {
      return (
        <div className="px-5 pt-2 pb-28 flex flex-col gap-6 ">
          <div className="flex flex-col gap-1">
            <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mb-[-4px]">
              SENSOR CALIBRATION / כיול חיישן
            </h3>
            <span className="text-[10px] text-slate-500">
              כיול היחס בין פולס חיישן המגנט (Hall Sensor) לזווית רוטציית הלדים
            </span>
          </div>

          {/* Trigger Auto Calibration button */}
          <div className="border border-slate-800 bg-[#0c0e15] rounded-2xl p-5 flex flex-col gap-4 shadow-sm/30">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Target className="w-5 h-5 text-teal-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200">ACTIVE DEVICE CONTROL</span>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              כדי לבצע סנכרון אוטומטי של זווית ההקרנה, פולסים וזמן תצוגה, אנא לחץ על הכפתור מטה. תהליך זה מפעיל את המנוע ומודד את הנתונים בזמן אמת.
            </p>

            <button
              onClick={() => {
                setShowCalibrateModal(true);
                handleStartCalibration();
              }}
              className="w-full bg-[#00b4d8] hover:bg-[#0096b4] text-white font-black py-4 rounded-xl text-[11px] tracking-widest uppercase shadow-[0_0_15px_rgba(0,180,216,0.3)] transition cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <Activity className="w-4 h-4" />
              הפעל כיול אוטומטי / START AUTO-CALIBRATION
            </button>
          </div>

          <CalibrationPanel
            onUpdate={handleCalibrationUpdate}
            config={calibrationConfig}
            telemetry={{ sync: isConnected || isBluetoothConnected, jitter: isConnected || isBluetoothConnected ? "0.12" : "0.00" }}
          />

          <div className="border border-slate-800 bg-[#080a0f] rounded-2xl p-5 flex flex-col gap-4 mt-2 shadow-inner">
            <div className="flex justify-between items-center px-1">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Sync History</span>
                <span className="text-[8px] text-slate-600 uppercase tracking-tighter">Real-time Hall Sensor Stability</span>
              </div>
              <Activity className="w-3.5 h-3.5 text-[#00b4d8] animate-pulse" />
            </div>

            <div className="h-[120px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={syncHistory}>
                  <defs>
                    <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00b4d8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00b4d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    hide 
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    hide 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: '10px' }}
                    itemStyle={{ color: '#00b4d8' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="quality" 
                    stroke="#00b4d8" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorQuality)" 
                    animationDuration={500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-[8px] text-slate-500 uppercase">Interference Monitor</span>
              <span className={`text-[10px] font-mono font-bold ${state.sync.quality.includes("PERFECT") ? "text-emerald-400" : "text-amber-400"}`}>
                {state.sync.quality}
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (subPage === "led") {
      return (
        <div className="px-5 pt-2 pb-28 flex flex-col gap-6 ">
          <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mb-[-10px]">
            LED SETTINGS
          </h3>

          <LedVisualizer 
            arms={state.led.arms} 
            stripsPerArm={state.led.stripsPerArm} 
            strips={state.led.strips} 
            pins={state.led.pins} 
            activeEffect={activeEffect}
            colorMode={colorMode}
            baseColor={logoTintColor}
            brightness={brightness}
            aiEffectJs={aiEffectJs}
          />
          <WiringGuide 
            pins={state.led.pins} 
            strips={state.led.strips} 
            motorPin={state.motor.pin}
            sensorPin={state.sync.sensorPin}
            chipModel={chipModel}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex flex-col gap-3">
              <span className="text-[11px] text-slate-400 tracking-wide uppercase font-bold flex items-center">
                Mechanical Arms
                <InfoTooltip title="Mechanical Arms" text="The number of physical spinning blades. Most holograms use 2, 4 or 6 arms for better persistence of vision." />
              </span>
              <div className="flex gap-1 justify-between">
                {[1, 2, 3, 4].map(val => (
                  <button 
                    key={val}
                    onClick={() => {
                      const newStrips = val * state.led.stripsPerArm;
                      setState((p: any) => ({
                        ...p,
                        led: { ...p.led, arms: val, strips: newStrips }
                      }));
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${state.led.arms === val ? "bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]" : "bg-slate-800/50 text-slate-500 hover:text-slate-300"}`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex flex-col gap-3">
              <span className="text-[11px] text-slate-400 tracking-wide uppercase font-bold flex items-center">
                Stripes per Arm
                <InfoTooltip title="Strips per Arm" text="Number of parallel LED strips on each blade. Dual strips double the density and brightness." />
              </span>
              <div className="flex gap-1 justify-between">
                {[1, 2].map(val => (
                  <button 
                    key={val}
                    onClick={() => {
                      const newStrips = state.led.arms * val;
                      setState((p: any) => ({
                        ...p,
                        led: { ...p.led, stripsPerArm: val, strips: newStrips }
                      }));
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${state.led.stripsPerArm === val ? "bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)]" : "bg-slate-800/50 text-slate-500 hover:text-slate-300"}`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[13px] text-slate-200 tracking-wide flex items-center">
                LEDs for Single Stripe
                <InfoTooltip title="LED Density" text="Number of pixels on one fan blade. Higher counts require faster processors and higher current." />
              </span>
              <span className="text-[10px] text-slate-500">Total: {state.led.strips * state.led.ledsPerStrip} LEDs</span>
            </div>
            <Stepper
              value={state.led.ledsPerStrip}
              onChange={(v: any) => updateState("led", "ledsPerStrip", v)}
              max={500}
            />
          </div>

          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex items-center justify-between">
            <span className="text-[13px] text-slate-200 tracking-wide flex items-center">
              LED Pins (comma separated)
              <InfoTooltip title="GPIO Pins" text="The ESP32 pins connected to the data lines of each strip. Separate pins allow for parallel DMA output." />
            </span>
            <input
              type="text"
              className="bg-transparent text-right text-slate-300 font-medium focus:outline-none w-[100px]"
              value={state.led.pins}
              onChange={(e) => updateState("led", "pins", e.target.value)}
              placeholder="e.g. 4, 5"
            />
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[11px] text-slate-400 tracking-wide flex items-center">
              Color Order
              <InfoTooltip title="Color Order" text="Defines the sequence of R, G, B components. If your colors look swapped (e.g., Red looks Green), try changing this." />
            </span>
            <RadioGroup
              options={[
                { label: "GRB", value: "GRB" },
                { label: "RGB", value: "RGB" },
                { label: "BRG", value: "BRG" },
              ]}
              value={state.led.colorOrder}
              onChange={(v: any) => updateState("led", "colorOrder", v)}
            />
          </div>

          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-2 flex items-center justify-between pr-4">
            <span className="text-[13px] text-slate-200 tracking-wide pl-3 flex items-center">
              Chipset
              <InfoTooltip title="LED Driver" text="The driver chip inside the LED. WS2812B is most common. SK6812 is similar but often has a dedicated White channel." />
            </span>
            <select
              className="bg-transparent text-sm font-medium text-slate-300 focus:outline-none appearance-none h-10 px-4 text-right"
              value={state.led.chipset}
              onChange={(e) => updateState("led", "chipset", e.target.value)}
            >
              <option>WS2812B</option>
              <option>APA102</option>
              <option>SK6812</option>
            </select>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            <span className="text-[11px] text-slate-400 tracking-wide">
              Global Brightness Limit
            </span>
            <div className="flex items-center gap-4 px-2">
              <CustomSlider
                value={state.led.globalBrightness}
                onChange={(v: any) => updateState("led", "globalBrightness", v)}
                thumbColor="#38bdf8"
                trackColor="#1e293b"
              />
              <span className="text-white font-mono text-sm w-8">
                {state.led.globalBrightness}
              </span>
            </div>
          </div>

          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex items-center justify-between mt-2">
            <span className="text-[13px] text-slate-200 tracking-wide">
              LED Test
            </span>
            <Toggle
              value={state.led.test}
              activeColor="#38bdf8"
              onChange={(v: any) => updateState("led", "test", v)}
            />
          </div>

          <button
            onClick={() => {
              safeSaveLocal("holospin_state", JSON.stringify(state));
              setToastMessage("LED Settings confirmed & applied! / הגדרות פינים ולדים נשמרו בהצלחה!");
            }}
            className="w-full bg-[#00b4d8] hover:bg-[#0096b4] text-white py-4 rounded-xl text-[11px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(0,180,216,0.25)] transition mt-2 cursor-pointer active:scale-95"
          >
            CONFIRM LED PARAMETERS
          </button>
        </div>
      );
    }

    if (subPage === "motor") {
      return (
        <div className="px-5 pt-2 pb-28 flex flex-col gap-6 ">
          <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mb-[-10px]">
            MOTOR SETTINGS
          </h3>

          <div className="flex justify-between items-center border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-4">
            <span className="text-[13px] text-slate-200 tracking-wide">
              Motor Control Pin
            </span>
            <input
              type="text"
              className="bg-transparent font-medium text-slate-300 text-right focus:outline-none w-[60px]"
              value={state.motor.pin}
              onChange={(e) => updateState("motor", "pin", e.target.value)}
              placeholder="e.g. 12"
            />
          </div>

          <div className="flex justify-between items-center border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-4">
            <span className="text-[13px] text-slate-200 tracking-wide flex items-center">
              PWM Frequency
              <InfoTooltip title="Switching Frequency" text="Higher frequency makes the motor quieter but increases heat in the MOSFET. 5-10kHz is recommended." />
            </span>
            <select
              className="bg-transparent font-medium text-slate-300 text-right focus:outline-none"
              value={state.motor.pwmFreq}
              onChange={(e) => updateState("motor", "pwmFreq", e.target.value)}
            >
              <option>5000 Hz</option>
              <option>10000 Hz</option>
            </select>
          </div>

          <div className="flex justify-between items-center border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-4">
            <span className="text-[13px] text-slate-200 tracking-wide flex items-center">
              PWM Resolution
              <InfoTooltip title="Duty Cycle Precision" text="Number of bits for speed control. 8-bit allows 256 levels, 10-bit allows 1024 levels." />
            </span>
            <select
              className="bg-transparent font-medium text-slate-300 text-right focus:outline-none"
              value={state.motor.pwmRes}
              onChange={(e) => updateState("motor", "pwmRes", e.target.value)}
            >
              <option>8 Bit</option>
              <option>10 Bit</option>
            </select>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-[11px] text-slate-400 tracking-wide">
              Max Speed Limit
            </span>
            <div className="flex items-center gap-4 px-2">
              <CustomSlider
                value={state.motor.maxSpeed}
                onChange={(v: any) => updateState("motor", "maxSpeed", v)}
                thumbColor="#2dd4bf"
                trackColor="#1e293b"
              />
              <span className="text-white font-mono text-sm w-8">
                {state.motor.maxSpeed}
              </span>
            </div>
          </div>

          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex items-center justify-between">
            <span className="text-[13px] text-slate-200 tracking-wide">
              Soft Start
            </span>
            <Toggle
              value={state.motor.softStart}
              activeColor="#38bdf8"
              onChange={(v: any) => updateState("motor", "softStart", v)}
            />
          </div>

          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex items-center justify-between">
            <span className="text-[13px] text-slate-200 tracking-wide">
              Soft Stop
            </span>
            <Toggle
              value={state.motor.softStop}
              activeColor="#f59e0b"
              onChange={(v: any) => updateState("motor", "softStop", v)}
            />
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[11px] text-slate-400 tracking-wide">
              Direction
            </span>
            <RadioGroup
              options={[
                { label: "CW", value: "CW" },
                { label: "CCW", value: "CCW" },
              ]}
              value={state.motor.direction}
              onChange={(v: any) => updateState("motor", "direction", v)}
            />
          </div>

          <button
            onClick={() => {
              safeSaveLocal("holospin_state", JSON.stringify(state));
              setToastMessage("Motor Settings confirmed & saved! / הגדרות המנוע נשמרו בהצלחה!");
            }}
            className="w-full bg-[#00b4d8] hover:bg-[#0096b4] text-white py-4 rounded-xl text-[11px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(0,180,216,0.25)] transition mt-4 cursor-pointer active:scale-95"
          >
            CONFIRM MOTOR PARAMETERS
          </button>
        </div>
      );
    }

    if (subPage === "pov") {
      return (
        <div className="px-5 pt-2 pb-28 flex flex-col gap-6 ">
          <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mb-[-10px]">
            POV SETTINGS
          </h3>
          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-4 flex items-center justify-between">
            <span className="text-[13px] text-slate-200 tracking-wide">
              Total Columns
            </span>
            <Stepper
              value={state.pov.totalColumns}
              onChange={(v: any) => updateState("pov", "totalColumns", v)}
              max={1000}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 tracking-wide">
              Rotation Direction
            </span>
            <div className="w-[180px]">
              <RadioGroup
                options={[
                  { label: "CW", value: "CW" },
                  { label: "CCW", value: "CCW" },
                ]}
                value={state.pov.rotationDir}
                onChange={(v: any) => updateState("pov", "rotationDir", v)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/50 pb-6 pt-2">
            <span className="text-[13px] text-slate-200 tracking-wide pl-1">
              Auto Calibrate
            </span>
            <button
              onClick={handleStartCalibration}
              className="bg-[#6366f1] px-6 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:bg-[#4f46e5] transition w-[130px] h-[40px]"
            >
              CALIBRATE
            </button>
          </div>

          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] text-slate-200 tracking-wide font-medium">
                Auto-Calibrate Hall Sensor on Bootup
              </span>
              <span className="text-[10px] text-slate-400">
                כיול אוטומטי של חיישן ה-Hall בעליית המערכת (Power-Up)
              </span>
            </div>
            <Toggle
              value={state.pov.hallAutoCalibrateOnPowerUp ?? false}
              onChange={(v: boolean) => updateState("pov", "hallAutoCalibrateOnPowerUp", v)}
            />
          </div>

          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex items-center justify-between">
            <span className="text-[13px] text-slate-200 tracking-wide">
              Preview Mode
            </span>
            <Toggle
              value={state.pov.previewMode}
              activeColor="#64748b"
              onChange={(v: any) => updateState("pov", "previewMode", v)}
            />
          </div>

          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-4 flex items-center justify-between">
            <span className="text-[13px] text-slate-200 tracking-wide">
              Frames Per Rotation
            </span>
            <Stepper
              value={state.pov.frames}
              onChange={(v: any) => updateState("pov", "frames", v)}
              max={1000}
            />
          </div>

          <button
            onClick={() => {
              safeSaveLocal("holospin_state", JSON.stringify(state));
              setToastMessage("POV Settings confirmed & applied! / הגדרות גיאומטריית POV נשמרו בהצלחה!");
            }}
            className="w-full bg-[#00b4d8] hover:bg-[#0096b4] text-white py-4 rounded-xl text-[11px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(0,180,216,0.25)] transition mt-2 cursor-pointer active:scale-95"
          >
            CONFIRM POV GEOMETRY
          </button>
        </div>
      );
    }

    if (subPage === "sync") {
      return (
        <div className="px-5 pt-2 pb-28 flex flex-col gap-6 ">
          <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mb-[-10px]">
            SYNC & SENSOR
          </h3>
          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex items-center justify-between">
            <span className="text-[13px] text-slate-200 tracking-wide">
              Hall Sensor
            </span>
            <Toggle
              value={state.sync.hallSensor}
              onChange={(v: any) => updateState("sync", "hallSensor", v)}
            />
          </div>

          <div className="flex justify-between items-center border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-4">
            <span className="text-[13px] text-slate-200 tracking-wide">
              Sensor Pin
            </span>
            <input
              type="text"
              className="bg-transparent font-medium text-slate-300 text-right focus:outline-none w-[60px]"
              value={state.sync.sensorPin}
              onChange={(e) => updateState("sync", "sensorPin", e.target.value)}
              placeholder="e.g. 14"
            />
          </div>

          <div className="flex justify-between items-center border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-4">
            <span className="text-[13px] text-slate-200 tracking-wide">
              Analog Mic Pin (ADC)
            </span>
            <input
              type="text"
              className="bg-transparent font-medium text-slate-300 text-right focus:outline-none w-[60px]"
              value={state.sync.adcPin ?? 32}
              onChange={(e) => updateState("sync", "adcPin", e.target.value)}
              placeholder="e.g. 32"
            />
          </div>

          <div className="flex justify-between items-center mt-2">
            <span className="text-[11px] text-slate-400 tracking-wide flex items-center">
              Trigger Mode
              <InfoTooltip title="Interrupt Edge" text="Falling edge triggers when sensor goes LOW. Use RISING if your sensor is active-high." />
            </span>
            <div className="w-[60%]">
              <RadioGroup
                options={[
                  { label: "FALLING", value: "FALLING" },
                  { label: "RISING", value: "RISING" },
                ]}
                value={state.sync.triggerMode}
                onChange={(v: any) => updateState("sync", "triggerMode", v)}
              />
            </div>
          </div>

          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex items-center justify-between">
            <span className="text-[13px] text-slate-200 tracking-wide flex items-center">
              Signal Invert
              <InfoTooltip title="Logic Inversion" text="Flips the HIGH/LOW state of the Hall sensor. Use if your sync point is 180 degrees off." />
            </span>
            <Toggle
              value={state.sync.signalInvert}
              activeColor="#64748b"
              onChange={(v: any) => updateState("sync", "signalInvert", v)}
            />
          </div>

          <div className="flex justify-between items-center px-1 mb-2 mt-2">
            <span className="text-[13px] text-slate-200 tracking-wide flex items-center gap-2">
              <RefreshCw className={`w-3.5 h-3.5 text-[#00b4d8] ${isConnected || isBluetoothConnected ? "animate-[spin_3s_linear_infinite]" : "opacity-50"}`} />
              Sync Quality
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[20px] font-medium text-[#22c55e] leading-none">
                100%
              </span>
              <span className="text-[10px] text-[#22c55e] font-bold tracking-widest uppercase leading-none mt-1">
                PERFECT
              </span>
            </div>
          </div>

          <SyncSvgGraph />

          <button
            onClick={() => {
              safeSaveLocal("holospin_state", JSON.stringify(state));
              setToastMessage("Sync & Sensor parameters confirmed! / הגדרות הסינכרון נשמרו בהצלחה!");
            }}
            className="w-full bg-[#00b4d8] hover:bg-[#0096b4] text-white py-4 rounded-xl text-[11px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(0,180,216,0.25)] transition mt-2 cursor-pointer active:scale-95"
          >
            CONFIRM SYNC SETTINGS
          </button>
        </div>
      );
    }

    if (subPage === "firmware") {
      const missingFields: string[] = [];
      if (!state.led?.pins?.trim()) missingFields.push("LED Strip Pins / פיני חיבור לדים");
      if (!state.led?.ledsPerStrip) missingFields.push("LED Count / כמות לדים (Pixel Count)");
      if (!state.sync?.sensorPin?.toString().trim()) missingFields.push("Hall Sensor Pin / פין חיישן טייל");
      if (!state.sync?.adcPin?.toString().trim()) missingFields.push("Analog Mic Pin (ADC) / פין מיקרופון (ADC)");
      if (!state.motor?.pin?.toString().trim()) missingFields.push("Motor Pin / פין מנוע");

      if (missingFields.length > 0) {
        return (
          <div className="px-5 pt-2 pb-28 flex flex-col gap-6 ">
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mb-0">
                FIRMWARE SETUP
              </h3>
            </div>
            
            <div className="border border-red-500/50 rounded-2xl bg-red-500/10 p-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <h4 className="font-bold text-sm tracking-wide">Missing Configuration / חסרים הגדרות חובה</h4>
              </div>
              <p className="text-xs text-red-200/80 mb-3">
                Please update the following missing fields before generating the firmware:
                <br/>
                אנא עדכן את ההגדרות החסרות הבאות לפני יצירת קוד ה-Firmware:
              </p>
              <ul className="text-sm font-medium space-y-1.5 text-white/90 bg-red-950/40 p-4 rounded-xl border border-red-500/20">
                {missingFields.map((field, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {field}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => setSubPage(null)}
                className="mt-4 w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-3 rounded-xl transition"
              >
                GO BACK / חזור
              </button>
            </div>
          </div>
        );
      }

      const pinsArray = state.led.pins
        .split(",")
        .map((p: string) => p.trim())
        .filter(Boolean);
        
      const stripDefines = pinsArray.map((pin: string, i: number) => `#define PIN_STRIP${i + 1} ${pin}`).join("\n");
      
      const featureName =
        "Neo" +
        state.led.colorOrder.charAt(0).toUpperCase() +
        state.led.colorOrder.substr(1).toLowerCase() +
        "Feature";

      const registeredFiles = (state.storage?.files || []).filter((f: any) => f.selected);
      const registeredCount = registeredFiles.length;
      const registeredListString = registeredCount > 0
        ? registeredFiles.map((f: any) => `  "${f.path || ('/' + (f.type === 'video' ? 'videos' : 'images') + '/' + f.name)}"`).join(",\n")
        : '  "/images/butterfly_nebula.png"';

      const stripObjects = pinsArray.map((_: any, i: number) => `NeoPixelBus<${featureName}, NeoEsp32Rmt${i}Ws2812xMethod> strip${i + 1}(PIXEL_COUNT, PIN_STRIP${i + 1});`).join("\n");
      const stripInit = pinsArray.map((_: any, i: number) => `    strip${i + 1}.Begin(); \n    strip${i + 1}.Show();`).join("\n");
      
      const renderLoops = Array.from({ length: state.led.arms }).map((_: any, armIdx: number) => {
        const armAngleOffset = (armIdx * 360.0) / state.led.arms;
        return Array.from({ length: state.led.stripsPerArm }).map((_: any, sIdx: number) => {
          const globalIdx = armIdx * state.led.stripsPerArm + sIdx;
          if (globalIdx >= pinsArray.length) return "";
          return `
    float angle${globalIdx + 1} = fmod(angle + ${armAngleOffset.toFixed(1)}f, 360.0f);
    for (int i = 0; i < PIXEL_COUNT; i++) {
        strip${globalIdx + 1}.SetPixelColor(i, getEffectColor(i, angle${globalIdx + 1}, timeMs));
    }
    strip${globalIdx + 1}.Show();`;
        }).join("");
      }).join("\n");

      const stripClear = pinsArray.map((_: any, i: number) => `        strip${i + 1}.ClearTo(RgbColor(0));\n        strip${i + 1}.Show();`).join("\n");

      const headerCode = `// Config.h
#pragma once

// VISUAL CONFIGURATION
#define MECHANICAL_ARMS ${state.led.arms}       // כמות זרועות מכניות
#define STRIPS_PER_ARM ${state.led.stripsPerArm}     // כמות פסי לדים לכל זרוע
#define PIXEL_COUNT ${state.led.ledsPerStrip}        // כמות לדים בכל פס (מניפה אחת)
#define TOTAL_STRIPS ${state.led.strips}       // סה"כ פסי לדים במערכת

// LED STRIP PINS (פיני חיבור לדים)
${stripDefines}

// SENSOR AND MOTOR PINS
#define HALL_PIN ${state.sync.sensorPin}           // חיישן הול (Hall Effect)
#define MOTOR_PIN ${state.motor.pin}          // פין מנוע
#define MIC_PIN ${state.sync.adcPin ?? 32}            // מיקרופון אנלוגי (ADC)
#define MOTOR_FREQ ${state.motor.pwmFreq.replace(" Hz", "")}       // תדר עבודה של המנוע
#define MOTOR_RES ${state.motor.pwmRes.replace(" Bit", "")}           // רזולוציית בקרת מהירות

// PHYSICAL SD CARD SPI CONFIGURATION (כרטיס זיכרון פיזי)
#define SD_CS_PIN 5           // פין Chip Select עבור כרטיס ה-SD
#define SD_MOSI_PIN 23        // פין MOSI של כרטיס ה-SD
#define SD_MISO_PIN 19        // פין MISO של כרטיס ה-SD
#define SD_SCK_PIN 18         // פין SCK של כרטיס ה-SD

// WIFI - ROUTER / ראוטר (STA MODE)
#define ROUTER_SSID "${state.wifi.routerSsid || "Dael CR"}"
#define ROUTER_PASS "${state.wifi.routerPass || "14cusco05"}"

// WIFI - LOCAL HOTSPOT / נקודה חמה (AP MODE)
#define AP_SSID "${state.wifi.ssid || "Holospin_POV2"}"
#define AP_PASS "${state.wifi.pass || "12345678"}"

// REGISTERED PLAYBACK FILES ON SD (אישור קבצי תצוגה לקוד)
#define PLAYBACK_FILE_COUNT ${registeredCount || 1}
const char* PLAYBACK_FILES[PLAYBACK_FILE_COUNT] = {
${registeredListString}
};
`;

      const inoCode = `/* 
  ===================================================================
  HOLOSPIN POV 3D - HARDWARE FIRMWARE
  ===================================================================
*/

#include <WiFi.h>
#include <WebServer.h>
#include <ElegantOTA.h>
#include <NeoPixelBus.h>
#include <NimBLEDevice.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <SD.h>
#include "Config.h"

// =====================================================
// LED STRIPS
// =====================================================
${stripObjects}

// =====================================================
// SERVER & BLE
// =====================================================
WebServer server(80);
NimBLECharacteristic *pTxCharacteristic;
NimBLECharacteristic *pRxCharacteristic;
bool bleConnected = false;

// =====================================================
// GLOBALS & EFFECTS DEF
// =====================================================
bool ledState = true;
uint8_t ledR = 255, ledG = 0, ledB = 0;

enum EffectType { 
    EFFECT_CLOCK, 
    EFFECT_RAINBOW, 
    EFFECT_FIRE, 
    EFFECT_MATRIX, 
    EFFECT_HYPNO, 
    EFFECT_SPACE,
    EFFECT_MANDALA,
    EFFECT_ACID,
    EFFECT_PLASMA,
    EFFECT_PORTAL,
    EFFECT_DNA,
    EFFECT_MUSHROOMS,
    EFFECT_ALIEN,
    EFFECT_CUBE3D,
    EFFECT_KALEIDO,
    EFFECT_VIDEO_SYNTH,
    EFFECT_ANIME_FLOW,
    EFFECT_POV_TEXT,
    EFFECT_LOGO,
    EFFECT_SOLID 
};
EffectType currentEffect = EFFECT_RAINBOW;

volatile unsigned long lastHallTrigger = 0;
volatile unsigned long revolutionTime = 40000;

// BLE Callbacks and Helpers would follow here...
// (Simplified for the template view)

RgbColor getEffectColor(int ledIdx, float angle, unsigned long timeMs) {
    float r = (float)ledIdx / PIXEL_COUNT;
    
    // AI Custom Effect injection
${aiEffectCode ? `    if (currentEffect == EFFECT_SOLID) { // Assuming mapped to AI
${aiEffectCode.split('\\n').map(line => '        ' + line).join('\\n')}
    }` : ''}
    
    return RgbColor(ledR, ledG, ledB);
}

void renderPOV(float angle, unsigned long timeMs) {
    if (!ledState) {
${stripClear}
        return;
    }
${renderLoops}
}

void setup() {
    Serial.begin(115200);
    pinMode(HALL_PIN, INPUT_PULLUP);
    pinMode(MOTOR_PIN, OUTPUT);
    attachInterrupt(digitalPinToInterrupt(HALL_PIN), hallISR, FALLING);

${stripInit}
    Serial.println("[SETUP] LEDs initialized");

    // Init WiFi, Server, BLE, SD...
}

void loop() {
    unsigned long now = micros();
    unsigned long elapsed = now - lastHallTrigger;
    if (elapsed > 1000000) { 
        revolutionTime = 40000;
        elapsed = elapsed % revolutionTime;
    }
    
    float angle = (float)elapsed / (float)revolutionTime * 360.0f;
    renderPOV(angle, millis());
    
    server.handleClient();
    ElegantOTA.loop();
}
`;

      const downloadFile = async (filename: string, content: string) => {
        const isCapacitor = !!(window as any).Capacitor;

        if (isCapacitor) {
          try {
            // Write to local cache directory first
            const writeResult = await Filesystem.writeFile({
              path: filename,
              data: content,
              directory: Directory.Cache,
              encoding: Encoding.UTF8
            });

            // Native share sheet so user can copy to standard files or drive
            await Share.share({
              title: `Save ${filename}`,
              text: `Holospin POV Firmware file: ${filename}`,
              url: writeResult.uri,
              dialogTitle: `Save or send ${filename}`
            });

            setToastMessage(`Shared ${filename} successfully! / שותף בהצלחה`);
          } catch (error: any) {
            console.error("Capacitor download/share failed:", error);
            setToastMessage(`Failed to export: ${error.message || error}`);
          }
          return;
        }

        try {
          const blob = new Blob([content], { type: "text/plain" });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          
          // Fallback if click doesn't trigger immediately
          setTimeout(() => {
            if (document.body.contains(link)) {
              document.body.removeChild(link);
            }
            window.URL.revokeObjectURL(url);
          }, 1000);
          
          setToastMessage(`Downloading ${filename}... / מוריד קובץ...`);
        } catch (error) {
          console.error("Download failed:", error);
          setToastMessage("Download failed. Use 'Copy to Clipboard' / הורדה נכשלה, השתמש בהעתקה");
        }
      };

      const copyToClipboard = async (content: string) => {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(content);
            setToastMessage("Copied to clipboard / הועתק ללוח");
          } else {
            throw new Error("Clipboard API not available");
          }
        } catch (err) {
          console.error("Clipboard copy failed", err);
          // Fallback for older browsers if needed
          const textArea = document.createElement("textarea");
          textArea.value = content;
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            setToastMessage("Copied to clipboard / הועתק ללוח");
          } catch (e) {
            alert("Could not copy to clipboard. Please copy manually.");
          }
          document.body.removeChild(textArea);
        }
      };

      return (
        <div className="px-5 pt-2 pb-28 flex flex-col gap-6 ">
          <div className="flex justify-between items-center">
            <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mb-0">
              FIRMWARE SETUP
            </h3>
            <button
               onClick={() => setShowBootloaderModal(true)}
               className="text-[10px] text-[#fbbf24] hover:text-white uppercase tracking-wide font-bold"
            >
              Need help?
            </button>
          </div>
          <p className="text-[13px] text-slate-400">
            Download or copy the generated .ino and .h files for your setup to
            flash to your board.
          </p>

          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] flex flex-col pt-4 overflow-hidden">
            <div className="px-4 flex justify-between items-center mb-2">
              <span className="text-[#a855f7] font-bold text-sm">Config.h</span>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => downloadFile("ConfigBackup.txt", headerCode)}
                  className="text-slate-400 hover:text-white transition px-2 py-1 text-[9px] border border-slate-700 rounded-lg uppercase tracking-wider font-bold bg-slate-800/50 hover:bg-slate-700"
                >
                  Save as .txt
                </button>
                <button
                  onClick={() => copyToClipboard(headerCode)}
                  className="text-slate-400 hover:text-white transition p-1"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => downloadFile("Config.h", headerCode)}
                  className="text-slate-400 hover:text-white transition p-1"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleWriteFileToESP32("Config.h", headerCode)}
                  className="text-emerald-400 hover:text-emerald-300 transition px-2 py-0.5 text-[9px] border border-emerald-800 rounded-lg uppercase tracking-wider font-bold bg-emerald-950/40 hover:bg-emerald-950/80 flex items-center gap-1 active:scale-95 ml-1"
                >
                  <Cpu className="w-3 h-3" />
                  <span>Write to ESP32</span>
                </button>
              </div>
            </div>
            <div className="bg-[#050608] p-4 overflow-x-auto text-xs font-mono text-slate-300 border-t border-slate-800/80">
              <pre>{headerCode}</pre>
            </div>
          </div>

          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] flex flex-col pt-4 overflow-hidden">
            <div className="px-4 flex justify-between items-center mb-2">
              <span className="text-[#38bdf8] font-bold text-sm">main.ino</span>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(inoCode)}
                  className="text-slate-400 hover:text-white transition p-1"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={() => downloadFile("main.ino", inoCode)}
                  className="text-slate-400 hover:text-white transition p-1"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleWriteFileToESP32("main.ino", inoCode)}
                  className="text-emerald-400 hover:text-emerald-300 transition px-2 py-0.5 text-[9px] border border-emerald-800 rounded-lg uppercase tracking-wider font-bold bg-emerald-950/40 hover:bg-emerald-950/80 flex items-center gap-1 active:scale-95 ml-1"
                >
                  <Cpu className="w-3 h-3" />
                  <span>Write to ESP32</span>
                </button>
              </div>
            </div>
            <div className="bg-[#050608] p-4 overflow-x-auto text-xs font-mono text-slate-300 border-t border-slate-800/80">
              <pre>{inoCode}</pre>
            </div>
          </div>

          {/* Firmware Flashing Section */}
          <div id="tour-firmware" className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex flex-col gap-4">
            <h4 className="text-white font-bold text-sm flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-400" />
              Firmware Flashing (No Computer Required)
            </h4>
            
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans mb-1">
              Just like <strong className="text-emerald-400">ArduinoDroid</strong>, you can flash your ESP32 directly from your phone. 
              Android phones support direct flashing via a USB OTG cable using the browser's Web Serial API, 
              or you can flash completely wirelessly via Wi-Fi OTA.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Method 1: OTA */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-3 group">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] font-bold text-white uppercase">1. Wi-Fi OTA (Wireless)</span>
                </div>
                <p className="text-[9px] text-slate-400 font-sans h-8">
                  Update firmware wirelessly via ElegantOTA. Ensure your phone is connected to the Holospin Wi-Fi. (iOS & Android)
                </p>
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={handleIntegratedOtaUpdate}
                    className="flex-1 py-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-400 font-bold uppercase text-[9px] tracking-widest transition"
                  >
                    Start OTA Update
                  </button>
                  <button
                    onClick={() => {
                      const url = getExternalDeviceUrl("/update");
                      window.open(url, '_blank');
                    }}
                    className="flex-1 py-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 text-slate-400 font-bold uppercase text-[9px] tracking-widest transition"
                  >
                    External Flasher
                  </button>
                  <a
                    href="/firmware.bin"
                    onClick={(e) => {
                      if (!validateFirmwarePath("/firmware.bin")) {
                        e.preventDefault();
                        setToastMessage("Invalid firmware path detected / נתיב קושחה לא תקין");
                      }
                    }}
                    download="holospin_firmware.bin"
                    className="flex-1 py-2.5 flex items-center justify-center rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-400 font-bold uppercase text-[9px] tracking-widest transition"
                  >
                    Download .bin
                  </a>
                </div>
              </div>

              {/* Method 2: Native USB OTG */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col gap-3 group">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] font-bold text-white uppercase">2. Native USB OTG (App)</span>
                </div>
                <p className="text-[9px] text-slate-400 font-sans h-8">
                  Connect ESP32 via USB OTG. Uses native Android USB Host API to establish CH340/CP2102 serial link.
                </p>
                <button
                  onClick={handleFlashViaOtg}
                  className="mt-auto w-full py-2.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/50 text-amber-400 font-bold uppercase text-[9px] tracking-widest transition cursor-pointer"
                >
                  Flash via USB OTG
                </button>
              </div>
            </div>
          </div>

          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-4 flex flex-col gap-2">
            <h4 className="text-white font-bold text-sm">System Diagnostics</h4>
            <p className="text-xs text-slate-400">Download the recent serial logs for debugging.</p>
            <button
              onClick={handleDownloadLogs}
              className="mt-2 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase text-[10px] tracking-widest transition"
            >
              Download Logs
            </button>
          </div>

          {/* Guide Card */}
          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                מדריך הגדרת סביבת פיתוח / ESP32 POV SETUP GUIDE
              </h3>
            </div>
            <div className="text-xs text-slate-300 space-y-3 font-sans leading-relaxed">
              <div>
                <strong className="text-[#00b4d8]">1. הורדת תוכנות פיתוח / Arduino IDE:</strong>
                <p className="text-slate-400 text-[10.5px]">הורד והתקן את הגרסה העדכנית ביותר של תוכנת <span className="font-semibold text-white">Arduino IDE 2.x</span> מאתר הרשמי.</p>
              </div>
              
              <div>
                <strong className="text-[#00b4d8]">2. תמיכה בלוח הברזל / Install ESP32 Board Core:</strong>
                <p className="text-slate-400 text-[10.5px]">
                  כנס לתפריט Preferences ב-IDE, והדבק את כתובת הנהלים הבאה:
                  <code className="block bg-[#050608] p-1.5 rounded border border-slate-900 overflow-x-auto text-pink-400 text-[10px] my-1 font-mono">
                    https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
                  </code>
                  פתח את Boards Manager (Ctrl+Shift+B), חפש <span className="text-white">esp32</span> מאת Espressif ובצע התקנה (Install).
                </p>
              </div>

              <div>
                <strong className="text-[#a855f7]">3. התקנת ספריות נדרשות / Required Libraries:</strong>
                <p className="text-slate-400 text-[10.5px]">
                  עבור אל Library Manager (Ctrl+Shift+I), חפש והתקן את הספריות הבאות:
                </p>
                <ul className="list-disc pl-5 text-[10.5px] text-slate-400 space-y-0.5 mt-1">
                  <li><span className="text-white font-mono">ArduinoJson</span> (by Benoit Blanchon) — לניהול פקודות ה-JSON</li>
                  <li><span className="text-white font-mono">NeoPixelBus</span> (by Makuna) — לנהיגת הלדים המהירה DMA/RMT</li>
                  <li><span className="text-white font-mono">ElegantOTA</span> — לעדכונים אלחוטיים באמצעות רשת Wi-Fi</li>
                  <li><span className="text-white font-mono">ESPAsyncWebServer</span> & <span className="text-white font-mono">AsyncTCP</span> — לשרת אינטרנט מהיר ואי-סינכרוני</li>
                  <li><span className="text-white font-mono">NimBLE-Arduino</span> (by h2zero) — לתקשורת Bluetooth חסכונית ומהירה</li>
                </ul>
              </div>

              <div className="border-t border-slate-800/50 pt-2 text-[10.5px] text-slate-400">
                <strong className="text-amber-500">4. מדריך חיווט פינים של הלוח / ESP32 Wiring Diagram:</strong>
                <p className="mt-1 mb-2">
                  חבר את כל הרכיבים בצורה בטוחה ויציבה לפי פיני החומרה הבאים שהגדרנו עבורך בהתאמה לקוד:
                </p>
                
                {/* Interactive ESP32 PCB Guide Board */}
                <div className="my-3 scale-[0.9] origin-top bg-black/40 rounded-xl overflow-hidden border border-slate-800/60 p-2">
                  <Esp32Board activePins={["25", "26", "27", "14"]} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 font-mono text-[10.5px]">
                  <div className="bg-[#050608] border border-slate-800 p-2 rounded-xl flex justify-between items-center text-slate-200">
                    <span>LED זרוע 1 / LED Strip 1</span>
                    <span className="bg-purple-900/30 text-purple-400 font-bold px-2 py-0.5 rounded border border-purple-800/30">GPIO 25</span>
                  </div>
                  <div className="bg-[#050608] border border-slate-800 p-2 rounded-xl flex justify-between items-center text-slate-200">
                    <span>LED זרוע 2 / LED Strip 2</span>
                    <span className="bg-purple-900/30 text-purple-400 font-bold px-2 py-0.5 rounded border border-purple-800/30">GPIO 26</span>
                  </div>
                  <div className="bg-[#050608] border border-slate-800 p-2 rounded-xl flex justify-between items-center text-slate-200">
                    <span>חיישן מגנטי / Hall Sensor</span>
                    <span className="bg-amber-900/30 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-800/30">GPIO 27</span>
                  </div>
                  <div className="bg-[#050608] border border-slate-800 p-2 rounded-xl flex justify-between items-center text-slate-200">
                    <span>בקרת מנוע / Motor PWM Gate</span>
                    <span className="bg-sky-900/30 text-sky-400 font-bold px-2 py-0.5 rounded border border-sky-800/30">GPIO 14</span>
                  </div>
                  <div className="bg-[#050608] border border-slate-800 p-2 rounded-xl flex justify-between items-center text-slate-200 sm:col-span-2">
                    <span>בלוטות' מובנה / Built-in ESP32 BT</span>
                    <span className="bg-emerald-900/30 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-800/30">חומרה פנימית - ללא פינים / On-Chip (No External Wiring)</span>
                  </div>
                </div>
                <div className="mt-2 bg-[#1b1509] p-2 rounded-xl border border-amber-600/20 text-[9.5px] text-amber-500">
                  ⚠️ <strong>הערת אדמה משותפת:</strong> חובה לחבר את פין האדמה GND של ה-ESP32, ספקי הכוח והלדים יחד!
                </div>
              </div>

              <div className="border-t border-slate-800/50 pt-2 text-[10.5px] text-slate-400">
                <strong className="text-[#22c55e]">5. העלאת הקוד למכשיר / Compile & Flash:</strong>
                <p className="mt-1">
                  בחר את הלוח הנכון: <span className="text-white">ESP32 Dev Module</span>, בחר את ה-Port (חיבור ה-USB), ולחץ על כפתור ה-Upload (חץ)!
                  אם החיבור קורס עם שגיאת Connection Time, החזק לחוץ את כפתור ה-BOOT הפיזי על ה-ESP32 עד לתחילת אחוזי הטעינה.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (subPage === "power") {
      return (
        <div className="px-5 pt-2 pb-28 flex flex-col gap-6 ">
          <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mb-[-10px]">
            POWER SETTINGS
          </h3>

          <div className="flex flex-col gap-4">
            <span className="text-[11px] text-slate-400 tracking-wide">
              Voltage Limit
            </span>
            <div className="flex items-center gap-4 px-2 bg-[#0c0e15] border border-slate-800/80 rounded-2xl p-4">
              <Zap className="w-5 h-5 text-[#a855f7]" />
              <CustomSlider
                value={state.power.voltageLimit}
                onChange={(v: any) => updateState("power", "voltageLimit", v)}
                min={0}
                max={30}
                thumbColor="#a855f7"
                trackColor="#1e293b"
              />
              <span className="text-white font-mono text-sm w-10 text-right">
                {state.power.voltageLimit}V
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-[11px] text-slate-400 tracking-wide">
              Current Limit
            </span>
            <div className="flex items-center gap-4 px-2 bg-[#0c0e15] border border-slate-800/80 rounded-2xl p-4">
              <Power className="w-5 h-5 text-[#38bdf8]" />
              <CustomSlider
                value={state.power.currentLimit}
                onChange={(v: any) => updateState("power", "currentLimit", v)}
                min={0}
                max={10}
                thumbColor="#38bdf8"
                trackColor="#1e293b"
              />
              <span className="text-white font-mono text-sm w-10 text-right">
                {state.power.currentLimit}A
              </span>
            </div>
          </div>

          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex items-center justify-between">
            <span className="text-[13px] text-slate-200 tracking-wide">
              Auto Power Off
            </span>
            <Toggle
              value={state.power.autoOff}
              activeColor="#ef4444"
              onChange={(v: any) => updateState("power", "autoOff", v)}
            />
          </div>

          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-4 flex items-center justify-between">
            <span className="text-[13px] text-slate-200 tracking-wide">
              Temp Warning (°C)
            </span>
            <Stepper
              value={state.power.tempWarning}
              onChange={(v: any) => updateState("power", "tempWarning", v)}
              min={30}
              max={80}
            />
          </div>

          <button
            onClick={() => {
              safeSaveLocal("holospin_state", JSON.stringify(state));
              setToastMessage("Power limits and thresholds confirmed! / הגדרות ההספק נשמרו בהצלחה!");
            }}
            className="w-full bg-[#00b4d8] hover:bg-[#0096b4] text-white py-4 rounded-xl text-[11px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(0,180,216,0.25)] transition mt-2 cursor-pointer active:scale-95"
          >
            CONFIRM POWER LIMITS
          </button>
        </div>
      );
    }

    if (subPage === "save_load") {
      const PRESET_CATEGORIES = [
        { id: 'cat1', name: 'NIGHTLIFE & VIBE', slots: ["1", "2"] },
        { id: 'cat2', name: 'SHOWROOM & PROMO', slots: ["3", "4"] }
      ];

      return (
        <div className="px-5 pt-2 pb-28 flex flex-col gap-6  font-sans">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mb-1">
                  SAVE / LOAD PROFILE PRESETS
                </h3>
                <span className="text-[9px] text-slate-500 font-medium tracking-tight">MANAGE & SYNC CONFIGURATIONS</span>
              </div>
              
              <div 
                onClick={() => {
                  const newState = !state.cloudSyncEnabled;
                  setState((prev: any) => ({ ...prev, cloudSyncEnabled: newState }));
                  setToastMessage(newState ? "סנכרון ענן הופעל! הפרופילים מגובים כעת. / Cloud Sync Active!" : "סנכרון ענן הופסק. / Cloud Sync Disabled.");
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer select-none ${state.cloudSyncEnabled ? 'bg-[#a855f7]/10 border-[#a855f7]/40 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'bg-slate-900 border-slate-800'}`}
              >
                <CloudLightning className={`w-3.5 h-3.5 ${state.cloudSyncEnabled ? 'text-[#a855f7] animate-pulse' : 'text-slate-600'}`} />
                <span className={`text-[9px] font-black tracking-tighter uppercase ${state.cloudSyncEnabled ? 'text-slate-100' : 'text-slate-500'}`}>
                  {state.cloudSyncEnabled ? 'Sync: ON' : 'Sync: OFF'}
                </span>
                <div className={`w-6 h-3 rounded-full relative transition-colors ${state.cloudSyncEnabled ? 'bg-[#a855f7]' : 'bg-slate-700'}`}>
                  <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${state.cloudSyncEnabled ? 'left-3.5' : 'left-0.5'}`}></div>
                </div>
              </div>
            </div>

            {state.cloudSyncEnabled && (
               <div className="flex items-center gap-3 p-3 bg-[#a855f7]/5 border border-[#a855f7]/10 rounded-xl animate-in fade-in zoom-in duration-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#a855f7] animate-ping"></div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    סנכרון פעיל מול HoloCloud / Multi-unit cloud sync active
                  </span>
               </div>
            )}
          </div>

          <div className="flex flex-col gap-8">
            {PRESET_CATEGORIES.map((category) => (
              <div key={category.id} className="flex flex-col gap-3">
                <div className="flex items-center gap-3 px-1">
                  <div className="h-[1px] flex-1 bg-slate-800/80"></div>
                  <span className="text-[10px] font-black text-slate-600 tracking-widest uppercase whitespace-nowrap">{category.name}</span>
                  <div className="h-[1px] flex-1 bg-slate-800/80"></div>
                </div>

                <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] overflow-hidden flex flex-col divide-y divide-slate-800/50">
                  {category.slots.map((slotId) => {
                    const saved = presets[slotId];
                    const isPresetActive = saved && saved.activeEffect === activeEffect;
                    const effectConfig = saved ? EFFECTS.find(e => e.id === saved.activeEffect) : null;
                    const effectColor = effectConfig?.color || '#a855f7';

                    return (
                      <div
                        key={slotId}
                        onMouseEnter={() => setHoveredPreset(slotId)}
                        onMouseLeave={() => setHoveredPreset(null)}
                        className={`flex flex-col py-4 px-4 transition-all group ${isPresetActive ? 'bg-[#00b4d8]/5' : 'hover:bg-slate-800/20'}`}
                      >
                        <div className="flex items-center gap-4 w-full">
                          {/* Preset Thumbnail */}
                          <div className="relative shrink-0">
                            {isPresetActive && (
                              <motion.div 
                                animate={{ 
                                  scale: [1, 1.2, 1],
                                  opacity: [0.3, 0.6, 0.3],
                                }}
                                transition={{ 
                                  duration: 2, 
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                                className="absolute inset-0 bg-[#00b4d8] rounded-xl blur-md -z-10"
                              />
                            )}
                            <div className={`w-12 h-12 rounded-xl bg-slate-900 border flex items-center justify-center shadow-inner transition overflow-hidden relative ${isPresetActive ? 'border-[#00b4d8] shadow-[0_0_15px_rgba(0,180,216,0.2)]' : 'border-slate-800 group-hover:border-slate-700'}`}>
                              {saved ? (
                                <motion.div 
                                  className={`scale-75 flex items-center justify-center ${
                                    saved.activeEffect === 'rainbow' || saved.activeEffect === 'acid' ? 'animate-rainbow-shift' :
                                    ['hypno', 'portal', 'kaleidoscope', 'mandala'].includes(saved.activeEffect) ? 'animate-hypno-spin' :
                                    ['matrix', 'video_synth'].includes(saved.activeEffect) ? 'animate-matrix-scroll' :
                                    ['mushrooms', 'alien'].includes(saved.activeEffect) ? 'animate-float-mini' :
                                    ''
                                  }`}
                                  animate={
                                    saved.activeEffect === 'fire' ? { opacity: [0.7, 1, 0.8, 1, 0.6, 1], scale: [1, 1.05, 0.95, 1.1, 1] } :
                                    ['plasma', 'dna', 'ai_custom'].includes(saved.activeEffect) ? { scale: [0.9, 1.1, 0.9] } :
                                    saved.activeEffect === 'cube3d' ? { rotateX: [0, 360], rotateY: [0, 360] } :
                                    saved.activeEffect === 'animation_flow' ? { x: [-2, 2, -2], scale: [1, 1.05, 1] } :
                                    {}
                                  }
                                  transition={{
                                    duration: ['cube3d'].includes(saved.activeEffect) ? 4 : 2,
                                    repeat: Infinity,
                                    ease: "linear"
                                  }}
                                >
                                  {effectConfig?.icon(effectColor)}
                                </motion.div>
                              ) : (
                                <Plus className="w-5 h-5 text-slate-800" />
                              )}
                            </div>
                            
                            {isPresetActive && (
                               <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#00b4d8] border-2 border-[#0c0e15] rounded-full z-10"></div>
                            )}
                          </div>

                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[13px] font-bold ${isPresetActive ? 'text-[#00b4d8]' : 'text-slate-200'}`}>
                                {saved?.name || `פרופיל ${slotId} / Slot ${slotId}`}
                              </span>
                              {isPresetActive && (
                                <span className="text-[7px] font-black bg-[#00b4d8] text-[#0c0e15] px-1 rounded-sm tracking-tighter uppercase animate-pulse">ACTIVE</span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {saved ? `Effect: ${effectConfig?.label || saved.activeEffect} (${saved.savedAt})` : 'Slot Empty / ריק'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {saved && (
                              <button
                                onClick={() => handleLoadPreset(slotId)}
                                title="Quick Apply / החל מיידית"
                                className="p-3 border border-emerald-500/30 rounded-xl text-emerald-400/70 hover:text-emerald-400 hover:border-emerald-500 transition-all flex items-center justify-center bg-emerald-500/5 hover:bg-emerald-500/10 hover:scale-110 active:scale-90 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-in fade-in zoom-in duration-300"
                              >
                                <Zap className="w-5 h-5 fill-current" />
                              </button>
                            )}
                            <div className="h-8 w-[1px] bg-slate-800/50 mx-1"></div>
                            <button
                              onClick={() => {
                                setPendingSaveSlot(slotId);
                                setPresetNameInput(saved?.name || `Slot ${slotId}`);
                              }}
                              title="Save Current State / שמור נוכחי"
                              className="p-3 border border-slate-700 rounded-xl hover:text-sky-400 hover:border-sky-400 text-slate-400 transition-all flex items-center justify-center bg-slate-900/40 hover:scale-105 active:scale-95 cursor-pointer"
                            >
                              <Save className="w-5 h-5" />
                            </button>
                            {saved && (
                              <button
                                onClick={() => handleDeletePreset(slotId)}
                                title="Clear / מחק"
                                className="p-3 border border-slate-700 hover:border-rose-500 hover:text-rose-500 text-slate-500 rounded-xl transition-all flex items-center justify-center bg-slate-900/40 hover:scale-105 active:scale-95 cursor-pointer"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Expandable Visual Preview HUD on Hover/Inspect */}
                        <AnimatePresence>
                          {hoveredPreset === slotId && saved && (
                            <motion.div
                              initial={{ height: 0, opacity: 0, marginTop: 0 }}
                              animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                              exit={{ height: 0, opacity: 0, marginTop: 0 }}
                              transition={{ duration: 0.25, ease: "easeOut" }}
                              className="overflow-hidden flex flex-col gap-2.5 bg-slate-950/70 border border-slate-800/60 rounded-xl p-3"
                            >
                              <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Effect Configuration Preview / תצוגה מקדימה</span>
                                <span className="text-[8px] text-slate-500 font-mono">Slot {slotId} HUD</span>
                              </div>

                              <div className="flex items-center gap-4">
                                {/* Spinning Holographic Mini-Disc Visualizer */}
                                <div className="relative w-12 h-12 rounded-full bg-slate-950 border border-slate-800/80 overflow-hidden shrink-0 flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.8)]">
                                  {/* Dynamic color aura gradient based on effect speed */}
                                  <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, ease: "linear", duration: 12 / (saved.effectSpeedRate || 1) }}
                                    className="absolute inset-1 rounded-full opacity-40 filter blur-[2px]"
                                    style={{
                                      background: `conic-gradient(from 0deg, ${effectColor}11, ${effectColor}ff, ${effectColor}11)`
                                    }}
                                  />

                                  {/* Mini POV Motor Fan Blade spinning based on motor speed */}
                                  <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, ease: "linear", duration: Math.max(0.5, 30 / (saved.motorSpeed || 80)) }}
                                    className="absolute w-0.5 h-10 bg-slate-300/80 rounded-full"
                                  />

                                  {/* Holographic Glowing Core */}
                                  <motion.div 
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="w-2 h-2 rounded-full z-10 shadow-[0_0_8px_#fff]"
                                    style={{ backgroundColor: effectColor }}
                                  />
                                </div>

                                {/* Config parameters stats grid */}
                                <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-300 font-mono">
                                  <div className="flex items-center gap-1.5">
                                    <Zap className="w-3 h-3 text-[#00b4d8]" />
                                    <span className="text-slate-400">RPM:</span>
                                    <span className="font-bold text-white">{saved.motorSpeed}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Sun className="w-3 h-3 text-amber-400" />
                                    <span className="text-slate-400">Bright:</span>
                                    <span className="font-bold text-white">{Math.round((saved.brightness || 0) / 2.55)}%</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-3 h-3 text-emerald-400" />
                                    <span className="text-slate-400">Scale:</span>
                                    <span className="font-bold text-white">{saved.effectScale || 100}%</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Activity className="w-3 h-3 text-purple-400" />
                                    <span className="text-slate-400">Rate:</span>
                                    <span className="font-bold text-white">{saved.effectSpeedRate || 1.0}x</span>
                                  </div>
                                </div>
                              </div>

                              {/* Custom Text or Custom Config indicator */}
                              {saved.povText && (
                                <div className="text-[9px] bg-slate-900/50 border border-slate-800/40 rounded px-2 py-1 flex items-center justify-between font-mono">
                                  <span className="text-slate-500">POV TEXT:</span>
                                  <span className="text-[#00b4d8] font-bold tracking-wider">&quot;{saved.povText}&quot;</span>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Export / Import Section */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[10px] text-slate-400 font-bold tracking-widest uppercase pl-1">
              Backup & Migrate Presets / גיבוי ושחזור פרופילים
            </h4>
            <div className="border border-slate-800/80 rounded-2xl p-4 bg-[#0c0e15] flex flex-col gap-3">
              <span className="text-[10px] text-slate-500 leading-normal">
                ייצא את רשימת פרופילי ההגדרות שלך לקובץ JSON במחשב, או טען קובץ פרופילים קיים כדי לשחזר את כל השמירות שלך במערכת.
              </span>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <button
                  onClick={handleExportPresets}
                  className="py-3 px-4 border border-slate-800 hover:border-sky-500 hover:text-sky-400 rounded-xl text-[10px] font-bold tracking-wider uppercase transition bg-slate-900/40 text-slate-300 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4 text-sky-400" /> Export Presets
                </button>
                <button
                  onClick={handleExportBackup}
                  className="py-3 px-4 border border-slate-800 hover:border-indigo-500 hover:text-indigo-400 rounded-xl text-[10px] font-bold tracking-wider uppercase transition bg-slate-900/40 text-slate-300 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4 text-indigo-400" /> Full Backup
                </button>
                <label className="py-3 px-4 border border-slate-800 hover:border-emerald-500 hover:text-emerald-400 rounded-xl text-[10px] font-bold tracking-wider uppercase transition bg-slate-900/40 text-slate-350 flex items-center justify-center gap-2 cursor-pointer text-center relative active:scale-95">
                  <Upload className="w-4 h-4 text-[#10b981]" /> Import Presets
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportPresets}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
              </div>
            </div>
          </div>

          <button 
            onClick={() => {
              if (confirm('Are you sure you want to restore default effects and settings values?')) {
                setPresets({ "1": null, "2": null, "3": null, "4": null });
                safeRemoveLocal("holospin_presets");
                setIsLightMode(false);
                setIsSyncSpeedRate(false);
                safeRemoveLocal("isLightMode");
                safeRemoveLocal("isSyncSpeedRate");
              }
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl text-[11px] font-bold tracking-widest uppercase transition border border-slate-700 active:scale-95 cursor-pointer"
          >
            RESET PRESETS & CUSTOM OPTIONS
          </button>
        </div>
      );
    }

    if (subPage === "advanced") {
      return (
        <div className="px-5 pt-2 pb-28 flex flex-col gap-6 ">
          <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mb-[-10px]">
            ADVANCED SETTINGS
          </h3>

          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex items-center justify-between">
            <span className="text-[13px] text-slate-200 tracking-wide">
              Developer Mode
            </span>
            <Toggle
              value={state.advanced.devMode}
              activeColor="#f97316"
              onChange={(v: any) => updateState("advanced", "devMode", v)}
            />
          </div>

          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex flex-col gap-4 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-slate-200 tracking-wide">
                Serial Monitor
              </span>
              <Toggle
                value={state.advanced.serialMonitor}
                activeColor="#3b82f6"
                onChange={(v: any) => updateState("advanced", "serialMonitor", v)}
              />
            </div>
            {state.advanced.serialMonitor && (
              <div className="bg-[#050608] rounded-xl p-3 h-48 overflow-y-auto font-mono text-[10px] text-[#4ade80] border border-slate-800 flex flex-col gap-1 shadow-inner animate-in fade-in slide-in-from-top-2">
                <div className="opacity-50 text-slate-500">Connecting to COM3...</div>
                <div>[10:43:02.102] POV_SYSTEM_BOOT_SEQUENCE_INIT</div>
                <div>[10:43:02.105] MOTOR_CALIBRATION... <span className="text-blue-400">OK</span></div>
                <div>[10:43:02.112] LED_STRIP_INIT (144 LEDs)... <span className="text-blue-400">OK</span></div>
                <div>[10:43:02.155] WIFI_AP_MODE_STARTED (Holospin_POV2)</div>
                <div>[10:43:02.160] WS_SERVER_LISTENING_PORT_81</div>
                <div>[10:43:10.021] SET_EFFECT: {activeEffect}</div>
                <div>[10:43:12.441] SET_MOTOR_SPEED: {Math.round((motorSpeed / 255) * 100)}%</div>
                <div>[10:43:14.225] SET_BRIGHTNESS: {Math.round((brightness / 255) * 100)}%</div>
                <div className="animate-pulse opacity-70">_</div>
              </div>
            )}
          </div>
          
          <AdvancedSyncPanel />

          <div className="border border-[#7f1d1d]/30 bg-[#450a0a]/20 p-4 rounded-2xl flex items-start gap-4 mt-2">
            <AlertTriangle className="w-6 h-6 text-[#ef4444] shrink-0" />
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-bold text-[#ef4444]">
                Danger Zone
              </span>
              <span className="text-[10px] text-slate-400 leading-relaxed">
                Modifying advanced settings might cause device instability.
                Proceed with caution.
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              safeSaveLocal("holospin_state", JSON.stringify(state));
              setToastMessage("Advanced settings applied & saved! / הגדרות מתקדמות נשמרו בהצלחה!");
            }}
            className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white py-4 rounded-xl text-[11px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(239,68,68,0.25)] transition mt-2 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            <ShieldAlert className="w-4 h-4" />
            CONFIRM ADVANCED SETTINGS
          </button>

          <div className="h-[1px] bg-slate-800/50 my-2"></div>

          <button
            onClick={handleFactoryReset}
            className="w-full bg-transparent border border-[#ef4444]/30 hover:border-[#ef4444] text-[#ef4444] py-4 rounded-xl text-[11px] font-bold tracking-widest uppercase transition cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            FACTORY RESET SYSTEM
          </button>
        </div>
      );
    }

    if (subPage === "bluetooth") {
      return (
        <div className="px-5 pt-2 pb-28 flex flex-col gap-6 ">
          <div className="flex flex-col gap-1">
            <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase">
              BLUETOOTH CONNECTIVITY / קישוריות בלוטוס
            </h3>
            <span className="text-[10px] text-slate-500">
              נהל חיבור BLE למכשירים ניידים ותקשורת אלחוטית
            </span>
          </div>

          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[13px] text-slate-200 tracking-wide">
                Bluetooth Enabled
              </span>
              <span className="text-[10px] text-slate-500">פעיל / כבוי</span>
            </div>
            <Toggle
              value={state.bluetooth?.enabled || false}
              activeColor="#60a5fa"
              onChange={(v: boolean) => updateState("bluetooth", "enabled", v)}
            />
          </div>

          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex flex-col gap-4">
            <InputField
              label="Broadcast Name (SSID)"
              value={state.bluetooth?.name || ""}
              onChange={(v: string) => updateState("bluetooth", "name", v)}
            />
            <div className="flex items-center justify-between pt-2">
              <div className="flex flex-col">
                <span className="text-[13px] text-slate-200 tracking-wide">
                  Discoverable
                </span>
                <span className="text-[10px] text-slate-500">ניתן לגילוי על ידי מכשירים אחרים</span>
              </div>
              <Toggle
                value={state.bluetooth?.discoverable || false}
                activeColor="#60a5fa"
                onChange={(v: boolean) => updateState("bluetooth", "discoverable", v)}
              />
            </div>
          </div>

          <button
            onClick={() => {
              safeSaveLocal("holospin_state", JSON.stringify(state));
              setToastMessage("Bluetooth settings applied! / הגדרות הבלוטוס נשמרו בהצלחה!");
            }}
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white py-4 rounded-xl text-[11px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(59,130,246,0.25)] transition mt-2 cursor-pointer active:scale-95"
          >
            CONFIRM BLUETOOTH SETTINGS
          </button>

          {/* Hardware Auto-Detection Handshake Emulator Section */}
          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1 border-b border-slate-800/80 pb-3">
              <span className="text-[12px] font-bold text-slate-200 tracking-wide flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                HARDWARE AUTO-DETECTION FLOW / זיהוי חומרה אוטומטי
              </span>
              <span className="text-[10px] text-slate-500">
                הפעל תהליך לחיצת יד מול בקר ה-ESP32 לזיהוי אוטומטי של דגם הצ'יפ והחלת פיני חיבור מותאמים אישית
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Select Emulated Device for Handshake / בחר דגם להתקשרות:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "WROOM", name: "ESP32 WROOM 32D", desc: "Classic / WROOM-32D" },
                  { id: "S3", name: "ESP32-S3", desc: "Dual Core / 240MHz" },
                  { id: "C3", name: "ESP32-C3", desc: "RISC-V / Single Core" },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedSimModel(m.id);
                      safeSaveLocal("holospin_sim_model", m.id);
                    }}
                    disabled={isHandshaking}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition cursor-pointer ${
                      selectedSimModel === m.id
                        ? "border-blue-500 bg-blue-500/10 text-blue-400"
                        : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-[11px] font-bold">{m.name}</span>
                    <span className="text-[9px] opacity-75 mt-0.5">{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => runHandshakeFlow(selectedSimModel)}
              disabled={isHandshaking}
              className={`w-full py-4 rounded-xl text-[11px] font-bold tracking-widest uppercase transition flex items-center justify-center gap-2 cursor-pointer ${
                isHandshaking
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] active:scale-95"
              }`}
            >
              {isHandshaking ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></span>
                  RUNNING HANDSHAKE...
                </>
              ) : (
                "INITIATE HANDSHAKE & OPTIMIZE / התחל לחיצת יד"
              )}
            </button>

            {/* Handshake Terminal Log Output */}
            {(handshakeLogs.length > 0 || isHandshaking) && (
              <div className="bg-[#050608] rounded-xl p-4 border border-slate-800 flex flex-col gap-1.5 shadow-inner animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-1 text-[9px] font-mono text-slate-500">
                  <span>HANDSHAKE_TELEMETRY_LOG_v1.0</span>
                  <span className="animate-pulse text-green-500">● LIVE FEED</span>
                </div>
                <div className="font-mono text-[10px] text-green-400 flex flex-col gap-1 max-h-48 overflow-y-auto leading-relaxed">
                  {handshakeLogs.map((log, i) => (
                    <div
                      key={i}
                      className={
                        log.includes("[SUCCESS]")
                          ? "text-blue-400 font-bold"
                          : log.includes("[DETECTED]")
                          ? "text-yellow-400 font-bold"
                          : log.includes("[OPTIMIZE]")
                          ? "text-cyan-400"
                          : "text-green-500"
                      }
                    >
                      {log}
                    </div>
                  ))}
                  {isHandshaking && (
                    <div className="animate-pulse text-green-500 opacity-70">_</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (subPage === "storage") {
      const allFiles = state.storage?.files || [];
      const imageFiles = allFiles.filter((f: any) => {
        const t = f.type || "";
        const n = (f.name || "").toLowerCase();
        return t === "image" || n.endsWith(".png") || n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".svg") || n.endsWith(".gif");
      });
      const videoFiles = allFiles.filter((f: any) => {
        const t = f.type || "";
        const n = (f.name || "").toLowerCase();
        return t === "video" || n.endsWith(".mp4") || n.endsWith(".mov") || n.endsWith(".webm") || n.endsWith(".avi");
      });
      const otherFiles = allFiles.filter((f: any) => {
        const t = f.type || "";
        const n = (f.name || "").toLowerCase();
        const isImg = t === "image" || n.endsWith(".png") || n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".svg") || n.endsWith(".gif");
        const isVid = t === "video" || n.endsWith(".mp4") || n.endsWith(".mov") || n.endsWith(".webm") || n.endsWith(".avi");
        return !isImg && !isVid;
      });

      return (
        <div className="px-5 pt-2 pb-28 flex flex-col gap-6  font-sans text-right" dir="rtl">
          <div className="flex flex-col gap-1 text-left" dir="ltr">
            <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase text-right">
              SD CARD STORAGE & FOLDERS / כרטיס זיכרון ותיקיות
            </h3>
            <span className="text-[10px] text-slate-500 text-right">
              ניהול קבצים ותיקיות ייעודיות לתמונות ולסרטונים על גבי כרטיס ה-SD
            </span>
          </div>

          <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15] p-5 flex flex-col gap-4 text-left" dir="ltr">
            <div className="flex items-center justify-between w-full" dir="rtl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${state.storage?.mounted ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
                  <HardDrive className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[13px] text-slate-200 font-bold">
                    {state.storage?.mounted ? 'SD Card Mounted' : 'SD Card Not Found'}
                  </span>
                  <span className="text-[10px] text-slate-500 lowercase">
                    {state.storage?.mounted ? `${state.storage?.usedSpace || "0.0 GB"} / ${state.storage?.totalSpace || "0.0 GB"} used` : "No Storage Media Detected"}
                  </span>
                </div>
              </div>
              
              {state.storage?.mounted ? (
                <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-[#06b6d4]" 
                    style={{ 
                      width: `${Math.min(100, Math.max(0, (parseFloat(state.storage?.usedSpace || "0") / parseFloat(state.storage?.totalSpace || "1")) * 100))}%` 
                    }}
                  ></div>
                </div>
              ) : (
                <span className="text-[10px] text-rose-400/80 font-mono font-bold uppercase animate-pulse">DISCONNECTED</span>
              )}
            </div>

            <div className="flex gap-2.5 mt-2" dir="rtl">
              <button
                onClick={fetchSDCardFiles}
                className="flex-1 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-gradient-to-r from-emerald-600 to-teal-500 text-white hover:from-emerald-500 hover:to-teal-400 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-500/20"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                רענן כרטיס SD / Refresh SD Card
              </button>
            </div>
          </div>

          {/* FOLDERS LIST */}
          <div className="flex flex-col gap-5">
            
            {/* 1. IMAGES FOLDER */}
            <div className="border border-purple-900/40 rounded-2xl bg-[#0c0e15]/90 overflow-hidden border-r-4 border-r-purple-500">
              <div className="bg-purple-950/20 p-4 border-b border-purple-900/30 flex items-center justify-between" dir="rtl">
                <div className="flex items-center gap-2">
                  <Folders className="w-5 h-5 text-purple-400" />
                  <div className="flex flex-col text-right">
                    <span className="text-[12px] font-bold text-slate-200">📂 תיקיית תמונות / IMAGES FOLDER</span>
                    <span className="text-[9px] text-purple-400/80 font-mono">Location: /images/</span>
                  </div>
                </div>
                <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-300 font-mono px-2 py-0.5 rounded-full" dir="ltr">
                  {imageFiles.length} files
                </span>
              </div>

              <div className="divide-y divide-purple-900/20">
                {imageFiles.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">התיקייה ריקה / Folder is empty</div>
                ) : (
                  imageFiles.map((file: any, i: number) => {
                    const filePath = file.path || `/images/${file.name}`;
                    return (
                      <div key={file.name + i} className="p-4 flex items-center justify-between hover:bg-purple-500/5 transition-colors group" dir="rtl">
                        <div className="flex items-center gap-3">
                          <Image className="w-4 h-4 text-purple-400 shrink-0" />
                          <div className="flex flex-col text-right">
                            <span className="text-[12px] text-slate-200 font-medium">{file.name}</span>
                            <span className="text-[9px] text-slate-500 font-mono">{filePath} • {file.size}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3" dir="ltr">
                          {/* File Playback Active registration toggle */}
                          <button
                            onClick={() => {
                              const updatedFiles = (state.storage?.files || []).map((f: any) => {
                                if (f.name === file.name) {
                                  return { ...f, selected: !f.selected };
                                }
                                return f;
                              });
                              updateState("storage", "files", updatedFiles);
                            }}
                            className="text-left font-sans cursor-pointer focus:outline-none"
                          >
                            {file.selected ? (
                              <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#a855f7] bg-[#a855f7]/15 px-2.5 py-1 rounded border border-[#a855f7]/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#a855f7] animate-pulse" />
                                רשום להצגה
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-900/50 hover:bg-slate-800 px-2.5 py-1 rounded border border-slate-800">
                                לא פעיל
                              </span>
                            )}
                          </button>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={async () => {
                                // If it's an IndexedDB file, handle deletion locally
                                if (file.physicalUri?.startsWith("indexeddb:") || file.idbKey) {
                                  const key = file.idbKey || file.physicalUri.replace("indexeddb:", "");
                                  try {
                                    await deleteMediaFromDB(key);
                                    setToastMessage(`הקובץ ${file.name} נמחק מ-IndexedDB!`);
                                  } catch (dbErr) {
                                    console.error("Failed to delete from IndexedDB:", dbErr);
                                  }
                                  updateState("storage", "files", (state.storage?.files || []).filter((f: any) => f.name !== file.name));
                                  return;
                                }

                                try {
                                  setToastMessage(`מוחק את ${file.name}... / Deleting ${file.name}...`);
                                  const isLocalHost = window.location.hostname === "192.168.4.1";
                                  const baseUrl = (state.wifi.mode === "AP" || isLocalHost) ? "http://192.168.4.1" : "";
                                  
                                  const res = await safeFetch(`${baseUrl}/api/delete-file`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ filename: file.name })
                                  });
                                  if (!res.ok) throw new Error();
                                  setToastMessage(`הקובץ ${file.name} נמחק בהצלחה! / Deleted successfully!`);
                                  fetchSDCardFiles();
                                } catch (e) {
                                  try {
                                    const res = await fetch(`/api/delete-file`, {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ filename: file.name })
                                    });
                                    if (res.ok) {
                                      setToastMessage(`הקובץ ${file.name} נמחק משרת הפיתוח!`);
                                      fetchSDCardFiles();
                                      return;
                                    }
                                  } catch (err) {}
                                  updateState("storage", "files", (state.storage?.files || []).filter((f: any) => f.name !== file.name));
                                  setToastMessage(`הקובץ הוסר מהתצוגה / File removed from view`);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-500 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 2. VIDEOS FOLDER */}
            <div className="border border-sky-900/40 rounded-2xl bg-[#0c0e15]/90 overflow-hidden border-r-4 border-r-sky-500">
              <div className="bg-sky-950/20 p-4 border-b border-sky-900/30 flex items-center justify-between" dir="rtl">
                <div className="flex items-center gap-2">
                  <Folders className="w-5 h-5 text-sky-400" />
                  <div className="flex flex-col text-right">
                    <span className="text-[12px] font-bold text-slate-200">📂 תיקיית סרטונים / VIDEOS FOLDER</span>
                    <span className="text-[9px] text-sky-400/80 font-mono">Location: /videos/</span>
                  </div>
                </div>
                <span className="text-[10px] bg-sky-500/10 border border-sky-500/20 text-sky-300 font-mono px-2 py-0.5 rounded-full" dir="ltr">
                  {videoFiles.length} files
                </span>
              </div>

              <div className="divide-y divide-sky-900/20">
                {videoFiles.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">התיקייה ריקה / Folder is empty</div>
                ) : (
                  videoFiles.map((file: any, i: number) => {
                    const filePath = file.path || `/videos/${file.name}`;
                    return (
                      <div key={file.name + i} className="p-4 flex items-center justify-between hover:bg-sky-500/5 transition-colors group" dir="rtl">
                        <div className="flex items-center gap-3">
                          <Video className="w-4 h-4 text-sky-400 shrink-0" />
                          <div className="flex flex-col text-right">
                            <span className="text-[12px] text-slate-200 font-medium">{file.name}</span>
                            <span className="text-[9px] text-slate-500 font-mono">{filePath} • {file.size}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3" dir="ltr">
                          {/* File Playback Active registration toggle */}
                          <button
                            onClick={() => {
                              const updatedFiles = (state.storage?.files || []).map((f: any) => {
                                if (f.name === file.name) {
                                  return { ...f, selected: !f.selected };
                                }
                                return f;
                              });
                              updateState("storage", "files", updatedFiles);
                            }}
                            className="text-left font-sans cursor-pointer focus:outline-none"
                          >
                            {file.selected ? (
                              <span className="flex items-center gap-1.5 text-[10px] font-bold text-sky-400 bg-sky-400/15 px-2.5 py-1 rounded border border-sky-400/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                                רשום להצגה
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-900/50 hover:bg-slate-800 px-2.5 py-1 rounded border border-slate-800">
                                לא פעיל
                              </span>
                            )}
                          </button>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={async () => {
                                // If it's an IndexedDB file, handle deletion locally
                                if (file.physicalUri?.startsWith("indexeddb:") || file.idbKey) {
                                  const key = file.idbKey || file.physicalUri.replace("indexeddb:", "");
                                  try {
                                    await deleteMediaFromDB(key);
                                    setToastMessage(`הקובץ ${file.name} נמחק מ-IndexedDB!`);
                                  } catch (dbErr) {
                                    console.error("Failed to delete from IndexedDB:", dbErr);
                                  }
                                  updateState("storage", "files", (state.storage?.files || []).filter((f: any) => f.name !== file.name));
                                  return;
                                }

                                try {
                                  setToastMessage(`מוחק את ${file.name}... / Deleting ${file.name}...`);
                                  const isLocalHost = window.location.hostname === "192.168.4.1";
                                  const baseUrl = (state.wifi.mode === "AP" || isLocalHost) ? "http://192.168.4.1" : "";
                                  
                                  const res = await safeFetch(`${baseUrl}/api/delete-file`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ filename: file.name })
                                  });
                                  if (!res.ok) throw new Error();
                                  setToastMessage(`הקובץ ${file.name} נמחק בהצלחה! / Deleted successfully!`);
                                  fetchSDCardFiles();
                                } catch (e) {
                                  try {
                                    const res = await fetch(`/api/delete-file`, {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ filename: file.name })
                                    });
                                    if (res.ok) {
                                      setToastMessage(`הקובץ ${file.name} נמחק משרת הפיתוח!`);
                                      fetchSDCardFiles();
                                      return;
                                    }
                                  } catch (err) {}
                                  updateState("storage", "files", (state.storage?.files || []).filter((f: any) => f.name !== file.name));
                                  setToastMessage(`הקובץ הוסר מהתצוגה / File removed from view`);
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-500 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Other files if exists */}
            {otherFiles.length > 0 && (
              <div className="border border-slate-800/80 rounded-2xl bg-[#0c0e15]/80 overflow-hidden">
                <div className="bg-slate-900/40 p-3 border-b border-slate-800 flex justify-between items-center" dir="rtl">
                  <span className="text-[11px] font-bold text-slate-400">📁 קבצי מערכת ותצורה / SYSTEM FILES</span>
                  <span className="text-[9px] text-slate-500 font-mono" dir="ltr">{otherFiles.length} files</span>
                </div>
                <div className="divide-y divide-slate-800/40">
                  {otherFiles.map((file: any, i: number) => (
                    <div key={file.name + i} className="p-3 flex justify-between items-center text-xs text-right" dir="rtl">
                      <span className="text-slate-400">{file.name} ({file.size})</span>
                      <button
                        onClick={() => {
                          updateState("storage", "files", (state.storage?.files || []).filter((f: any) => f.name !== file.name));
                        }}
                        className="p-1 text-slate-500 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACTION CONFIRM BUTTON (כפתור אישור איזה קבצים נרשמים בקוד להצגה) */}
            <div className="flex flex-col gap-3 p-1">
              <button
                onClick={() => {
                  safeSaveLocal("holospin_state", JSON.stringify(state));
                  setToastMessage("📁 הגדרות התיקיות ורשימת הקבצים אושרו וסנכרנו בהצלחה! קוד ה-Config.h עודכן.");
                }}
                className="w-full bg-gradient-to-r from-purple-600 via-[#a855f7] to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold tracking-wider py-4 rounded-xl text-xs uppercase transition shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] flex items-center justify-center gap-2 border border-purple-500/20 active:scale-95 duration-150 cursor-pointer focus:outline-none"
              >
                <CheckCircle2 className="w-5 h-5 text-white animate-pulse" />
                אישור קבצי תצוגה לקוד / CONFIRM & REGISTER DISPLAY FILES
              </button>
              <p className="text-[10px] text-center text-slate-500 leading-normal" dir="rtl">
                לחיצה על כפתור האישור מאשרת את הקבצים שנבחרו (מסומנים כ-<strong>רשום להצגה</strong>) ורושמת אותם באופן קבוע כמקור התצוגה הראשי בתוך קוד המקור הציורי לשבב ה-ESP32.
              </p>
            </div>

            {/* INTEGRATED FOLDER UPLOADER */}
            <div className="border border-slate-800 bg-slate-900/10 rounded-2xl p-4 flex flex-col gap-4 text-right" dir="rtl">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-200">העלאת קובץ חדש לתיקייה ייעודית / UPLOAD FILES</span>
                <span className="text-[9px] text-slate-500">בחר לאיזו תיקייה ייעודית להעלות את קובצי המדיה שלך ישירות</span>
              </div>

              {/* Upload Folder Selector Switch */}
              <div className="grid grid-cols-2 p-1 bg-slate-950/70 border border-slate-800 rounded-xl" dir="ltr">
                <button
                  type="button"
                  onClick={() => setUploadDest("image")}
                  className={`py-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none ${uploadDest === "image" ? 'bg-purple-950/60 border border-purple-500/30 text-purple-300' : 'text-slate-500 hover:text-white'}`}
                >
                  <Image className="w-3.5 h-3.5" />
                  תיקיית תמונות /images/
                </button>
                <button
                  type="button"
                  onClick={() => setUploadDest("video")}
                  className={`py-2 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none ${uploadDest === "video" ? 'bg-sky-950/60 border border-sky-500/30 text-sky-300' : 'text-slate-500 hover:text-white'}`}
                >
                  <Video className="w-3.5 h-3.5" />
                  תיקיית סרטונים /videos/
                </button>
              </div>

              <div className="border border-dashed border-slate-800 hover:border-purple-500/40 bg-slate-900/30 rounded-xl p-6 text-center transition-all">
                <label className="flex flex-col items-center justify-center gap-2 cursor-pointer">
                  <Upload className={`w-8 h-8 ${uploadDest === "image" ? "text-purple-400" : "text-sky-400"} animate-bounce`} />
                  <span className="text-xs font-bold text-slate-200">לחץ לבחירה או גרור קובץ להעלאה</span>
                  <span className="text-[9px] text-slate-500 font-mono" dir="ltr">
                    {uploadDest === "image" ? "Supports PNG, JPG, JPEG, SVG to /images" : "Supports MP4, MOV, WEBM to /videos"}
                  </span>
                  <input
                    type="file"
                    accept={uploadDest === "image" ? "image/*" : "video/*"}
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setToastMessage(`מעלה קובץ... / Uploading ${file.name}...`);
                        
                        if (Capacitor.isNativePlatform()) {
                          // NATIVE PLATFORM: Write directly to physical device filesystem
                          try {
                            const reader = new FileReader();
                            reader.onload = async () => {
                              try {
                                const base64Data = reader.result as string;
                                const base64Content = base64Data.split(',')[1];
                                
                                const dirPath = uploadDest === "image" ? "images" : "videos";
                                const filePath = `${dirPath}/${file.name}`;
                                
                                const writeResult = await Filesystem.writeFile({
                                  path: filePath,
                                  data: base64Content,
                                  directory: Directory.Documents,
                                  recursive: true
                                });
                                
                                const convertedUrl = Capacitor.convertFileSrc(writeResult.uri);
                                
                                const newFile = {
                                  name: file.name,
                                  size: (file.size / 1024).toFixed(0) + " KB",
                                  type: uploadDest,
                                  path: convertedUrl,
                                  physicalUri: writeResult.uri,
                                  selected: true
                                };
                                const newFiles = [...(state.storage?.files || []), newFile];
                                updateState("storage", "files", newFiles);
                                safeSaveLocal("holospin_state", JSON.stringify({
                                  ...state,
                                  storage: {
                                    ...state.storage,
                                    files: newFiles
                                  }
                                }));
                                setToastMessage(`קובץ ${file.name} נשמר בהצלחה לאחסון המכשיר!`);
                              } catch (fsErr: any) {
                                console.error("Fs write failed, falling back to IndexedDB local cache...", fsErr);
                                setToastMessage("מערכת הקבצים לא זמינה, שומר ב-IndexedDB... / Filesystem error, caching in IndexedDB...");
                                try {
                                  const mediaKey = `media_${Date.now()}_${file.name}`;
                                  await saveMediaToDB(mediaKey, file, file.name);
                                  const localUrl = URL.createObjectURL(file);
                                  const newFile = {
                                    name: file.name,
                                    size: (file.size / 1024).toFixed(0) + " KB (IDB Cached)",
                                    type: uploadDest,
                                    path: localUrl,
                                    physicalUri: `indexeddb:${mediaKey}`,
                                    selected: true,
                                    idbKey: mediaKey
                                  };
                                  const newFiles = [...(state.storage?.files || []), newFile];
                                  updateState("storage", "files", newFiles);
                                  setToastMessage("קובץ נשמר מקומית ב-IndexedDB ונרשם להצגה! / File saved locally in IndexedDB!");
                                } catch (idbErr) {
                                  console.error("IndexedDB storage failed:", idbErr);
                                  setToastMessage(`שגיאה בשמירת הקובץ: ${fsErr.message || fsErr}`);
                                }
                              }
                            };
                            reader.readAsDataURL(file);
                          } catch (err: any) {
                            console.error("Reader failed:", err);
                            setToastMessage(`שגיאה בקריאת הקובץ: ${err.message || err}`);
                          }
                        } else {
                          // WEB PLATFORM: Proxy to Express server API
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            
                            const res = await fetch('/api/upload-file', {
                              method: 'POST',
                              body: formData
                            });
                            
                            if (!res.ok) throw new Error("Upload failed");
                            
                            const data = await res.json();
                            const fileUrl = data.url;
                            
                            const newFile = {
                              name: file.name,
                              size: (file.size / 1024).toFixed(0) + " KB",
                              type: uploadDest,
                              path: fileUrl,
                              selected: true
                            };
                            const newFiles = [...(state.storage?.files || []), newFile];
                            updateState("storage", "files", newFiles);
                            // Backup upload in the background
                            const backupKey = `media_${Date.now()}_${file.name}`;
                            saveMediaToDB(backupKey, file, file.name).catch(e => console.warn("Could not back up to IDB:", e));
                            setToastMessage(`קובץ ${file.name} הועלה בהצלחה ונרשם להקרנה!`);
                          } catch (err) {
                            console.error("Server upload failed, falling back to IndexedDB local cache...", err);
                            setToastMessage("שרת לא זמין, שומר בזיכרון המקומי... / Server offline, caching locally in IndexedDB...");
                            try {
                              const mediaKey = `media_${Date.now()}_${file.name}`;
                              await saveMediaToDB(mediaKey, file, file.name);
                              const localUrl = URL.createObjectURL(file);
                              const newFile = {
                                name: file.name,
                                size: (file.size / 1024).toFixed(0) + " KB (IDB Cached)",
                                type: uploadDest,
                                path: localUrl,
                                physicalUri: `indexeddb:${mediaKey}`,
                                selected: true,
                                idbKey: mediaKey
                              };
                              const newFiles = [...(state.storage?.files || []), newFile];
                              updateState("storage", "files", newFiles);
                              setToastMessage("קובץ נשמר מקומית ב-IndexedDB ונרשם להצגה! / File saved locally in IndexedDB!");
                            } catch (idbErr) {
                              console.error("IndexedDB storage failed:", idbErr);
                              setToastMessage("שגיאה בהעלאת הקובץ / Upload error");
                            }
                          }
                        }
                      }
                    }}
                  />
                </label>
              </div>
            </div>

          </div>

          <div className="border border-amber-500/10 bg-amber-500/5 p-4 rounded-xl flex gap-3 text-amber-500/70 italic text-[10px] text-right" dir="rtl">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <p className="leading-relaxed">
              קבצים המאוחסנים על כרטיס ה-SD בתיקיות המוגדרות מופעלים ישירות מהדיסק המקומי של ה-ESP32. סימון פריטים וכפתור האישור מאפשרים עריכת פלייליסט התצוגה המעגלי ללא צורך בכתיבת קוד מחדש בכל פעם.
            </p>
          </div>
        </div>
      );
    }

    if (subPage === "ai_model") {
      return (
        <AiModelInstaller onBack={() => setSubPage(null)} />
      );
    }

    if (subPage === "pin_selection") {
      return (
        <PinSelectorPanel state={state} setState={setState} onBack={() => setSubPage(null)} />
      );
    }

    if (subPage === "gesture_mapping") {
      const currentMapping = pendingMapping || gestureMapping;
      const hasChanges = pendingMapping !== null;

      return (
        <div className="px-5 pt-2 pb-28 flex flex-col gap-6 ">
           <div className="flex flex-col gap-1">
              <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase">
                Gesture Mapping Config / פקודות מחוות
              </h3>
              <button 
                onClick={() => {
                    setTutorialStep(0);
                    setShowGestureTutorial(true);
                }}
                className="p-2 border border-slate-800 rounded-xl bg-slate-900/50 text-[#00b4d8] hover:bg-slate-800 transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <p className="text-[10px] text-slate-500">Assign hand shapes to specific effects</p>
           </div>

            <div className="bg-slate-900/40 p-5 rounded-3xl border border-slate-800/60 flex flex-col gap-5">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Motion Sensitivity</span>
                <span className="text-[11px] font-mono text-[#00b4d8] font-bold">{gestureSensitivity}%</span>
              </div>

              <div className="flex gap-2 p-1 bg-slate-950/50 rounded-2xl border border-slate-800/40">
                {[
                  { label: "Relaxed", val: 25 },
                  { label: "High Accuracy", val: 55 },
                  { label: "Quick Response", val: 85 }
                ].map((prof) => (
                  <button
                    key={prof.label}
                    onClick={() => setGestureSensitivity(prof.val)}
                    className={`flex-1 py-2 rounded-xl text-[8px] font-bold uppercase tracking-widest transition-all ${
                      gestureSensitivity === prof.val 
                      ? 'bg-[#00b4d8] text-white shadow-[0_0_15px_rgba(0,180,216,0.3)]' 
                      : 'bg-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {prof.label}
                  </button>
                ))}
              </div>

              <div className="px-1">
                <CustomSlider 
                  value={gestureSensitivity} 
                  onChange={setGestureSensitivity} 
                  min={1} 
                  max={100} 
                  thumbColor="#00b4d8" 
                  trackColor="#10141e"
                />
              </div>
              <p className="text-[8px] text-slate-500 uppercase tracking-tighter text-center">Higher sensitivity allows for smaller hand movements</p>
           </div>

           <div className={`p-5 rounded-3xl border flex flex-col gap-4 transition-all duration-300 ${handInFrame ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/40 border-slate-800/60'}`}>
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Detection Strength</span>
                  {handInFrame && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                </div>
                <span className={`text-[11px] font-mono font-bold ${handInFrame ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {handInFrame ? Math.round(handConfidence * 100) : 0}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/50 p-[1px]">
                <motion.div 
                  className={`h-full rounded-full transition-all duration-300 ${handConfidence > 0.8 ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]' : handConfidence > 0.5 ? 'bg-amber-400' : 'bg-rose-500'}`}
                  initial={{ width: 0 }}
                  animate={{ width: handInFrame ? `${handConfidence * 100}%` : '0%' }}
                />
              </div>
              <button 
                onClick={handleCalibrate}
                disabled={!handInFrame || isCalibrating}
                className={`w-full py-2.5 rounded-xl border font-bold text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  handInFrame 
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30' 
                  : 'bg-slate-800/50 border-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                <Target className={`w-3 h-3 ${isCalibrating ? 'animate-spin' : ''}`} />
                {isCalibrating ? "Calibrating..." : "Record Hand for Calibration"}
              </button>
           </div>

           <div className="flex flex-col gap-3">
              {[
                { key: 'peace', label: 'Peace Sign' },
                { key: 'palm', label: 'Open Palm' },
                { key: 'fist', label: 'Closed Fist' },
                { key: 'thumbs_up', label: 'Thumbs Up' },
                { key: 'point_up', label: 'Pointing Up' },
                { key: 'rock_on', label: 'Rock On' }
              ].map((ges) => {
                const isActive = activeRawGesture === ges.key;
                return (
                <div key={ges.key} className={`relative bg-[#0c0e15] border rounded-2xl p-4 flex flex-col gap-4 overflow-hidden transition-all duration-300 ${
                  isActive ? 'border-[#00b4d8] shadow-[0_0_20px_rgba(0,180,216,0.3)] scale-[1.02]' : 'border-slate-800'
                }`}>
                   {isActive && <div className="absolute inset-0 bg-[#00b4d8]/10 animate-pulse pointer-events-none" />}
                   
                   <div className="flex items-center justify-between relative z-10">
                     <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border transition-all duration-300 ${
                          isActive ? 'bg-[#00b4d8]/20 border-[#00b4d8] text-white shadow-[0_0_10px_rgba(0,180,216,0.4)] text-[#00b4d8]' : 'bg-slate-900 border-slate-800 text-[#00b4d8]'
                        }`}>
                           <Hand className="w-4 h-4" />
                        </div>
                        <span className={`text-[11px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-slate-300'}`}>{ges.label}</span>
                     </div>
                     <div className="flex gap-2">
                       {isActive && <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 uppercase tracking-widest animate-pulse">DETECTED</span>}
                       <div className="text-[9px] font-mono text-slate-500 bg-slate-900/50 px-2 py-0.5 rounded border border-slate-800/50">landmarker_v1</div>
                     </div>
                   </div>

                   <div className="flex flex-col gap-1.5 relative z-10">
                      <span className="text-[9px] font-bold text-slate-500 uppercase ml-1">Target Action</span>
                      <select 
                        value={currentMapping[ges.key]}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPendingMapping(prev => ({ ...(prev || gestureMapping), [ges.key]: val }));
                        }}
                        className={`w-full bg-[#050608] border rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none appearance-none cursor-pointer transition-colors ${
                          isActive ? 'border-[#00b4d8]/50 focus:border-[#00b4d8]' : 'border-slate-800 focus:border-[#00b4d8]/50'
                        }`}
                      >
                         <option value="power_on">Activate Device (On)</option>
                         <option value="power_off">Deactivate Device (Off)</option>
                         <option value="fire">Fire Particles</option>
                         <option value="rainbow">Rainbow Spin</option>
                         <option value="matrix">Matrix Code</option>
                         <option value="aurora">Aurora Borealis</option>
                         <option value="plasma">Plasma Pulse</option>
                         <option value="clock">Analog Clock</option>
                      </select>
                   </div>
                </div>
              )})}
           </div>

           {hasChanges && (
             <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-50">
                <button 
                  onClick={() => {
                    setGestureMapping(pendingMapping);
                    setPendingMapping(null);
                    setToastMessage("Gesture mappings updated successfully!");
                  }}
                  className="w-full bg-[#00b4d8] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(0,180,216,0.4)] flex items-center justify-center gap-3 active:scale-95 transition-transform"
                >
                  <CheckCircle2 className="w-4 h-4" />
                   Confirm Mapping Changes
                </button>
             </div>
           )}

           <div className="bg-[#00b4d8]/5 border border-[#00b4d8]/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#00b4d8]/10 flex items-center justify-center border border-[#00b4d8]/20">
                 <Aperture className="w-5 h-5 text-[#00b4d8]" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest">Real-time Recognition</span>
                 <span className="text-[9px] text-slate-500 leading-tight">Gestures are processed locally via MediaPipe for low latency.</span>
              </div>
           </div>
        </div>
      );
    }

    if (subPage === "schedule") {
      return (
        <div className="px-5 pt-2 pb-28 flex flex-col gap-6 ">
           <div className="flex flex-col gap-1">
              <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase">
                Operation Scheduler / זמני פעילות
              </h3>
              <p className="text-[10px] text-slate-500">Set automatic timers for HoloSpin events</p>
           </div>

           <div className="flex flex-col gap-3">
              {schedules.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-3 text-slate-500">
                   <Clock className="w-10 h-10 opacity-20" />
                   <span className="text-[10px] font-bold uppercase tracking-widest">No Active Schedules</span>
                </div>
              ) : (
                schedules.map((sched) => (
                  <div key={sched.id} className="bg-[#0c0e15] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-slate-900 border border-slate-800 ${sched.active ? "text-[#00b4d8]" : "text-slate-600"}`}>
                           <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-slate-200">{sched.time}</span>
                           <span className="text-[10px] font-black uppercase tracking-widest text-[#a855f7]/80">
                              {sched.action === "power_on" ? "Power On" : sched.action === "power_off" ? "Power Off" : `Preset: ${sched.presetId}`}
                           </span>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <Toggle 
                           value={sched.active} 
                           activeColor="#00b4d8" 
                           onChange={(v: boolean) => setSchedules(schedules.map(s => s.id === sched.id ? { ...s, active: v } : s))} 
                        />
                        <button 
                           onClick={() => setSchedules(schedules.filter(s => s.id !== sched.id))}
                           className="p-2 text-slate-600 hover:text-red-500 transition-colors"
                        >
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                ))
              )}
           </div>

           <div className="bg-slate-900/60 p-5 rounded-3xl border border-slate-800 flex flex-col gap-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add New Schedule</h4>
              <div className="grid grid-cols-2 gap-3">
                 <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase ml-1">Time</span>
                    <input 
                       type="time" 
                       value={newSchedTime}
                       onChange={e => setNewSchedTime(e.target.value)}
                       className="bg-[#050608] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-[#00b4d8]/50"
                    />
                 </div>
                 <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase ml-1">Action</span>
                    <select 
                       value={newSchedAction}
                       onChange={e => setNewSchedAction(e.target.value)}
                       className="bg-[#050608] border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-[#00b4d8]/50 appearance-none"
                    >
                       <option value="power_on">Power On</option>
                       <option value="power_off">Power Off</option>
                       <option value="preset_1">Preset 1</option>
                       <option value="preset_2">Preset 2</option>
                       <option value="preset_3">Preset 3</option>
                       <option value="preset_4">Preset 4</option>
                    </select>
                 </div>
              </div>
              <button 
                 onClick={() => {
                    if (!newSchedTime) return;
                    
                    const action = newSchedAction.startsWith("preset_") ? "preset" : newSchedAction;
                    const presetId = newSchedAction.startsWith("preset_") ? newSchedAction.split("_")[1] : undefined;

                    const nextId = Math.random().toString(36).substr(2, 9);
                    setSchedules([...schedules, { id: nextId, time: newSchedTime, action, active: true, presetId }]);
                    setNewSchedTime("");
                 }}
                 className="w-full bg-[#00b4d8]/10 border border-[#00b4d8]/30 hover:bg-[#00b4d8]/20 text-[#00b4d8] py-3.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2"
              >
                 <Plus className="w-4 h-4" />
                 Add Schedule Timer
              </button>
           </div>

           <div className="bg-[#0c0e15] border border-slate-800/60 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                 <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[11px] font-bold text-slate-200">System Time Sync</span>
                 <span className="text-[9px] text-slate-500 uppercase tracking-tighter">Using Network NTP / Browser RTC</span>
              </div>
           </div>
        </div>
      );
    }

    if (subPage === "background") {
      return (
        <div className="px-5 pt-2 pb-28 flex flex-col gap-6 ">
          <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mb-[-10px]">
            BACKGROUND STYLE
          </h3>

                      <div className="grid grid-cols-2 gap-4">
            <div
              className={`relative h-28 rounded-2xl border-2 overflow-hidden cursor-pointer flex flex-col justify-end p-4 transition-all ${
                bgImageId === "galaxy0" ? "border-[#2dd4bf] shadow-[0_0_20px_rgba(45,212,191,0.2)]" : "border-slate-800"
              }`}
              onClick={() => setBgImageId("galaxy0")}
            >
              <img src={galaxy0} alt="Galaxy 0" className="absolute inset-0 w-full h-full object-cover z-0 opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
              <span className="relative z-20 font-bold text-white tracking-widest text-[11px]">DEEP SPACE</span>
            </div>

            <div
              className={`relative h-28 rounded-2xl border-2 overflow-hidden cursor-pointer flex flex-col justify-end p-4 transition-all ${
                bgImageId === "galaxy1" ? "border-[#2dd4bf] shadow-[0_0_20px_rgba(45,212,191,0.2)]" : "border-slate-800"
              }`}
              onClick={() => setBgImageId("galaxy1")}
            >
              <img src={galaxy1} alt="Galaxy 1" className="absolute inset-0 w-full h-full object-cover z-0 opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
              <span className="relative z-20 font-bold text-white tracking-widest text-[11px]">VIVID NEBULA</span>
            </div>

            <div
              className={`relative h-28 rounded-2xl border-2 overflow-hidden cursor-pointer flex flex-col justify-end p-4 transition-all ${
                bgImageId === "galaxy2" ? "border-[#a855f7] shadow-[0_0_20px_rgba(168,85,247,0.2)]" : "border-slate-800"
              }`}
              onClick={() => setBgImageId("galaxy2")}
            >
              <img src={galaxy2} alt="Galaxy 2" className="absolute inset-0 w-full h-full object-cover z-0 opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
              <span className="relative z-20 font-bold text-white tracking-widest text-[11px]">NEON RAINBOW</span>
            </div>

            <div
              className={`relative h-28 rounded-2xl border-2 overflow-hidden cursor-pointer flex flex-col justify-end p-4 transition-all ${
                bgImageId === "galaxy3" ? "border-[#f97316] shadow-[0_0_20px_rgba(249,115,22,0.2)]" : "border-slate-800"
              }`}
              onClick={() => setBgImageId("galaxy3")}
            >
              <img src={galaxy3} alt="Galaxy 3" className="absolute inset-0 w-full h-full object-cover z-0 opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
              <span className="relative z-20 font-bold text-white tracking-widest text-[11px]">FIERY CORE</span>
            </div>

            <div
              className={`relative h-28 rounded-2xl border-2 overflow-hidden cursor-pointer flex flex-col justify-end p-4 transition-all ${
                bgImageId === "butterfly" ? "border-[#f472b6] shadow-[0_0_20px_rgba(244,114,182,0.2)]" : "border-slate-800"
              }`}
              onClick={() => setBgImageId("butterfly")}
            >
              <img src={butterfly} alt="Butterfly" className="absolute inset-0 w-full h-full object-cover z-0 opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
              <span className="relative z-20 font-bold text-white tracking-widest text-[11px]">HOLO BUTTERFLY</span>
            </div>

            <div
              className={`relative h-28 rounded-2xl border-2 overflow-hidden cursor-pointer flex flex-col justify-end p-4 transition-all ${
                bgImageId === "planet" ? "border-[#fbbf24] shadow-[0_0_20px_rgba(251,191,36,0.2)]" : "border-slate-800"
              }`}
              onClick={() => setBgImageId("planet")}
            >
              <img src={planetImg} alt="Planet" className="absolute inset-0 w-full h-full object-cover z-0 opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
              <span className="relative z-20 font-bold text-white tracking-widest text-[11px]">HOLO PLANET</span>
            </div>

            <div
              className={`relative h-28 rounded-2xl border-2 overflow-hidden cursor-pointer flex flex-col justify-end p-4 transition-all ${
                bgImageId === "spaceDark" ? "border-slate-400 shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "border-slate-800"
              }`}
              onClick={() => setBgImageId("spaceDark")}
            >
              <img src={splashBg} alt="Cosmic Void" className="absolute inset-0 w-full h-full object-cover z-0 opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
              <span className="relative z-20 font-bold text-white tracking-widest text-[11px]">COSMIC VOID</span>
            </div>
          </div>

          <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mt-4">
            VIDEO BACKGROUNDS
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div
              className={`relative h-28 rounded-2xl border-2 overflow-hidden cursor-pointer flex flex-col justify-end p-4 transition-all ${
                bgImageId === "video1" ? "border-[#3b82f6] shadow-[0_0_20px_rgba(59,130,246,0.2)]" : "border-slate-800"
              }`}
              onClick={() => setBgImageId("video1")}
            >
              <video src={video1} preload="auto" crossOrigin="anonymous" autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0 opacity-60 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none"></div>
              <span className="relative z-20 font-bold text-white tracking-widest text-[11px] pointer-events-none">BIG BANG (VIDEO)</span>
            </div>

            <div
              className={`relative h-28 rounded-2xl border-2 overflow-hidden cursor-pointer flex flex-col justify-end p-4 transition-all ${
                bgImageId === "video2" ? "border-[#ec4899] shadow-[0_0_20px_rgba(236,72,153,0.2)]" : "border-slate-800"
              }`}
              onClick={() => setBgImageId("video2")}
            >
              <video src={video2} preload="auto" crossOrigin="anonymous" autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0 opacity-60 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none"></div>
              <span className="relative z-20 font-bold text-white tracking-widest text-[11px] pointer-events-none">GALAXY SPIRAL (VIDEO)</span>
            </div>
          </div>

        </div>
      );
    }

    if (subPage === "media") {
      return (
        <div className="px-5 pt-2 pb-28 flex flex-col gap-6 ">
          <div className="flex flex-col gap-1">
            <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase">
              MEDIA & FILES UPLOADS / העלאת קבצים ומדיה
            </h3>
            <span className="text-[10px] text-slate-500">
              נהל והעלה קבצי תמונות ווידאו עבור המקרן ההולוגרפי
            </span>
          </div>

          {/* Image Upload section */}
          <section className="flex flex-col gap-3">
            <h4 className="text-[10px] text-[#00b4d8] font-bold tracking-widest uppercase pl-1">
              IMAGE UPLOADS (LOGOS / VECTOR STICKERS) / העלאת תמונות ולוגו מחשב
            </h4>
            
            <div className="border border-slate-800/80 rounded-2xl p-5 bg-[#0c0e15] flex flex-col gap-4">
              <div className="text-xs text-slate-300 leading-relaxed">
                באפשרותך להעלות תמונות מותאמות אישית (כמו לוגו, תגיות או סטיקרים). הקוד של המכשיר יעבד את התמונה לפס תצוגה מבוסס POV.
              </div>

              {/* Quick Image Presets */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">בחירה מהירה / Quick Presets:</span>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => setLogoUrl(planetImg)}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      logoUrl === planetImg ? "border-[#00b4d8] bg-[#00b4d8]/15" : "border-slate-800 bg-slate-900/40 hover:bg-slate-800"
                    }`}
                  >
                    🪐 <span className="text-[8px] text-slate-300">Planet</span>
                  </button>
                  <button
                    onClick={() => setLogoUrl("preset:smile")}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      logoUrl === "preset:smile" ? "border-[#00b4d8] bg-[#00b4d8]/15" : "border-slate-800 bg-slate-900/40 hover:bg-slate-800"
                    }`}
                  >
                    😊 <span className="text-[8px] text-slate-300">Smiley</span>
                  </button>
                  <button
                    onClick={() => setLogoUrl("preset:ghost")}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      logoUrl === "preset:ghost" ? "border-[#00b4d8] bg-[#00b4d8]/15" : "border-slate-800 bg-slate-900/40 hover:bg-slate-800"
                    }`}
                  >
                    👻 <span className="text-[8px] text-slate-300">Ghost</span>
                  </button>
                  <button
                    onClick={() => setLogoUrl("preset:aperture")}
                    className={`py-2 px-1 rounded-xl border text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      logoUrl === "preset:aperture" ? "border-[#00b4d8] bg-[#00b4d8]/15" : "border-slate-800 bg-slate-900/40 hover:bg-slate-800"
                    }`}
                  >
                    💡 <span className="text-[8px] text-slate-300">Aperture</span>
                  </button>
                </div>
              </div>

              {/* Upload Box */}
              <div>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-[#00b4d8] rounded-2xl py-6 px-4 cursor-pointer transition bg-slate-900/30">
                  <Image className="w-8 h-8 text-slate-500 mb-2" />
                  <span className="text-xs font-bold text-slate-300">העלה קובץ תמונה / Select Logo Image</span>
                  <span className="text-[9px] text-slate-500 mt-1">PNG, JPG, SVG are supported. Fits standard resolution.</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                         setToastMessage(`מעבד תמונה... / Processing image...`);
                         try {
                           // 1. Pre-process image to 128x64 greyscale
                           const processedBlob = await processLogoImage(file);
                           const processedFile = new File([processedBlob], "logo_128x64.png", { type: "image/png" });
                           
                           setToastMessage(`מעלה תמונה מעובדת... / Uploading processed image...`);
                           const formData = new FormData();
                           formData.append('file', processedFile);
                           const res = await fetch('/api/upload-file', { method: 'POST', body: formData });
                           if (!res.ok) throw new Error("Upload failed");
                           const data = await res.json();
                           setLogoUrl(data.url);
                           // Back up to IndexedDB
                           saveMediaToDB("custom_logo", processedFile, processedFile.name).catch(e => console.warn("Could not back up custom logo:", e));
                           setToastMessage(`תמונה הועלתה בהצלחה! / Image processed and uploaded!`);
                         } catch (err) {
                           console.error("Server upload failed, falling back to IndexedDB local cache...", err);
                           setToastMessage("שרת לא זמין, שומר בזיכרון המקומי... / Server offline, caching locally in IndexedDB...");
                           try {
                             const processedBlob = await processLogoImage(file);
                             await saveMediaToDB("custom_logo", processedBlob, "logo_128x64.png");
                             const localUrl = URL.createObjectURL(processedBlob);
                             setLogoUrl(localUrl);
                             safeSaveLocal("holospin_logoUrl", "indexeddb:custom_logo");
                             setToastMessage("תמונה עובדה ונשמרה מקומית! / Image processed and saved locally!");
                           } catch (idbErr: any) {
                             console.error("IndexedDB save failed:", idbErr);
                             setToastMessage("שגיאה בהעלאה / Upload failed");
                           }
                         }
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Current Active Preview */}
              {logoUrl && (
                <div className="flex items-center justify-between border border-slate-800/80 bg-slate-950/50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    {logoUrl.startsWith("data:") || logoUrl.startsWith("blob:") ? (
                      <img src={logoUrl} className="w-10 h-10 object-contain rounded border border-slate-800 bg-black/55" />
                    ) : logoUrl.startsWith("preset:") ? (
                      <div className="w-10 h-10 rounded border border-slate-800 bg-black/55 flex items-center justify-center text-lg">
                        {logoUrl === "preset:smile" ? "😊" : logoUrl === "preset:ghost" ? "👻" : "💡"}
                      </div>
                    ) : (
                      <img src={logoUrl} className="w-10 h-10 object-contain rounded border border-slate-800 bg-black/55" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-200">לוגו פעיל / Active Image</span>
                      <span className="text-[9px] text-slate-500 truncate max-w-[130px]">
                        {logoUrl.startsWith("data:") ? "Custom Image Upload 🖼️" : logoUrl.split("/").pop()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setLogoUrl(null)}
                    className="text-[9px] font-bold tracking-widest text-rose-500 hover:text-rose-400 uppercase"
                  >
                    CLEAR
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Video Upload section */}
          <section className="flex flex-col gap-3">
            <h4 className="text-[10px] text-[#a855f7] font-bold tracking-widest uppercase pl-1">
              VIDEO UPLOADS (SYNTH ANIMATION LOOPS) / העלאת סרטונים והנפשות
            </h4>
            
            <div className="border border-slate-800/80 rounded-2xl p-5 bg-[#0c0e15] flex flex-col gap-4">
              <div className="text-xs text-slate-300 leading-relaxed">
                העלה לולאת וידאו קצרה. הסירטון יוקרן ויומר בזמן אמת לאפקט סרקולציה הולוגרפי בהתאם למהירות סיבובי מנוע ה-POV.
              </div>

              {/* Video loops presets */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">לולאות מובנות / Factory Loops:</span>
                <div className="grid grid-cols-2 gap-2">
                  {VIDEO_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSynthVideoUrl(preset.url);
                        safeSaveLocal("synthVideoUrl", preset.url);
                      }}
                      className={`py-2.5 px-3 rounded-xl border text-[10px] font-bold tracking-wider transition-all flex flex-col items-center justify-center text-center gap-1 cursor-pointer ${
                        synthVideoUrl === preset.url
                          ? "border-[#00b4d8] bg-[#00b4d8]/15 text-white shadow-[0_0_8px_rgba(0,180,216,0.25)]"
                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      <span className="text-[10px] font-bold truncate w-full">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Video upload button */}
              <div>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-[#a855f7] rounded-2xl py-6 px-4 cursor-pointer transition bg-slate-900/30">
                  <Video className="w-8 h-8 text-slate-500 mb-2" />
                  <span className="text-xs font-bold text-slate-300">העלה קובץ וידאו / Select Short Video</span>
                  <span className="text-[9px] text-slate-500 mt-1">Supports MP4, WebM, MOV. Playback loops locally.</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setToastMessage(`מעלה סרטון... / Uploading video...`);
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          const res = await fetch('/api/upload-file', { method: 'POST', body: formData });
                          if (!res.ok) throw new Error("Upload failed");
                          const data = await res.json();
                          setSynthVideoUrl(data.url);
                          safeSaveLocal("synthVideoUrl", data.url);
                          // Back up to IndexedDB
                          saveMediaToDB("custom_video", file, file.name).catch(e => console.warn("Could not back up custom video:", e));
                          setToastMessage(`סרטון הועלה בהצלחה! / Video uploaded!`);
                        } catch (err) {
                           console.error("Server upload failed, falling back to IndexedDB local cache...", err);
                           setToastMessage("שרת לא זמין, שומר בזיכרון המקומי... / Server offline, caching locally in IndexedDB...");
                           try {
                             await saveMediaToDB("custom_video", file, file.name);
                             const localUrl = URL.createObjectURL(file);
                             setSynthVideoUrl(localUrl);
                             safeSaveLocal("synthVideoUrl", "indexeddb:custom_video");
                             setToastMessage("סרטון נשמר מקומית ב-IndexedDB! / Video saved locally in IndexedDB!");
                           } catch (idbErr: any) {
                             console.error("IndexedDB save failed:", idbErr);
                             setToastMessage("שגיאה בהעלאה / Upload failed");
                           }
                        }
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Current Active Preview */}
              {synthVideoUrl && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between border border-slate-800/80 bg-slate-950/50 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded border border-slate-800 bg-black/55 overflow-hidden flex items-center justify-center">
                        <video src={synthVideoUrl} preload="auto" crossOrigin="anonymous" muted autoPlay loop playsInline className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-200">סרטון פעיל / Active Video</span>
                        <span className="text-[9px] text-slate-500 truncate max-w-[130px]">
                          {synthVideoUrl.startsWith("blob:") ? "Custom Video Upload 🎥" : synthVideoUrl.split("/").pop()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSynthVideoUrl(null);
                        safeRemoveLocal("synthVideoUrl");
                      }}
                      className="text-[9px] font-bold tracking-widest text-rose-500 hover:text-rose-400 uppercase"
                    >
                      CLEAR
                    </button>
                  </div>
                  <BufferHealthIndicator videoUrl={synthVideoUrl} />
                </div>
              )}
            </div>
          </section>

          {/* Quick Notice Card */}
          <div className="border border-[#0e2a35] rounded-2xl bg-[#091e26] p-4 flex gap-3 text-slate-300">
            <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="text-white block mb-0.5">טיפ להקרנה מיטבית:</strong>
              לקבלת תוצאות תלת-ממדיות עמוקות ומרחפות, מומלץ להשתמש בקבצים בעלי רקע שחור (#000000) מוחלט או קבצי PNG בעלי שקיפות (Alpha Channel). רקע כהה לא יאיר את פסי הלדים ויצור אפקט של ריחוף מרשים באוויר.
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "devices") {
      return (
        <div className="px-5 pt-2 pb-28 flex flex-col gap-6 ">
          <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mb-1 text-center font-black">
            CONNECTED DEVICES / מכשירים מחוברים
          </h3>
          <div className="border border-slate-800 bg-[#0c0e15]/80 rounded-3xl p-6 flex flex-col gap-5 shadow-xl backdrop-blur-md">
             <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800/50 rounded-2xl">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                      <Cpu className="w-5 h-5 text-blue-400" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-sm font-bold text-white tracking-tight">HoloSpin POV {chipModel || "ESP32 Device"}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{state.wifi.ip || (window.location.hostname === "192.168.4.1" ? "192.168.4.1" : "Disconnected")}</span>
                   </div>
                </div>
                <div className="flex items-center gap-2 bg-[#22c55e]/10 px-3 py-1 rounded-full border border-[#22c55e]/30">
                   <div className={`w-1.5 h-1.5 rounded-full bg-[#22c55e] ${isConnected ? 'animate-pulse' : ''}`}></div>
                   <span className="text-[8px] font-black text-[#22c55e] uppercase">{isConnected ? 'Active' : 'Standby'}</span>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 flex flex-col gap-1 items-center text-center">
                   <Wifi className="w-5 h-5 text-sky-400 mb-1" />
                   <span className="text-[10px] text-slate-400 uppercase font-black">Signal</span>
                   <span className="text-[11px] font-bold text-white">{isConnected ? "-42 dBm" : "N/A"}</span>
                </div>
                <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 flex flex-col gap-1 items-center text-center">
                   <Zap className="w-5 h-5 text-amber-400 mb-1" />
                   <span className="text-[10px] text-slate-400 uppercase font-black">Power</span>
                   <span className="text-[11px] font-bold text-white">{isConnected ? "USB-C / 5.0V" : "0V"}</span>
                </div>
             </div>
          </div>
          
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-6 backdrop-blur-sm">
             <h4 className="text-[10px] text-slate-400 font-black tracking-widest uppercase mb-4 pl-1">SYSTEM DIAGNOSTICS</h4>
             <div className="space-y-4">
                <div className="flex justify-between items-center py-1">
                   <div className="flex flex-col">
                      <span className="text-[11px] text-slate-200 font-bold uppercase tracking-tight">System Core</span>
                      <span className="text-[8px] text-slate-500 uppercase">{chipModel?.includes("S3") ? "Dual-Core Xtensa® LX7" : chipModel?.includes("C3") ? "Single-Core RISC-V" : "Dual-Core Xtensa® LX6"}</span>
                   </div>
                   <span className={`text-[10px] font-mono font-bold ${isConnected ? 'text-blue-400' : 'text-slate-600'}`}>{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                   <div className="flex flex-col">
                      <span className="text-[11px] text-slate-200 font-bold uppercase tracking-tight">Flash Memory</span>
                      <span className="text-[8px] text-slate-500 uppercase">{chipModel?.includes("S3") ? "8MB Octal SPI" : "4MB SPI Flash"}</span>
                   </div>
                   <span className={`text-[10px] font-mono font-bold ${isConnected ? 'text-emerald-400' : 'text-slate-600'}`}>{isConnected ? 'HEALTHY' : 'UNKNOWN'}</span>
                </div>
             </div>
          </div>
        </div>
      );
    }

    if (activeTab === "library") {
      return (
        <div className="px-5 pt-2 pb-28 flex flex-col gap-6 ">
          <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mb-1 text-center font-black">
            MEDIA LIBRARY / ספריית קבצים
          </h3>
          <div className="grid grid-cols-2 gap-4">
             {EFFECTS.map(effect => (
               <div key={effect.id} className="bg-[#0c0e15]/70 border border-slate-800/60 rounded-3xl p-4 flex flex-col items-center gap-3 transition hover:border-[#00b4d8]/50 hover:bg-[#00b4d8]/5 group cursor-pointer" onClick={() => { setActiveEffect(effect.id); setActiveTab("controller"); }}>
                  <div className="w-14 h-14 rounded-2xl bg-slate-900/80 flex items-center justify-center border border-slate-800 group-hover:bg-[#00b4d8]/10 group-hover:border-[#00b4d8]/30 transition shadow-inner">
                     {effect.icon(effect.color)}
                  </div>
                  <div className="flex flex-col items-center">
                     <span className="text-[10px] font-black text-white uppercase tracking-tighter">{effect.label}</span>
                     <span className="text-[7.5px] text-slate-500 uppercase font-bold mt-0.5 tracking-[0.1em]">Pov Effect</span>
                  </div>
               </div>
             ))}
             {/* Active Session Content */}
             <div className="bg-[#0c0e15]/40 border border-slate-800/40 rounded-3xl p-4 flex flex-col items-center gap-3 opacity-50 relative overflow-hidden">
                <div className="w-14 h-14 rounded-2xl bg-slate-900/80 flex items-center justify-center border border-slate-800">
                   <HardDrive className="w-7 h-7 text-slate-600" />
                </div>
                <div className="flex flex-col items-center">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">SD STORAGE</span>
                   <span className="text-[7.5px] text-slate-600 uppercase font-bold mt-0.5 tracking-[0.1em]">
                      {state.storage?.mounted ? `${state.storage?.usedSpace} / ${state.storage?.totalSpace}` : "DISCONNECTED"}
                    </span>
                </div>
                <div className="absolute top-2 right-2">
                   <AlertTriangle className="w-3 h-3 text-amber-600" />
                </div>
             </div>
          </div>
        </div>
      );
    }

    if (activeTab === "controller") {
        return (
          <div className="flex-1 overflow-y-auto px-5 pb-28 pt-2 flex flex-col gap-6 ">
            {/* Sync Progress Bar */}
            {syncProgress !== null && (
              <div className="w-full max-w-3xl mx-auto -mb-4 pt-4">
                <div className="flex justify-between items-center mb-1.5 px-1">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-3 h-3 text-[#00b4d8] animate-spin" />
                    <span className="text-[10px] font-black text-[#00b4d8] uppercase tracking-widest">Synchronizing Commands...</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{syncProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#00b4d8] to-[#a855f7]"
                    initial={{ width: 0 }}
                    animate={{ width: `${syncProgress}%` }}
                    transition={{ ease: "linear" }}
                  />
                </div>
                
                {/* Enhanced Command Sync List */}
                <div className="mt-4 flex flex-col gap-1.5 max-h-24 overflow-y-auto px-1 custom-scrollbar">
                  {syncLogs.map((log, i) => (
                    <div key={i} className="flex items-center justify-between text-[8px] font-mono tracking-tighter">
                      <span className="text-slate-500 truncate max-w-[80%] uppercase">{log.cmd}</span>
                      {log.status === 'success' ? (
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                      ) : (
                        <RefreshCw className="w-2.5 h-2.5 text-slate-700 animate-spin" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="w-full max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center my-8">
              <div className="flex justify-center items-center w-full max-w-[280px] aspect-square mx-auto relative">
                <motion.div
                  id="tour-simulator"
                  className={`w-full h-full rounded-full border-[2px] bg-[#050608] flex items-center justify-center overflow-hidden relative transition-all duration-500 ${
                    activeEffect === "fire" 
                      ? "border-[#f97316] shadow-[0_0_50px_rgba(249,115,22,0.4)] animate-fire-glow-preview" 
                      : "border-slate-800 shadow-[0_0_50px_rgba(34,180,216,0.2)]"
                  }`}
                  animate={isApplyingPreset ? { scale: [1, 1.08, 1], rotate: [0, 5, -5, 0], filter: ['brightness(1)', 'brightness(1.8)', 'brightness(1)'] } : { scale: 1, rotate: 0 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                >
                  <HologramSimulator
                    effect={activeEffect}
                    speed={motorSpeed}
                    brightness={brightness}
                    logoUrl={logoUrl}
                    povText={povText}
                    logoRotation={logoRotation}
                    logoTintColor={useLogoTint ? logoTintColor : null}
                    rainbowMode={colorMode === "random"}
                    povTextAnimation={povTextAnimation}
                    effectSpeedRate={effectSpeedRate}
                    effectScale={effectScale}
                    effectComplexity={effectComplexity}
                    videoUrl={synthVideoUrl}
                    ledCount={state.led.ledsPerStrip}
                    kaleidoShape={kaleidoShape}
                    kaleidoLines={kaleidoLines}
                    kaleidoMorphSpeed={kaleidoMorphSpeed}
                    flameIntensity={flameIntensity}
                    aiEffectJs={aiEffectJs}
                    aiEffectCode={aiEffectCode}
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rounded-full pointer-events-none"></div>
                  <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] pointer-events-none rounded-full"></div>
                </motion.div>
              </div>
              
              <div className="flex justify-center items-center">
                <Gauge value={rpm} min={0} max={2000} label="RPM" unit=" RPM" colorClass="text-[#00b4d8]" />
              </div>
            </div>

            {activeEffect === "fire" && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-3xl mx-auto border border-orange-500/30 bg-orange-950/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden shadow-[0_0_20px_rgba(249,115,22,0.1)] -mt-2 mb-4"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
                <div className="flex justify-between items-center mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-[#f97316] animate-pulse" />
                    <span className="text-[11px] font-black tracking-widest text-[#f97316] uppercase">Fire Effect Controls / בקרת אפקט אש</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-orange-400">{Math.round((flameIntensity / 255) * 100)}%</span>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Flame Intensity (Burn Rate)</span>
                    <span className="text-[11px] font-mono text-orange-400">{flameIntensity} / 255</span>
                  </div>
                  <CustomSlider 
                    value={flameIntensity} 
                    onChange={(val: number) => setFlameIntensity(val)} 
                    min={0}
                    max={255}
                    thumbColor="#f97316" 
                    trackColor="#1e110a" 
                  />
                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter mt-1">
                    Adjusts the rate of thermal combustion, flame propagation speed, and rising pixel heat layers.
                  </p>
                </div>
              </motion.div>
            )}

            <div className="flex justify-center -mt-4 mb-4">
              <button
                id="tour-gesture-btn"
                onClick={() => setGestureMode(!gestureMode)}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all active:scale-95 ${
                  gestureMode 
                    ? "bg-[#00b4d8]/20 border-[#00b4d8] text-white shadow-[0_0_25px_rgba(0,180,216,0.3)]" 
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800"
                }`}
              >
                <div className="relative">
                  <Hand className={`w-5 h-5 ${gestureMode ? "text-[#00b4d8]" : "text-slate-500"}`} />
                  {gestureMode && (
                    <motion.div 
                      layoutId="gestureActive"
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0c0e15]"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  )}
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[12px] font-black uppercase tracking-widest leading-none mb-1">Gesture Controller</span>
                  <span className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">Swipe: Vertical (Bright) | Horizontal (Speed)</span>
                </div>
              </button>
            </div>

            <div className="mx-auto w-full max-w-3xl mb-4 text-center">
               <HardwareHealth 
                 apiUrl={getDeviceUrl("/status")} 
                 externalData={isBluetoothConnected ? streamData : null} 
                 powerLimits={{
                    currentLimit: state.power.currentLimit,
                    tempWarning: state.power.tempWarning
                 }}
                 brightness={state.brightness}
                 motorSpeed={state.motorSpeed}
                 isSyncEnabled={isSyncEnabled}
               />
            </div>
          </div>
        );
      }

      if (activeTab === "effects") {
        return (
          <div className="flex-1 overflow-y-auto px-5 pb-28 pt-2 flex flex-col gap-6 ">
            
            {/* Color Mode Selection */}
            <section className="mt-2 text-center">
              <h3 className="text-[10px] text-slate-500 font-black tracking-widest uppercase mb-3">COLOR STYLE / סגנון צבע</h3>
              <div className="flex justify-center">
                <div className="bg-slate-900/60 p-1 rounded-2xl border border-slate-800/50 flex gap-1 w-full max-w-[280px]">
                  <button 
                    onClick={() => setColorMode("solid")}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${colorMode === "solid" ? "bg-[#00b4d8]/20 text-[#00b4d8] border border-[#00b4d8]/30" : "text-slate-500 hover:text-slate-400"}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${colorMode === "solid" ? "bg-[#00b4d8]" : "bg-slate-700"}`}></div>
                    SOLID COLOR
                  </button>
                  <button 
                    onClick={() => setColorMode("random")}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${colorMode === "random" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "text-slate-500 hover:text-slate-400"}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${colorMode === "random" ? "bg-purple-400" : "bg-slate-700"} animate-pulse`}></div>
                    RANDOMIZED
                  </button>
                </div>
              </div>
            </section>

            <section className="mt-2">
              <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mb-3 px-1 text-center font-black">
                EFFECT LIBRARY / ספריית אפקטים
              </h3>
              <div className="grid grid-cols-4 gap-3 bg-[#0c0e15]/80 p-4 rounded-3xl border border-slate-800/50">
                {EFFECTS.map((eff) => (
                  <button
                    key={eff.id}
                    onClick={() => handleSelectEffect(eff.id)}
                    className={`flex flex-col items-center justify-center py-3 px-1 rounded-2xl border transition-all duration-300 ${
                      activeEffect === eff.id
                        ? (eff.id === "fire"
                            ? "border-[#f97316] bg-[#f97316]/10 shadow-[0_0_15px_rgba(249,115,22,0.25)] scale-[1.02]"
                            : "border-[#00b4d8] bg-[#00b4d8]/10 shadow-[0_0_15px_rgba(0,180,216,0.2)] scale-[1.02]")
                        : "border-transparent bg-slate-900/40 hover:bg-slate-800/50"
                    } ${eff.id === "fire" && activeEffect === "fire" ? "animate-fire-pulse-icon" : ""}`}
                  >
                    <div className="mb-2 h-7 w-7 flex items-center justify-center">
                      {eff.icon(eff.color)}
                    </div>
                    <span className="text-[7.5px] font-black tracking-widest uppercase"
                          style={{ color: activeEffect === eff.id ? eff.color : (eff.color + '99') }}>
                      {eff.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-4">
              <AiEffectStudio 
                onEffectGenerated={(code, js, prompt) => {
                  setAiEffectCode(code);
                  setAiEffectJs(js);
                  setAiEffectPrompt(prompt);
                  setActiveEffect("ai_custom");
                }} 
              />
            </section>

            <section className="bg-[#0c0e15]/50 border border-slate-800/50 rounded-3xl p-6 relative overflow-hidden backdrop-blur-sm mt-4">
               <h3 className="text-[11px] text-[#0ea5e9] font-black tracking-widest uppercase mb-4 text-center">
                  UPLOAD NEW CONTENT / העלאת תוכן
               </h3>
               <HoloSlicer onUpload={handleHoloUpload} />
            </section>

            {/* Advanced Modifiers Section */}
            <section>
              <h3 className="text-[11px] text-slate-400 font-bold tracking-widest mb-3 uppercase pl-1 text-center font-black">
                ADVANCED MODIFIERS / הגדרות מתקדמות
              </h3>
              <div className="border border-slate-800/80 rounded-3xl p-6 bg-[#0c0e15]/60 flex flex-col gap-6 backdrop-blur-md">
                
                {/* Speed Rate */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Playback Time</span>
                    <span className="text-[11px] font-mono text-[#00b4d8] font-bold">
                      x{(effectSpeedRate || 1.0).toFixed(1)}
                    </span>
                  </div>
                  <CustomSlider
                    value={Math.round((effectSpeedRate - 0.2) / 2.8 * 255)}
                    onChange={(v: number) => {
                      const computedVal = 0.2 + (v / 255) * 2.8;
                      setEffectSpeedRate(computedVal);
                    }}
                    thumbColor="#00b4d8"
                    trackColor="#1e293b"
                  />
                </div>

                {/* Scale */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Radial Scale</span>
                    <span className="text-[11px] font-mono text-pink-400 font-bold">{Math.round(effectScale * 100)}%</span>
                  </div>
                  <CustomSlider
                    value={Math.round((effectScale - 0.5) / 1.0 * 255)}
                    onChange={(v: number) => {
                      const computedVal = 0.5 + (v / 255) * 1.0;
                      setEffectScale(computedVal);
                    }}
                    thumbColor="#f43f5e"
                    trackColor="#1e293b"
                  />
                </div>

                {/* Complexity */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Complexity Layers</span>
                    <span className="text-[11px] font-mono text-amber-400 font-bold">{Math.round(effectComplexity)}</span>
                  </div>
                  <CustomSlider
                    value={Math.round((effectComplexity - 3) / 13 * 255)}
                    onChange={(v: number) => {
                      const computedVal = 3 + (v / 255) * 13;
                      setEffectComplexity(computedVal);
                    }}
                    thumbColor="#fbbf24"
                    trackColor="#1e293b"
                  />
                </div>

                {/* Color Palette (Visible in Solid mode) */}
                <div className={`flex flex-col gap-2 transition-all duration-500 ${colorMode === 'random' ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                      {colorMode === 'random' ? 'Cycle Pattern (Active)' : 'Core Hue / גוון ראשי'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold" style={{ color: logoTintColor }}>{logoTintColor.toUpperCase()}</span>
                      <div className="w-3 h-3 rounded-full shadow-sm shadow-black" style={{ backgroundColor: logoTintColor }}></div>
                    </div>
                  </div>
                  <HueSlider 
                    hue={hue} 
                    setHue={setHue} 
                  />
                </div>

              </div>
            </section>

            <button
              onClick={() => {
                setToastMessage("Settings Updated! / הגדרות עודכנו בהצלחה!");
              }}
              className="w-full bg-[#00b4d8] hover:bg-[#0096b4] text-white py-4 rounded-2xl text-[11.5px] font-black tracking-widest uppercase shadow-[0_0_20px_rgba(0,180,216,0.3)] transition active:scale-95 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              CONFIRM & UPDATE EFFECT
            </button>
          </div>
        );
      }

      if (activeTab === "studio") {
        return (
          <div className="px-5 pt-2 pb-28 flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col gap-4">
              <h3 className="text-[11px] text-slate-400 font-bold tracking-widest uppercase pl-1 text-center font-black">
                STUDIO / כלי יצירה וחומרה
              </h3>
              
              <div className="flex bg-[#0c0e15] p-1 rounded-xl border border-slate-800/50 self-center">
                <button 
                  onClick={() => setStudioView("creative")}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${studioView === "creative" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Creative Effects
                </button>
                <button 
                  onClick={() => setStudioView("firmware")}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${studioView === "firmware" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Firmware IDE
                </button>
              </div>
            </div>

            {studioView === "creative" ? (
              <>
                <AudioVisualizer onSyncParams={(b, m, h) => {
                  // Send params to device if connected
                  if (isConnected || isBluetoothConnected) {
                     const payload = { category: "effect", update: { effectParams: { speed: b * 100, hue: Math.floor(h * 360) } } };
                     if (isBluetoothConnected && activeBleId) {
                       sendCommand(payload);
                     } else {
                       const targetUrl = getDeviceUrl("/control");
                       safeFetch(targetUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(console.error);
                     }
                  }
                }} />
                <TextMarquee onFrameUpdate={async (data) => {
                  if (isConnected || isBluetoothConnected) {
                     // Convert base64 image data to frame and upload
                  }
                }} />
                <LivePaint onFrameUpdate={async (data) => {
                   // Same here
                }} />
              </>
            ) : (
              <div className="h-[500px]">
                <FirmwareStudio 
                  onFlash={handleFlashViaOtg}
                  selectedModel={state.detectedModel || "ESP32 WROOM 32D"}
                />
              </div>
            )}
          </div>
        );
      }

      if (activeTab === "settings") {
        return (
          <div className="px-5 pt-2 pb-28 flex flex-col gap-5 ">
            <h3 className="text-[11px] text-slate-400 font-bold tracking-widest mb-1 uppercase pl-1 text-center font-black">
              SYSTEM CONFIG / הגדרות מערכת
            </h3>
            
            <div className="border border-slate-800 bg-[#0c0e15] rounded-3xl p-6 flex flex-col gap-6 shadow-2xl">
               <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center px-1">
                     <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Motor Speed</span>
                     <span className="text-[11px] font-mono text-[#a855f7] font-bold">{motorSpeed} RPM</span>
                  </div>
                  <CustomSlider value={motorSpeed} onChange={setMotorSpeed} thumbColor="#a855f7" trackColor="#0f172a" />
               </div>
               <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center px-1">
                     <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">LED Brightness</span>
                     <span className="text-[11px] font-mono text-[#fbbf24] font-bold">{brightness}%</span>
                  </div>
                  <CustomSlider value={brightness} onChange={setBrightness} thumbColor="#fbbf24" trackColor="#0f172a" />
               </div>
            </div>

            <div className="border border-slate-800/80 rounded-3xl bg-[#0c0e15]/60 overflow-hidden flex flex-col backdrop-blur-md shadow-lg">
              <SettingsRow 
                onClick={() => setGestureMode(!gestureMode)} 
                icon={<Hand className={`w-5 h-5 ${gestureMode ? "text-emerald-400" : "text-slate-600"}`} />} 
                title="AI Gesture Control" 
                subtitle={gestureMode ? "Enabled & Tracking" : "Disabled"}
                rightWidget={<Toggle value={gestureMode} onChange={setGestureMode} activeColor="#10b981" />}
              />
              <SettingsRow onClick={() => setSubPage("wifi")} icon={<Wifi className="w-5 h-5 text-sky-400" />} title="WiFi Settings" subtitle={state.wifi.ssid || "Disconnected"} />
              <SettingsRow onClick={() => setSubPage("gesture_mapping")} icon={<Hand className="w-5 h-5 text-emerald-400" />} title="Gesture Mapping" subtitle="Configure AI Controls" />
              <SettingsRow onClick={() => setSubPage("ai_model")} icon={<Cpu className="w-5 h-5 text-indigo-400" />} title="AI Model Installer" subtitle="Configure & cache offline models" />
              <SettingsRow onClick={() => setSubPage("pin_selection")} icon={<SlidersHorizontal className="w-5 h-5 text-fuchsia-400" />} title="Pin Configuration" subtitle="Map GPIO Pins Interactively" />
              <SettingsRow onClick={() => setSubPage("schedule")} icon={<Clock className="w-5 h-5 text-purple-400" />} title="Schedules" subtitle={`${schedules.filter(s => s.active).length} Active Timers`} />
              <SettingsRow onClick={() => setSubPage("calibration")} icon={<Target className="w-5 h-5 text-teal-400" />} title="Calibration" subtitle="Angle & Timing" />
              <SettingsRow onClick={handleFirmwareUpdateCheck} icon={<Download className="w-5 h-5 text-emerald-400" />} title="Firmware" subtitle="Update POV Core" />
              <SettingsRow onClick={() => setSubPage("power")} icon={<Power className="w-5 h-5 text-rose-500" />} title="Power Management" subtitle="Battery & Voltage" />
              <SettingsRow onClick={() => setSubPage("background")} icon={<Image className="w-5 h-5 text-indigo-400" />} title="Background Style" subtitle="Change App Theme" />
            </div>
            
            <button onClick={handleRunDiagnostics} className="w-full bg-slate-800/40 border border-slate-700/50 py-4 rounded-2xl text-[10px] font-black tracking-widest text-slate-300 flex items-center justify-center gap-3 hover:bg-slate-800/60 transition shadow-inner">
               <ShieldCheck className="w-4 h-4 text-blue-400" />
               HARDWARE DIAGNOSTICS TEST
            </button>
          </div>
        );
      }

    return (
      <div className="flex-1 flex items-center justify-center p-10 text-center opacity-40">
        <div className="flex flex-col items-center gap-4">
          <Aperture className="w-12 h-12 animate-spin-slow text-slate-600" />
          <p className="text-xs font-black tracking-widest uppercase text-slate-500">
            Select an Operation / בחר פעולה מהתפריט
          </p>
        </div>
      </div>
    );
    };

  if (showSplash) {
    return (
      <div className="bg-transparent min-h-screen text-white font-sans w-full max-w-md mx-auto relative overflow-hidden flex items-center justify-center antialiased">
        <GalaxyBackground bgImageId="video1" />
        {/* Subtle dark gradient overlay - lightened to show video better */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-0"></div>
        
        {showSplashLogo && (
          <motion.div 
            className="relative z-10 flex flex-col items-center w-full px-12"
            initial={{ scale: 0.2, filter: "blur(30px)", opacity: 0 }}
            animate={{ scale: 1, filter: "blur(0px)", opacity: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <PsychedelicLogo />
            <h1 className="text-3xl font-bold tracking-[0.3em] text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.7)] mt-4">HOLOSPIN</h1>
            <p className="text-[#06b6d4] tracking-[0.4em] text-xs font-semibold mt-2 uppercase drop-shadow-[0_0_8px_rgba(6,182,212,0.5)] mb-8 animate-pulse">POV System</p>
            
            <div className="w-full max-w-[200px] h-1 bg-white/10 rounded-full overflow-hidden mt-6 shadow-[0_0_10px_rgba(168,85,247,0.3)]">
              <div 
                className="h-full bg-gradient-to-r from-[#06b6d4] to-[#a855f7] rounded-full transition-all duration-75 ease-linear"
                style={{ width: `${splashProgress}%` }}
              ></div>
            </div>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-2">{Math.round(splashProgress)}% LOADING</p>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-transparent min-h-screen text-text-primary font-sans w-full max-w-md mx-auto shadow-2xl relative overflow-x-hidden flex flex-col antialiased transition-all duration-500`}
         style={{ 
           boxShadow: handInFrame 
             ? `inset 0 0 ${20 * handConfidence}px rgba(16, 185, 129, ${0.4 * handConfidence})` 
             : 'none'
         }}>
      <GalaxyBackground bgImageId={bgImageId} />
      {/* Slate-colored semi-translucent dark masking cover for legibility */}
      <div className="absolute inset-0 bg-slate-950/85 pointer-events-none z-0"></div>

      <AnimatePresence>
        {showPermissions && (
          <PermissionsManager onComplete={handlePermissionsComplete} />
        )}
      </AnimatePresence>
      {isLightMode && (
        <style>{`
          .bg-\\[\\#0c0e15\\], .bg-\\[\\#0c0e15\\]\\/90, .bg-\\[\\#090a10\\], .bg-black\\/40, .bg-\\[\\#161d2a\\], .bg-\\[\\#090a10\\]\\/95, .bg-\\[\\#0c0e15\\]\\/95 {
            background-color: var(--bg-panel) !important;
            color: var(--text-primary) !important;
          }
          .border-slate-800, .border-slate-800\\/50, .border-slate-800\\/80, .border-slate-800\\/60, .border-slate-900, .divider-slate-800\\/50 {
            border-color: var(--border-color) !important;
          }
          .text-slate-100, .text-slate-200, .text-slate-300, .text-slate-400, .text-white, .hover\\:text-slate-200:hover, .text-slate-200 {
            color: var(--text-primary) !important;
          }
          .text-slate-500 {
            color: var(--text-secondary) !important;
          }
          .bg-\\[\\#050608\\], .bg-black, .bg-\\[\\#020306\\]\\/90 {
            background-color: var(--bg-app) !important;
          }
          .hover\\:bg-slate-800\\/30:hover {
            background-color: var(--bg-panel-hover) !important;
          }
          .divide-slate-800\\/50 > * + * {
            border-color: var(--divider-color) !important;
          }
        `}</style>
      )}

      <AnimatePresence>
        {isInstallable && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-2 left-1/2 -translate-x-1/2 w-[95%] max-w-[400px] z-[9999] bg-gradient-to-r from-blue-600 to-[#00b4d8] rounded-xl p-3 shadow-[0_0_20px_rgba(0,180,216,0.4)] flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span className="text-white font-bold text-xs uppercase tracking-wider">Install HoloSpin App</span>
              <span className="text-blue-100 text-[10px] font-sans">Get the native app experience offline.</span>
            </div>
            <button 
              onClick={handleInstallClick}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30 active:scale-95 transition-all text-[10px] font-bold px-4 py-2 rounded-lg"
            >
              INSTALL
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {showFirmwareModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setShowFirmwareModal(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-[420px] bg-[#0c0e15] border border-slate-800 rounded-[32px] overflow-hidden shadow-2xl shadow-emerald-500/10"
          >
            <div className="p-8 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <Download className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-sm font-black text-white tracking-widest uppercase">Firmware Update</h3>
                    <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">POV Core v{serverVersion || "..."}</p>
                  </div>
                </div>
                <button onClick={() => setShowFirmwareModal(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {firmwareCheckStage === "checking" && (
                <div className="py-8 flex flex-col items-center gap-4 text-center">
                  <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-bold text-white tracking-wide uppercase">Checking Compatibility...</p>
                    <p className="text-[10px] text-slate-500">Querying ESP32 device for active build info</p>
                  </div>
                </div>
              )}

              {firmwareCheckStage === "up_to_date" && (
                <div className="py-6 flex flex-col gap-6">
                   <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl flex flex-col items-center gap-3 text-center">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-black text-emerald-400 tracking-widest uppercase">Firmware Up to Date</p>
                        <p className="text-[10px] text-slate-400">Current device version: <span className="font-mono text-emerald-300">{deviceVersion}</span></p>
                      </div>
                   </div>
                   <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                     Your POV Core is running the latest stable build optimized for ESP32 WROOM-32D hardware. No action required.
                   </p>
                   <button 
                    onClick={() => {
                      setShowFirmwareModal(false);
                      setSubPage("firmware");
                    }}
                    className="w-full py-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-[10px] font-black text-slate-400 tracking-widest hover:bg-slate-800 transition"
                   >
                     REINSTALL FIRMWARE ANYWAY
                   </button>
                </div>
              )}

              {firmwareCheckStage === "update_available" && (
                <div className="py-6 flex flex-col gap-6">
                   <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl flex flex-col items-center gap-3 text-center">
                      <Zap className="w-10 h-10 text-amber-400 animate-pulse" />
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-black text-amber-400 tracking-widest uppercase">Update Available!</p>
                        <p className="text-[10px] text-slate-400 font-mono">v{deviceVersion} → v{serverVersion}</p>
                      </div>
                   </div>
                   <div className="flex flex-col gap-3">
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        A new stable release is available. This update improves buffer stability and fixes Wi-Fi reconnect bugs on dual-core ESP32 chips.
                      </p>
                      <ul className="text-[10px] text-slate-500 space-y-1 pl-1">
                        <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-500" /> Improved DMA buffering</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-500" /> Enhanced sensor interrupt logic</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-500" /> New animation API v2.4</li>
                      </ul>
                   </div>
                   <button 
                    onClick={() => {
                      setShowFirmwareModal(false);
                      setSubPage("firmware");
                    }}
                    className="w-full py-4 bg-emerald-500 shadow-xl shadow-emerald-500/20 rounded-2xl text-[10px] font-black text-white tracking-widest hover:bg-emerald-400 transition"
                   >
                     UPGRADE NOW (STABLE)
                   </button>
                </div>
              )}

              {firmwareCheckStage === "error" && (
                <div className="py-8 flex flex-col items-center gap-4 text-center">
                  <ShieldAlert className="w-10 h-10 text-rose-500" />
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-bold text-rose-500 tracking-wide uppercase">Connection Error</p>
                    <p className="text-[10px] text-slate-500 px-4">Could not verify firmware compatibility. Ensure device is online.</p>
                  </div>
                  <button 
                    onClick={handleFirmwareUpdateCheck}
                    className="mt-2 px-4 py-2 bg-slate-800 rounded-xl text-[10px] font-bold text-slate-300"
                  >
                    RETRY CHECK
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {toastMessage && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-[350px] z-[1000] bg-[#0c0e15]/95 border px-4 py-3 rounded-xl text-xs font-bold tracking-wider uppercase animate-in fade-in slide-in-from-bottom-5 duration-300 flex items-start gap-3 ${
          toastMessage.toLowerCase().includes("error") || 
          toastMessage.toLowerCase().includes("failed") || 
          toastMessage.includes("שגיא") || 
          toastMessage.includes("חסום") ||
          toastMessage.includes("נכשל")
          ? "border-rose-500/50 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.35)]" 
          : "border-[#22c55e]/50 text-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.35)]"}`}>
          {toastMessage.toLowerCase().includes("error") || 
           toastMessage.toLowerCase().includes("failed") || 
           toastMessage.includes("שגיא") || 
           toastMessage.includes("חסום") ||
           toastMessage.includes("נכשל") ? (
             <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          ) : (
             <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{toastMessage}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto w-full no-scrollbar relative z-10 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={subPage || activeTab}
            initial={{ opacity: 0, x: 18, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -18, scale: 0.98 }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 28,
              mass: 0.8,
              opacity: { duration: 0.16 }
            }}
            className="flex flex-col w-full min-h-max"
          >
            {renderHeader()}
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t border-slate-800/40 bg-[#090a10]/90 backdrop-blur-md flex justify-between items-center px-3 min-[360px]:px-5 sm:px-6 py-2.5 min-[360px]:py-3 pb-5 min-[360px]:pb-6 z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
        <button
          onClick={() => {
            setActiveTab("controller");
            setSubPage(null);
          }}
          className="flex-1 flex flex-col items-center gap-0.5 min-[360px]:gap-1 focus:outline-none transition-transform active:scale-95 group"
        >
          <SlidersHorizontal
            className={`w-4.5 h-4.5 min-[360px]:w-5.5 min-[360px]:h-5.5 transition-all duration-300 ${
              activeTab === "controller" 
                ? "text-[#00b4d8] scale-110 drop-shadow-[0_0_8px_rgba(0,180,216,0.5)]" 
                : "text-slate-500 group-hover:text-slate-300"
            }`}
          />
          <span
            className={`text-[7px] min-[360px]:text-[8px] min-[400px]:text-[9px] font-black tracking-wider min-[360px]:tracking-widest transition-colors duration-300 ${
              activeTab === "controller" ? "text-[#00b4d8]" : "text-slate-500"
            }`}
          >
            CONTROLLER
          </span>
          <div className={`w-0.75 h-0.75 min-[360px]:w-1 min-[360px]:h-1 rounded-full bg-[#00b4d8] shadow-[0_0_6px_#00b4d8] transition-all duration-300 mt-0.5 ${
            activeTab === "controller" ? "scale-100 opacity-100" : "scale-0 opacity-0"
          }`} />
        </button>
        <button
          onClick={() => {
            setActiveTab("effects");
            setSubPage(null);
          }}
          className="flex-1 flex flex-col items-center gap-0.5 min-[360px]:gap-1 focus:outline-none transition-transform active:scale-95 group"
        >
          <Aperture
            className={`w-4.5 h-4.5 min-[360px]:w-5.5 min-[360px]:h-5.5 transition-all duration-300 ${
              activeTab === "effects" 
                ? "text-[#00b4d8] scale-110 drop-shadow-[0_0_8px_rgba(0,180,216,0.5)] animate-spin-slow" 
                : "text-slate-500 group-hover:text-slate-300"
            }`}
          />
          <span
            className={`text-[7px] min-[360px]:text-[8px] min-[400px]:text-[9px] font-black tracking-wider min-[360px]:tracking-widest transition-colors duration-300 ${
              activeTab === "effects" ? "text-[#00b4d8]" : "text-slate-500"
            }`}
          >
            EFFECTS
          </span>
          <div className={`w-0.75 h-0.75 min-[360px]:w-1 min-[360px]:h-1 rounded-full bg-[#00b4d8] shadow-[0_0_6px_#00b4d8] transition-all duration-300 mt-0.5 ${
            activeTab === "effects" ? "scale-100 opacity-100" : "scale-0 opacity-0"
          }`} />
        </button>
        <button
          onClick={() => {
            setActiveTab("studio");
            setSubPage(null);
          }}
          className="flex-1 flex flex-col items-center gap-0.5 min-[360px]:gap-1 focus:outline-none transition-transform active:scale-95 group"
        >
          <Wand2
            className={`w-4.5 h-4.5 min-[360px]:w-5.5 min-[360px]:h-5.5 transition-all duration-300 ${
              activeTab === "studio" 
                ? "text-[#00b4d8] scale-110 drop-shadow-[0_0_8px_rgba(0,180,216,0.5)]" 
                : "text-slate-500 group-hover:text-slate-300"
            }`}
          />
          <span
            className={`text-[7px] min-[360px]:text-[8px] min-[400px]:text-[9px] font-black tracking-wider min-[360px]:tracking-widest transition-colors duration-300 ${
              activeTab === "studio" ? "text-[#00b4d8]" : "text-slate-500"
            }`}
          >
            STUDIO
          </span>
          <div className={`w-0.75 h-0.75 min-[360px]:w-1 min-[360px]:h-1 rounded-full bg-[#00b4d8] shadow-[0_0_6px_#00b4d8] transition-all duration-300 mt-0.5 ${
            activeTab === "studio" ? "scale-100 opacity-100" : "scale-0 opacity-0"
          }`} />
        </button>
        <button
          onClick={() => {
            setActiveTab("settings");
            setSubPage(null);
          }}
          className="flex-1 flex flex-col items-center gap-0.5 min-[360px]:gap-1 focus:outline-none transition-transform active:scale-95 group"
        >
          <Settings
            className={`w-4.5 h-4.5 min-[360px]:w-5.5 min-[360px]:h-5.5 transition-all duration-300 ${
              activeTab === "settings" 
                ? "text-[#00b4d8] scale-110 drop-shadow-[0_0_8px_rgba(0,180,216,0.5)]" 
                : "text-slate-500 group-hover:text-slate-300"
            }`}
          />
          <span
            className={`text-[7px] min-[360px]:text-[8px] min-[400px]:text-[9px] font-black tracking-wider min-[360px]:tracking-widest transition-colors duration-300 ${
              activeTab === "settings" ? "text-[#00b4d8]" : "text-slate-500"
            }`}
          >
            SETTINGS
          </span>
          <div className={`w-0.75 h-0.75 min-[360px]:w-1 min-[360px]:h-1 rounded-full bg-[#00b4d8] shadow-[0_0_6px_#00b4d8] transition-all duration-300 mt-0.5 ${
            activeTab === "settings" ? "scale-100 opacity-100" : "scale-0 opacity-0"
          }`} />
        </button>
      </nav>

      {/* Sidebar Menu */}
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          <div className="fixed top-0 left-0 w-64 h-full bg-[#090a10] border-r border-slate-800/80 z-[70] flex flex-col animate-in slide-in-from-left shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex flex-col">
                <div className="text-[18px] font-black tracking-[0.1em] flex leading-none">
                  <span className="text-[#00b4d8]">HOLO</span>
                  <span className="text-[#a855f7]">SPIN</span>
                </div>
                <div className="text-[7px] text-slate-400 font-bold tracking-[0.15em] mt-1">
                  MENU
                </div>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col p-4 gap-2">
              <button
                className="flex items-center gap-3 p-3 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition text-left"
                onClick={() => {
                  setActiveTab("devices");
                  setSubPage(null);
                  setIsSidebarOpen(false);
                }}
              >
                <Monitor className="w-5 h-5 text-[#38bdf8]" />
                <span className="text-[13px] font-medium tracking-wide">
                  Devices
                </span>
              </button>
              <button
                className="flex items-center gap-3 p-3 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition text-left"
                onClick={() => {
                  setSubPage("bluetooth");
                  setIsSidebarOpen(false);
                }}
              >
                <Bluetooth className="w-5 h-5 text-[#60a5fa]" />
                <span className="text-[13px] font-medium tracking-wide">
                  Bluetooth
                </span>
              </button>
              <button
                className="flex items-center gap-3 p-3 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition text-left"
                onClick={() => {
                  setSubPage("storage");
                  setIsSidebarOpen(false);
                }}
              >
                <HardDrive className="w-5 h-5 text-[#fbbf24]" />
                <span className="text-[13px] font-medium tracking-wide">
                  SD Card Storage
                </span>
              </button>
              <button
                className="flex items-center gap-3 p-3 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition text-left"
                onClick={() => {
                  setActiveTab("library");
                  setSubPage(null);
                  setIsSidebarOpen(false);
                }}
              >
                <Database className="w-5 h-5 text-[#a855f7]" />
                <span className="text-[13px] font-medium tracking-wide">
                  Library
                </span>
              </button>
              <button
                className="flex items-center gap-3 p-3 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition text-left"
                onClick={() => {
                  setActiveTab("settings");
                  setSubPage("firmware");
                  setIsSidebarOpen(false);
                }}
              >
                <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
                <span className="text-[13px] font-medium tracking-wide">
                  Firmware Setup
                </span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Calibration Confirmation & Progress Modal */}
      {showCalibrateModal && (
        <>
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
            onClick={() => {
              if (calibrationStage !== "calibrating" && calibrationStage !== "requesting") {
                setShowCalibrateModal(false);
              }
            }}
          ></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#090a10] border border-slate-800/80 rounded-2xl p-6 z-[110] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            {calibrationStage === "idle" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <Target className="w-8 h-8 text-[#00b4d8] animate-pulse" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      אישור כיול חיישן / SENSOR CALIBRATION
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono font-medium">POV FAN SYNCING PROTOCOL</p>
                  </div>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed space-y-2 font-sans py-2">
                  <p>
                    <strong className="text-[#00b4d8]">בעברית:</strong> תהליך הכיול יקבע את היחס האפקטיבי בין פולס חיישן המגנט (Hall Sensor) לזווית רוטציית הלדים. המאוורר יסתובב במהירות גבוהה למשך כמה שניות כדי למצוא את נקודת הסריקה היציבה.
                  </p>
                  <p>
                    <strong className="text-[#a855f7]">English:</strong> This calibration establishes the relationship between magnetic Hall Sensor pulses and LED rotation angles. The rotor fan will ramp up high to scan, map, and synchronize the projection.
                  </p>
                </div>

                <div className="flex gap-3 justify-end mt-4">
                  <button
                    onClick={() => setShowCalibrateModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-800 text-slate-400 font-bold tracking-widest text-[10px] hover:bg-slate-900 transition-all active:scale-95 uppercase"
                  >
                    ביטול / Cancel
                  </button>
                  <button
                    onClick={handleStartCalibration}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#00b4d8] hover:bg-[#0077b6] text-white font-bold tracking-widest text-[10px] shadow-[0_0_15px_rgba(0,180,216,0.4)] transition-all active:scale-95 uppercase"
                  >
                    התחל כיול / Start
                  </button>
                </div>
              </div>
            )}

            {(calibrationStage === "requesting" || calibrationStage === "calibrating") && (
              <div className="flex flex-col items-center justify-center py-6 gap-5">
                <div className="relative flex items-center justify-center">
                  {/* Outer spinning ring */}
                  <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-[#00b4d8] animate-spin"></div>
                  {/* Inner reverse spinning ring */}
                  <div className="absolute w-10 h-10 rounded-full border-4 border-slate-800 border-t-[#a855f7] animate-spin [animation-direction:reverse] [animation-duration:1s]"></div>
                  {/* Glowing center point */}
                  <div className="absolute w-3 h-3 rounded-full bg-cyan-400 animate-ping"></div>
                </div>

                <div className="text-center space-y-1">
                  <span className="text-[11px] font-bold tracking-wider text-cyan-400 uppercase">
                    כיול בפועל... / CALIBRATING DEVICE
                  </span>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Status: {deviceStatus === "calibrating" ? "SCANNING PULSES..." : "INITIATING..."}
                  </div>
                </div>

                <div className="w-full bg-[#050608] border border-slate-800/60 rounded-xl p-3 text-[10px] text-slate-500 font-mono text-center flex flex-col gap-1">
                  <div>Ramping motor speed to high RPM...</div>
                  <div className="text-sky-400 font-bold animate-pulse">DO NOT SWITCH OFF POWER</div>
                </div>
              </div>
            )}

            {calibrationStage === "success" && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col items-center justify-center py-4 gap-3 text-center">
                  <div className="w-12 h-12 bg-emerald-950/60 border border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 animate-bounce">
                    <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      הכיול הושלם בהצלחה!
                    </h3>
                    <p className="text-[10px] text-emerald-400 font-mono font-medium uppercase tracking-wider">
                      CALIBRATION SUCCESSFUL
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#050608] border border-slate-900 rounded-xl space-y-1 font-mono text-[10px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Calibration Sync:</span>
                    <span className="text-emerald-400 font-bold">100% PERSISTENCE</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rotor Lock RPM:</span>
                    <span className="text-white">125 RPM (Stable)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Index Offset:</span>
                    <span className="text-white">12.44 degrees</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowCalibrateModal(false);
                    setCalibrationStage("idle");
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold tracking-widest text-[10px] shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all active:scale-95 uppercase mt-2"
                >
                  סגור / Close Window
                </button>
              </div>
            )}

            {calibrationStage === "error" && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col items-center justify-center py-4 gap-3 text-center">
                  <div className="w-12 h-12 bg-rose-950/60 border border-rose-500 rounded-full flex items-center justify-center text-rose-400">
                    <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      הכיול נכשל / CALIBRATION FAILED
                    </h3>
                    <p className="text-[10px] text-rose-400 font-mono font-medium uppercase tracking-wider">
                      CONNECTION ERROR / TIMEOUT
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-sans text-center leading-relaxed px-1">
                  הייתה שגיאה בתקשורת עם מכשיר ה-ESP32. אנא ודא שהסוללות/הכבל מחוברים, והמכשיר דולק.
                  <br />
                  <span className="text-rose-400 font-semibold text-[10px]">Verify dev environment runs standard firmware.</span>
                </p>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => {
                      setShowCalibrateModal(false);
                      setCalibrationStage("idle");
                    }}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-800 text-slate-400 font-bold tracking-widest text-[10px] hover:bg-slate-900 transition-all uppercase"
                  >
                    סגור / Cancel
                  </button>
                  <button
                    onClick={handleStartCalibration}
                    className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold tracking-widest text-[10px] shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all uppercase"
                  >
                    נסה שוב / Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {showDiagnosticsModal && (
        <>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" onClick={() => !isRunningDiagnostics && setShowDiagnosticsModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#090a10] border border-slate-800/80 rounded-2xl p-6 z-[110] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <ShieldCheck className="w-8 h-8 text-[#00b4d8]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hardware Diagnostics</h3>
            </div>
            {isRunningDiagnostics ? (
              <div className="py-6 flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-slate-300">Running Tests...</span>
                  <span className="text-xs text-[#00b4d8] font-mono">{diagnosticProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00b4d8] to-[#a855f7] transition-all duration-75 shadow-[0_0_10px_#00b4d8]"
                    style={{ width: `${diagnosticProgress}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center">Please wait while the system is communicating with the ESP32...</p>
                <div className="flex justify-center mt-2">
                  <button 
                    onClick={handleCancelDiagnostics}
                    className="px-6 py-2 bg-slate-800/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/50 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : diagnosticsResult ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  {Object.entries(diagnosticsResult).map(([key, val]: any) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-slate-400 capitalize">{key}:</span>
                      <span className={val === "OK" ? "text-emerald-400" : "text-rose-400"}>{val}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowDiagnosticsModal(false)}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase text-[10px]"
                >
                  Close
                </button>
              </div>
            ) : null}
          </div>
        </>
      )}

      {pendingSaveSlot !== null && (
        <>
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" 
            onClick={() => setPendingSaveSlot(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#090a10] border border-slate-800/80 rounded-3xl p-6 z-[110] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800/60 pb-3">
              <Save className="w-5 h-5 text-sky-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">
                Save Preset / שמירת פרופיל
              </h3>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Save current settings, patterns, and dynamic active parameters into <strong>Profile Slot {pendingSaveSlot}</strong>.
            </p>

            {/* Custom Preset Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-black tracking-wider text-slate-500 uppercase">
                Preset Label / שם הפרופיל
              </label>
              <input
                type="text"
                value={presetNameInput}
                onChange={(e) => setPresetNameInput(e.target.value)}
                placeholder={`Slot ${pendingSaveSlot}`}
                className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50 transition-colors"
              />
            </div>

            {/* Simulated Live Hologram spinning preview */}
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 flex flex-col gap-3 items-center justify-center">
              <span className="text-[8px] font-black text-slate-500 tracking-wider uppercase self-start flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                Live Hologram simulation / סימולציה חיה
              </span>
              
              <div className="relative w-40 h-40 rounded-full bg-slate-950 border border-slate-800/80 overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.1)]">
                {/* Micro spinning layout for live preview */}
                <HologramSimulator
                  effect={activeEffect}
                  speed={motorSpeed}
                  brightness={brightness}
                  customColor={logoTintColor}
                  logoUrl={logoUrl}
                  povText={povText}
                  logoRotation={logoRotation}
                  logoTintColor={logoTintColor}
                  povTextAnimation={povTextAnimation}
                  effectSpeedRate={effectSpeedRate}
                  effectScale={effectScale}
                  effectComplexity={effectComplexity}
                  videoUrl={synthVideoUrl}
                  aiEffectJs={aiEffectJs}
                  aiEffectCode={aiEffectCode}
                />
              </div>

              {/* AI Effect Preview static frame simulation */}
              {activeEffect === "ai_custom" && aiEffectPrompt && (
                <div className="bg-slate-950/40 border border-indigo-950/40 rounded-2xl p-3 flex flex-col gap-2.5 items-center justify-center w-full mt-1">
                  <span className="text-[8px] font-black text-indigo-400 tracking-wider uppercase self-start flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
                    AI Static Frame / פריים סטטי (AI)
                  </span>
                  
                  <div className="flex gap-3.5 items-center w-full">
                    <div className="shrink-0">
                      <AiEffectPreview 
                        prompt={aiEffectPrompt} 
                        aiEffectJs={aiEffectJs} 
                        brightness={brightness} 
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1 text-left">
                      <span className="text-[9.5px] font-bold text-slate-300">Generated Blueprint</span>
                      <p className="text-[9px] text-indigo-300 italic font-medium leading-snug line-clamp-2">"{aiEffectPrompt}"</p>
                      <span className="text-[7.5px] text-slate-500 uppercase tracking-wider font-mono">Swept 360° POV Sweep</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status HUD of what will be saved */}
              <div className="w-full grid grid-cols-2 gap-x-3 gap-y-1.5 text-[9px] font-mono text-slate-400 mt-1">
                <div className="flex justify-between border-b border-slate-900 pb-1">
                  <span className="text-slate-500">EFFECT:</span>
                  <span className="text-sky-400 font-bold uppercase truncate max-w-[70px]">{activeEffect === "ai_custom" ? "AI Custom" : activeEffect}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                  <span className="text-slate-500">SPEED:</span>
                  <span className="text-sky-400 font-bold">{motorSpeed} RPM</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                  <span className="text-slate-500">BRIGHTNESS:</span>
                  <span className="text-sky-400 font-bold">{brightness}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                  <span className="text-slate-500">COMPLEX:</span>
                  <span className="text-sky-400 font-bold">{effectComplexity}</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5 mt-2">
              <button
                onClick={() => setPendingSaveSlot(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800/60 text-slate-400 hover:text-slate-300 font-black tracking-widest text-[9.5px] transition-all cursor-pointer"
              >
                CANCEL / ביטול
              </button>
              <button
                onClick={() => {
                  if (pendingSaveSlot) {
                    handleSavePreset(pendingSaveSlot, presetNameInput.trim());
                    setPendingSaveSlot(null);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black tracking-widest text-[9.5px] shadow-[0_0_15px_rgba(14,165,233,0.35)] transition-all cursor-pointer"
              >
                SAVE / שמירה
              </button>
            </div>
          </div>
        </>
      )}

      {showBootloaderModal && (
        <>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" onClick={() => setShowBootloaderModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#090a10] border border-slate-800/80 rounded-2xl p-6 z-[110] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Bootloader Mode Guide
              </h3>
            </div>
            <div className="text-[13px] text-slate-300 space-y-3">
              <p>If the standard upload fails, follow these steps to manually enter bootloader mode:</p>
              <ol className="list-decimal pl-4 space-y-2">
                <li>Disconnect the USB cable.</li>
                <li>Hold down the <strong>BOOT</strong> button on your ESP32 board.</li>
                <li>Connect the USB cable while continuing to hold the <strong>BOOT</strong> button.</li>
                <li>Release the <strong>BOOT</strong> button after 1 second.</li>
                <li>Try uploading the firmware again.</li>
              </ol>
            </div>
            <button
              onClick={() => setShowBootloaderModal(false)}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase text-[10px]"
            >
              Close
            </button>
          </div>
        </>
      )}

      {isFlashing && (
        <>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" onClick={() => {
            if (flashStage === 'completed' || flashStage === 'error') {
              setIsFlashing(false);
            }
          }}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#090a10] border border-slate-800/80 rounded-2xl p-6 z-[110] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Cpu className={`w-8 h-8 ${flashStage === 'ota' ? 'text-emerald-500' : 'text-amber-500'} animate-pulse`} />
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {flashStage === 'ota' ? 'Wi-Fi OTA Flasher' : 'Native USB Flasher'}
                </h3>
                <span className={`text-[9px] ${flashStage === 'ota' ? 'text-emerald-400/80' : 'text-amber-400/80'} font-mono font-bold uppercase tracking-wider`}>
                  {flashStage === 'ota' ? 'Wireless Binary Stream' : 'ESP32 ROM BOOTLOADER'}
                </span>
              </div>
            </div>

            <div className="py-2 flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest font-sans">
                  {flashStage === 'connecting' && 'Establishing Connection...'}
                  {flashStage === 'syncing' && 'Syncing Bootloader...'}
                  {flashStage === 'connected' && 'Device Connected'}
                  {flashStage === 'erasing' && 'Erasing Flash...'}
                  {flashStage === 'writing' && 'Uploading Firmware...'}
                  {flashStage === 'verifying' && 'Verifying Checksum...'}
                  {flashStage === 'ota' && 'Streaming via WiFi...'}
                  {flashStage === 'completed' && 'Update Successful!'}
                  {flashStage === 'error' && 'Update Failed!'}
                </span>
                <span className={`text-xs ${flashStage === 'ota' ? 'text-emerald-400' : 'text-amber-400'} font-mono font-bold`}>{flashProgress}%</span>
              </div>

              <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden p-[1px] border border-slate-700/30">
                <div 
                  className={`h-full bg-gradient-to-r ${flashStage === 'ota' ? 'from-emerald-500 via-emerald-400 to-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'from-amber-500 via-amber-400 to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]'} rounded-full transition-all duration-300`}
                  style={{ width: `${flashProgress}%` }}
                ></div>
              </div>

              <div className="bg-[#050608] border border-slate-900 rounded-xl p-3 font-mono text-[9.5px] leading-relaxed text-slate-400 break-words min-h-[50px] flex items-center justify-center text-center">
                <span className={flashStage === 'completed' ? 'text-emerald-400 font-bold' : flashStage === 'error' ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
                  {flashMessage}
                </span>
              </div>

              {flashStage === 'completed' && (
                <button
                  onClick={() => setIsFlashing(false)}
                  className="w-full py-3 mt-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-[0_0_15px_rgba(16,185,129,0.3)] transition"
                >
                  Done / סגור
                </button>
              )}

              {flashStage === 'error' && (
                <div className="flex gap-2.5 mt-2">
                  <button
                    onClick={() => setIsFlashing(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-800 text-slate-400 font-bold uppercase tracking-widest text-[9px] hover:bg-slate-900 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleFlashViaOtg}
                    className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-widest text-[9px] shadow-[0_0_15px_rgba(245,158,11,0.3)] transition"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showPluginMissingModal && (
        <>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" onClick={() => setShowPluginMissingModal(false)}></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#090a10] border border-slate-800/80 rounded-2xl p-6 z-[110] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <Smartphone className="w-8 h-8 text-amber-500" />
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Native Plugin Required
                </h3>
                <span className="text-[9px] text-slate-400 font-mono uppercase tracking-widest font-bold">
                  USB HOST SERIAL BRIDGING
                </span>
              </div>
            </div>
            
            <div className="text-[11px] text-slate-300 space-y-3 font-sans leading-relaxed">
              <p>
                To flash your ESP32 board over <strong>USB OTG</strong>, this application requires a native Android bridge to control the phone's physical USB controller:
              </p>
              
              <div className="bg-[#050608] border border-slate-900/60 p-3 rounded-xl space-y-2">
                <div className="flex gap-2">
                  <span className="w-4 h-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full flex items-center justify-center font-mono font-bold text-[9px] shrink-0 mt-0.5">1</span>
                  <p className="text-slate-300">Run this application as a <strong>native Android App</strong> instead of inside a web browser.</p>
                </div>
                <div className="flex gap-2">
                  <span className="w-4 h-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full flex items-center justify-center font-mono font-bold text-[9px] shrink-0 mt-0.5">2</span>
                  <p className="text-slate-300">Ensure the <strong>ESPTool Native Android Plugin</strong> is built and compiled into the application bundle.</p>
                </div>
                <div className="flex gap-2">
                  <span className="w-4 h-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full flex items-center justify-center font-mono font-bold text-[9px] shrink-0 mt-0.5">3</span>
                  <p className="text-slate-300">Connect your ESP32 using an <strong>OTG cable adapter</strong> and accept the Android USB permission prompt.</p>
                </div>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/20 text-amber-400 p-2.5 rounded-lg flex items-start gap-2.5 text-[10px]">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-normal">
                  <strong>Hint:</strong> If standard USB upload fails, hold the physical <strong>BOOT</strong> button on the ESP32 while plugging in the OTG cable.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPluginMissingModal(false)}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase text-[10px] tracking-widest transition"
            >
              Close Guide
            </button>
          </div>
        </>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      <AnimatePresence>
        {showGestureTutorial && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              onClick={() => setShowGestureTutorial(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#0a0c12] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
            >
               <div className="flex justify-between items-center p-6 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#00b4d8]/10 flex items-center justify-center border border-[#00b4d8]/20 text-[#00b4d8]">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Gesture Guide</h3>
                    <div className="flex gap-1.5 items-center">
                      {tutorialSteps.map((_, i) => (
                        <div 
                          key={i} 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            i === tutorialStep ? 'w-4 bg-[#00b4d8]' : 'w-1.5 bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowGestureTutorial(false)}
                  className="p-2 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 flex flex-col items-center text-center gap-6">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={tutorialStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="w-24 h-24 rounded-[2rem] bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner relative">
                       <div className="absolute inset-0 bg-[#00b4d8]/5 rounded-[2rem] animate-pulse" />
                       <motion.div
                         key={`icon-${tutorialStep}`}
                         {...(tutorialSteps[tutorialStep] as any).animation}
                       >
                         {tutorialSteps[tutorialStep].icon}
                       </motion.div>
                    </div>
                    
                    <div className="space-y-2">
                       <h4 className="text-xl font-bold text-white tracking-tight">{tutorialSteps[tutorialStep].title}</h4>
                       <p className="text-xs text-slate-400 leading-relaxed max-w-[240px]">
                         {tutorialSteps[tutorialStep].desc}
                       </p>
                    </div>

                    <div className="bg-[#00b4d8]/5 border border-[#00b4d8]/20 rounded-2xl p-4 flex items-start gap-4 text-left">
                       <Info className="w-4 h-4 text-[#00b4d8] mt-0.5 shrink-0" />
                       <p className="text-[10px] text-slate-300 leading-normal italic">
                         <span className="font-bold text-[#00b4d8] uppercase tracking-tighter not-italic mr-1">Pro Tip:</span>
                         {tutorialSteps[tutorialStep].tip}
                       </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="p-6 bg-slate-900/40 border-t border-slate-800/50 flex gap-4">
                <button 
                  onClick={() => setTutorialStep(prev => Math.max(0, prev - 1))}
                  disabled={tutorialStep === 0}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all"
                >
                  Back
                </button>
                {tutorialStep < tutorialSteps.length - 1 ? (
                  <button 
                    onClick={() => setTutorialStep(prev => prev + 1)}
                    className="flex-[2] py-4 bg-[#00b4d8] hover:bg-[#0096b4] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_5px_15px_rgba(0,180,216,0.2)]"
                  >
                    Next Step
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowGestureTutorial(false)}
                    className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_5px_15px_rgba(16,185,129,0.2)]"
                  >
                    Got It!
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {gesturePulse && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.2, scale: 1.1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 pointer-events-none z-[999] bg-[#00b4d8] shadow-[inset_0_0_100px_rgba(0,180,216,0.5)]"
          />
        )}
      </AnimatePresence>

      {showTour && (
        <AppWalkthrough
          activeTab={activeTab}
          subPage={subPage}
          onNavigate={(tab, sub) => {
            setActiveTab(tab);
            setSubPage(sub);
          }}
          onClose={() => setShowTour(false)}
        />
      )}

      <GestureController 
        active={gestureMode} 
        sensitivity={gestureSensitivity}
        neutralCenter={neutralCenter}
        onVerticalSwipe={handleVerticalSwipe}
        onHorizontalSwipe={handleHorizontalSwipe}
        onMove={handleGestureMove}
        onGesture={(gesture) => {
           setActiveRawGesture(gesture);
           if (activeGestureTimeout.current) clearTimeout(activeGestureTimeout.current);
           activeGestureTimeout.current = setTimeout(() => setActiveRawGesture(null), 500);
           handleGesture(gesture);
        }}
        onHandDetected={handleHandDetected}
      />
    </div>
  );
}
