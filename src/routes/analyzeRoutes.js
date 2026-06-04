const { Router } = require("express");
const multer = require("multer");
const { analyzeClothing } = require("../services/analyze.js");

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const base64 = req.file.buffer.toString("base64");
    const mime = req.file.mimetype || "image/jpeg";
    const dataUrl = `data:${mime};base64,${base64}`;

    const result = await analyzeClothing(dataUrl, {
      HF_TOKEN: req.apiKeys?.HF_TOKEN,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
