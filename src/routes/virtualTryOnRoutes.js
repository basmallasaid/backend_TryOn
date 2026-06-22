const { Router } = require("express");
const multer = require("multer");
const protect = require("../middlewares/authMiddleware");
const { checkLimit, incrementUsage } = require("../middlewares/usageLimit");
const { generateVirtualTryOn, generateOutfitTryOn } = require("../services/virtualTryOn.js");
const { classifyImage } = require("../services/classify.js");
const { sendAutomated } = require("../services/notificationService");

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/virtual-tryon:
 *   post:
 *     summary: Generate a virtual try-on (single garment)
 *     description: Upload a person image and a garment image. Uses KIE nano-banana-2 model to generate a photo-realistic try-on.
 *     tags: [Virtual Try-On]
 *     security:
 *       - bearerAuth: []
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
 *                 description: Image of the person wearing the garment
 *               garmentImage:
 *                 type: string
 *                 format: binary
 *                 description: Image of the garment to try on
 *               prompt:
 *                 type: string
 *                 description: Optional custom prompt for the AI model
 *     responses:
 *       200:
 *         description: Virtual try-on generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *                   description: URL of the generated try-on result image
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     taskId:
 *                       type: string
 *                     costTime:
 *                       type: number
 *                     model:
 *                       type: string
 *                     creditsConsumed:
 *                       type: number
 *       400:
 *         description: Both personImage and garmentImage files are required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Both personImage and garmentImage files are required"
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Generation failed
 */
router.post(
  "/",
  protect,
  checkLimit("tryon"),
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
        apiKey: req.apiKeys?.KIE_API_KEY || process.env.KIE_API_key,
      });

      await incrementUsage(req.user._id, "tryon");

      if (req.user?._id) {
        sendAutomated('tryon', req.user._id, { operation: 'try-on' });
      }

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
 *     summary: Generate a virtual try-on with top AND bottom garments
 *     description: Upload a person image, a top garment, and a bottom garment. Validates garment categories via AI, then generates a try-on with both garments.
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
 *                 description: Image of the top garment (or outerwear)
 *               bottomImage:
 *                 type: string
 *                 format: binary
 *                 description: Image of the bottom garment
 *               prompt:
 *                 type: string
 *                 description: Optional custom prompt for the AI model
 *     responses:
 *       200:
 *         description: Virtual try-on generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *                   description: URL of the generated try-on result image
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     taskId:
 *                       type: string
 *                     costTime:
 *                       type: number
 *                     model:
 *                       type: string
 *                     creditsConsumed:
 *                       type: number
 *       400:
 *         description: Missing images, missing token, or garment validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Both images appear to be tops; one must be a bottom"
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Generation failed
 */
router.post(
  "/outfit",
  protect,
  checkLimit("tryon"),
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

      const hfToken = req.apiKeys?.HF_TOKEN || process.env.HF_TOKEN;
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
        apiKey: req.apiKeys?.KIE_API_KEY || process.env.KIE_API_key,
      });

      await incrementUsage(req.user._id, "tryon");

      if (req.user?._id) {
        sendAutomated('tryon', req.user._id, { operation: 'try-on' });
      }

      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
