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
 *     description: Upload 1-3 garment images. AI (GPT-4o-mini) analyzes them and returns 3 creative upcycling or remix ideas with title and design description. Requires x-github-token header.
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
 *         example: "ghp_xxxxxxxxxxxxxxxxxxxx"
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
 *         description: Analysis complete with 3 upcycling ideas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session_id:
 *                   type: string
 *                 ideas:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       design_description:
 *                         type: string
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
 *     description: Generates a visual representation of a specific upcycling idea using Qwen image generation model. Requires x-dashscope-api-key header.
 *     tags: [Recycle]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID from /api/recycle/analyze
 *       - in: path
 *         name: ideaId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 3
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
 *                 example: "qwen-image-2.0-pro"
 *     responses:
 *       200:
 *         description: Image generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session_id:
 *                   type: string
 *                 idea_id:
 *                   type: integer
 *                 image_url:
 *                   type: string
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
 *     description: Batch generates images for all 3 upcycling ideas in a session. Requires x-dashscope-api-key header.
 *     tags: [Recycle]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID from /api/recycle/analyze
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session_id:
 *                   type: string
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       idea_id:
 *                         type: integer
 *                       image_url:
 *                         type: string
 *                       status:
 *                         type: string
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
 *     description: Returns session details including original images, upcycling ideas, and generation results.
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
 *         description: Session details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     user_id:
 *                       type: string
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *                     ideas:
 *                       type: array
 *                       items:
 *                         type: object
 *                     status:
 *                       type: string
 *                       enum: [analyzing, generating, completed, failed]
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Session not found
 *       401:
 *         description: Not authenticated
 */
router.get("/:id", protect, recycleController.getSession);

module.exports = router;
