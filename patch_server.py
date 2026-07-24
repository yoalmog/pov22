import sys
import re

with open('server.ts', 'r') as f:
    content = f.read()

# Fix log obfuscation
content = re.sub(
    r'const cleanMsg = rawMsg\.replace\(/error/gi, "err_info"\)\.replace\(/failed/gi, "fld_info"\)\.replace\(/exception/gi, "exc_info"\);',
    r'const cleanMsg = rawMsg;',
    content
)

# Replace the mock endpoints with real implementations or proxying logic (but since this is a local web server for the UI, the UI expects it to talk to the device).
# We can just return 503 if no device IP is configured, or fetch from device if it is.
# But wait, if this is the actual Node.js server that runs alongside the app, maybe it should just return an error if it can't proxy to an ESP32.

new_endpoints = """
  // Determine ESP32 IP from environment variable
  const ESP32_IP = process.env.ESP32_IP;
  const proxyToEsp32 = async (req, res, path) => {
    if (!ESP32_IP) {
      return res.status(503).json({ error: "No ESP32_IP configured. Device offline." });
    }
    try {
      const response = await fetch(`http://${ESP32_IP}${path}`, {
        method: req.method,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
        headers: { 'Content-Type': req.headers['content-type'] || 'application/json' }
      });
      const data = await response.text();
      res.status(response.status).send(data);
    } catch (e) {
      res.status(502).json({ error: "Failed to connect to ESP32" });
    }
  };

  app.get("/status", (req, res) => proxyToEsp32(req, res, '/status'));
  app.get("/version", (req, res) => proxyToEsp32(req, res, '/version'));
  app.post("/api/set-model", (req, res) => proxyToEsp32(req, res, '/api/set-model'));
  app.get("/api/status", (req, res) => proxyToEsp32(req, res, '/status'));
  app.post("/calibrate", (req, res) => proxyToEsp32(req, res, '/calibrate'));
  app.post("/control", (req, res) => proxyToEsp32(req, res, '/control'));
  app.post("/config", (req, res) => proxyToEsp32(req, res, '/config'));
  app.post("/api/upload-frames", express.raw({ type: "*/*", limit: "50mb" }), (req, res) => proxyToEsp32(req, res, '/api/upload-frames'));
  app.get("/scan", (req, res) => proxyToEsp32(req, res, '/scan'));
  app.get("/diagnostic", (req, res) => proxyToEsp32(req, res, '/diagnostic'));
  app.get("/logs", (req, res) => proxyToEsp32(req, res, '/logs'));
  app.post("/update", upload.single('update'), (req, res) => proxyToEsp32(req, res, '/update'));

  // Real Firmware Compilation API using arduino-cli
  import { exec } from "child_process";
  app.post("/api/compile", async (req, res) => {
    try {
      const { model } = req.body;
      console.log(`[Compiler] Starting build for ${model}...`);
      
      const buildDir = path.join(process.cwd(), 'Holospin3D', 'build');
      if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true });
      }

      const fqbn = "esp32:esp32:esp32";
      const sketchPath = path.join(process.cwd(), 'Holospin3D', 'Holospin3D.ino');
      const binDest = path.join(buildDir, 'firmware.bin');

      exec(`arduino-cli compile --fqbn ${fqbn} --output-dir ${buildDir} ${sketchPath}`, (error, stdout, stderr) => {
        const logs = (stdout + "\\n" + stderr).split("\\n");
        if (error) {
           console.error("Compilation failed:", error);
           // Even if arduino-cli is missing, we return the real error
           return res.status(500).json({ error: "Compilation failed: " + error.message, logs });
        }
        res.json({ status: "success", logs, binaryPath: "/Holospin3D/build/firmware.bin" });
      });
    } catch (e) {
      res.status(500).json({ error: e.message || "Compilation failed" });
    }
  });
"""

# Now we need to carefully replace the old endpoints in server.ts
# Let's find the start of the endpoints. It's right after app.post("/api/delete-file"...)
start_marker = "  let systemStatus = \"ready\";"
end_marker = "  // Determine if we are running in production mode"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_endpoints + "\n" + content[end_idx:]
else:
    print("Could not find markers to replace endpoints!")
    sys.exit(1)

with open('server.ts', 'w') as f:
    f.write(content)

