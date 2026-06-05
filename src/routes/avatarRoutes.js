const express = require("express");
const router = express.Router();
const { createAvatar, getUserAvatars } = require("../controllers/avatarController");
const protect = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/avatars:
 *   post:
 *     summary: Create a new AI-generated avatar
 *     tags: [Avatars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-kie-api-key
 *         required: true
 *         schema:
 *           type: string
 *         description: KIE API key for image generation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - age
 *               - gender
 *               - skin_tone
 *               - face_shape
 *               - hair_style
 *               - eye_color
 *               - beard_style
 *               - facial_expression
 *             properties:
 *               age:
 *                 type: string
 *                 enum: [child, teenager, young adult, adult, old man, old woman]
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *               skin_tone:
 *                 type: string
 *                 enum: [pale, fair, olive, tan, brown, dark]
 *               face_shape:
 *                 type: string
 *                 enum: [oval, round, square, heart shaped, sharp jawline]
 *               hair_style:
 *                 type: string
 *                 enum: [short hair, curly hair, messy hair, fade haircut, buzz cut, long hair, wavy hair]
 *               eye_color:
 *                 type: string
 *                 enum: [brown eyes, black eyes, hazel eyes, green eyes, blue eyes]
 *               beard_style:
 *                 type: string
 *                 enum: [clean shave, stubble beard, trimmed beard, full beard, goatee]
 *               facial_expression:
 *                 type: string
 *                 enum: [smiling, serious, neutral, confident, thoughtful, angry, happy]
 *     responses:
 *       201:
 *         description: Avatar created successfully
 *       400:
 *         description: All avatar attributes are required
 *       401:
 *         description: Not authenticated
 */
router.post("/", protect, createAvatar);

/**
 * @swagger
 * /api/avatars:
 *   get:
 *     summary: Get all avatars for the authenticated user
 *     tags: [Avatars]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user avatars
 *       401:
 *         description: Not authenticated
 */
router.get("/", protect, getUserAvatars);

module.exports = router;
