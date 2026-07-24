var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_child_process = require("child_process");
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_multer = __toESM(require("multer"), 1);
var import_genai = require("@google/genai");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  let ai = null;
  if (geminiApiKey) {
    ai = new import_genai.GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  const uploadDir = import_path.default.join(process.cwd(), "public", "uploads");
  if (!import_fs.default.existsSync(uploadDir)) {
    import_fs.default.mkdirSync(uploadDir, { recursive: true });
  }
  const storage = import_multer.default.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    }
  });
  const upload = (0, import_multer.default)({ storage });
  app.use(import_express.default.json());
  app.use("/uploads", import_express.default.static(uploadDir));
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.post("/api/generate-effect", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      if (!ai) {
        return res.status(503).json({
          error: "Cloud AI fallback is not configured. Please add GEMINI_API_KEY in Settings > Secrets."
        });
      }
      const systemPrompt = `You are an expert full-stack developer writing effects for a POV LED hologram.
The user wants an effect that: ${prompt}

You must return a JSON object with two fields:
1. "cpp": The C++ case statement block for a switch statement inside getEffectColorRaw.
   Signature: RgbColor getEffectColorRaw(int ledIdx, float angle, unsigned long timeMs)
   Variables available: ledIdx (0 to PIXEL_COUNT-1), angle (0 to 360), timeMs, r (ledIdx / PIXEL_COUNT from 0.0 to 1.0), DEG_TO_RAD.
   Just return the raw case body logic that returns RgbColor(r,g,b).
2. "js": The JavaScript equivalent function body for the web visualizer.
   Signature: (stripIndex, ledIndex, time, brightness, arms) => string (rgba/hsla string)
   Variables available: stripIndex, ledIndex (0 to 14), time (tick counter, incremented every 50ms).
   Return the JS logic as a string.

Return ONLY the raw JSON object conforming to the schema.`;
      const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
      let lastError = null;
      let responseText = "";
      for (const model of models) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`[Gemini] Generating custom effect. Model: ${model}, Attempt: ${attempt}`);
            const response = await ai.models.generateContent({
              model,
              contents: systemPrompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    cpp: {
                      type: import_genai.Type.STRING,
                      description: "C++ code block inside the case statement"
                    },
                    js: {
                      type: import_genai.Type.STRING,
                      description: "JavaScript equivalent function body returning an rgba or hsla string"
                    }
                  },
                  required: ["cpp", "js"]
                }
              }
            });
            if (response && response.text) {
              responseText = response.text;
              break;
            }
          } catch (err) {
            lastError = err;
            const rawMsg = err.message || "unavailable";
            const cleanMsg = rawMsg;
            console.log(`[Gemini] Model ${model} (attempt ${attempt}) returned retry status: ${cleanMsg}`);
            await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
          }
        }
        if (responseText) break;
      }
      if (!responseText) {
        throw lastError || new Error("All fallback models returned retry status.");
      }
      const parsed = JSON.parse(responseText);
      res.json(parsed);
    } catch (e) {
      const rawMsg = e.message || String(e);
      const cleanMsg = rawMsg;
      console.log("[Gemini] Custom effect generation ended with notice:", cleanMsg);
      res.status(500).json({ error: e.message || "Failed to generate effect using Cloud AI" });
    }
  });
  app.post("/api/upload-file", upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ status: "success", url: fileUrl, filename: req.file.filename });
  });
  app.get("/api/files", (req, res) => {
    try {
      const files = import_fs.default.readdirSync(uploadDir);
      const resultList = files.map((f) => ({
        name: f,
        size: `${(import_fs.default.statSync(import_path.default.join(uploadDir, f)).size / 1024).toFixed(1)} KB`,
        type: f.toLowerCase().endsWith(".mp4") ? "video" : "image",
        path: `/uploads/${f}`
      }));
      res.json(resultList);
    } catch (e) {
      res.status(500).json({ error: "Failed to list files" });
    }
  });
  app.post("/api/write-file", import_express.default.raw({ type: "*/*", limit: "50mb" }), (req, res) => {
    try {
      const filename = req.query.filename;
      const content = req.body;
      if (!filename || !content) {
        return res.status(400).json({ error: "Missing filename query param or body content" });
      }
      const destPath = import_path.default.join(process.cwd(), filename);
      import_fs.default.writeFileSync(destPath, content);
      console.log(`[DevServer] File ${filename} written successfully to project root.`);
      res.json({ status: "success", message: `File ${filename} saved successfully!` });
    } catch (e) {
      console.error("[DevServer] Write error:", e);
      res.status(500).json({ error: `Failed to write file: ${e.message}` });
    }
  });
  app.post("/api/delete-file", (req, res) => {
    try {
      const { filename } = req.body;
      if (!filename) {
        return res.status(400).json({ error: "Missing filename parameter" });
      }
      const destPath = import_path.default.join(uploadDir, filename);
      if (import_fs.default.existsSync(destPath)) {
        import_fs.default.unlinkSync(destPath);
        return res.json({ status: "success", message: "File deleted successfully!" });
      }
      res.status(404).json({ error: "File not found" });
    } catch (e) {
      res.status(500).json({ error: `Failed to delete file: ${e.message}` });
    }
  });
  const ESP32_IP = process.env.ESP32_IP;
  const proxyToEsp32 = async (req, res, path2) => {
    if (!ESP32_IP) {
      return res.status(503).json({ error: "No ESP32_IP configured. Device offline." });
    }
    try {
      const response = await fetch(`http://${ESP32_IP}${path2}`, {
        method: req.method,
        body: ["GET", "HEAD"].includes(req.method) ? void 0 : req.body,
        headers: { "Content-Type": req.headers["content-type"] || "application/json" }
      });
      const data = await response.text();
      res.status(response.status).send(data);
    } catch (e) {
      res.status(502).json({ error: "Failed to connect to ESP32" });
    }
  };
  app.get("/status", (req, res) => proxyToEsp32(req, res, "/status"));
  app.get("/version", (req, res) => proxyToEsp32(req, res, "/version"));
  app.post("/api/set-model", (req, res) => proxyToEsp32(req, res, "/api/set-model"));
  app.get("/api/status", (req, res) => proxyToEsp32(req, res, "/status"));
  app.post("/calibrate", (req, res) => proxyToEsp32(req, res, "/calibrate"));
  app.post("/control", (req, res) => proxyToEsp32(req, res, "/control"));
  app.post("/config", (req, res) => proxyToEsp32(req, res, "/config"));
  app.post("/api/upload-frames", import_express.default.raw({ type: "*/*", limit: "50mb" }), (req, res) => proxyToEsp32(req, res, "/api/upload-frames"));
  app.get("/scan", (req, res) => proxyToEsp32(req, res, "/scan"));
  app.get("/diagnostic", (req, res) => proxyToEsp32(req, res, "/diagnostic"));
  app.get("/logs", (req, res) => proxyToEsp32(req, res, "/logs"));
  app.post("/update", upload.single("update"), (req, res) => proxyToEsp32(req, res, "/update"));
  const serveFirmwareBin = (req, res) => {
    const buildBin = import_path.default.join(process.cwd(), "Holospin3D", "build", "firmware.bin");
    const publicBin = import_path.default.join(process.cwd(), "public", "firmware.bin");
    const targetFile = import_fs.default.existsSync(buildBin) ? buildBin : import_fs.default.existsSync(publicBin) ? publicBin : null;
    if (!targetFile) {
      return res.status(404).json({ error: "Firmware binary not found" });
    }
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", 'attachment; filename="holospin_firmware.bin"');
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(targetFile);
  };
  app.get("/firmware.bin", serveFirmwareBin);
  app.get("/api/firmware/download", serveFirmwareBin);
  app.post("/api/compile", async (req, res) => {
    try {
      const { model } = req.body;
      console.log(`[Compiler] Starting build for ${model}...`);
      const buildDir = import_path.default.join(process.cwd(), "Holospin3D", "build");
      if (!import_fs.default.existsSync(buildDir)) {
        import_fs.default.mkdirSync(buildDir, { recursive: true });
      }
      const fqbn = "esp32:esp32:esp32";
      const sketchPath = import_path.default.join(process.cwd(), "Holospin3D", "Holospin3D.ino");
      const binDest = import_path.default.join(buildDir, "firmware.bin");
      (0, import_child_process.exec)(`arduino-cli compile --fqbn ${fqbn} --output-dir ${buildDir} ${sketchPath}`, (error, stdout, stderr) => {
        const logs = (stdout + "\n" + stderr).split("\n");
        if (error) {
          console.error("Compilation failed:", error);
          return res.status(500).json({ error: "Compilation failed: " + error.message, logs });
        }
        res.json({ status: "success", logs, binaryPath: "/Holospin3D/build/firmware.bin" });
      });
    } catch (e) {
      res.status(500).json({ error: e.message || "Compilation failed" });
    }
  });
  const isProd = process.env.NODE_ENV === "production";
  const distPath = import_path.default.join(process.cwd(), "dist");
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(import_express.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Critical server startup failure:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
