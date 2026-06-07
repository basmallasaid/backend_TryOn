const { Router } = require("express");
const multer = require("multer");
const protect = require("../middlewares/authMiddleware");
const { generateVirtualTryOn, generateOutfitTryOn } = require("../services/virtualTryOn.js");
const { classifyImage } = require("../services/classify.js");

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/virtual-tryon:
 *   post:
 *     summary: Generate a virtual try-on
 *     tags: [Virtual Try-On]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [personImage, garmentImage]
 *             properties:
 *               personImage:
 *                 type: string
 *                 format: binary
 *                 description: Image of the person
 *               garmentImage:
 *                 type: string
 *                 format: binary
 *                 description: Image of the garment
 *               prompt:
 *                 type: string
 *                 description: Optional prompt for the AI model
 *     responses:
 *       200:
 *         description: Virtual try-on result
 *       400:
 *         description: Both personImage and garmentImage are required
 */
router.post(
  "/",
  upload.fields([
    { name: "personImage", maxCount: 1 },
    { name: "garmentImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const personFile = req.files?.personImage?.[0];
      const garmentFile = req.files?.garmentImage?.[0];

      if (!personFile || !garmentFile) {
        return res
          .status(400)
          .json({ error: "Both personImage and garmentImage files are required" });
      }

      const toDataUrl = (file) =>
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

      const result = await generateVirtualTryOn({
        personImage: toDataUrl(personFile),
        garmentImage: toDataUrl(garmentFile),
        prompt: req.body?.prompt || undefined,
        apiKey: req.apiKeys?.KIE_API_KEY,
      });

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * @swagger
 * /api/virtual-tryon/outfit:
 *   post:
 *     summary: Generate a virtual try-on with top and bottom garments
 *     tags: [Virtual Try-On]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [personImage, topImage, bottomImage]
 *             properties:
 *               personImage:
 *                 type: string
 *                 format: binary
 *                 description: Image of the person
 *               topImage:
 *                 type: string
 *                 format: binary
 *                 description: Image of the top garment
 *               bottomImage:
 *                 type: string
 *                 format: binary
 *                 description: Image of the bottom garment
 *               prompt:
 *                 type: string
 *                 description: Optional prompt for the AI model
 *     responses:
 *       200:
 *         description: Virtual try-on result
 *       400:
 *         description: All three images are required, or garment validation failed
 *       401:
 *         description: Not authenticated
 */
router.post(
  "/outfit",
  protect,
  upload.fields([
    { name: "personImage", maxCount: 1 },
    { name: "topImage", maxCount: 1 },
    { name: "bottomImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const personFile = req.files?.personImage?.[0];
      const topFile = req.files?.topImage?.[0];
      const bottomFile = req.files?.bottomImage?.[0];

      if (!personFile || !topFile || !bottomFile) {
        return res
          .status(400)
          .json({ error: "personImage, topImage, and bottomImage files are all required" });
      }

      const toDataUrl = (file) =>
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

      const hfToken = req.apiKeys?.HF_TOKEN;
      if (!hfToken) {
        return res
          .status(400)
          .json({ error: "HF_TOKEN is required to validate garments" });
      }

      const [topResult, bottomResult] = await Promise.all([
        classifyImage(toDataUrl(topFile), { HF_TOKEN: hfToken }),
        classifyImage(toDataUrl(bottomFile), { HF_TOKEN: hfToken }),
      ]);

      const topCategory = topResult.garments?.[0]?.category;
      const bottomCategory = bottomResult.garments?.[0]?.category;

      let finalTop = topFile;
      let finalBottom = bottomFile;

      if (topCategory && bottomCategory) {
        const isTop = (c) => ["top", "outerwear"].includes(c);
        const isBottom = (c) => c === "bottom";

        if (isTop(topCategory) && isBottom(bottomCategory)) {
          // Already correct
        } else if (isBottom(topCategory) && isTop(bottomCategory)) {
          [finalTop, finalBottom] = [bottomFile, topFile];
        } else if (isTop(topCategory) && isTop(bottomCategory)) {
          return res
            .status(400)
            .json({ error: "Both images appear to be tops; one must be a bottom" });
        } else if (isBottom(topCategory) && isBottom(bottomCategory)) {
          return res
            .status(400)
            .json({ error: "Both images appear to be bottoms; one must be a top" });
        }
      }

      const result = await generateOutfitTryOn({
        personImage: toDataUrl(personFile),
        topImage: toDataUrl(finalTop),
        bottomImage: toDataUrl(finalBottom),
        prompt: req.body?.prompt || undefined,
        apiKey: req.apiKeys?.KIE_API_KEY,
      });

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
