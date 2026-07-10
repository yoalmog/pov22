import React from "react";
import { Esp32Board } from "./Esp32Board";
import { AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";

interface Props {
  pins: string;
  strips: number;
}

// Known restricted/special ESP32 pins
const INPUT_ONLY_PINS = [34, 35, 36, 39];
const FLASH_PINS = [6, 7, 8, 9, 10, 11];
const RESERVED_STATIC = [4, 17, 18, 19, 23, 5];

export const WiringGuide: React.FC<Props> = ({ pins, strips }) => {
  const pinArray = pins.split(",").map(p => p.trim()).filter(p => p !== "");
  
  const dynamicConnections = pinArray.map((pin, i) => ({
    component: `LED Strip ${String.fromCharCode(65 + i)}`,
    pin: `GPIO ${pin}`,
    pinNum: parseInt(pin, 10)
  }));

  const staticConnections = [
    { component: "Hall Sensor", pin: "GPIO 4" },
    { component: "Motor Control", pin: "GPIO 17" },
    { component: "SD Card MOSI", pin: "GPIO 23" },
    { component: "SD Card MISO", pin: "GPIO 19" },
    { component: "SD Card SCK", pin: "GPIO 18" },
    { component: "SD Card CS", pin: "GPIO 5" },
  ];

  // Validation Logic
  const errors: string[] = [];
  const warnings: string[] = [];

  if (pinArray.length < strips) {
    errors.push(`Missing wiring: Configured for ${strips} strips, but only ${pinArray.length} pins provided.`);
  } else if (pinArray.length > strips) {
    warnings.push(`Too many pins: Configured for ${strips} strips, but ${pinArray.length} pins provided.`);
  }

  const seenPins = new Set<number>();
  dynamicConnections.forEach((conn, index) => {
    if (isNaN(conn.pinNum)) {
      errors.push(`Invalid pin number at index ${index + 1}: "${pinArray[index]}" is not a number.`);
      return;
    }
    
    if (seenPins.has(conn.pinNum)) {
      errors.push(`Duplicate pin detected: GPIO ${conn.pinNum} is assigned multiple times.`);
    }
    seenPins.add(conn.pinNum);

    if (INPUT_ONLY_PINS.includes(conn.pinNum)) {
      errors.push(`Invalid wiring: GPIO ${conn.pinNum} is an INPUT-ONLY pin and cannot drive LEDs.`);
    }
    if (FLASH_PINS.includes(conn.pinNum)) {
      errors.push(`Invalid wiring: GPIO ${conn.pinNum} is reserved for internal flash and cannot be used.`);
    }
    if (RESERVED_STATIC.includes(conn.pinNum)) {
      errors.push(`Pin conflict: GPIO ${conn.pinNum} is already reserved for core system components (Sensor/Motor/SD).`);
    }
  });

  const allConnections = [...dynamicConnections, ...staticConnections];

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-lg mx-auto">
      <h3 className="text-lg font-bold text-white mb-4">Wiring Diagram (ESP32)</h3>
      
      {errors.length > 0 && (
        <div className="mb-4 bg-red-950/40 border border-red-900 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <h4 className="text-sm font-bold text-red-400">Wiring Errors Detected</h4>
          </div>
          <ul className="list-disc list-inside text-xs text-red-300 space-y-1">
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mb-4 bg-amber-950/40 border border-amber-900/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-bold text-amber-400">Wiring Warnings</h4>
          </div>
          <ul className="list-disc list-inside text-xs text-amber-300 space-y-1">
            {warnings.map((warn, i) => <li key={i}>{warn}</li>)}
          </ul>
        </div>
      )}

      {errors.length === 0 && warnings.length === 0 && (
        <div className="mb-4 bg-emerald-950/30 border border-emerald-900/40 rounded-xl p-3 flex items-center gap-2">
           <CheckCircle2 className="w-4 h-4 text-emerald-500" />
           <span className="text-xs font-medium text-emerald-400">Wiring configuration is valid</span>
        </div>
      )}

      <div className="mb-6">
        <Esp32Board activePins={allConnections.map(c => c.pin.replace("GPIO ", ""))} />
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm text-purple-400 font-bold mb-2">LED Pinout Map</h4>
          <div className="space-y-2">
            {dynamicConnections.map((conn) => (
              <div key={conn.component} className={`flex justify-between items-center p-2 px-3 rounded-lg border ${errors.some(e => e.includes(`GPIO ${conn.pinNum}`)) ? 'bg-red-950/20 border-red-900/50' : 'bg-slate-950 border-purple-900/30'}`}>
                <span className="text-slate-300 font-mono text-xs">{conn.component}</span>
                <span className={`font-bold font-mono text-sm ${errors.some(e => e.includes(`GPIO ${conn.pinNum}`)) ? 'text-red-400' : 'text-purple-400'}`}>{conn.pin}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm text-slate-400 font-bold mb-2">System Pinout</h4>
          <div className="space-y-2">
            {staticConnections.map((conn) => (
              <div key={conn.component} className="flex justify-between items-center bg-slate-950 p-2 px-3 rounded-lg border border-slate-800">
                <span className="text-slate-300 font-mono text-xs">{conn.component}</span>
                <span className="text-slate-500 font-bold font-mono text-sm">{conn.pin}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <p className="text-xs text-slate-500 mt-4 leading-relaxed">
        Note: Ensure common ground (GND) is connected between all power sources 
        (Motor supply, LED supply, and ESP32).
      </p>
    </div>
  );
};
