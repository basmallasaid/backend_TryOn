const { Router } = require("express");
const crypto = require("crypto");
const multer = require("multer");
const { analyzeClothing } = require("../services/analyze");
const Analysis = require("../models/Analysis");
const protect = require("../middlewares/authMiddleware");

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/analyze:
 *   get:
 *     summary: Get all past analyses for the user
 *     tags: [Analyze]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of results to return (max 100)
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: List of analyses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 analyses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Analysis'
 *       401:
 *         description: Not authenticated
 */
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

/**
 * @swagger
 * /api/analyze:
 *   post:
 *     summary: Upload an image for AI garment analysis
 *     description: Sends garment image to Hugging Face Qwen3-VL AI for analysis. Returns detected garments with category, style, pattern, season, colors. Results are cached by image hash — send ?force=true to bypass.
 *     tags: [Analyze]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: force
 *         schema:
 *           type: string
 *           enum: ["true"]
 *         description: Set to "true" to bypass cached results
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to analyze (JPEG/PNG)
 *     responses:
 *       200:
 *         description: Analysis results (fresh or cached). If cached=true, the result was served from a previous analysis with the same image hash.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 analysis_id:
 *                   type: string
 *                   description: ID of the analysis
 *                 garments:
 *                   type: array
 *                   description: Detected garment(s) with full attributes
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                         enum: [top, bottom, outerwear, dress, footwear, accessory]
 *                       specificType:
 *                         type: string
 *                       confidence:
 *                         type: number
 *                       colors:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             color:
 *                               type: string
 *                             percentage:
 *                               type: number
 *                       style:
 *                         type: string
 *                         enum: [casual, smart-casual, formal, streetwear, sport]
 *                       pattern:
 *                         type: string
 *                         enum: [solid, striped, checked, graphic, floral]
 *                       season:
 *                         type: array
 *                         items:
 *                           type: string
 *                           enum: [spring, summer, autumn, winter]
 *                       gender:
 *                         type: string
 *                         enum: [male, female, unisex]
 *                 detectionType:
 *                   type: string
 *                   enum: [single, multiple, outfit, unknown]
 *                 cached:
 *                   type: boolean
 *                   description: True if the result was served from cache (omitted for fresh analyses)
 *                   example: true
 *       400:
 *         description: Image file is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Analysis failed
 */
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
      image: dataUrl,
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

/**
 * @swagger
 * /api/analyze/{id}:
 *   get:
 *     summary: Get a single analysis by ID
 *     tags: [Analyze]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Analysis ID
 *     responses:
 *       200:
 *         description: Analysis details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 analysis:
 *                   $ref: '#/components/schemas/Analysis'
 *       404:
 *         description: Analysis not found
 *       401:
 *         description: Not authenticated
 */
router.get("/:id", protect, async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      user_id: req.user._id,
    });
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/analyze/{id}:
 *   put:
 *     summary: Edit/update an analysis by ID
 *     tags: [Analyze]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Analysis ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               detectionType:
 *                 type: string
 *                 enum: [single, multiple, outfit, unknown]
 *               garments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     category:
 *                       type: string
 *                       enum: [top, bottom, outerwear, dress, footwear, accessory]
 *                     specificType:
 *                       type: string
 *                     confidence:
 *                       type: number
 *                     colors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           color:
 *                             type: string
 *                           percentage:
 *                             type: number
 *                     style:
 *                       type: string
 *                       enum: [casual, smart-casual, formal, streetwear, sport]
 *                     pattern:
 *                       type: string
 *                       enum: [solid, striped, checked, graphic, floral]
 *                     season:
 *                       type: array
 *                       items:
 *                         type: string
 *                         enum: [spring, summer, autumn, winter]
 *                     gender:
 *                       type: string
 *                       enum: [male, female, unisex]
 *     responses:
 *       200:
 *         description: Analysis updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 analysis:
 *                   $ref: '#/components/schemas/Analysis'
 *       404:
 *         description: Analysis not found
 *       401:
 *         description: Not authenticated
 */
router.put("/:id", protect, async (req, res) => {
  try {
    const updates = {};
    if (req.body.detectionType !== undefined) {
      updates.detectionType = req.body.detectionType;
    }
    if (req.body.garments !== undefined) {
      updates.garments = req.body.garments;
    }
    if (req.body.image !== undefined) {
      updates.image = req.body.image;
    }

    const analysis = await Analysis.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found" });
    }
    res.json({ success: true, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/analyze/{id}:
 *   delete:
 *     summary: Delete a single analysis by ID
 *     tags: [Analyze]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Analysis ID
 *     responses:
 *       200:
 *         description: Analysis deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Analysis not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 */
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

/**
 * @swagger
 * /api/analyze:
 *   delete:
 *     summary: Clear all analyses for the user
 *     tags: [Analyze]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All analyses cleared
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Not authenticated
 */
router.delete("/", protect, async (req, res) => {
  try {
    await Analysis.deleteMany({ user_id: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
