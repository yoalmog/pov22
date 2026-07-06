import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure upload directory exists
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Multer configuration
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });
  const upload = multer({ storage: storage });

  app.use(express.json());
  app.use('/uploads', express.static(uploadDir));

  // --- REAL BACKEND ENDPOINTS (Proxying or Handling) ---
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  app.post("/api/upload-file", upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ status: "success", url: fileUrl, filename: req.file.filename });
  });

  app.get("/api/files", (req, res) => {
    try {
      const files = fs.readdirSync(uploadDir);
      // Include any root Config.h or main.ino in the file list if they exist, or just uploadDir files
      const resultList = files.map(f => ({
        name: f,
        size: `${(fs.statSync(path.join(uploadDir, f)).size / 1024).toFixed(1)} KB`,
        type: f.toLowerCase().endsWith(".mp4") ? "video" : "image",
        path: `/uploads/${f}`
      }));
      res.json(resultList);
    } catch (e) {
      res.status(500).json({ error: "Failed to list files" });
    }
  });

  // Real file writer for Config.h, main.ino, and general assets
  app.post("/api/write-file", (req, res) => {
    try {
      const { filename, content } = req.body;
      if (!filename || content === undefined) {
        return res.status(400).json({ error: "Missing filename or content parameter" });
      }
      
      // Write directly to project root directory
      const destPath = path.join(process.cwd(), filename);
      fs.writeFileSync(destPath, content, "utf8");
      console.log(`[DevServer] File ${filename} written successfully to project root.`);
      
      res.json({ status: "success", message: `File ${filename} saved successfully!` });
    } catch (e: any) {
      console.error("[DevServer] Write error:", e);
      res.status(500).json({ error: `Failed to write file: ${e.message}` });
    }
  });

  // Real file deletion API
  app.post("/api/delete-file", (req, res) => {
    try {
      const { filename } = req.body;
      if (!filename) {
        return res.status(400).json({ error: "Missing filename parameter" });
      }
      
      const destPath = path.join(uploadDir, filename);
      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
        return res.json({ status: "success", message: "File deleted successfully!" });
      }
      res.status(404).json({ error: "File not found" });
    } catch (e: any) {
      res.status(500).json({ error: `Failed to delete file: ${e.message}` });
    }
  });

  let mockStatus = "ready";
  let mockRpm = 100;

  app.get("/status", (req, res) => {
    res.status(503).json({ error: "Real hardware not detected in dev environment" });
  });

  app.get("/api/status", (req, res) => {
    res.status(503).json({ error: "Real hardware not detected in dev environment" });
  });

  app.post("/calibrate", (req, res) => {
    res.status(503).json({ error: "No hardware connected" });
  });

  app.post("/control", (req, res) => {
    res.status(503).json({ error: "No hardware connected" });
  });

  app.post("/config", (req, res) => {
    res.status(503).json({ error: "No hardware connected" });
  });

  app.post("/upload", express.raw({ type: "*/*", limit: "50mb" }), (req, res) => {
    res.status(503).json({ error: "No hardware connected" });
  });

  app.get("/scan", (req, res) => {
    res.json([]);
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

  // Determine if we are running in production mode
  const distPath = path.join(process.cwd(), 'dist');
  const hasBuild = fs.existsSync(path.join(distPath, 'index.html'));
  const isProd = process.env.NODE_ENV === "production" || hasBuild;

  // Vite middleware for development
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server startup failure:", err);
  process.exit(1);
});
