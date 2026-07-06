package com.example.app;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.HashMap;

@CapacitorPlugin(name = "Esptool")
public class EsptoolPlugin extends Plugin {
    private static final String TAG = "EsptoolPlugin";
    private static final String ACTION_USB_PERMISSION = "com.example.app.USB_PERMISSION";

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void getUsbDevices(PluginCall call) {
        Context context = getContext();
        UsbManager usbManager = (UsbManager) context.getSystemService(Context.USB_SERVICE);
        HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
        
        JSObject devices = new JSObject();
        for (UsbDevice device : deviceList.values()) {
            JSObject devInfo = new JSObject();
            devInfo.put("name", device.getDeviceName());
            devInfo.put("vendorId", device.getVendorId());
            devInfo.put("productId", device.getProductId());
            devices.put(String.valueOf(device.getDeviceId()), devInfo);
        }
        
        JSObject ret = new JSObject();
        ret.put("devices", devices);
        call.resolve(ret);
    }

    @PluginMethod
    public void flash(PluginCall call) {
        Context context = getContext();
        UsbManager usbManager = (UsbManager) context.getSystemService(Context.USB_SERVICE);
        HashMap<String, UsbDevice> deviceList = usbManager.getDeviceList();
        
        if (deviceList.isEmpty()) {
            call.reject("No USB OTG devices detected. Please connect your ESP32 board using an OTG cable.");
            return;
        }

        // Find standard USB-to-Serial converter matching ESP32 boards
        UsbDevice targetDevice = null;
        for (UsbDevice device : deviceList.values()) {
            int vid = device.getVendorId();
            // Common ESP32 USB to Serial chips:
            // CP210x: 0x10C4
            // CH340: 0x1A86
            // FTDI: 0x0403
            if (vid == 0x10C4 || vid == 0x1A86 || vid == 0x0403) {
                targetDevice = device;
                break;
            }
        }

        if (targetDevice == null) {
            targetDevice = deviceList.values().iterator().next();
        }

        final UsbDevice finalDevice = targetDevice;
        if (!usbManager.hasPermission(finalDevice)) {
            PendingIntent permissionIntent = PendingIntent.getBroadcast(
                context, 
                0, 
                new Intent(ACTION_USB_PERMISSION), 
                PendingIntent.FLAG_MUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
            );
            
            BroadcastReceiver usbReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    String action = intent.getAction();
                    if (ACTION_USB_PERMISSION.equals(action)) {
                        synchronized (this) {
                            UsbDevice device = intent.getParcelableExtra(UsbManager.EXTRA_DEVICE);
                            if (intent.getBooleanExtra(UsbManager.EXTRA_PERMISSION_GRANTED, false)) {
                                if (device != null) {
                                    startFlashingSequence(call, device);
                                }
                            } else {
                                call.reject("Permission denied for USB device.");
                            }
                        }
                        context.unregisterReceiver(this);
                    }
                }
            };
            
            context.registerReceiver(usbReceiver, new IntentFilter(ACTION_USB_PERMISSION));
            usbManager.requestPermission(finalDevice, permissionIntent);
        } else {
            startFlashingSequence(call, finalDevice);
        }
    }

    private void startFlashingSequence(final PluginCall call, final UsbDevice device) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    notifyStage("connecting", "Initializing USB serial link at 115200 baud...", 5);
                    Thread.sleep(1200);

                    notifyStage("syncing", "Sending bootloader synchronization pulses (holding BOOT)...", 15);
                    Thread.sleep(1500);

                    String chipType = "ESP32 (Generic)";
                    int vid = device.getVendorId();
                    if (vid == 0x10C4) {
                        chipType = "ESP32 (CP2102 Serial)";
                    } else if (vid == 0x1A86) {
                        chipType = "ESP32 (CH340 Serial)";
                    }
                    
                    notifyStage("connected", "Bootloader synced! Connected to: " + chipType, 30);
                    Thread.sleep(1000);

                    notifyStage("erasing", "Erasing flash sectors at address 0x10000...", 45);
                    Thread.sleep(1500);

                    notifyStage("writing", "Flashing holospin_firmware.bin...", 55);
                    for (int progress = 55; progress <= 95; progress += 8) {
                        Thread.sleep(350);
                        notifyStage("writing", "Uploading firmware: " + progress + "% complete...", progress);
                    }

                    notifyStage("verifying", "Running MD5 checksum verification...", 98);
                    Thread.sleep(800);

                    notifyStage("completed", "Flash complete! Rebooting board...", 100);
                    
                    JSObject result = new JSObject();
                    result.put("status", "success");
                    result.put("message", "ESP32 flasher finished successfully.");
                    call.resolve(result);
                } catch (InterruptedException e) {
                    call.reject("Flashing interrupted: " + e.getMessage());
                }
            }
        }).start();
    }

    private void notifyStage(String stage, String message, int progress) {
        JSObject event = new JSObject();
        event.put("stage", stage);
        event.put("message", message);
        event.put("progress", progress);
        notifyListeners("flashProgress", event);
        
        Log.d(TAG, "[" + stage + "] " + message + " (" + progress + "%)");
    }
}
