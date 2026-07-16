import { useState, useEffect, useCallback, useRef } from 'react';
import { BleClient, ScanMode } from '@capacitor-community/bluetooth-le';

const ESP32_SERVICE = '0000aaaa-0000-1000-8000-00805f9b34fb'; 
const ESP32_CHARACTERISTIC_TX = '0000bbbb-0000-1000-8000-00805f9b34fb'; 
const ESP32_CHARACTERISTIC_RX = '0000cccc-0000-1000-8000-00805f9b34fb'; 

export function useHardwareStream(initialDeviceId: string | null) {
  const [data, setData] = useState<{ rpm?: number; temp?: number; [key: string]: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(initialDeviceId);
  
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendCommand = useCallback(async (payload: any) => {
    if (!deviceId || !isConnected) return false;
    try {
      const dataView = new TextEncoder().encode(JSON.stringify(payload));
      await BleClient.write(deviceId, ESP32_SERVICE, ESP32_CHARACTERISTIC_RX, new DataView(dataView.buffer));
      return true;
    } catch (err) {
      console.error("BLE Write Error:", err);
      return false;
    }
  }, [deviceId, isConnected]);

  const scanAndConnect = useCallback(async () => {
    try {
      setIsScanning(true);
      setError(null);
      
      let foundId: string | null = null;
      
      // Directly request device. This handles both Web (shows browser native dialog) 
      // and Capacitor (shows native OS dialog). Avoids user-gesture timeouts.
      try {
        const device = await BleClient.requestDevice({
          services: [ESP32_SERVICE],
          optionalServices: [ESP32_SERVICE]
        });
        if (device) {
          foundId = device.deviceId;
        }
      } catch (e: any) {
        // If filtering by service fails, try accepting all devices (fallback for some Androids)
        try {
           const fallbackDevice = await BleClient.requestDevice();
           if (fallbackDevice) {
             foundId = fallbackDevice.deviceId;
           }
        } catch (errFallback) {
           console.warn("requestDevice fallback failed:", errFallback);
           throw new Error("Device selection cancelled or failed.");
        }
      }

      if (foundId) {
        setDeviceId(foundId);
      } else {
        throw new Error("ESP32 hardware not selected.");
      }
    } catch (err: any) {
      setError(err.message || "Discovery failed");
      // Throw the error so the UI can show a toast
      throw err;
    } finally {
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    if (!deviceId) return;

    let isActive = true;
    let isSubscribed = false;
    let currentAttempt = 0;
    const maxRetries = 5;
    let reconnectTimer: NodeJS.Timeout | null = null;
    
    const connect = async () => {
      if (!isActive) return;
      try {
        setIsConnecting(true);
        // Drop existing connection if any
        try { await BleClient.disconnect(deviceId); } catch(e) {}

        // Timeout handler for connection hangs (increased to 25 seconds for Android BLE discovery and connection)
        connectionTimeoutRef.current = setTimeout(() => {
          if (isActive && !isSubscribed) {
            handleError(new Error("Connection attempt timed out. Ensure ESP32 is powered, and both Bluetooth and Location (GPS) are enabled on your phone."));
          }
        }, 25000);

        await BleClient.connect(deviceId, (disconnectedId) => {
          if (isActive) {
            setIsConnected(false);
            isSubscribed = false;
            handleError(new Error("Hardware connection dropped unexpectedly."));
          }
        });

        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);

        if (!isActive) {
           BleClient.disconnect(deviceId).catch(() => {});
           return;
        }

        setIsConnected(true);
        setError(null);
        currentAttempt = 0; // Reset on success

        await BleClient.startNotifications(
          deviceId,
          ESP32_SERVICE,
          ESP32_CHARACTERISTIC_TX,
          (value) => {
            try {
              const jsonStr = new TextDecoder().decode(value.buffer);
              const parsed = JSON.parse(jsonStr);
              // Ensure we normalize RPM and Temp for the dashboard
              setData(prev => ({
                ...prev,
                ...parsed,
                rpm: typeof parsed.rpm === 'number' ? parsed.rpm : prev?.rpm || 0,
                temp: typeof parsed.temp === 'number' ? parsed.temp : prev?.temp || 0
              }));
            } catch (e) {
              console.warn("Telemetry parse error");
            }
          }
        );
        isSubscribed = true;
      } catch (err: any) {
        if (isActive) {
          handleError(err);
        }
      } finally {
        if (isActive) setIsConnecting(false);
      }
    };

    const handleError = (err: any) => {
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      const errMsg = err.message || String(err);
      setIsConnected(false);
      isSubscribed = false;
      
      const shouldRetry = errMsg.toLowerCase().includes("timeout") || 
                          errMsg.toLowerCase().includes("fetch") || 
                          errMsg.toLowerCase().includes("dropped") ||
                          errMsg.toLowerCase().includes("disconnected") ||
                          errMsg.toLowerCase().includes("failed");

      if (shouldRetry && currentAttempt < maxRetries && isActive) {
        currentAttempt++;
        const delay = Math.pow(2, currentAttempt) * 1000; // Exponential backoff (2s, 4s, 8s, 16s...)
        setError(`${errMsg} - Retrying in ${delay/1000}s (Attempt ${currentAttempt}/${maxRetries})...`);
        reconnectTimer = setTimeout(() => {
          if (isActive) connect();
        }, delay);
      } else if (isActive) {
        setError(`Connection failed: ${errMsg}. Ensure BLE & Location services are ON, and you are close to the HoloSpin device.`);
      }
    };

    connect();

    return () => {
      isActive = false;
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (isSubscribed) {
        BleClient.stopNotifications(deviceId, ESP32_SERVICE, ESP32_CHARACTERISTIC_TX).catch(() => {});
      }
      BleClient.disconnect(deviceId).catch(() => {});
      setIsConnected(false);
      setIsConnecting(false);
    };
  }, [deviceId]);

  return { streamData: data, isConnected, isScanning, isConnecting, error, sendCommand, scanAndConnect, setDeviceId };
}

