import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "const runHandshakeFlow = async (targetModel: string) => {" in line:
        start_idx = i
    if "const handleDownloadLogs = async () => {" in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    new_func = """  const runHandshakeFlow = async () => {
    setIsHandshaking(true);
    setHandshakeLogs([]);
    
    setHandshakeLogs([`[SYSTEM] Connecting to device to fetch model...`]);
    try {
      const targetUrl = getDeviceUrl("/status");
      const res = await safeFetch(targetUrl);
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
  };

  """
    lines = lines[:start_idx] + [new_func] + lines[end_idx:]

with open('src/App.tsx', 'w') as f:
    f.writelines(lines)

