import { useState, useEffect } from 'react';
import { BleClient } from '@capacitor-community/bluetooth-le';
import { Geolocation } from '@capacitor/geolocation';
import { Filesystem } from '@capacitor/filesystem';

export function usePermissions() {
  const [permissions, setPermissions] = useState({
    ble: false,
    geolocation: false,
    filesystem: false,
    isRequesting: true
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const perms = { ble: false, geolocation: false, filesystem: false, isRequesting: true };
      
      try {
        await BleClient.initialize({ androidNeverForLocation: true });
        perms.ble = true;
      } catch (err) {
        console.warn('BLE permission failed or not supported:', err);
      }
      
      try {
        const geo = await Geolocation.requestPermissions();
        perms.geolocation = geo.location === 'granted' || geo.coarseLocation === 'granted';
      } catch (err) {
        console.warn('Geolocation permission failed or not supported:', err);
      }

      try {
        const fs = await Filesystem.requestPermissions();
        perms.filesystem = fs.publicStorage === 'granted';
      } catch (err) {
        console.warn('Filesystem permission failed or not supported:', err);
      }

      perms.isRequesting = false;
      if (mounted) {
        setPermissions(perms);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return permissions;
}
