const express = require("express");
const router = express.Router();
const { createAvatar, getUserAvatars, getAvatarById, updateAvatar, deleteAvatar } = require("../controllers/avatarController");
const protect = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/avatars:
 *   post:
 *     summary: Create a new AI-generated avatar
 *     description: Creates an avatar based on detailed facial attributes using KIE image generation. Requires KIE_API_key in .env.
 *     tags: [Avatars]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: object
 *                 required:
 *                   - age
 *                   - height
 *                   - weight
 *                   - gender
 *                   - skin_tone
 *                   - face_shape
 *                   - hair_color
 *                   - eye_color
 *                   - beard_style
 *                   - facial_expression
 *                 properties:
 *                   age:
 *                     type: string
 *                     example: "20y"
 *                   height:
 *                     type: string
 *                     example: "175cm"
 *                   weight:
 *                     type: string
 *                     example: "70kg"
 *                   gender:
 *                     type: string
 *                     enum: [male, female]
 *                   skin_tone:
 *                     type: string
 *                     enum: [very-light, light, medium, tan, brown, dark]
 *                   face_shape:
 *                     type: string
 *                     enum: [oval, round, square, heart shaped, sharp jawline]
 *                   hair_color:
 *                     type: string
 *                     enum: [black, dark-brown, brown, light-brown, blonde, red]
 *                   eye_color:
 *                     type: string
 *                     enum: [brown eyes, black eyes, hazel eyes, green eyes, blue eyes]
 *                   beard_style:
 *                     type: string
 *                     enum: [clean shave, stubble beard, trimmed beard, full beard, goatee]
 *                   facial_expression:
 *                     type: string
 *                     enum: [smiling, serious, neutral, confident, thoughtful, angry, happy]
 *     responses:
 *       201:
 *         description: Avatar created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 avatar:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     user_id:
 *                       type: string
 *                     image_url:
 *                       type: string
 *                     attributes:
 *                       type: object
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: All avatar attributes are required
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Avatar generation failed
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 avatars:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Not authenticated
 */
router.get("/", protect, getUserAvatars);

/**
 * @swagger
 * /api/avatars/{id}:
 *   get:
 *     summary: Get an avatar by ID
 *     tags: [Avatars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Avatar ID
 *     responses:
 *       200:
 *         description: Avatar details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 avatar:
 *                   type: object
 *       404:
 *         description: Avatar not found
 *       401:
 *         description: Not authenticated
 */
router.get("/:id", protect, getAvatarById);

/**
 * @swagger
 * /api/avatars/{id}:
 *   put:
 *     summary: Update an avatar
 *     tags: [Avatars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Avatar ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               age:
 *                 type: string
 *                 example: "20y"
 *               height:
 *                 type: string
 *                 example: "175cm"
 *               weight:
 *                 type: string
 *                 example: "70kg"
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *               skin_tone:
 *                 type: string
 *                 enum: [very-light, light, medium, tan, brown, dark]
 *               face_shape:
 *                 type: string
 *                 enum: [oval, round, square, heart shaped, sharp jawline]
 *               hair_color:
 *                 type: string
 *                 enum: [black, dark-brown, brown, light-brown, blonde, red]
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
 *       200:
 *         description: Avatar updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 avatar:
 *                   type: object
 *       404:
 *         description: Avatar not found
 *       401:
 *         description: Not authenticated
 */
router.put("/:id", protect, updateAvatar);

/**
 * @swagger
 * /api/avatars/{id}:
 *   delete:
 *     summary: Delete an avatar
 *     tags: [Avatars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Avatar ID
 *     responses:
 *       200:
 *         description: Avatar deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Avatar not found
 *       401:
 *         description: Not authenticated
 */
router.delete("/:id", protect, deleteAvatar);

module.exports = router;
