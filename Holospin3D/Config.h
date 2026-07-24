// Config.h
#pragma once

// VISUAL CONFIGURATION
#define PIXEL_COUNT 45        // 45 לדים בכל זרוע של ההולוגרמה (מעודכן פיזית)

// LED STRIP PINS (שתי זרועות לד מדווחות)
#define PIN_STRIP1 25         // זרוע לד 1 מחוברת לפין 25
#define PIN_STRIP2 26         // זרוע לד 2 מחוברת לפין 26

// SENSOR AND MOTOR PINS
#define HALL_PIN 27           // חיישן הול (Hall Effect) לפין 27
#define MOTOR_PIN 14          // פין מנוע (נקבע לפין 14 - כניסת PWM יציבה ומאושרת)
#define MOTOR_FREQ 5000       // תדר עבודה של המנוע (5kHz)
#define MOTOR_RES 8           // רזולוציית בקרת מהירות (8 סיביות)

// HC-05 BLUETOOTH CLASSIC MODULE CONFIG (מודול בלוטות' חיצוני)
#define HC05_BAUD 9600        // קצב ברירת מחדל של HC-05
#define HC05_RX_PIN 16        // פין RX2 מחובר ל-TX של מודול HC-05
#define HC05_TX_PIN 17        // פין TX2 מחובר ל-RX של מודול HC-05

// WIFI - ROUTER / ראוטר (STA MODE)
#define ROUTER_SSID "Dael CR"
#define ROUTER_PASS "14cusco05"

// WIFI - LOCAL HOTSPOT / נקודה חמה (AP MODE)
#define AP_SSID "Holospin_POV2"
#define AP_PASS "12345678"

// REGISTERED PLAYBACK FILES ON SD (אישור קבצי תצוגה לקוד)
#define PLAYBACK_FILE_COUNT 4
const char* PLAYBACK_FILES[PLAYBACK_FILE_COUNT] = {
  "/images/butterfly_nebula.png",
  "/images/hologram_planet.png",
  "/videos/galaxy_big_bang.mp4",
  "/videos/matrix_rain_tunnel.mp4"
};
