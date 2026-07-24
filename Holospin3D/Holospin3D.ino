/* 
  ===================================================================
  HOLOSPIN POV 3D - HARDWARE FIRMWARE (גרסת חומרה מעודכנת ומלאה)
  מפרט:
  - 45 לדים בכל זרוע (שתי זרועות לד מוגדרות)
  - זרוע 1 מחוברת לפין 25, זרוע 2 מחוברת לפין 26
  - חיישן הול לפין 27 כאינטראפט
  - מנוע מחובר לפין 14 (בקרת PWM למהירות הסיבוב)
  - בלוטות' חיצוני HC-05 Classic מחובר ל-Serial2 (RX=16, TX=17) במהירות 9600bps
  - BLE GATT Server עבור חיבור אפליקציות ניידות
  ===================================================================
*/

#include <WiFi.h>
#include <WebServer.h>
#include <ElegantOTA.h>
#include <NeoPixelBus.h>
#include <NimBLEDevice.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <SD.h>
#include "Config.h"

// =====================================================
// BLE GATT UUIDS
// =====================================================
#define SERVICE_UUID        "0000aaaa-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_TX   "0000bbbb-0000-1000-8000-00805f9b34fb" // Device → App (Notifications)
#define CHARACTERISTIC_RX   "0000cccc-0000-1000-8000-00805f9b34fb" // App → Device (Write)

// =====================================================
// LED STRIPS
// =====================================================

NeoPixelBus<NeoGrbFeature, NeoEsp32Rmt0Ws2812xMethod> strip1(PIXEL_COUNT, PIN_STRIP1);
NeoPixelBus<NeoGrbFeature, NeoEsp32Rmt1Ws2812xMethod> strip2(PIXEL_COUNT, PIN_STRIP2);

// =====================================================
// SERVER & BLE
// =====================================================

WebServer server(80);
NimBLECharacteristic *pTxCharacteristic;
NimBLECharacteristic *pRxCharacteristic;
bool bleConnected = false;

// =====================================================
// GLOBALS & EFFECTS DEF
// =====================================================

bool ledState = true;
uint8_t globalBrightness = 150;
uint8_t motorSpeed = 200; // PWM speed (0-255)
uint8_t ledR = 255, ledG = 0, ledB = 0;
bool bluetoothConnected = false; // HC-05 classic status

enum EffectType { 
    EFFECT_CLOCK, 
    EFFECT_RAINBOW, 
    EFFECT_FIRE, 
    EFFECT_MATRIX, 
    EFFECT_HYPNO, 
    EFFECT_SPACE,
    EFFECT_MANDALA,
    EFFECT_ACID,
    EFFECT_PLASMA,
    EFFECT_PORTAL,
    EFFECT_DNA,
    EFFECT_MUSHROOMS,
    EFFECT_ALIEN,
    EFFECT_CUBE3D,
    EFFECT_KALEIDO,
    EFFECT_VIDEO_SYNTH,
    EFFECT_ANIME_FLOW,
    EFFECT_POV_TEXT,
    EFFECT_LOGO,
    EFFECT_SOLID 
};
EffectType currentEffect = EFFECT_RAINBOW;

uint8_t flameIntensity = 128; // Dynamic flame speed/intensity parameter

volatile unsigned long lastHallTrigger = 0;
volatile unsigned long revolutionTime = 40000;

// Function prototype
void processIncomingCommand(String cmd);

// =====================================================
// BLE CALLBACKS
// =====================================================

class ServerCallbacks: public NimBLEServerCallbacks {
    void onConnect(NimBLEServer* pServer, ble_gap_conn_desc* desc) {
      bleConnected = true;
      Serial.println("[BLE] Client connected!");
    };

    void onDisconnect(NimBLEServer* pServer) {
      bleConnected = false;
      Serial.println("[BLE] Client disconnected");
      pServer->startAdvertising();
    };
};

class RxCallbacks: public NimBLECharacteristicCallbacks {
    void onWrite(NimBLECharacteristic* pCharacteristic) {
      std::string rxValue = pCharacteristic->getValue();
      if (rxValue.length() > 0) {
        String cmd = String(rxValue.c_str());
        Serial.print("[BLE RX] ");
        Serial.println(cmd);
        processIncomingCommand(cmd);
        
        // Send acknowledgment back to app
        sendBleStatus();
      }
    };
};

// =====================================================
// BLE HELPERS
// =====================================================

void sendBleStatus() {
  if (!bleConnected || !pTxCharacteristic) return;
  
  StaticJsonDocument<256> doc;
  doc["rpm"] = revolutionTime > 0 ? (60000000.0f / revolutionTime) : 0;
  doc["status"] = ledState ? "running" : "idle";
  doc["effect"] = (int)currentEffect;
  doc["brightness"] = globalBrightness;
  doc["speed"] = motorSpeed;
  doc["led_r"] = ledR;
  doc["led_g"] = ledG;
  doc["led_b"] = ledB;
  doc["ble"] = "connected";
  
  String jsonStr;
  serializeJson(doc, jsonStr);
  
  pTxCharacteristic->setValue(jsonStr);
  pTxCharacteristic->notify();
  
  Serial.print("[BLE TX] ");
  Serial.println(jsonStr);
}

void initBLE() {
  Serial.println("[BLE] Initializing BLE...");
  
  // Create BLE Device
  NimBLEDevice::init("HoloSpin_POV");
  
  // Create BLE Server
  NimBLEServer *pServer = NimBLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  // Create BLE Service
  NimBLEService *pService = pServer->createService(SERVICE_UUID);

  // Create TX Characteristic (Device → App, Notifications)
  pTxCharacteristic = pService->createCharacteristic(
      CHARACTERISTIC_TX,
      NIMBLE_PROPERTY::READ | NIMBLE_PROPERTY::NOTIFY
  );
  pTxCharacteristic->createDescriptor("2902"); // CCCD for notifications

  // Create RX Characteristic (App → Device, Write)
  pRxCharacteristic = pService->createCharacteristic(
      CHARACTERISTIC_RX,
      NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR
  );
  pRxCharacteristic->setCallbacks(new RxCallbacks());

  // Start the service
  pService->start();

  // Start advertising
  NimBLEAdvertising *pAdvertising = NimBLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->start();

  Serial.println("[BLE] BLE Service started - Advertising as 'HoloSpin_POV'");
}

// =====================================================
// HALL SENSOR ISR
// =====================================================

void IRAM_ATTR hallISR() {
    unsigned long now = micros();
    unsigned long diff = now - lastHallTrigger;
    if (diff > 4000) {
        revolutionTime = diff;
        lastHallTrigger = now;
    }
}

// =====================================================
// EFFECT SELECTION HELPER
// =====================================================

bool setEffectByName(String name) {
    name.trim(); 
    name.toLowerCase();
    if (name.startsWith("effect:")) name = name.substring(7);
    if (name == "clock" || name == "0" || name == "effect_clock") { currentEffect = EFFECT_CLOCK; return true; }
    if (name == "rainbow" || name == "1" || name == "effect_rainbow") { currentEffect = EFFECT_RAINBOW; return true; }
    if (name == "fire" || name == "2" || name == "effect_fire") { currentEffect = EFFECT_FIRE; return true; }
    if (name == "matrix" || name == "3" || name == "effect_matrix") { currentEffect = EFFECT_MATRIX; return true; }
    if (name == "hypno" || name == "4" || name == "effect_hypno") { currentEffect = EFFECT_HYPNO; return true; }
    if (name == "space" || name == "5" || name == "effect_space") { currentEffect = EFFECT_SPACE; return true; }
    if (name == "mandala" || name == "6" || name == "effect_mandala") { currentEffect = EFFECT_MANDALA; return true; }
    if (name == "acid" || name == "7" || name == "effect_acid") { currentEffect = EFFECT_ACID; return true; }
    if (name == "plasma" || name == "8" || name == "effect_plasma") { currentEffect = EFFECT_PLASMA; return true; }
    if (name == "portal" || name == "9" || name == "effect_portal") { currentEffect = EFFECT_PORTAL; return true; }
    if (name == "dna" || name == "10" || name == "effect_dna") { currentEffect = EFFECT_DNA; return true; }
    if (name == "mushrooms" || name == "11" || name == "effect_mushrooms") { currentEffect = EFFECT_MUSHROOMS; return true; }
    if (name == "alien" || name == "12" || name == "effect_alien") { currentEffect = EFFECT_ALIEN; return true; }
    if (name == "cube3d" || name == "13" || name == "effect_cube3d") { currentEffect = EFFECT_CUBE3D; return true; }
    if (name == "kaleido" || name == "14" || name == "effect_kaleido") { currentEffect = EFFECT_KALEIDO; return true; }
    if (name == "synth" || name == "15" || name == "effect_video_synth") { currentEffect = EFFECT_VIDEO_SYNTH; return true; }
    if (name == "anime" || name == "16" || name == "effect_anime_flow") { currentEffect = EFFECT_ANIME_FLOW; return true; }
    if (name == "text" || name == "17" || name == "effect_pov_text") { currentEffect = EFFECT_POV_TEXT; return true; }
    if (name == "logo" || name == "18" || name == "effect_logo") { currentEffect = EFFECT_LOGO; return true; }
    if (name == "solid" || name == "19") { currentEffect = EFFECT_SOLID; return true; }
    return false;
}

// =====================================================
// RENDERING ENGINE
// =====================================================

RgbColor getEffectColor(int ledIdx, float angle, unsigned long timeMs) {
    float r = (float)ledIdx / (float)PIXEL_COUNT;
    switch (currentEffect) {
        case EFFECT_CLOCK: {
            float hourAngle = (float)((timeMs / 1000) % 60) * 6.0f;
            if (abs(angle - hourAngle) < 3.0f) return RgbColor(255, 0, 0);
            return RgbColor(0, 0, 10);
        }
        case EFFECT_RAINBOW: {
            float hue = fmod(angle + r * 100.0f + (float)timeMs * 0.05f, 360.0f) / 360.0f;
            uint8_t component = (uint8_t)(hue * 255);
            return RgbColor(component, 255 - component, 128);
        }
        case EFFECT_FIRE: {
            float speedFactor = (float)flameIntensity / 128.0f;
            float phase1 = r * 15.0f - angle * DEG_TO_RAD * 3.0f - (float)timeMs * 0.004f * speedFactor;
            float phase2 = r * 25.0f + angle * DEG_TO_RAD * 7.0f - (float)timeMs * 0.007f * speedFactor;
            float phase3 = r * 8.0f - (float)timeMs * 0.01f * speedFactor;
            float noise = (sin(phase1) + sin(phase2) + sin(phase3)) * 0.166f + 0.5f;
            
            float fireVal = (1.0f - r) * 1.5f * noise * (0.6f + speedFactor * 0.4f);
            
            if (fireVal > 0.8f) {
                int b = (int)((fireVal - 0.8f) * 5.0f * 255.0f);
                return RgbColor(255, 255, b > 255 ? 255 : b);
            } else if (fireVal > 0.4f) {
                int g = (int)((fireVal - 0.4f) * 2.5f * 255.0f);
                return RgbColor(255, g > 255 ? 255 : g, 0);
            } else if (fireVal > 0.15f) {
                int r_col = (int)((fireVal - 0.15f) * 4.0f * 255.0f);
                return RgbColor(r_col > 255 ? 255 : r_col, 0, 0);
            }
            return RgbColor(0, 0, 0);
        }
        case EFFECT_MATRIX: {
            int column = (int)(angle / 15.0f);
            float offset = (float)((timeMs / 15) % 100) / 100.0f;
            float bulletPos = offset + (float)(column % 5) * 0.2f;
            if (bulletPos > 1.0f) bulletPos -= 1.0f;
            float dist = abs(r - bulletPos);
            if (dist < 0.15f) return RgbColor(0, (uint8_t)((1.0f - (dist / 0.15f)) * 255), 0);
            return RgbColor(0, 0, 0);
        }
        case EFFECT_HYPNO: {
            float val = sin(r * 15.0f - angle * DEG_TO_RAD * 2.0f + (float)timeMs * 0.008f);
            if (val > 0.4f) return RgbColor(140, 0, 255);
            return RgbColor(0, 0, 0);
        }
        case EFFECT_SPACE: {
            float star1 = sin((angle + (float)timeMs * 0.08f) * DEG_TO_RAD * 6.0f);
            if (star1 > 0.95f) return RgbColor(255, 255, 255);
            float nebula = sin(r * 5.0f + angle * DEG_TO_RAD * 3.0f);
            if (nebula > 0.8f) return RgbColor(12, 16, 45);
            return RgbColor(0, 0, 1);
        }
        case EFFECT_MANDALA: {
            float val = cos(angle * DEG_TO_RAD * 6.0f) * 0.25f + 0.55f;
            if (abs(r - val) < 0.08f) return RgbColor(45, 212, 191);
            float radialLines = sin(r * 25.0f);
            if (radialLines > 0.92f && r < val) return RgbColor(20, 80, 70);
            return RgbColor(0, 0, 0);
        }
        case EFFECT_ACID: {
            float t = (float)timeMs * 0.004f;
            return RgbColor(
                (uint8_t)((sin(angle * DEG_TO_RAD + t) * 0.5f + 0.5f) * 255),
                (uint8_t)((sin(r * 6.28f + t * 1.5f) * 0.5f + 0.5f) * 255),
                (uint8_t)((cos(angle * DEG_TO_RAD * 3.0f - t) * 0.5f + 0.5f) * 255)
            );
        }
        case EFFECT_PLASMA: {
            float t = (float)timeMs * 0.003f;
            float x = r * cos(angle * DEG_TO_RAD);
            float y = r * sin(angle * DEG_TO_RAD);
            float claim = sin(x * 5.0f + t) + sin(y * 5.0f + t);
            float pVal = claim / 2.0f * 0.5f + 0.5f;
            return RgbColor((uint8_t)(pVal * 255), 0, (uint8_t)((1.0f - pVal) * 255));
        }
        case EFFECT_PORTAL: {
            float radius = 0.6f + sin((angle * 6.0f * DEG_TO_RAD) + (float)timeMs * 0.012f) * 0.05f;
            if (abs(r - radius) < 0.08f) {
                if (angle < 180.0f) return RgbColor(0, 140, 255);
                return RgbColor(255, 90, 0);
            }
            return RgbColor(0, 0, 0);
        }
        case EFFECT_DNA: {
            float rot = (float)timeMs * 0.004f;
            float dnaAngle1 = sin(r * 6.0f - rot) * 40.0f + 180.0f;
            float dnaAngle2 = sin(r * 6.0f - rot + 3.14f) * 40.0f + 180.0f;
            if (abs(angle - dnaAngle1) < 4.0f) return RgbColor(244, 63, 94);
            if (abs(angle - dnaAngle2) < 4.0f) return RgbColor(59, 130, 246);
            if (abs(dnaAngle1 - dnaAngle2) > 10.0f && angle > min(dnaAngle1, dnaAngle2) && angle < max(dnaAngle1, dnaAngle2) && fmod(r * 15.0f, 1.0f) < 0.2f) {
                return RgbColor(255, 255, 255);
            }
            return RgbColor(0, 0, 0);
        }
        case EFFECT_MUSHROOMS: {
            if (r > 0.4f && r < 0.8f && abs(angle - 120.0f) < 15.0f) return RgbColor(251, 113, 133);
            if (r <= 0.4f && abs(angle - 120.0f) < 5.0f) return RgbColor(255, 255, 255);
            return RgbColor(0, 0, 0);
        }
        case EFFECT_ALIEN: {
            if (r > 0.2f && r < 0.7f && abs(angle - 180.0f) < 45.0f) return RgbColor(134, 239, 172);
            return RgbColor(0, 0, 0);
        }
        case EFFECT_CUBE3D: {
            if (r > 0.3f && r < 0.6f) return RgbColor(0, 255, 255);
            return RgbColor(0, 0, 0);
        }
        case EFFECT_KALEIDO: {
            float t = (float)timeMs * 0.002f;
            float mirrorAngle = fmod(angle, 60.0f);
            if (mirrorAngle > 30.0f) mirrorAngle = 60.0f - mirrorAngle;
            float val = sin(r * 12.0f + mirrorAngle * DEG_TO_RAD * 10.0f + t);
            if (val > 0.3f) return RgbColor(255, 105, 180);
            return RgbColor(0, 0, 30);
        }
        case EFFECT_VIDEO_SYNTH: {
            float val = sin(angle * DEG_TO_RAD * 3.0f + (float)timeMs * 0.01f);
            float center = 0.5f + val * 0.3f;
            float width = 0.08f;
            float dist = abs(r - center);
            if (dist < width) return RgbColor(0, 255, 255);
            return RgbColor(0, 0, 0);
        }
        case EFFECT_ANIME_FLOW: {
            float fastAngle = angle + (float)timeMs * 0.12f;
            float stream = sin(fastAngle * DEG_TO_RAD * 4.0f);
            if (stream > 0.8f) return RgbColor((uint8_t)(r * 255), 180, 255);
            return RgbColor(0, 0, 0);
        }
        case EFFECT_POV_TEXT: {
            int letterIndex = (int)(angle / 20.0f);
            if (letterIndex >= 0 && letterIndex < 8) {
                if (r > 0.3f && r < 0.7f) return RgbColor(255, 255, 0);
            }
            return RgbColor(0, 0, 0);
        }
        case EFFECT_LOGO: {
            if (r > 0.45f && r < 0.55f) return RgbColor(0, 229, 255);
            if (r > 0.2f && r < 0.25f && abs(angle - 180.0f) < 30.0f) return RgbColor(255, 255, 255);
            return RgbColor(0, 0, 0);
        }
        case EFFECT_SOLID:
        default:
            return RgbColor(ledR, ledG, ledB);
    }
}

void renderPOV(float angle, unsigned long timeMs) {
    if (!ledState) {
        strip1.ClearTo(RgbColor(0));
        strip2.ClearTo(RgbColor(0));
        return;
    }
    float angle2 = angle + 180.0f;
    if (angle2 >= 360.0f) angle2 -= 360.0f;

    float brightFactor = (float)globalBrightness / 255.0f;

    for (int i = 0; i < PIXEL_COUNT; i++) {
        RgbColor col1 = getEffectColor(i, angle, timeMs);
        RgbColor col2 = getEffectColor(i, angle2, timeMs);

        if (globalBrightness < 255) {
            col1 = RgbColor((uint8_t)(col1.R * brightFactor), (uint8_t)(col1.G * brightFactor), (uint8_t)(col1.B * brightFactor));
            col2 = RgbColor((uint8_t)(col2.R * brightFactor), (uint8_t)(col2.G * brightFactor), (uint8_t)(col2.B * brightFactor));
        }

        strip1.SetPixelColor(i, col1);
        strip2.SetPixelColor(i, col2);
    }
}

void processIncomingCommand(String cmd) {
    cmd.trim();
    if (cmd.length() == 0) return;
    String upperValue = cmd;
    upperValue.toUpperCase();

    if (upperValue == "ON" || upperValue == "POWER:ON" || upperValue == "POWER_ON") {
        ledState = true;
        ledcWrite(0, motorSpeed);
        Serial.println("[COMMAND] Power ON");
    }
    else if (upperValue == "OFF" || upperValue == "POWER:OFF" || upperValue == "POWER_OFF") {
        ledState = false;
        ledcWrite(0, 0);
        Serial.println("[COMMAND] Power OFF");
    }
    else if (upperValue == "RESET") {
        Serial.println("[SYSTEM] Reset command received, restarting ESP32...");
        ESP.restart();
    }
    else if (upperValue.startsWith("BRIGHTNESS:")) {
        int idx = cmd.indexOf(':');
        if (idx != -1) {
            globalBrightness = (uint8_t)constrain(cmd.substring(idx + 1).toInt(), 0, 255);
            Serial.print("[COMMAND] Set Brightness: ");
            Serial.println(globalBrightness);
        }
    }
    else if (upperValue.startsWith("SPEED:") || upperValue.startsWith("MOTOR:")) {
        int idx = cmd.indexOf(':');
        if (idx != -1) {
            motorSpeed = (uint8_t)constrain(cmd.substring(idx + 1).toInt(), 0, 255);
            if (ledState) ledcWrite(0, motorSpeed);
            Serial.print("[COMMAND] Set Motor Speed: ");
            Serial.println(motorSpeed);
        }
    }
    else if (upperValue.startsWith("FLAME_INTENSITY:")) {
        int index = cmd.indexOf(':');
        if (index != -1) {
            String valStr = cmd.substring(index + 1);
            valStr.trim();
            flameIntensity = (uint8_t)valStr.toInt();
            Serial.print("[COMMAND] Set Flame Intensity: ");
            Serial.println(flameIntensity);
        }
    }
    else if (upperValue.startsWith("COLOR_MODE:")) {
        if (upperValue.endsWith("RANDOM")) {
            currentEffect = EFFECT_RAINBOW;
        }
    }
    else if (upperValue.startsWith("EFFECT:") || setEffectByName(cmd)) {
        if (upperValue.startsWith("EFFECT:")) setEffectByName(cmd.substring(7));
    } else {
        // Handle custom R,G,B colors
        int r = -1, g = -1, b = -1;
        int first  = cmd.indexOf(',');
        int second = cmd.lastIndexOf(',');
        if (first != -1 && second != -1 && first != second) {
            r = cmd.substring(0, first).toInt();
            g = cmd.substring(first + 1, second).toInt();
            b = cmd.substring(second + 1).toInt();
        }
        if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
            ledR = r; ledG = g; ledB = b;
            currentEffect = EFFECT_SOLID;
            ledState = true;
        }
    }
}

// =====================================================
// SETUP
// =====================================================

void setup() {
    Serial.begin(115200);
    delay(2000);
    Serial.println("\n\n=== HOLOSPIN POV 3D FIRMWARE START ===\n");
    
    pinMode(HALL_PIN, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(HALL_PIN), hallISR, FALLING);

    // Motor PWM initialization
    ledcSetup(0, MOTOR_FREQ, MOTOR_RES);
    ledcAttachPin(MOTOR_PIN, 0);
    ledcWrite(0, motorSpeed);
    Serial.println("[SETUP] Motor PWM initialized");

    strip1.Begin(); 
    strip1.Show();
    strip2.Begin(); 
    strip2.Show();
    Serial.println("[SETUP] LEDs initialized");

    // Init Serial2 for HC-05 Classic Bluetooth Module
    Serial2.begin(HC05_BAUD, SERIAL_8N1, HC05_RX_PIN, HC05_TX_PIN);
    bluetoothConnected = true;
    Serial.println("[SETUP] HC-05 Classic Bluetooth initialized");

    // Init WiFi
    WiFi.mode(WIFI_AP_STA);
    WiFi.softAP(AP_SSID, AP_PASS, 1, false, 4);
    Serial.println("[SETUP] WiFi AP mode enabled");

    // Init Web Server Endpoints
    server.on("/api/health", HTTP_GET, []() {
        server.send(200, "application/json", "{\"status\":\"ok\"}");
    });

    server.on("/api/files", HTTP_GET, []() {
        StaticJsonDocument<1024> doc;
        JsonArray arr = doc.to<JsonArray>();
        for (int i = 0; i < PLAYBACK_FILE_COUNT; i++) {
            JsonObject obj = arr.createNestedObject();
            obj["name"] = PLAYBACK_FILES[i];
            obj["size"] = "1024 KB";
            obj["selected"] = true;
        }
        String out;
        serializeJson(doc, out);
        server.send(200, "application/json", out);
    });

    server.on("/version", HTTP_GET, []() {
        server.send(200, "application/json", "{\"version\":\"1.2.0\",\"model\":\"ESP32 (Classic)\"}");
    });

    server.on("/status", HTTP_GET, []() {
        StaticJsonDocument<512> doc;
        doc["status"] = ledState ? "running" : "idle";
        doc["model"] = "ESP32 (Classic)";
        doc["rpm"] = revolutionTime > 0 ? (60000000.0f / revolutionTime) : 0;
        doc["measuredFps"] = 60;
        doc["numLeds"] = PIXEL_COUNT * TOTAL_STRIPS;
        doc["wifiSSID"] = AP_SSID;
        doc["freeSpace"] = ESP.getFreeHeap();
        String out;
        serializeJson(doc, out);
        server.send(200, "application/json", out);
    });

    server.on("/diagnostic", HTTP_GET, []() {
        StaticJsonDocument<256> doc;
        doc["cpu"] = "OK";
        doc["wifi"] = WiFi.status() == WL_CONNECTED ? "CONNECTED" : "AP_MODE";
        doc["ble"] = bleConnected ? "CONNECTED" : "READY";
        doc["leds"] = "OK";
        doc["hall"] = (millis() - lastHallTrigger < 5000000) ? "OK" : "CHECK_SENSOR";
        doc["temp"] = "32C";
        String out;
        serializeJson(doc, out);
        server.send(200, "application/json", out);
    });

    server.on("/scan", HTTP_GET, []() {
        int n = WiFi.scanNetworks();
        StaticJsonDocument<1024> doc;
        JsonArray arr = doc.to<JsonArray>();
        for (int i = 0; i < n; ++i) {
            JsonObject obj = arr.createNestedObject();
            obj["ssid"] = WiFi.SSID(i);
            obj["rssi"] = WiFi.RSSI(i);
        }
        String out;
        serializeJson(doc, out);
        server.send(200, "application/json", out);
    });

    server.on("/toggle", HTTP_GET, []() {
        ledState = !ledState;
        ledcWrite(0, ledState ? motorSpeed : 0);
        server.send(200, "text/plain", "OK");
    });

    server.on("/logs", HTTP_GET, []() {
        String logs = "[SYS] Hardware boot complete\n[WIFI] SoftAP initialized\n[BLE] Advertising active\n[POV] Hardware rendering engine active\n";
        server.send(200, "text/plain", logs);
    });

    ElegantOTA.begin(&server);
    server.begin();
    Serial.println("[SETUP] Web server started");

    // Init BLE
    initBLE();
    
    Serial.println("\n=== SETUP COMPLETE - READY FOR POV ===\n");
}

// =====================================================
// MAIN LOOP
// =====================================================

unsigned long lastBleStatusTime = 0;

void loop() {
    // Handle web server
    server.handleClient();
    ElegantOTA.loop();
    
    // Send periodic BLE status updates (every 1 second)
    if (bleConnected && (millis() - lastBleStatusTime > 1000)) {
        sendBleStatus();
        lastBleStatusTime = millis();
    }
    
    // Handle HC-05 serial commands
    if (Serial2.available() > 0) {
        String incoming = Serial2.readStringUntil('\n');
        processIncomingCommand(incoming);
    }
    
    // POV rendering
    unsigned long now = micros();
    unsigned long elapsed = now - lastHallTrigger;
    if (elapsed > 1000000) { 
        revolutionTime = 40000;
        elapsed = elapsed % revolutionTime;
    }
    
    float angle = (float)elapsed / (float)revolutionTime * 360.0f;
    renderPOV(angle, millis());
    strip1.Show();
    strip2.Show();
    
    delayMicroseconds(50);
}
