const { Router } = require("express");
const multer = require("multer");
const recycleController = require("../controllers/recycleController");
const protect = require("../middlewares/authMiddleware");

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/**
 * @swagger
 * /api/recycle/analyze:
 *   post:
 *     summary: Upload images → AI analysis → 3 upcycling/remix ideas
 *     tags: [Recycle]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-github-token
 *         required: true
 *         schema:
 *           type: string
 *         description: GitHub token (with AI model access) for GPT-4o-mini analysis
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [images]
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: 1 to 3 garment images
 *     responses:
 *       200:
 *         description: Analysis complete with 3 upcycling ideas (title + design_description)
 *       400:
 *         description: Invalid input (wrong image count or missing token)
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Analysis failed
 */
router.post("/analyze", protect, upload.array("images", 3), recycleController.analyze);

/**
 * @swagger
 * /api/recycle/{id}/generate/{ideaId}:
 *   post:
 *     summary: Generate image for one upcycling idea (image-to-image)
 *     tags: [Recycle]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *       - in: path
 *         name: ideaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Idea ID (1, 2, or 3)
 *       - in: header
 *         name: x-dashscope-api-key
 *         required: true
 *         schema:
 *           type: string
 *         description: DashScope API key for Qwen image generation
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               model:
 *                 type: string
 *                 enum: [qwen-image-2.0, qwen-image-2.0-pro]
 *                 description: Qwen image model (default qwen-image-2.0-pro)
 *     responses:
 *       200:
 *         description: Image generated successfully
 *       400:
 *         description: Missing API key
 *       404:
 *         description: Session or idea not found
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Generation failed
 */
router.post("/:id/generate/:ideaId", protect, recycleController.generateIdea);

/**
 * @swagger
 * /api/recycle/{id}/generate-all:
 *   post:
 *     summary: Generate images for ALL upcycling ideas at once
 *     tags: [Recycle]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *       - in: header
 *         name: x-dashscope-api-key
 *         required: true
 *         schema:
 *           type: string
 *         description: DashScope API key for Qwen image generation
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               model:
 *                 type: string
 *                 enum: [qwen-image-2.0, qwen-image-2.0-pro]
 *                 description: Qwen image model (default qwen-image-2.0-pro)
 *     responses:
 *       200:
 *         description: Batch generation complete with results array
 *       400:
 *         description: Missing API key
 *       404:
 *         description: Session not found
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Batch generation failed
 */
router.post("/:id/generate-all", protect, recycleController.generateAllIdeas);

/**
 * @swagger
 * /api/recycle/{id}:
 *   get:
 *     summary: Get a recycle session by ID
 *     tags: [Recycle]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Session details with ideas, status, and generation results
 *       404:
 *         description: Session not found
 *       401:
 *         description: Not authenticated
 */
router.get("/:id", protect, recycleController.getSession);

module.exports = router;
