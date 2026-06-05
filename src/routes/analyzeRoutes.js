const { Router } = require("express");
const crypto = require("crypto");
const multer = require("multer");
const { analyzeClothing } = require("../services/analyze");
const Analysis = require("../models/Analysis");
const protect = require("../middlewares/authMiddleware");

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", protect, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = parseInt(req.query.skip) || 0;
    const analyses = await Analysis.find({ user_id: req.user._id })
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(skip);
    res.json({ analyses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", protect, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const imageHash = crypto.createHash("md5").update(req.file.buffer).digest("hex");

    if (!req.query.force) {
      const existing = await Analysis.findOne({
        user_id: req.user._id,
        image_hash: imageHash,
      }).sort({ created_at: -1 });

      if (existing) {
        return res.json({
          analysis_id: existing._id,
          garments: existing.garments,
          detectionType: existing.detectionType,
          cached: true,
        });
      }
    }

    const base64 = req.file.buffer.toString("base64");
    const mime = req.file.mimetype || "image/jpeg";
    const dataUrl = `data:${mime};base64,${base64}`;

    const result = await analyzeClothing(dataUrl, {
      HF_TOKEN: req.apiKeys?.HF_TOKEN,
    });

    const analysis = await Analysis.create({
      user_id: req.user._id,
      image_hash: imageHash,
      garments: result.garments,
      detectionType: result.detectionType,
    });

    res.json({
      analysis_id: analysis._id,
      garments: result.garments,
      detectionType: result.detectionType,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const deleted = await Analysis.findOneAndDelete({
      _id: req.params.id,
      user_id: req.user._id,
    });
    if (!deleted) {
      return res.status(404).json({ error: "Analysis not found" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/", protect, async (req, res) => {
  try {
    await Analysis.deleteMany({ user_id: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
