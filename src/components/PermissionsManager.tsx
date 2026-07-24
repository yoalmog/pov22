import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BleClient } from '@capacitor-community/bluetooth-le';
import { Geolocation } from '@capacitor/geolocation';
import { Network } from '@capacitor/network';
import { ShieldCheck, ShieldAlert, Wifi, Bluetooth, MapPin, Camera, Mic } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

export const PermissionsManager: React.FC<Props> = ({ onComplete }) => {
  const [status, setStatus] = useState<Record<string, 'pending' | 'granted' | 'denied' | 'error'>>({
    bluetooth: 'pending',
    location: 'pending',
    network: 'pending',
    camera: 'pending',
    microphone: 'pending'
  });
  const [isInitializing, setIsInitializing] = useState(true);

  const requestAll = async () => {
    setIsInitializing(true);
    
    // 1. Bluetooth
    try {
      // For Bluetooth on Android, we often need to initialize first
      await BleClient.initialize();
      // On some platforms, checking if it's enabled helps trigger permissions
      const enabled = await BleClient.isEnabled();
      if (!enabled && /android/i.test(navigator.userAgent)) {
        try { await BleClient.enable(); } catch(e) {}
      }
      setStatus(s => ({ ...s, bluetooth: 'granted' }));
    } catch (e) {
      console.warn("BLE Init error:", e);
      // Fallback: requestPermissions might be available depending on plugin version
      try {
        const p = await BleClient.requestLEScan({ services: [] }, (res) => {}).catch(() => null);
        if (p) setStatus(s => ({ ...s, bluetooth: 'granted' }));
        else setStatus(s => ({ ...s, bluetooth: 'denied' }));
      } catch (err) {
        setStatus(s => ({ ...s, bluetooth: 'error' }));
      }
    }

    // 2. Location (Crucial for BLE scanning on Android)
    try {
      const p = await Geolocation.requestPermissions();
      const granted = p.location === 'granted' || p.coarseLocation === 'granted';
      setStatus(s => ({ ...s, location: granted ? 'granted' : 'denied' }));
    } catch (e) {
      setStatus(s => ({ ...s, location: 'denied' }));
    }

    // 4. WiFi / Network Status
    try {
      // Network plugin typically doesn't have a permission prompt, but it's required for setup
      const net = await Network.getStatus();
      setStatus(s => ({ ...s, network: net.connected ? 'granted' : 'granted' })); // Always "granted" if it runs, but useful to surface
    } catch (e) {
      setStatus(s => ({ ...s, network: 'granted' }));
    }

    // 5. Camera
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus(s => ({ ...s, camera: 'error' }));
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
        setStatus(s => ({ ...s, camera: 'granted' }));
      }
    } catch (e: any) {
      console.warn("Camera permission error:", e);
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setStatus(s => ({ ...s, camera: 'denied' }));
      } else {
        setStatus(s => ({ ...s, camera: 'error' }));
      }
    }

    // 6. Microphone
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus(s => ({ ...s, microphone: 'error' }));
      } else {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        setStatus(s => ({ ...s, microphone: 'granted' }));
      }
    } catch (e: any) {
      console.warn("Mic permission error:", e);
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setStatus(s => ({ ...s, microphone: 'denied' }));
      } else {
        setStatus(s => ({ ...s, microphone: 'error' }));
      }
    }

    setIsInitializing(false);
  };

  useEffect(() => {
    requestAll();
  }, []);

  const allGranted = Object.values(status).every(v => v === 'granted' || v === 'pending');

  if (allGranted && !isInitializing) {
    onComplete();
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020108] flex flex-col items-center justify-center p-6 text-white font-sans antialiased">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex justify-center mb-8">
          <div className="relative">
            <ShieldCheck className="w-16 h-16 text-[#38bdf8] animate-pulse" />
            <div className="absolute inset-0 blur-xl bg-[#38bdf8]/20 rounded-full"></div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-center mb-2 tracking-tight">Security Check</h2>
        <p className="text-slate-400 text-center text-sm mb-8">
          To connect with your ESP32 hardware, please grant the following permissions.
        </p>

        <div className="space-y-4 mb-10">
          <PermissionRow 
            icon={<Bluetooth className="w-4 h-4" />} 
            label="Bluetooth LE" 
            status={status.bluetooth} 
          />
          <PermissionRow 
            icon={<MapPin className="w-4 h-4" />} 
            label="Hardware Location" 
            status={status.location} 
          />
          <PermissionRow 
            icon={<Camera className="w-4 h-4" />} 
            label="Gesture Camera" 
            status={status.camera} 
          />
          <PermissionRow 
            icon={<Mic className="w-4 h-4" />} 
            label="Audio Module" 
            status={status.microphone} 
          />
          <PermissionRow 
            icon={<Wifi className="w-4 h-4" />} 
            label="Network Stack" 
            status={status.network} 
          />
        </div>

        <button
          onClick={requestAll}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] text-black font-bold uppercase text-xs tracking-widest shadow-lg shadow-[#38bdf8]/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          Check Permissions Again
        </button>

        <button
          onClick={onComplete}
          className="w-full mt-3 py-3 text-slate-500 font-medium text-[10px] uppercase tracking-widest hover:text-slate-300 transition-colors"
        >
          Skip (Hardware may not work)
        </button>
      </motion.div>
    </div>
  );
};

const PermissionRow = ({ icon, label, status }: { icon: React.ReactNode, label: string, status: string }) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800/50">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-slate-900/80 text-slate-400">
        {icon}
      </div>
      <span className="text-[13px] font-medium text-slate-200">{label}</span>
    </div>
    {status === 'granted' ? (
      <ShieldCheck className="w-4 h-4 text-[#22c55e]" />
    ) : status === 'pending' ? (
      <div className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse"></div>
    ) : status === 'error' ? (
      <div className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">Not Supported</div>
    ) : (
      <ShieldAlert className="w-4 h-4 text-[#ef4444]" />
    )}
  </div>
);
