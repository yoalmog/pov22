# HOLOSPIN PRO - ESP32 FIRMWARE

- **MCU**: ESP32 / ESP32-S3
- **LEDs**: WS2812B (Pin 13) - 256 LEDs
- **Motor Control**: MOSFET/ESC (Pin 14)
- **Sensor**: Hall Effect (Pin 12)

## Setup instructions

1. Install the [Arduino IDE](https://www.arduino.cc/en/software).
2. Install the ESP32 board package in the Arduino IDE (Boards Manager -> search for "esp32").
3. Install the required libraries in the Library Manager:
   - `FastLED` by Daniel Garcia
   - `Adafruit LIS3DH` by Adafruit
   - `ArduinoJson` by Benoit Blanchon
   - `ESPAsyncWebServer` by me-no-dev
   - `AsyncTCP` by me-no-dev
4. Open the `Holospin3D.ino` file in the Arduino IDE.
5. Select your ESP32 board and COM port.
6. Click "Upload".
