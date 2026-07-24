import React, { useState, useEffect } from "react";
import { Usb, Cpu, RefreshCw, CheckCircle2, AlertCircle, X, Terminal, Zap, Shield, HelpCircle } from "lucide-react";

interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
  chipsetName: string;
  chipType: "CH340" | "CP2102" | "ESP32_NATIVE" | "FTDI" | "GENERIC";
  description: string;
  granted: boolean;
  portRef?: any;
}

interface SerialScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPort?: (port: any, info: SerialPortInfo) => void;
}

export function SerialScanModal({ isOpen, onClose, onSelectPort }: SerialScanModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [detectedPorts, setDetectedPorts] = useState<SerialPortInfo[]>([]);
  const [selectedBaud, setSelectedBaud] = useState<number>(115200);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  useEffect(() => {
    const supported = typeof navigator !== "undefined" && "serial" in navigator;
    setIsSupported(supported);
    if (supported && isOpen) {
      checkExistingPorts();
    }
  }, [isOpen]);

  const identifyChipset = (vendorId?: number, productId?: number): {
    chipsetName: string;
    chipType: "CH340" | "CP2102" | "ESP32_NATIVE" | "FTDI" | "GENERIC";
    description: string;
  } => {
    if (!vendorId) {
      return {
        chipsetName: "Generic USB Serial Device",
        chipType: "GENERIC",
        description: "Standard USB-to-UART Serial Bridge"
      };
    }

    const vidHex = `0x${vendorId.toString(16).toUpperCase()}`;
    const pidHex = productId ? `0x${productId.toString(16).toUpperCase()}` : "N/A";

    // CH340 / CH341 Series (QuinHeng / WCH) - Vendor ID: 0x1A86
    if (vendorId === 0x1a86 || vendorId === 6790) {
      return {
        chipsetName: `WCH CH340 USB-Serial Bridge (${vidHex}:${pidHex})`,
        chipType: "CH340",
        description: "QinHeng CH340G / CH340C / CH341 USB-to-UART Controller (ESP32 DevKit)"
      };
    }

    // Silicon Labs CP2102 / CP210x Series - Vendor ID: 0x10C4
    if (vendorId === 0x10c4 || vendorId === 4292) {
      return {
        chipsetName: `Silicon Labs CP2102 / CP210x Bridge (${vidHex}:${pidHex})`,
        chipType: "CP2102",
        description: "CP2102 / CP2104 / CP2108 USB to UART Bridge (Espressif Official)"
      };
    }

    // Espressif Native USB / JTAG - Vendor ID: 0x303A
    if (vendorId === 0x303a || vendorId === 12346) {
      return {
        chipsetName: `Espressif Native USB JTAG/Serial (${vidHex}:${pidHex})`,
        chipType: "ESP32_NATIVE",
        description: "ESP32-S3 / ESP32-C3 / ESP32-C6 On-Chip USB Controller"
      };
    }

    // FTDI FT232R / FT2232 Series - Vendor ID: 0x0403
    if (vendorId === 0x0403 || vendorId === 1027) {
      return {
        chipsetName: `FTDI FT232 / FT2232 UART Bridge (${vidHex}:${pidHex})`,
        chipType: "FTDI",
        description: "FTDI USB-to-Serial Converter Interface"
      };
    }

    return {
      chipsetName: `USB Serial Device (${vidHex}:${pidHex})`,
      chipType: "GENERIC",
      description: "USB UART Controller Interface"
    };
  };

  const checkExistingPorts = async () => {
    if (!("serial" in navigator)) return;
    try {
      setIsScanning(true);
      const ports = await (navigator as any).serial.getPorts();
      const mapped: SerialPortInfo[] = ports.map((port: any) => {
        const info = port.getInfo ? port.getInfo() : {};
        const chip = identifyChipset(info.usbVendorId, info.usbProductId);
        return {
          usbVendorId: info.usbVendorId,
          usbProductId: info.usbProductId,
          ...chip,
          granted: true,
          portRef: port
        };
      });
      setDetectedPorts(mapped);
      if (mapped.length > 0) {
        setStatusMessage(`Found ${mapped.length} previously authorized USB serial bridge(s).`);
      } else {
        setStatusMessage("Click 'Scan & Connect USB Device' to authorize a connected CH340 or CP2102 bridge.");
      }
    } catch (err: any) {
      console.error("Error reading granted serial ports:", err);
      setStatusMessage("Could not scan local serial ports. Ensure browser permissions are enabled.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleRequestNewPort = async () => {
    if (!("serial" in navigator)) {
      alert("Web Serial API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Opera on Desktop or Android.");
      return;
    }

    try {
      setIsScanning(true);
      setStatusMessage("Waiting for user selection in USB device prompt...");

      // Filter for CH340 (0x1a86), CP2102 (0x10c4), FTDI (0x0403), ESP32 Native (0x303a)
      const port = await (navigator as any).serial.requestPort({
        filters: [
          { usbVendorId: 0x1a86 }, // CH340 / CH341
          { usbVendorId: 0x10c4 }, // CP2102 / CP210x
          { usbVendorId: 0x303a }, // ESP32 Native USB
          { usbVendorId: 0x0403 }  // FTDI
        ]
      }).catch(async (e: any) => {
        // Fallback without filters if user device has custom vendor ID
        console.warn("Filtered port request failed or cancelled, trying unfiltered request...", e);
        return await (navigator as any).serial.requestPort();
      });

      if (port) {
        const info = port.getInfo ? port.getInfo() : {};
        const chip = identifyChipset(info.usbVendorId, info.usbProductId);
        const newPortInfo: SerialPortInfo = {
          usbVendorId: info.usbVendorId,
          usbProductId: info.usbProductId,
          ...chip,
          granted: true,
          portRef: port
        };

        setDetectedPorts(prev => {
          const filtered = prev.filter(p => p.portRef !== port);
          return [newPortInfo, ...filtered];
        });

        setStatusMessage(`Successfully connected to ${chip.chipsetName}!`);
        if (onSelectPort) {
          onSelectPort(port, newPortInfo);
        }
      }
    } catch (err: any) {
      if (err.name === "NotFoundError" || err.message?.includes("No port selected")) {
        setStatusMessage("USB scan cancelled by user.");
      } else {
        console.error("Web Serial scan error:", err);
        setStatusMessage(`Serial Scan Error: ${err.message || "Device request failed"}`);
      }
    } finally {
      setIsScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#0c0e15] border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 relative overflow-hidden">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-[#00b4d8] to-emerald-400" />

        {/* Modal Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-[#00b4d8]">
              <Usb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Serial USB Bridge Scanner / סורק התקני USB
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Detects CH340, CP2102, & FTDI USB-to-UART Bridges via Web Serial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compatibility Warning if Web Serial not supported */}
        {!isSupported ? (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <span className="font-bold block mb-1">Web Serial API Unreachable / דפדפן לא נתמך</span>
              Web Serial API is disabled or unsupported in this browser environment. Please launch this application in 
              <span className="font-bold text-white"> Google Chrome</span>, <span className="font-bold text-white">Microsoft Edge</span>, or <span className="font-bold text-white">Android Chrome</span> over HTTPS/localhost for physical USB OTG access.
            </div>
          </div>
        ) : (
          <>
            {/* Scan Control Action Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl">
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Terminal className="w-4 h-4 text-[#00b4d8]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-black">Baud Rate / קצב שידור</span>
                  <select
                    value={selectedBaud}
                    onChange={(e) => setSelectedBaud(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 text-white text-xs font-mono font-bold rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#00b4d8]"
                  >
                    <option value={115200}>115200 baud (Standard ESP32)</option>
                    <option value={921600}>921600 baud (High-Speed Flash)</option>
                    <option value={460800}>460800 baud (Fast Serial)</option>
                    <option value={57600}>57600 baud</option>
                    <option value={9600}>9600 baud</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleRequestNewPort}
                disabled={isScanning}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-[#00b4d8] hover:from-blue-500 hover:to-[#00c8f0] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
                {isScanning ? "Scanning USB Ports..." : "Scan & Add USB Device"}
              </button>
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className="text-[11px] font-mono text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/50 flex items-center justify-between">
                <span>{statusMessage}</span>
                <button 
                  onClick={checkExistingPorts}
                  className="text-[9px] text-[#00b4d8] hover:underline uppercase font-bold tracking-wider"
                >
                  Refresh List
                </button>
              </div>
            )}

            {/* Detected Devices List */}
            <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              <h4 className="text-[10px] text-slate-400 font-black tracking-widest uppercase pl-1">
                Detected USB Serial Interfaces ({detectedPorts.length})
              </h4>

              {detectedPorts.length === 0 ? (
                <div className="p-6 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center gap-2 bg-slate-950/30">
                  <Usb className="w-8 h-8 text-slate-600 mb-1" />
                  <span className="text-xs font-bold text-slate-400">No USB Serial Bridges Selected</span>
                  <p className="text-[10px] text-slate-500 max-w-sm">
                    Connect your ESP32 board via USB-C cable, click <span className="text-slate-300 font-bold">"Scan & Add USB Device"</span> above, and select your CH340 or CP2102 port in the browser dialog.
                  </p>
                </div>
              ) : (
                detectedPorts.map((device, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        device.chipType === "CH340" ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" :
                        device.chipType === "CP2102" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" :
                        device.chipType === "ESP32_NATIVE" ? "bg-purple-500/10 text-purple-400 border border-purple-500/30" :
                        "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                      }`}>
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white tracking-tight">{device.chipsetName}</span>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            device.chipType === "CH340" ? "bg-amber-950/60 text-amber-400 border-amber-500/30" :
                            device.chipType === "CP2102" ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30" :
                            "bg-blue-950/60 text-blue-400 border-blue-500/30"
                          }`}>
                            {device.chipType}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 leading-tight">{device.description}</span>
                        <div className="flex items-center gap-3 mt-1 text-[9px] font-mono text-slate-500">
                          <span>Vendor ID: <strong className="text-slate-300">0x{device.usbVendorId?.toString(16).toUpperCase() || "N/A"}</strong></span>
                          <span>Product ID: <strong className="text-slate-300">0x{device.usbProductId?.toString(16).toUpperCase() || "N/A"}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => {
                          if (onSelectPort) onSelectPort(device.portRef, device);
                          onClose();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-black text-[10px] uppercase tracking-wider transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Select Port
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Info Footer */}
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Web Serial Hardware Sandbox Protected</span>
              </div>
              <span className="font-mono text-slate-500">Baud: {selectedBaud}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
