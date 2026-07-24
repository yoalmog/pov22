import { useState, useEffect, useCallback, useRef } from 'react';
import { BleClient, ScanMode } from '@capacitor-community/bluetooth-le';

const ESP32_SERVICE = '0000aaaa-0000-1000-8000-00805f9b34fb'; 
const ESP32_CHARACTERISTIC_TX = '0000bbbb-0000-1000-8000-00805f9b34fb'; 
const ESP32_CHARACTERISTIC_RX = '0000cccc-0000-1000-8000-00805f9b34fb'; 

export function useHardwareStream(initialDeviceId: string | null) {
  const [data, setData] = useState<{ rpm?: number; temp?: number; rssi?: number; [key: string]: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttemptCount, setReconnectAttemptCount] = useState(0);
  const [deviceId, setDeviceId] = useState<string | null>(initialDeviceId);

  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rssiIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef<number>(0);
  const isManuallyDisconnectedRef = useRef<boolean>(false);

  const sendCommand = useCallback(async (payload: any) => {
    if (!deviceId || !isConnected) return false;
    try {
      const dataView = new TextEncoder().encode(typeof payload === 'string' ? payload : JSON.stringify(payload));
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
      isManuallyDisconnectedRef.current = false;
      reconnectAttemptRef.current = 0;
      setReconnectAttemptCount(0);

      // Ensure BleClient is initialized before scan
      try { await BleClient.initialize(); } catch (e) {}

      let foundId: string | null = null;

      try {
        const device = await BleClient.requestDevice({
          services: [ESP32_SERVICE],
          optionalServices: [ESP32_SERVICE],
          namePrefix: "HoloSpin"
        });
        if (device) {
          foundId = device.deviceId;
        }
      } catch (e: any) {
        // Fallback for devices without service prefix filter
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
      throw err;
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Periodic RSSI Telemetry Reader when connected
  useEffect(() => {
    if (!isConnected || !deviceId) {
      if (rssiIntervalRef.current) clearInterval(rssiIntervalRef.current);
      return;
    }

    rssiIntervalRef.current = setInterval(async () => {
      try {
        const rssiVal = await BleClient.readRssi(deviceId);
        if (typeof rssiVal === 'number') {
          setData(prev => ({
            ...prev,
            rssi: rssiVal
          }));
        }
      } catch (e) {
        // Transient BLE RSSI read error ignored
      }
    }, 2500);

    return () => {
      if (rssiIntervalRef.current) clearInterval(rssiIntervalRef.current);
    };
  }, [isConnected, deviceId]);

  useEffect(() => {
    if (!deviceId) return;

    let isActive = true;
    let isSubscribed = false;

    const scheduleReconnect = (reasonMsg: string) => {
      if (!isActive || isManuallyDisconnectedRef.current) return;

      setIsConnected(false);
      isSubscribed = false;
      setIsConnecting(false);
      setIsReconnecting(true);

      reconnectAttemptRef.current += 1;
      const attemptNum = reconnectAttemptRef.current;
      setReconnectAttemptCount(attemptNum);

      // Exponential Backoff calculation: 1s, 2s, 4s, 8s, 16s, capped at 30s max
      const exponent = Math.min(attemptNum - 1, 5);
      const delay = Math.min(30000, Math.pow(2, exponent) * 1000 + Math.floor(Math.random() * 500));

      const delaySec = (delay / 1000).toFixed(1);
      setError(`[BLE auto-reconnect] ${reasonMsg}. Retrying in ${delaySec}s... (Attempt #${attemptNum})`);

      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        if (isActive && !isManuallyDisconnectedRef.current) {
          connect();
        }
      }, delay);
    };

    const connect = async () => {
      if (!isActive || isManuallyDisconnectedRef.current) return;

      try {
        setIsConnecting(true);
        if (reconnectAttemptRef.current === 0) {
          setError(null);
        }

        // Drop existing connection if any before reconnecting
        try { await BleClient.disconnect(deviceId); } catch(e) {}

        // 20 second connection timeout guard
        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = setTimeout(() => {
          if (isActive && !isSubscribed) {
            scheduleReconnect("Connection request timed out");
          }
        }, 20000);

        await BleClient.connect(deviceId, (disconnectedId) => {
          if (isActive && !isManuallyDisconnectedRef.current) {
            scheduleReconnect("Connection lost unexpectedly");
          }
        });

        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);

        if (!isActive || isManuallyDisconnectedRef.current) {
          BleClient.disconnect(deviceId).catch(() => {});
          return;
        }

        setIsConnected(true);
        setIsConnecting(false);
        setIsReconnecting(false);
        setError(null);

        // Reset reconnect attempts on successful connection
        reconnectAttemptRef.current = 0;
        setReconnectAttemptCount(0);

        // Start Telemetry Notifications
        await BleClient.startNotifications(
          deviceId,
          ESP32_SERVICE,
          ESP32_CHARACTERISTIC_TX,
          (value) => {
            try {
              const jsonStr = new TextDecoder().decode(value.buffer);
              const parsed = JSON.parse(jsonStr);
              setData(prev => ({
                ...prev,
                ...parsed,
                rpm: typeof parsed.rpm === 'number' ? parsed.rpm : prev?.rpm || 0,
                temp: typeof parsed.temp === 'number' ? parsed.temp : prev?.temp || 0,
                rssi: typeof parsed.rssi === 'number' ? parsed.rssi : prev?.rssi
              }));
            } catch (e) {
              // Non-JSON or telemetry packet string
            }
          }
        );

        isSubscribed = true;

        // Immediately fetch initial RSSI
        try {
          const initialRssi = await BleClient.readRssi(deviceId);
          if (typeof initialRssi === 'number') {
            setData(prev => ({ ...prev, rssi: initialRssi }));
          }
        } catch (e) {}

      } catch (err: any) {
        if (isActive && !isManuallyDisconnectedRef.current) {
          const errMsg = err.message || "Connection failed";
          scheduleReconnect(errMsg);
        }
      } finally {
        if (isActive) setIsConnecting(false);
      }
    };

    connect();

    return () => {
      isActive = false;
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (rssiIntervalRef.current) clearInterval(rssiIntervalRef.current);

      if (isSubscribed) {
        BleClient.stopNotifications(deviceId, ESP32_SERVICE, ESP32_CHARACTERISTIC_TX).catch(() => {});
      }
      BleClient.disconnect(deviceId).catch(() => {});
      setIsConnected(false);
      setIsConnecting(false);
      setIsReconnecting(false);
    };
  }, [deviceId]);

  const reconnect = useCallback(() => {
    isManuallyDisconnectedRef.current = false;
    reconnectAttemptRef.current = 0;
    setReconnectAttemptCount(0);
    setIsReconnecting(false);
    setError(null);

    if (deviceId) {
      setIsConnecting(true);
      BleClient.disconnect(deviceId)
        .catch(() => {})
        .finally(() => {
          setDeviceId(null);
          setTimeout(() => setDeviceId(deviceId), 100);
        });
    } else {
      scanAndConnect().catch(() => {});
    }
  }, [deviceId, scanAndConnect]);

  return {
    streamData: data,
    isConnected,
    isScanning,
    isConnecting,
    isReconnecting,
    reconnectAttemptCount,
    error,
    sendCommand,
    scanAndConnect,
    setDeviceId,
    reconnect
  };
}
