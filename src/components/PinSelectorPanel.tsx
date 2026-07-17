import React, { useState } from "react";
import { Esp32Board } from "./Esp32Board";
import { 
  Settings, 
  Cpu, 
  Check, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  ArrowLeft,
  Sliders,
  Sparkles,
  Layers,
  Activity,
  Music,
  HardDrive
} from "lucide-react";

interface PinSelectorPanelProps {
  state: any;
  setState: React.Dispatch<React.SetStateAction<any>>;
  onBack: () => void;
}

// Lists of available/functional GPIO pins for classic ESP32
const ALL_GPIO_PINS = [
  { val: 2, label: "GPIO 2 (Onboard LED)" },
  { val: 4, label: "GPIO 4" },
  { val: 5, label: "GPIO 5" },
  { val: 12, label: "GPIO 12" },
  { val: 13, label: "GPIO 13" },
  { val: 14, label: "GPIO 14" },
  { val: 15, label: "GPIO 15" },
  { val: 16, label: "GPIO 16" },
  { val: 17, label: "GPIO 17" },
  { val: 18, label: "GPIO 18" },
  { val: 19, label: "GPIO 19" },
  { val: 21, label: "GPIO 21" },
  { val: 22, label: "GPIO 22" },
  { val: 23, label: "GPIO 23" },
  { val: 25, label: "GPIO 25" },
  { val: 26, label: "GPIO 26" },
  { val: 27, label: "GPIO 27" },
  { val: 32, label: "GPIO 32 (ADC)" },
  { val: 33, label: "GPIO 33 (ADC)" },
  { val: 34, label: "GPIO 34 (Input-only)" },
  { val: 35, label: "GPIO 35 (Input-only)" },
  { val: 36, label: "GPIO 36 (Input-only)" },
  { val: 39, label: "GPIO 39 (Input-only)" }
];

const INPUT_ONLY_PINS = [34, 35, 36, 39];
const FLASH_PINS = [6, 7, 8, 9, 10, 11];

export const PinSelectorPanel: React.FC<PinSelectorPanelProps> = ({ state, setState, onBack }) => {
  const [selectedPreset, setSelectedPreset] = useState<"custom" | "classic" | "s3" | "c3">("custom");
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [selectionTarget, setSelectionTarget] = useState<"led" | "motor" | "hall" | "mic" | null>(null);

  // Helper to extract numeric pins
  const parseLedPins = (pinStr: string): number[] => {
    return pinStr
      .split(",")
      .map(p => parseInt(p.trim(), 10))
      .filter(p => !isNaN(p));
  };

  const ledPinsArray = parseLedPins(state.led.pins);
  const motorPin = parseInt(state.motor.pin, 10);
  const sensorPin = parseInt(state.sync.sensorPin, 10);
  const adcPin = parseInt(state.sync.adcPin || "32", 10);

  const handleBoardPinClick = (pin: any) => {
    if (!selectionTarget) return;

    const gpioNum = parseInt(pin.gpio.replace("GPIO", ""), 10);
    if (isNaN(gpioNum)) return;

    if (selectionTarget === "led") {
      const current = parseLedPins(state.led.pins);
      if (!current.includes(gpioNum)) {
        handlePinChange("led", "pins", state.led.pins ? `${state.led.pins}, ${gpioNum}` : `${gpioNum}`);
      }
    } else if (selectionTarget === "motor") {
      handlePinChange("motor", "pin", gpioNum);
    } else if (selectionTarget === "hall") {
      handlePinChange("sync", "sensorPin", gpioNum);
    } else if (selectionTarget === "mic") {
      handlePinChange("sync", "adcPin", gpioNum);
    }
    
    setSelectionTarget(null);
  };

  // Validate current mapping configuration
  const conflicts: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check duplicate pin assignments
  const pinMap: Record<number, string> = {};
  
  ledPinsArray.forEach((pin, i) => {
    if (pinMap[pin]) {
      conflicts.push(`GPIO ${pin} is assigned to both ${pinMap[pin]} and LED Strip ${i + 1}`);
    } else {
      pinMap[pin] = `LED Strip ${i + 1}`;
    }

    if (INPUT_ONLY_PINS.includes(pin)) {
      errors.push(`GPIO ${pin} is assigned to LED Strip ${i + 1}, but it is input-only and cannot drive LEDs.`);
    }
  });

  if (pinMap[motorPin]) {
    conflicts.push(`GPIO ${motorPin} is assigned to both ${pinMap[motorPin]} and Motor Control`);
  } else {
    pinMap[motorPin] = "Motor Control";
  }

  if (INPUT_ONLY_PINS.includes(motorPin)) {
    errors.push(`GPIO ${motorPin} is assigned to Motor, but it is input-only and cannot output PWM signal.`);
  }

  if (pinMap[sensorPin]) {
    conflicts.push(`GPIO ${sensorPin} is assigned to both ${pinMap[sensorPin]} and Hall Sensor`);
  } else {
    pinMap[sensorPin] = "Hall Sensor";
  }

  if (pinMap[adcPin]) {
    conflicts.push(`GPIO ${adcPin} is assigned to both ${pinMap[adcPin]} and Analog Microphone`);
  } else {
    pinMap[adcPin] = "Analog Microphone";
  }

  // Preset Applicator
  const applyPreset = (presetType: "classic" | "s3" | "c3") => {
    setSelectedPreset(presetType);
    let ledPins = "25, 26";
    let mPin = 12;
    let sPin = 27;
    let aPin = 32;

    if (presetType === "s3") {
      ledPins = "15, 16";
      mPin = 17;
      sPin = 18;
      aPin = 1;
    } else if (presetType === "c3") {
      ledPins = "4, 5";
      mPin = 6;
      sPin = 7;
      aPin = 2;
    }

    setState((prev: any) => {
      const updated = {
        ...prev,
        led: { ...prev.led, pins: ledPins },
        motor: { ...prev.motor, pin: mPin },
        sync: { ...prev.sync, sensorPin: sPin, adcPin: aPin }
      };
      localStorage.setItem("holospin_state", JSON.stringify(updated));
      return updated;
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handlePinChange = (category: "led" | "motor" | "sync", key: string, value: any) => {
    setSelectedPreset("custom");
    setState((prev: any) => {
      const updated = {
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value
        }
      };
      localStorage.setItem("holospin_state", JSON.stringify(updated));
      return updated;
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1500);
  };

  // Build list of all active pins to highlight on the ESP32Board component
  const allActivePins = [
    ...ledPinsArray.map(p => String(p)),
    String(motorPin),
    String(sensorPin),
    String(adcPin)
  ];

  return (
    <div className="px-5 pt-2 pb-28 flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 border border-slate-800 rounded-xl bg-slate-900/50 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h3 className="text-[13px] text-slate-200 font-black tracking-widest uppercase flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            GPIO Pin Mapper & Controller / הגדרת פינים אינטראקטיבית
          </h3>
          <p className="text-[10px] text-slate-500">Configure ESP32 hardware assignments with real-time visual feedback</p>
        </div>
      </div>

      {/* Preset Fast Selector */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 flex flex-col gap-3.5">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          Hardware Board Preset / תבניות פינים מוכנות מראש
        </span>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => applyPreset("classic")}
            className={`py-2.5 px-3 rounded-2xl text-[10px] font-bold tracking-wider transition-all border ${
              selectedPreset === "classic"
                ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200"
            }`}
          >
            ESP32 WROOM / Classic
          </button>
          <button
            onClick={() => applyPreset("s3")}
            className={`py-2.5 px-3 rounded-2xl text-[10px] font-bold tracking-wider transition-all border ${
              selectedPreset === "s3"
                ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200"
            }`}
          >
            ESP32-S3 Core
          </button>
          <button
            onClick={() => applyPreset("c3")}
            className={`py-2.5 px-3 rounded-2xl text-[10px] font-bold tracking-wider transition-all border ${
              selectedPreset === "c3"
                ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200"
            }`}
          >
            ESP32-C3 Mini
          </button>
        </div>

        {/* ESP32 WROOM Specific Notes */}
        <div className="mt-2 bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[10.5px] font-black text-indigo-300 uppercase tracking-wider">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            ESP32-WROOM Configuration Guide / מדריך לחומרת WROOM
          </div>
          <p className="text-[10.5px] text-slate-400 leading-relaxed">
            Your <strong>ESP32-WROOM</strong> (WROOM-32 / WROOM-32D / WROOM-32E) is the standard dual-core ESP32 microcontroller. The optimal pin mapping has been automatically loaded below:
          </p>
          <div className="grid grid-cols-2 gap-3 mt-1.5 text-[10px] font-mono text-slate-300">
            <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50">
              <span className="text-[8px] text-purple-400 font-black block uppercase tracking-wider">LED STRIPS</span>
              GPIO 25 & 26 (High speed DAC)
            </div>
            <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50">
              <span className="text-[8px] text-sky-400 font-black block uppercase tracking-wider">MOTOR SPEED</span>
              GPIO 12 (PWM speed control)
            </div>
            <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50">
              <span className="text-[8px] text-amber-400 font-black block uppercase tracking-wider">HALL SENSOR</span>
              GPIO 27 (Hardware Interrupt)
            </div>
            <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50">
              <span className="text-[8px] text-pink-400 font-black block uppercase tracking-wider">MICROPHONE ADC</span>
              GPIO 32 (Analog sampling)
            </div>
          </div>
          <p className="text-[9.5px] text-slate-500 italic mt-1">
            ⚠️ <strong>Pro-Tip:</strong> Avoid using GPIOs 6-11 (connected to the internal flash storage) and GPIOs 34-39 (which are strictly input-only and cannot drive LEDs or motors).
          </p>
        </div>
      </div>

      {/* Validation Feedback */}
      {conflicts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3 text-amber-400 text-[11px] leading-relaxed">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <strong className="uppercase tracking-wide font-black text-[10px]">Pin Conflicts Detected / התנגשות פינים</strong>
            <ul className="list-disc pl-4 space-y-1">
              {conflicts.map((conf, idx) => <li key={idx}>{conf}</li>)}
            </ul>
          </div>
        </div>
      )}

      {errors.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex gap-3 text-rose-400 text-[11px] leading-relaxed">
          <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <strong className="uppercase tracking-wide font-black text-[10px]">Invalid Mappings / שגיאות חיווט קריטיות</strong>
            <ul className="list-disc pl-4 space-y-1">
              {errors.map((err, idx) => <li key={idx}>{err}</li>)}
            </ul>
          </div>
        </div>
      )}

      {conflicts.length === 0 && errors.length === 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 px-4 rounded-2xl flex items-center gap-2.5 text-emerald-400 text-[11px] font-bold">
          <Check className="w-4 h-4" />
          <span>All selected pins mapped correctly and isolated successfully! / כל הפינים תקינים ומבודדים</span>
          {saveSuccess && (
            <span className="ml-auto text-[9px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300 font-mono tracking-widest uppercase">
              AUTO-SAVED
            </span>
          )}
        </div>
      )}

      {/* Form Grid Pin Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* LED strip pin assignment */}
        <div className="bg-[#0c0e15]/50 border border-slate-800/50 rounded-3xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <Layers className="w-4 h-4 text-purple-400" />
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase text-slate-200 tracking-wider">LED Data Pin Mapping</span>
              <span className="text-[9px] text-slate-500">Supports comma separation for parallel output</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Assigned LED Data Pins:
              </label>
              <button 
                onClick={() => setSelectionTarget(selectionTarget === "led" ? null : "led")}
                className={`text-[9px] px-2 py-1 rounded-lg border transition-all ${selectionTarget === "led" ? 'bg-purple-500 border-purple-400 text-white animate-pulse' : 'bg-slate-900 border-slate-800 text-purple-400 hover:bg-slate-800'}`}
              >
                {selectionTarget === "led" ? "CLICK PIN ON BOARD..." : "PICK FROM BOARD"}
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-purple-500/60"
                value={state.led.pins}
                onChange={(e) => handlePinChange("led", "pins", e.target.value)}
                placeholder="e.g. 25, 26"
              />
              <div className="flex gap-1">
                <button
                  onClick={() => handlePinChange("led", "pins", "25, 26")}
                  className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 px-2.5 rounded-xl text-[10px] font-mono"
                >
                  Classic (25, 26)
                </button>
                <button
                  onClick={() => handlePinChange("led", "pins", "15, 16")}
                  className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 px-2.5 rounded-xl text-[10px] font-mono"
                >
                  S3 (15, 16)
                </button>
              </div>
            </div>
          </div>

          <p className="text-[10.5px] text-slate-400 leading-normal">
            For multi-arm fans (e.g., 2 strips), separate pins with a comma. This configures the ESP32 to push high-speed frame buffers to multiple strips in parallel using DMA channels.
          </p>
        </div>

        {/* Motor controller pin assignment */}
        <div className="bg-[#0c0e15]/50 border border-slate-800/50 rounded-3xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <Activity className="w-4 h-4 text-sky-400" />
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase text-slate-200 tracking-wider">Motor PWM Control Pin</span>
              <span className="text-[9px] text-slate-500">Transmits PWM duty cycle to gate driver</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select PWM Pin:
              </label>
              <button 
                onClick={() => setSelectionTarget(selectionTarget === "motor" ? null : "motor")}
                className={`text-[9px] px-2 py-1 rounded-lg border transition-all ${selectionTarget === "motor" ? 'bg-sky-500 border-sky-400 text-white animate-pulse' : 'bg-slate-900 border-slate-800 text-sky-400 hover:bg-slate-800'}`}
              >
                {selectionTarget === "motor" ? "CLICK PIN ON BOARD..." : "PICK FROM BOARD"}
              </button>
            </div>
            <select
              value={state.motor.pin}
              onChange={(e) => handlePinChange("motor", "pin", parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-sky-500/60"
            >
              {ALL_GPIO_PINS.filter(p => !INPUT_ONLY_PINS.includes(p.val)).map(pin => (
                <option key={pin.val} value={pin.val}>
                  GPIO {pin.val} {pin.val === 12 ? "(Classic Default)" : pin.val === 17 ? "(S3 Default)" : pin.val === 6 ? "(C3 Default)" : ""}
                </option>
              ))}
            </select>
          </div>

          <p className="text-[10.5px] text-slate-400 leading-normal">
            The PWM pin outputs a high-frequency square wave (e.g. 5000Hz) to regulate the speed of the BLDC fan motor. High-speed pins like GPIO 12 or 17 are recommended.
          </p>
        </div>

        {/* Hall Sensor pin assignment */}
        <div className="bg-[#0c0e15]/50 border border-slate-800/50 rounded-3xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase text-slate-200 tracking-wider">Hall Effect Sensor Pin</span>
              <span className="text-[9px] text-slate-500">Listens for magnets to calculate speed & position</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Interrupt Pin:
              </label>
              <button 
                onClick={() => setSelectionTarget(selectionTarget === "hall" ? null : "hall")}
                className={`text-[9px] px-2 py-1 rounded-lg border transition-all ${selectionTarget === "hall" ? 'bg-amber-500 border-amber-400 text-white animate-pulse' : 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'}`}
              >
                {selectionTarget === "hall" ? "CLICK PIN ON BOARD..." : "PICK FROM BOARD"}
              </button>
            </div>
            <select
              value={state.sync.sensorPin}
              onChange={(e) => handlePinChange("sync", "sensorPin", parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-amber-500/60"
            >
              {ALL_GPIO_PINS.map(pin => (
                <option key={pin.val} value={pin.val}>
                  GPIO {pin.val} {pin.val === 27 ? "(Classic Default)" : pin.val === 18 ? "(S3 Default)" : pin.val === 7 ? "(C3 Default)" : ""}
                </option>
              ))}
            </select>
          </div>

          <p className="text-[10.5px] text-slate-400 leading-normal">
            This pin is configured as an hardware interrupt. Whenever the fan completes a rotation and passes the magnet, it triggers an ISR to synchronize the rendering frame.
          </p>
        </div>

        {/* Audio Mic pin assignment */}
        <div className="bg-[#0c0e15]/50 border border-slate-800/50 rounded-3xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
            <Music className="w-4 h-4 text-pink-400" />
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase text-slate-200 tracking-wider">Analog Mic / Audio ADC Pin</span>
              <span className="text-[9px] text-slate-500">Converts audio voltages to flash reactive pulses</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select ADC Pin:
              </label>
              <button 
                onClick={() => setSelectionTarget(selectionTarget === "mic" ? null : "mic")}
                className={`text-[9px] px-2 py-1 rounded-lg border transition-all ${selectionTarget === "mic" ? 'bg-pink-500 border-pink-400 text-white animate-pulse' : 'bg-slate-900 border-slate-800 text-pink-400 hover:bg-slate-800'}`}
              >
                {selectionTarget === "mic" ? "CLICK PIN ON BOARD..." : "PICK FROM BOARD"}
              </button>
            </div>
            <select
              value={state.sync.adcPin || 32}
              onChange={(e) => handlePinChange("sync", "adcPin", parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-pink-500/60"
            >
              {ALL_GPIO_PINS.filter(p => p.label.includes("ADC") || p.val === 1 || p.val === 2).map(pin => (
                <option key={pin.val} value={pin.val}>
                  GPIO {pin.val} {pin.val === 32 ? "(Classic ADC1_CH4)" : pin.val === 33 ? "(Classic ADC1_CH5)" : ""}
                </option>
              ))}
            </select>
          </div>

          <p className="text-[10.5px] text-slate-400 leading-normal">
            The music reactive visualizer relies on this pin. Connecting an analog microphone module (e.g. MAX9814) to an ADC1 channel allows fast sampling without interfering with Wi-Fi.
          </p>
        </div>

      </div>

      {/* Visual Map Render section */}
      <div className="mt-4">
        <h4 className="text-[11px] font-black uppercase text-indigo-400 tracking-widest mb-3">
          ESP32 Solder & Wiring Board Map / מפת הלחמות וחיווט של הלוח
        </h4>
        <Esp32Board 
          activePins={allActivePins} 
          ledPins={state.led.pins} 
          motorPin={state.motor.pin} 
          sensorPin={state.sync.sensorPin} 
          onPinClick={handleBoardPinClick}
        />
      </div>

    </div>
  );
};
