const { Router } = require("express");
const multer = require("multer");
const { generateVirtualTryOn } = require("../services/virtualTryOn.js");

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

module.exports = router;
