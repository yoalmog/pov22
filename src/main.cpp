/* 
 * HOLOSPIN PRO - CORE FIRMWARE (ENGINEERING VERIFICATION)
 * Target: ESP32-WROOM-32 / ESP32-S3
 * Libraries: FastLED, ESPAsyncWebServer, BLEDevice, LittleFS
 */

#include <Arduino.h>
#include <FastLED.h>
#include <ESPAsyncWebServer.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLE2902.h>
#include <SPI.h>
#include <SD.h>
#include <ArduinoJson.h>

// --- HARDWARE CONFIGURATION ---
#define LED_PIN 13
#define MOTOR_PIN 14
#define HALL_PIN 12
#define NUM_LEDS 256
#define MAX_RPM 1800

// --- SD CARD PINS ---
#define SD_CS_PIN 5
#define SD_MOSI_PIN 23
#define SD_MISO_PIN 19
#define SD_SCK_PIN 18

CRGB leds[NUM_LEDS];
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

// --- BLE UUIDS ---
#define SERVICE_UUID           "0000aaaa-0000-1000-8000-00805f9b34fb"
#define CHARACTERISTIC_UUID_TX "0000bbbb-0000-1000-8000-00805f9b34fb" // Telemetry
#define CHARACTERISTIC_UUID_RX "0000cccc-0000-1000-8000-00805f9b34fb" // Commands

BLECharacteristic *pTxCharacteristic;
bool deviceConnected = false;

// --- STATE VARIABLES ---
volatile uint32_t lastHallTime = 0;
volatile uint32_t currentRpm = 0;
uint8_t globalBrightness = 128;
bool isCalibrated = false;

// --- HALL SENSOR / RPM CALCULATION ---
void IRAM_ATTR onHallInterrupt() {
    uint32_t now = micros();
    uint32_t delta = now - lastHallTime;
    if (delta > 2000) { // Debounce 2ms
        currentRpm = 60000000 / delta;
        lastHallTime = now;
    }
}

// --- TASK: RENDERING ENGINE (Core 1) ---
void renderTask(void *pvParameters) {
    FastLED.addLeds<WS2812B, LED_PIN, GRB>(leds, NUM_LEDS).setCorrection(TypicalLEDStrip);
    FastLED.setBrightness(globalBrightness);
    
    for (;;) {
        // Calculate rendering offset based on RPM and Micros()
        // Synchronization logic for POV display
        if (currentRpm > 100) {
            // POV Render Logic Here
        }
        
        FastLED.show();
        vTaskDelay(1); // Yield to IDLE
    }
}

// --- TASK: NETWORKING & TELEMETRY (Core 0) ---
void networkTask(void *pvParameters) {
    for (;;) {
        if (deviceConnected) {
            StaticJsonDocument<128> doc;
            doc["rpm"] = currentRpm;
            doc["temp"] = temperatureRead(); // Internal ESP32 sensor
            doc["sync"] = isCalibrated;
            
            char buffer[128];
            serializeJson(doc, buffer);
            pTxCharacteristic->setValue(buffer);
            pTxCharacteristic->notify();
        }
        vTaskDelay(pdMS_TO_TICKS(100)); // 10Hz Telemetry
    }
}

// --- BLE SERVER CALLBACKS ---
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
    };
    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      BLEDevice::startAdvertising(); // Restart advertising on disconnect
    }
};

class MyCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      std::string value = pCharacteristic->getValue();
      if (value.length() > 0) {
        StaticJsonDocument<512> doc;
        deserializeJson(doc, value.c_str());
        if (doc.containsKey("brightness")) {
            globalBrightness = doc["brightness"];
            FastLED.setBrightness(globalBrightness);
        }
        if (doc.containsKey("motorSpeed")) {
            analogWrite(MOTOR_PIN, doc["motorSpeed"]);
        }
      }
    }
};

// --- API: ENDPOINT HANDLERS ---
void setupServerTransitions() {
    server.on("/status", HTTP_GET, [](AsyncWebServerRequest *request) {
        AsyncResponseStream *response = request->beginResponseStream("application/json");
        StaticJsonDocument<512> doc;
        doc["status"] = "ready";
        doc["rpm"] = currentRpm;
        doc["temp"] = 38.5; // Placeholder for logic
        doc["wifi_mode"] = WiFi.getMode() == WIFI_AP ? "AP" : "STA";
        doc["sync"] = isCalibrated;
        
        // Auto-detect chip model
        #if defined(CONFIG_IDF_TARGET_ESP32S3)
            doc["model"] = "ESP32-S3";
        #elif defined(CONFIG_IDF_TARGET_ESP32C3)
            doc["model"] = "ESP32-C3";
        #elif defined(CONFIG_IDF_TARGET_ESP32)
            doc["model"] = "ESP32";
        #else
            doc["model"] = "Unknown ESP32";
        #endif

        serializeJson(doc, *response);
        request->send(response);
    });

    server.on("/scan", HTTP_GET, [](AsyncWebServerRequest *request) {
        int n = WiFi.scanNetworks();
        AsyncResponseStream *response = request->beginResponseStream("application/json");
        DynamicJsonDocument doc(2048);
        JsonArray array = doc.to<JsonArray>();
        for (int i = 0; i < n; ++i) {
            JsonObject obj = array.createNestedObject();
            obj["ssid"] = WiFi.SSID(i);
            obj["signal"] = WiFi.RSSI(i);
            obj["secure"] = WiFi.encryptionType(i) != WIFI_AUTH_OPEN;
        }
        serializeJson(doc, *response);
        request->send(response);
    });

    server.on("/control", HTTP_POST, [](AsyncWebServerRequest *request) {}, NULL, 
        [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            StaticJsonDocument<512> doc;
            deserializeJson(doc, (const char*)data);
            if (doc.containsKey("motorSpeed")) {
                analogWrite(MOTOR_PIN, doc["motorSpeed"]);
            }
            if (doc.containsKey("brightness")) {
                globalBrightness = doc["brightness"];
                FastLED.setBrightness(globalBrightness);
            }
            request->send(200, "application/json", "{\"status\":\"ok\"}");
    });

    // Real physical SD Card file list API
    server.on("/api/files", HTTP_GET, [](AsyncWebServerRequest *request) {
        AsyncResponseStream *response = request->beginResponseStream("application/json");
        DynamicJsonDocument doc(4096);
        JsonArray array = doc.to<JsonArray>();
        
        File root = SD.open("/");
        if (!root) {
            JsonObject obj = array.createNestedObject();
            obj["error"] = "Failed to open SD root directory";
        } else {
            File file = root.openNextFile();
            while (file) {
                if (!file.isDirectory()) {
                    JsonObject obj = array.createNestedObject();
                    obj["name"] = String(file.name());
                    obj["size"] = String(file.size() / 1024) + " KB";
                    obj["type"] = (String(file.name()).endsWith(".png") || String(file.name()).endsWith(".jpg") || String(file.name()).endsWith(".jpeg")) ? "image" : "video";
                    obj["path"] = "/sd/" + String(file.name());
                }
                file = root.openNextFile();
            }
        }
        serializeJson(doc, *response);
        request->send(response);
    });

    // Real file writer for Config.h and main.ino or assets on the physical ESP32 SD Card
    server.on("/api/write-file", HTTP_POST, [](AsyncWebServerRequest *request) {}, NULL,
        [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            StaticJsonDocument<1024> doc;
            deserializeJson(doc, (const char*)data);
            if (doc.containsKey("filename") && doc.containsKey("content")) {
                String filename = doc["filename"];
                String content = doc["content"];
                
                // Write directly to SD Card
                File f = SD.open("/" + filename, FILE_WRITE);
                if (f) {
                    f.print(content);
                    f.close();
                    request->send(200, "application/json", "{\"status\":\"success\",\"message\":\"File saved to SD Card successfully!\"}");
                } else {
                    request->send(500, "application/json", "{\"status\":\"error\",\"message\":\"Failed to write file to SD Card\"}");
                }
            } else {
                request->send(400, "application/json", "{\"status\":\"error\",\"message\":\"Missing filename or content parameter\"}");
            }
        }
    );

    // Real file deletion on the physical ESP32 SD Card
    server.on("/api/delete-file", HTTP_POST, [](AsyncWebServerRequest *request) {}, NULL,
        [](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            StaticJsonDocument<512> doc;
            deserializeJson(doc, (const char*)data);
            if (doc.containsKey("filename")) {
                String filename = doc["filename"];
                if (SD.remove("/" + filename)) {
                    request->send(200, "application/json", "{\"status\":\"success\",\"message\":\"File deleted successfully!\"}");
                } else {
                    request->send(500, "application/json", "{\"status\":\"error\",\"message\":\"Failed to delete file from SD Card\"}");
                }
            } else {
                request->send(400, "application/json", "{\"status\":\"error\",\"message\":\"Missing filename parameter\"}");
            }
        }
    );
}

void setup() {
    Serial.begin(115200);
    
    // SPI and SD Card Setup
    SPI.begin(SD_SCK_PIN, SD_MISO_PIN, SD_MOSI_PIN, SD_CS_PIN);
    if (!SD.begin(SD_CS_PIN)) {
        Serial.println("[ERROR] SD Card Mount Failed!");
    } else {
        Serial.println("[SUCCESS] SD Card Mounted successfully!");
    }
    
    // Hardware Setup
    pinMode(HALL_PIN, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(HALL_PIN), onHallInterrupt, FALLING);
    pinMode(MOTOR_PIN, OUTPUT);
    
    // BLE Setup
    BLEDevice::init("HoloSpin_PRO");
    BLEServer *pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());
    BLEService *pService = pServer->createService(SERVICE_UUID);
    
    pTxCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID_TX,
        BLECharacteristic::PROPERTY_NOTIFY
    );
    pTxCharacteristic->addDescriptor(new BLE2902());

    BLECharacteristic *pRxCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID_RX,
        BLECharacteristic::PROPERTY_WRITE
    );
    pRxCharacteristic->setCallbacks(new MyCallbacks());

    pService->start();
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    BLEDevice::startAdvertising();

    // WiFi Setup (AP Mode Default)
    WiFi.softAP("HoloSpin_AP", "12345678");
    setupServerTransitions();
    server.begin();
    
    // Initialize FreeRTOS Tasks
    xTaskCreatePinnedToCore(renderTask, "Render", 4096, NULL, 5, NULL, 1);
    xTaskCreatePinnedToCore(networkTask, "Net", 4096, NULL, 1, NULL, 0);
}

void loop() {
    // Empty - logic handled by FreeRTOS tasks
}
