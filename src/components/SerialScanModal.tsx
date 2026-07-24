import React, { useState, useEffect } from "react";
import { X, Usb, Cpu, RefreshCw, CheckCircle2, AlertTriangle, ShieldAlert, Plug } from "lucide-react";

interface SerialScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DetectedSerialPort {
  id: string;
  vendorId?: number;
  productId?: number;
  chipType: string;
  port: any;
  status: "idle" | "connecting" | "connected" | "error";
  errorMsg?: string;
}

export function SerialScanModal({ isOpen, onClose }: SerialScanModalProps) {
  const [ports, setPorts] = useState<DetectedSerialPort[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedPortInfo, setConnectedPortInfo] = useState<string | null>(null);

  // Helper to resolve Chip Type based on USB Vendor/Product IDs
  const identifyChip = (vendorId?: number, productId?: number): string => {
    if (!vendorId) return "Generic USB Serial Bridge";
    
    // CH340 / CH341 chips (WCH)
    if (vendorId === 0x1A86) {
      if (productId === 0x7523) return "WCH CH340 Serial Converter";
      if (productId === 0x5523) return "WCH CH341A Serial/SPI Bridge";
      return "WCH CH340/CH341 Series";
    }

    // CP210x chips (Silicon Labs)
    if (vendorId === 0x10C4) {
      if (productId === 0xEA60) return "Silicon Labs CP2102/CP2104 USB-to-UART";
      if (productId === 0xEA70) return "Silicon Labs CP2105 Dual UART";
      return "Silicon Labs CP210x Bridge";
    }

    // FTDI chips
    if (vendorId === 0x0403) {
      if (productId === 0x6001) return "FTDI FT232R USB UART";
      if (productId === 0x6010) return "FTDI FT2232H Hi-Speed Dual UART";
      return "FTDI USB Serial Bridge";
    }

    // Espressif Native USB-JTAG/Serial (ESP32-S2/S3/C3/C6)
    if (vendorId === 0x303A) {
      if (productId === 0x1001) return "ESP32-S3 / ESP32-C3 Native USB Serial";
      return "Espressif Native USB Hardware";
    }

    return `USB Device (VID: 0x${vendorId.toString(16).toUpperCase().padStart(4, "0")}, PID: 0x${productId ? productId.toString(16).toUpperCase().padStart(4, "0") : "????"})`;
  };

  const handleScanDevices = async () => {
    setError(null);
    setIsScanning(true);

    if (!("serial" in navigator)) {
      setError("Web Serial API is not supported in this browser. Please use Chrome, Edge, or Opera.");
      setIsScanning(false);
      return;
    }

    try {
      // Request user to select a port via Web Serial popup
      const port = await (navigator as any).serial.requestPort({
        filters: [
          { usbVendorId: 0x1a86 }, // CH340 / CH341
          { usbVendorId: 0x10c4 }, // CP2102 / CP210x
          { usbVendorId: 0x0403 }, // FTDI
          { usbVendorId: 0x303a }  // Espressif
        ]
      }).catch((e: any) => {
        // User cancelled picker or browser restriction
        if (e.name !== "NotFoundError") {
          throw e;
        }
        return null;
      });

      // Get all paired/authorized ports
      const availablePorts = await (navigator as any).serial.getPorts();
      
      const mapped: DetectedSerialPort[] = availablePorts.map((p: any, idx: number) => {
        const info = p.getInfo ? p.getInfo() : {};
        return {
          id: `port-${idx}-${info.usbVendorId || 'gen'}-${info.usbProductId || 'gen'}`,
          vendorId: info.usbVendorId,
          productId: info.usbProductId,
          chipType: identifyChip(info.usbVendorId, info.usbProductId),
          port: p,
          status: "idle"
        };
      });

      setPorts(mapped);
    } catch (err: any) {
      console.error("Serial Scan Error:", err);
      setError(err.message || "Failed to scan for USB Serial devices.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectPort = async (item: DetectedSerialPort) => {
    try {
      setPorts(prev => prev.map(p => p.id === item.id ? { ...p, status: "connecting", errorMsg: undefined } : p));

      // Open serial communication at 115200 baud
      await item.port.open({ baudRate: 115200 });

      setPorts(prev => prev.map(p => p.id === item.id ? { ...p, status: "connected" } : p));
      setConnectedPortInfo(`Connected to ${item.chipType} @ 115200 Baud`);
    } catch (err: any) {
      console.error("Failed to open serial port:", err);
      setPorts(prev => prev.map(p => p.id === item.id ? { ...p, status: "error", errorMsg: err.message || "Could not open port. Check if another app is using it." } : p));
    }
  };

  const handleDisconnectPort = async (item: DetectedSerialPort) => {
    try {
      if (item.port && item.port.close) {
        await item.port.close();
      }
    } catch (e) {
      // Ignored
    } finally {
      setPorts(prev => prev.map(p => p.id === item.id ? { ...p, status: "idle" } : p));
      setConnectedPortInfo(null);
    }
  };

  useEffect(() => {
    if (isOpen && "serial" in navigator) {
      // Load previously paired ports
      (navigator as any).serial.getPorts().then((existingPorts: any[]) => {
        const mapped = existingPorts.map((p: any, idx: number) => {
          const info = p.getInfo ? p.getInfo() : {};
          return {
            id: `port-${idx}-${info.usbVendorId || 'gen'}-${info.usbProductId || 'gen'}`,
            vendorId: info.usbVendorId,
            productId: info.usbProductId,
            chipType: identifyChip(info.usbVendorId, info.usbProductId),
            port: p,
            status: "idle" as const
          };
        });
        setPorts(mapped);
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0c0e17] border border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-[#00b4d8]">
              <Usb className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                USB Serial Device Scanner
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Detect CH340, CP2102, FTDI & ESP32 USB Bridges
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Banner */}
        {connectedPortInfo ? (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-mono font-bold flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{connectedPortInfo}</span>
          </div>
        ) : (
          <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-slate-300 text-xs leading-relaxed flex items-start gap-2.5">
            <Plug className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              Plug in your ESP32 board via USB-C or Micro-USB cable, then click <strong>Scan USB Devices</strong> to detect hardware bridges.
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-medium flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Detected Ports List */}
        <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
          {ports.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2">
              <Cpu className="w-8 h-8 text-slate-600" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                No Serial Bridges Paired
              </span>
              <span className="text-[10px] text-slate-500 max-w-xs">
                Click the scan button below to grant permission and list attached serial chips.
              </span>
            </div>
          ) : (
            ports.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-4 transition hover:border-slate-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0 text-blue-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate">
                      {item.chipType}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 truncate">
                      {item.vendorId ? `VID: 0x${item.vendorId.toString(16).toUpperCase()} | PID: 0x${item.productId?.toString(16).toUpperCase()}` : "Web Serial Device"}
                    </span>
                    {item.errorMsg && (
                      <span className="text-[9px] text-rose-400 font-medium truncate mt-0.5">
                        {item.errorMsg}
                      </span>
                    )}
                  </div>
                </div>

                {item.status === "connected" ? (
                  <button
                    onClick={() => handleDisconnectPort(item)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[10px] font-black uppercase tracking-wider shrink-0 transition"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnectPort(item)}
                    disabled={item.status === "connecting"}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 hover:text-white text-[10px] font-black uppercase tracking-wider shrink-0 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {item.status === "connecting" && <RefreshCw className="w-3 h-3 animate-spin" />}
                    {item.status === "connecting" ? "Opening..." : "Connect"}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Scan Button */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-bold uppercase transition"
          >
            Close
          </button>
          <button
            onClick={handleScanDevices}
            disabled={isScanning}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-[#00b4d8] hover:from-blue-500 hover:to-[#00b4d8]/90 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/20 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
            {isScanning ? "Scanning USB..." : "Scan USB Devices"}
          </button>
        </div>

      </div>
    </div>
  );
}
