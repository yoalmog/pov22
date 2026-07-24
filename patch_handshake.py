import sys

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_handshake = """  const runHandshakeFlow = async (targetModel: string) => {
    setIsHandshaking(true);
    setHandshakeLogs([]);
    
    const logs = [
      `[00:00.100] [SYSTEM] Initiating handshake sequence...`,
      `[00:00.350] [CONNECT] Opening communication channel (BLE/WiFi)...`,
      `[00:00.700] [HANDSHAKE] Sending 'QUERY_CHIP_MODEL' command block...`,
      `[00:01.100] [RESPONSE] Received response: 0x55 0xAA [FINGERPRINT]`,
      `[00:01.400] [AUTO-DETECT] Parsing controller hardware signatures...`,
    ];
    for (let i = 0; i < logs.length; i++) {
      await new Promise(r => setTimeout(r, 400));
      setHandshakeLogs(prev => [...prev, logs[i]]);
    }

    let detectedText = "";
    let finalModelName = "ESP32 (Classic)";

    if (targetModel === "S3") {
      detectedText = `[00:01.800] [DETECTED] Chip: ESP32-S3 (Dual-Core Xtensa® LX7, RMT & USB-OTG Enabled)`;
      finalModelName = "ESP32-S3";
    } else if (targetModel === "C3") {
      detectedText = `[00:01.800] [DETECTED] Chip: ESP32-C3 (Single-Core RISC-V, Low Power Enabled)`;
      finalModelName = "ESP32-C3";
    } else if (targetModel === "WROOM") {
      detectedText = `[00:01.800] [DETECTED] Chip: ESP32 WROOM 32D (Dual-Core Xtensa® LX6, Advanced Wireless Core)`;
      finalModelName = "ESP32 WROOM 32D";
    } else {
      detectedText = `[00:01.800] [DETECTED] Chip: ESP32 (Classic Dual-Core Xtensa® LX6, Legacy WiFi/BLE)`;
      finalModelName = "ESP32";
    }

    await new Promise(r => setTimeout(r, 450));
    setHandshakeLogs(prev => [...prev, detectedText]);

    await new Promise(r => setTimeout(r, 500));
    setHandshakeLogs(prev => [
      ...prev,
      `[00:02.300] [OPTIMIZE] Auto-applying optimized firmware pin mapping for ${finalModelName}...`
    ]);

    let ledPins = "25, 26";
    let motorPin = 12;
    let sensorPin = 27;

    if (targetModel === "S3") {
      ledPins = "15, 16";
      motorPin = 17;
      sensorPin = 18;
    } else if (targetModel === "C3") {
      ledPins = "4, 5";
      motorPin = 6;
      sensorPin = 7;
    }

    await new Promise(r => setTimeout(r, 600));
    setHandshakeLogs(prev => [
      ...prev,
      `[00:02.900] [OPTIMIZE] LED data pins: GPIO ${ledPins}`,
      `[00:03.100] [OPTIMIZE] Motor PWM pin: GPIO ${motorPin}`,
      `[00:03.300] [OPTIMIZE] Hall sensor interrupt: GPIO ${sensorPin}`,
    ]);

    await new Promise(r => setTimeout(r, 400));
    setHandshakeLogs(prev => [
      ...prev,
      `[00:03.700] [SUCCESS] Handshake fully complete! Device optimized and ready.`
    ]);

    // Apply the actual state update
    setChipModel(finalModelName);
    applyOptimizedPinDefaults(targetModel);
    
    // Call server API to synchronize model in real express backend
    try {
      await fetch("/api/set-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: finalModelName })
      });
    } catch (e) {
      console.warn("Could not sync active model to server backend:", e);
    }
    setIsHandshaking(false);
  };"""

new_handshake = """  const runHandshakeFlow = async () => {
    setIsHandshaking(true);
    setHandshakeLogs([]);
    
    setHandshakeLogs([`[SYSTEM] Connecting to device to fetch model...`]);
    try {
      const res = await safeFetch("/status");
      if (!res.ok) throw new Error("Could not reach device");
      const data = await res.json();
      
      const finalModelName = data.model || "ESP32 (Classic)";
      setHandshakeLogs(prev => [...prev, `[DETECTED] Chip: ${finalModelName}`]);
      setHandshakeLogs(prev => [...prev, `[SUCCESS] Handshake complete. Loading pin mapping.`]);
      
      setChipModel(finalModelName);
      
      let targetModel = "Classic";
      if (finalModelName.includes("S3")) targetModel = "S3";
      if (finalModelName.includes("C3")) targetModel = "C3";
      if (finalModelName.includes("WROOM")) targetModel = "WROOM";
      
      applyOptimizedPinDefaults(targetModel);
    } catch (e: any) {
      setHandshakeLogs(prev => [...prev, `[ERROR] Handshake failed: ${e.message}`]);
    }
    setIsHandshaking(false);
  };"""

content = content.replace(old_handshake, new_handshake)
content = content.replace("runHandshakeFlow(selectedSimModel)", "runHandshakeFlow()")

with open('src/App.tsx', 'w') as f:
    f.write(content)
