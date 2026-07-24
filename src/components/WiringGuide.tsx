import * as React from "react";
import { useState } from "react";
import { Esp32Board } from "./Esp32Board";
import { AlertTriangle, XCircle, CheckCircle2, Info, ChevronDown, ChevronUp, Zap, HardDrive } from "lucide-react";

interface Props {
  pins: string;
  strips: number;
  motorPin?: string | number;
  sensorPin?: string | number;
  chipModel?: string | null;
}

// Known restricted/special ESP32 pins
const INPUT_ONLY_PINS = [34, 35, 36, 39];
const FLASH_PINS = [6, 7, 8, 9, 10, 11];

export const WiringGuide: React.FC<Props> = ({ pins, strips, motorPin, sensorPin, chipModel }) => {
  const [showWorkaround, setShowWorkaround] = useState(false);
  const [showSDGuide, setShowSDGuide] = useState(false);
  const pinArray = pins.split(",").map(p => p.trim()).filter(p => p !== "");
  
  const dynamicConnections = pinArray.map((pin, i) => ({
    component: `LED Strip ${String.fromCharCode(65 + i)}`,
    pin: `GPIO ${pin}`,
    pinNum: parseInt(pin, 10)
  }));

  const staticConnections = [
    { component: "Hall Sensor", pin: `GPIO ${sensorPin ?? 27}` },
    { component: "Motor Control", pin: `GPIO ${motorPin ?? 12}` },
    { component: "Analog Microphone (ADC)", pin: "GPIO 32" },
    { component: "SD Card MOSI", pin: "GPIO 23" },
    { component: "SD Card MISO", pin: "GPIO 19" },
    { component: "SD Card SCK", pin: "GPIO 18" },
    { component: "SD Card CS", pin: "GPIO 5" },
  ];

  const coreSystemPins = [
    parseInt(String(sensorPin ?? 27), 10),
    parseInt(String(motorPin ?? 12), 10),
    23, 19, 18, 5, 32
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
    if (coreSystemPins.includes(conn.pinNum)) {
      errors.push(`Pin conflict: GPIO ${conn.pinNum} is already reserved for core system components (Sensor/Motor/SD).`);
    }
  });

  const allConnections = [...dynamicConnections, ...staticConnections];

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-lg mx-auto">
      <h3 className="text-lg font-bold text-white mb-1">Wiring Diagram ({chipModel || "ESP32"})</h3>
      {chipModel && (
        <p className="text-xs text-amber-400 font-mono mb-4">Optimized hardware defaults active</p>
      )}
      
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
        <Esp32Board 
          activePins={allConnections.map(c => c.pin.replace("GPIO ", ""))} 
          ledPins={pins}
          motorPin={motorPin}
          sensorPin={sensorPin}
        />
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

        {/* Level Shifter Workarounds Accordion */}
        <div className="border border-cyan-500/30 rounded-xl bg-cyan-950/10 p-3 mt-4">
          <button
            onClick={() => setShowWorkaround(!showWorkaround)}
            className="w-full flex items-center justify-between text-left text-xs font-bold text-cyan-400 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>אין לי Logic Level Shifter? / No Level Shifter?</span>
            </span>
            {showWorkaround ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showWorkaround && (
            <div className="mt-3 text-xs text-slate-300 space-y-3 leading-relaxed border-t border-cyan-500/20 pt-3 animate-in fade-in slide-in-from-top-1">
              <div>
                <p className="font-semibold text-white">1. שימוש בדיודה להורדת מתח (Diode Trick):</p>
                <p className="text-slate-400 mt-1">
                  חבר דיודה רגילה (למשל 1N4001) בטור לקו ה-5V של הפיקסל הראשון בלבד (או הפס כולו). 
                  הדיודה תוריד את מתח ההזנה שלו ל-~4.3V. במתח זה, הפיקסל יזהה את האות הלוגי של ה-ESP32 (3.3V) בקלות, 
                  וישדר הלאה אות 4.3V נקי לפס הלדים.
                </p>
                <p className="text-slate-500 mt-1 italic">
                  Connect a standard diode (e.g. 1N4001) in series with the 5V power line of the first pixel to drop VCC to ~4.3V, making the 3.3V GPIO signal compatible.
                </p>
              </div>

              <div>
                <p className="font-semibold text-white">2. שיטת "הפיקסל המקריב" (Sacrificial Pixel):</p>
                <p className="text-slate-400 mt-1">
                  חתוך לד בודד והנח אותו קרוב מאוד ל-ESP32 (פחות מ-10 ס"מ). חבר את ה-VCC שלו דרך דיודה 1N4001, 
                  והזן אותו מה-GPIO. הוא ישמש כ"מתאם רמות עצמאי" ויחזק את הסיגנל לרמה מלאה עבור שאר הפס.
                </p>
                <p className="text-slate-500 mt-1 italic">
                  Place a single sacrificial pixel very close to the ESP32 (under 10cm), running at lower VCC to act as an inline driver.
                </p>
              </div>

              <div>
                <p className="font-semibold text-white">3. חוט קצר ככל הניתן (Ultra-short wire):</p>
                <p className="text-slate-400 mt-1">
                  אם אינך משתמש ברכיבים נוספים, שמור על החוט שמחבר בין יציאת ה-ESP32 לפיקסל הראשון קצר במיוחד (פחות מ-15 ס"מ). 
                  זה מפחית הפרעות ומאפשר לסיגנל לעבור בצורה תקינה ברוב המקרים.
                </p>
                <p className="text-slate-500 mt-1 italic">
                  Keep the data line wire between the ESP32 and the first pixel under 15cm to minimize voltage attenuation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* DIY SD Card Adapter Accordion */}
        <div className="border border-purple-500/30 rounded-xl bg-purple-950/10 p-4 mt-4">
          <button
            onClick={() => setShowSDGuide(!showSDGuide)}
            className="w-full flex items-center justify-between text-left text-xs font-bold text-purple-400 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <span>חיבור כרטיס SD מאולתר (Maxell Adapter) / DIY SD Card Adapter</span>
            </span>
            {showSDGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showSDGuide && (
            <div className="mt-3 text-xs text-slate-300 space-y-4 leading-relaxed border-t border-purple-500/20 pt-3 animate-in fade-in slide-in-from-top-1">
              <div className="bg-slate-950 p-3 rounded-lg border border-purple-900/40 text-[11px] text-amber-300">
                <span className="font-bold text-white block mb-1">🔍 אבחון פינים לפי הדיאגרמה שלך (SD Adapter):</span>
                במתאם ה-SD הרגיל (כמו ה-Maxell שבתמונה שלך), כשמסתכלים מאחור (המגעים פונים אליך, מגרעת אלכסונית בצד שמאל למעלה):
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-300">
                  <li><strong>פין 9</strong> הבולט נמצא לבדו בקצה השמאלי ביותר.</li>
                  <li><strong>פינים 1 עד 6</strong> הם המגעים הרחבים המרכזיים (משמאל לימין).</li>
                  <li><strong>פינים 7 ו-8</strong> הם המגעים הצרים ביותר בקצה הימני.</li>
                </ul>
                <span className="text-slate-400 italic block mt-1.5 border-t border-slate-900 pt-1.5">
                  Looking at the back of your Maxell SD Adapter (contacts facing you, notch on top-left): Pin 9 is on the far-left, pins 1-6 are the wide middle contacts (left-to-right), and pins 7-8 are the thin contacts on the far-right.
                </span>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-white text-[12px] flex items-center gap-1.5 text-purple-300">
                  <span>📋 טבלת חיווט מלאה עבור מתאם SD (במצב SPI) מול ESP32:</span>
                </p>
                <div className="grid grid-cols-1 gap-1 text-[11px] font-mono mt-1.5">
                  <div className="flex justify-between bg-slate-950 p-2 px-3 rounded border border-slate-900 text-slate-500">
                    <span>Pin 9 (Far Left / שמאל קיצוני) - DAT2</span>
                    <span>ללא חיבור / NC</span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-2 px-3 rounded border border-purple-900/30">
                    <span className="text-white font-bold">Pin 1 (CD/DAT3) - CS</span>
                    <span className="text-purple-400 font-bold bg-purple-950/40 px-1.5 py-0.5 rounded">GPIO 5</span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-2 px-3 rounded border border-purple-900/30">
                    <span className="text-white font-bold">Pin 2 (CMD) - DI / MOSI</span>
                    <span className="text-purple-400 font-bold bg-purple-950/40 px-1.5 py-0.5 rounded">GPIO 23</span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-2 px-3 rounded border border-emerald-900/30">
                    <span className="text-emerald-300">Pin 3 (VSS1) - GND</span>
                    <span className="text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded">GND</span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-2 px-3 rounded border border-red-900/40">
                    <span className="text-amber-400 font-bold">Pin 4 (VDD) - 3.3V Power</span>
                    <span className="text-red-400 font-bold bg-red-950/40 px-1.5 py-0.5 rounded">ESP32 3.3V Pin ONLY!</span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-2 px-3 rounded border border-purple-900/30">
                    <span className="text-white font-bold">Pin 5 (CLK) - SCLK</span>
                    <span className="text-purple-400 font-bold bg-purple-950/40 px-1.5 py-0.5 rounded">GPIO 18</span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-2 px-3 rounded border border-emerald-900/30">
                    <span className="text-emerald-300">Pin 6 (VSS2) - GND</span>
                    <span className="text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded">GND</span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-2 px-3 rounded border border-purple-900/30">
                    <span className="text-white font-bold">Pin 7 (DAT0) - DO / MISO</span>
                    <span className="text-purple-400 font-bold bg-purple-950/40 px-1.5 py-0.5 rounded">GPIO 19</span>
                  </div>
                  <div className="flex justify-between bg-slate-950 p-2 px-3 rounded border border-slate-900 text-slate-500">
                    <span>Pin 8 (DAT1) - NC</span>
                    <span>ללא חיבור / NC</span>
                  </div>
                </div>
              </div>

              <div className="bg-red-950/30 border border-red-900/50 p-3 rounded-lg text-red-300">
                <span className="font-bold text-red-400 block mb-1">⚠️ סכנת שריפה - חבר רק ל-3.3V:</span>
                כרטיסי SD פועלים במתח לוגי של <strong>3.3V בלבד</strong>. אסור בהחלט לחבר את פין 4 של המתאם למתח 5V או ל-12V! זה ישרוף את כרטיס הזיכרון מיידית.
                <br />
                <span className="text-slate-400 italic block mt-1">
                  Warning: SD cards operate strictly on 3.3V. Connect Pin 4 strictly to the 3.3V line of your ESP32. Connecting to 5V or 12V will permanently damage the card!
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <p className="text-xs text-slate-500 mt-4 leading-relaxed">
        Note: Ensure common ground (GND) is connected between all power sources 
        (Motor supply, LED supply, and ESP32).
      </p>
    </div>
  );
};
