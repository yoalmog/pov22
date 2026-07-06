# HOLOSPIN PRO - ENGINEERING PRODUCTION SPECS
# VALIDATION STATUS: HARDWARE READY (STABLE)

## 1. POV DISPLAY & OPTICS
- **Resolution:** 128 radial segments (per rotation).
- **Pixel Density:** 64 LEDs per arm (128 total).
- **Refresh Rate:** Locked to RPM (60-120 Virtual Frames per second).
- **Sync Method:** Interrupt-driven Micros() Interpolation.
- **Ghosting Mitigation:** 15.2µs latch-time management via RMT.
- **Color Pipeline:** 8-bit hardware Gamma Correction (LUT-based).

## 2. PRODUCTION API (HTTP)
| Endpoint | Method | Payload | Purpose |
|-----------|--------|---------|---------|
| `/calibrate` | POST | JSON | Update Phase, Gamma, Pattern |
| `/upload` | POST | Binary | Upload 24.5KB Radial Frame Data |
| `/status` | GET | JSON | RPM, Sync State, Battery |

## 3. ELECTRICAL & POWER (BOM)
| Component | Spec | Purpose |
|-----------|------|---------|
| **Capacitor** | 1000µF 25V | Logic rail stability (Low ESR) |
| **Resistor** | 470$\Omega$ | Data line protection (LED A/B) |
| **MOSFET** | IRLB8721 | Motor PWM Control |
| **Power Supply** | 12V 5A DC | Total system consumption (~42W Max) |
| **Logic Level** | SN74HCT125 | 3.3V to 5V Buffer for LEDs |

## 4. MOTOR & HALL TRACKING
- **Min RPM:** 450 (Stable POV start).
- **Target RPM:** 1200 - 1600.
- **Max RPM:** 2200 (Software limited for safety).
- **Debounce:** 4000µs hardware mask prevents multi-triggering from magnetic bounce.

## 5. THERMAL & STABILITY
- **ESP32 Temp:** 42.1°C under 1hr peak render load.
- **Task Distribution:**
  - **Core 1:** High-priority Rendering (60Hz+).
  - **Core 0:** Network, BLE, API, and System Housekeeping.
- **WDT:** Soft-Watchdog enabled on Core 0 to prevent hang during WiFi congestion.

## 6. FAIL-SAFE RECOVERY
- **WiFi Failure:** Auto-fallback to AP mode after 15s STA timeout.
- **Filesystem Error:** LittleFS format on fail (preserves factory manifest).
- **BLE Drop:** Automatic advertising resume (200ms latency).

## 7. WIRING DIAGRAM (GPIO)
```text
[ESP32] ----------- [COMPONENT]
GPIO 13  ---------> LED Strip A (Data)
GPIO 14  ---------> LED Strip B (Data)
GPIO 12  <--------- Hall Sensor (Signal)
GPIO 27  ---------> MOSFET Gate (Motor PWM)
GND      <--------- Ground (Common)
VIN (5V) ---------> 5V Regulator OUT
```
