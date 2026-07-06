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
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_multer = __toESM(require("multer"), 1);
var import_vite = require("vite");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
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
      res.json(files.map((f) => ({ name: f, url: `/uploads/${f}` })));
    } catch (e) {
      res.status(500).json({ error: "Failed to list files" });
    }
  });
  let mockStatus = "ready";
  let mockRpm = 100;
  app.get("/status", (req, res) => {
    res.json({ rpm: mockRpm, status: mockStatus });
  });
  app.get("/api/status", (req, res) => {
    res.json({
      state: mockStatus,
      image: "current_animation.bmp",
      column: 12,
      totalColumns: 64,
      speed: mockRpm,
      measuredFps: 30,
      brightness: 128,
      loopMode: true,
      orientation: "vertical",
      direction: "left_to_right",
      ledType: "WS2812",
      numLeds: 64,
      effectRunning: false,
      effectType: 0,
      wifiConnected: true,
      wifiSSID: "HoloSpin_Network",
      wifiIP: "192.168.1.50",
      freeSpace: 2048e3
    });
  });
  app.post("/calibrate", (req, res) => {
    mockStatus = "calibrating";
    mockRpm = 240;
    setTimeout(() => {
      mockStatus = "ready";
      mockRpm = 125;
    }, 4e3);
    res.json({ status: "calibrating" });
  });
  app.post("/control", (req, res) => {
    res.json({ status: "success" });
  });
  app.post("/config", (req, res) => {
    res.json({ status: "success" });
  });
  app.post("/upload", import_express.default.raw({ type: "*/*", limit: "50mb" }), (req, res) => {
    const data = req.body;
    const len = data ? Buffer.isBuffer(data) ? data.length : Object.keys(data).length : 0;
    console.log(`[Server] Received upload: ${len} units`);
    res.json({ status: "success", received: len });
  });
  app.get("/scan", (req, res) => {
    res.json([
      { ssid: "HoloSpin_WiFi_AP", rssi: -45, secure: false },
      { ssid: "Home_WiFi_2.4G", rssi: -68, secure: true }
    ]);
  });
  app.get("/diagnostic", (req, res) => {
    res.json({
      heap: 124500,
      uptime: process.uptime(),
      tasks: 8,
      wifi_rssi: -42,
      temp: 45.2
    });
  });
  app.get("/logs", (req, res) => {
    res.send("[SYS] Boot complete\n[WIFI] Connected\n[POV] Frame buffer ready\n[HTTP] Server started on port 80");
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
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
