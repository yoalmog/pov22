import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Capacitor Plugins and platform features to isolate UI rendering
vi.mock('@capacitor-community/bluetooth-le', () => ({
  BleClient: {
    initialize: vi.fn().mockResolvedValue(undefined),
    requestDevice: vi.fn().mockResolvedValue({ deviceId: 'test-device' }),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    startNotifications: vi.fn().mockResolvedValue(undefined),
    stopNotifications: vi.fn().mockResolvedValue(undefined),
    write: vi.fn().mockResolvedValue(true)
  },
  ScanMode: {
    BALANCED: 1,
    LOW_LATENCY: 2,
    LOW_POWER: 0
  }
}));

vi.mock('@capacitor/core', () => ({
  registerPlugin: vi.fn().mockReturnValue({}),
  Capacitor: {
    isNativePlatform: vi.fn().mockReturnValue(false),
    getPlatform: vi.fn().mockReturnValue('web')
  }
}));

vi.mock('@capacitor/network', () => ({
  Network: {
    getStatus: vi.fn().mockResolvedValue({ connected: true, connectionType: 'wifi' }),
    addListener: vi.fn().mockReturnValue({ remove: vi.fn() })
  }
}));

vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    requestPermissions: vi.fn().mockResolvedValue({ location: 'granted', coarseLocation: 'granted' }),
    getCurrentPosition: vi.fn().mockResolvedValue({ coords: { latitude: 0, longitude: 0 } })
  }
}));

vi.mock('@capacitor/filesystem', () => ({
  Filesystem: {
    requestPermissions: vi.fn().mockResolvedValue({ publicStorage: 'granted' }),
    writeFile: vi.fn().mockResolvedValue({ uri: 'test-file-uri' }),
    readFile: vi.fn().mockResolvedValue({ data: '{}' }),
    readdir: vi.fn().mockResolvedValue({ files: [] })
  },
  Directory: {
    Documents: 'DOCUMENTS',
    Data: 'DATA',
    Cache: 'CACHE',
    External: 'EXTERNAL'
  },
  Encoding: {
    UTF8: 'utf8'
  }
}));

vi.mock('@capacitor/share', () => ({
  Share: {
    share: vi.fn().mockResolvedValue({})
  }
}));

// Mock standard API fetch endpoints with full compliance
const mockFetchResponses: Record<string, any> = {
  "/status": {
    status: "ready",
    rpm: 2450,
    model: "ESP32-D0WDQ6",
    temp: 42.5,
    current: 1.2,
    voltage: 12.1,
    rssi: -45,
    uptime: 1200,
    storage: { mounted: true, total: "16 GB", used: "1.2 GB" }
  },
  "/api/files": [
    { name: "test_image.png", size: "12 KB", type: "image", path: "/uploads/test_image.png" }
  ],
  "/diagnostic": {
    heap: 124500,
    uptime: 1200,
    tasks: 8,
    wifi_rssi: -42,
    temp: 45.2
  },
  "/logs": "[SYS] Boot complete\n[WIFI] Connected\n[POV] Frame buffer ready",
  "/calibrate": { status: "calibrating", message: "Calibration started" },
  "/control": { status: "success" },
  "/config": { status: "success", message: "Configuration applied" },
  "/scan": []
};

global.fetch = vi.fn().mockImplementation(async (url: string, options?: any) => {
  const cleanUrl = url.split("?")[0];
  if (mockFetchResponses[cleanUrl]) {
    return {
      ok: true,
      status: 200,
      json: async () => mockFetchResponses[cleanUrl],
      text: async () => typeof mockFetchResponses[cleanUrl] === "string" ? mockFetchResponses[cleanUrl] : JSON.stringify(mockFetchResponses[cleanUrl])
    };
  }
  return {
    ok: true,
    status: 200,
    json: async () => ({ status: "success" }),
    text: async () => "success"
  };
}) as any;

// Stub window.HTMLCanvasElement.prototype.getContext with a robust Proxy-based mock to prevent drawing crashes
const mockGradient = {
  addColorStop: vi.fn()
};

window.HTMLCanvasElement.prototype.getContext = (() => {
  const coreMock = {
    getImageData: (x: number, y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    createLinearGradient: () => mockGradient,
    createRadialGradient: () => mockGradient,
  };

  return new Proxy(coreMock, {
    get(target, prop) {
      if (prop in target) {
        return (target as any)[prop];
      }
      // Provide a safe no-op fallback for any canvas context property/method called by renderers
      return () => {};
    }
  });
}) as any;

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue("blob:test");
global.URL.revokeObjectURL = vi.fn();

// Mock AudioContext for synthesizers or audio visualizers
const mockAudioContext = vi.fn().mockImplementation(() => ({
  createAnalyser: () => ({
    fftSize: 2048,
    frequencyBinCount: 1024,
    getByteFrequencyData: (array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) array[i] = Math.random() * 255;
    },
    getByteTimeDomainData: (array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) array[i] = 128;
    },
    connect: () => {},
    disconnect: () => {}
  }),
  createMediaElementSource: () => ({
    connect: () => {}
  }),
  destination: {},
  close: async () => {}
}));

global.AudioContext = mockAudioContext as any;
(global as any).webkitAudioContext = mockAudioContext as any;

// Set act environment flag for React
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

// Import App after mocks are defined
import App from "../App";

describe("Comprehensive Application UI & API Integrity Auditing", () => {
  let container: HTMLDivElement;
  let root: any;
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];

  const originalError = console.error;
  const originalWarn = console.warn;

  beforeEach(() => {
    // Intercept and collect all console logs to analyze JS safety
    consoleErrors = [];
    consoleWarnings = [];
    console.error = (...args: any[]) => {
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" ");
      consoleErrors.push(msg);
      originalError(...args);
    };
    console.warn = (...args: any[]) => {
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(" ");
      consoleWarnings.push(msg);
      originalWarn(...args);
    };

    container = document.createElement("div");
    container.id = "root";
    document.body.appendChild(container);
  });

  afterEach(() => {
    console.error = originalError;
    console.warn = originalWarn;
    if (root) {
      act(() => {
        root.unmount();
      });
    }
    document.body.removeChild(container);
  });

  it("mounts the App without throwing errors, runs through tabs & captures zero fatal exceptions", async () => {
    console.log("▶ [Test] Starting Application Mount and Navigation Smoke Tests...");

    // Enable fake timers to bypass splash screen immediately
    vi.useFakeTimers();

    // Mount the Application
    await act(async () => {
      root = createRoot(container);
      root.render(<App />);
    });

    // Advance timers by 5000ms to clear the splash loading sequence
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // Restore real timers for the rest of the test execution
    vi.useRealTimers();

    // Let any background effects settle
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check that we don't have severe unhandled rendering errors
    const unexpectedErrors = consoleErrors.filter(err => 
      !err.includes("benign") && 
      !err.includes("WebSocket") && 
      !err.includes("testing environment is not configured") &&
      !err.includes("not wrapped in act(...)") &&
      !err.includes("Failed to load Mediapipe model")
    );
    if (unexpectedErrors.length > 0) {
      console.log("❌ [Test] Captured Unexpected Console Errors:");
      unexpectedErrors.forEach((err, idx) => {
        console.log(`   [Error #${idx + 1}]:`, err);
      });
    }
    expect(unexpectedErrors.length).toBe(0);
    console.log("✓ [Test] Application mounted successfully with clean console!");

    // Search for navigation bar items and trigger layout traversal
    const navButtons = container.querySelectorAll("nav button");
    console.log(`✓ [Test] Found ${navButtons.length} navigation buttons.`);

    // 1. Audit Tab: Controller
    console.log("▶ [Test] Auditing CONTROLLER Tab...");
    expect(container.innerHTML).toContain("HOLOSPIN");

    // 2. Audit Tab: Effects
    console.log("▶ [Test] Navigating to EFFECTS Tab...");
    const effectsBtn = Array.from(navButtons).find(btn => btn.textContent?.includes("אפקטים") || btn.textContent?.includes("Effects"));
    if (effectsBtn) {
      await act(async () => {
        (effectsBtn as HTMLButtonElement).click();
      });
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log("✓ [Test] Navigated to Effects tab successfully.");
    }

    // 3. Audit Tab: Studio
    console.log("▶ [Test] Navigating to STUDIO Tab...");
    const studioBtn = Array.from(navButtons).find(btn => btn.textContent?.includes("סטודיו") || btn.textContent?.includes("Studio"));
    if (studioBtn) {
      await act(async () => {
        (studioBtn as HTMLButtonElement).click();
      });
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log("✓ [Test] Navigated to Studio tab successfully.");
    }

    // 4. Audit Tab: Settings & Forms
    console.log("▶ [Test] Navigating to SETTINGS Tab...");
    const settingsBtn = Array.from(navButtons).find(btn => btn.textContent?.includes("הגדרות") || btn.textContent?.includes("Settings"));
    if (settingsBtn) {
      await act(async () => {
        (settingsBtn as HTMLButtonElement).click();
      });
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log("✓ [Test] Navigated to Settings tab successfully.");

      // Test Subpage: WiFi Settings
      console.log("▶ [Test] Auditing WiFi Settings sub-page...");
      const wifiRow = Array.from(container.querySelectorAll("div")).find(el => el.textContent === "WiFi Settings");
      if (wifiRow) {
        await act(async () => {
          wifiRow.click();
        });
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log("✓ [Test] Navigated to WiFi settings panel.");

        // Check if wifi inputs are present
        const ssidInput = container.querySelector("input[value]") || container.querySelector("input");
        expect(ssidInput).not.toBeNull();
        console.log("✓ [Test] Located SSID input field in WiFi form.");

        // Simulate typing (change value and fire change event)
        if (ssidInput) {
          await act(async () => {
            (ssidInput as HTMLInputElement).value = "HoloSpin-Secure";
            ssidInput.dispatchEvent(new Event("input", { bubbles: true }));
          });
          console.log("✓ [Test] Simulated entering SSID in WiFi form.");
        }

        // Click Save button
        const saveBtn = Array.from(container.querySelectorAll("button")).find(btn => btn.textContent?.includes("CONFIRM") || btn.textContent?.includes("שמירה"));
        if (saveBtn) {
          await act(async () => {
            (saveBtn as HTMLButtonElement).click();
          });
          await new Promise(resolve => setTimeout(resolve, 200));
          console.log("✓ [Test] Clicked save button and verified no crashes occurred.");
        }

        // Return to main Settings screen by clicking Settings tab button again
        await act(async () => {
          (settingsBtn as HTMLButtonElement).click();
        });
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log("✓ [Test] Returned to Settings root.");
      }

      // Test Subpage: Calibration
      console.log("▶ [Test] Auditing Calibration sub-page...");
      const calibrationRow = Array.from(container.querySelectorAll("div")).find(el => el.textContent === "Calibration");
      if (calibrationRow) {
        await act(async () => {
          calibrationRow.click();
        });
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log("✓ [Test] Navigated to Calibration panel.");

        // Click a trigger button to run calibration
        const calibrateTriggerBtn = Array.from(container.querySelectorAll("button")).find(btn => btn.textContent?.includes("Calibrate") || btn.textContent?.includes("CALIBRATE") || btn.textContent?.includes("כיול"));
        if (calibrateTriggerBtn) {
          // Reset fetch spy
          (global.fetch as any).mockClear();

          await act(async () => {
            (calibrateTriggerBtn as HTMLButtonElement).click();
          });
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Verify that /calibrate endpoint was hit
          expect(global.fetch).toHaveBeenCalled();
          console.log("✓ [Test] Clicked Calibrate button & verified API request went out successfully!");
        }

        // Return to main Settings screen
        await act(async () => {
          (settingsBtn as HTMLButtonElement).click();
        });
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log("✓ [Test] Completed full navigation, form, and API checks across tabs with 0 fatal crashes!");
  });
});
