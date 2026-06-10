const express = require("express");

const {
  updateProfile,
  getSettings,
  updateLanguage,
  updateNotifications,
  getUserById,
  deleteAccount,
  addToLatestTryOn,
  removeFromLatestTryOn,
  getLatestTryOn,
} = require("../controllers/userController");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: "John"
 *               last_name:
 *                 type: string
 *                 example: "Doe"
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-15"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.put("/profile", protect, updateProfile);

/**
 * @swagger
 * /api/users/settings:
 *   post:
 *     summary: Get user settings (language, notifications, mobile app)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: User settings retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 language:
 *                   type: string
 *                 notifications:
 *                   type: boolean
 *                 mobile:
 *                   type: object
 *       400:
 *         description: Email is required
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Email does not match authenticated user
 */
router.post("/settings", protect, getSettings);

/**
 * @swagger
 * /api/users/settings/language:
 *   put:
 *     summary: Update language preference
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [language]
 *             properties:
 *               language:
 *                 type: string
 *                 description: Language code (e.g. en, ar)
 *                 example: "en"
 *     responses:
 *       200:
 *         description: Language updated
 *       400:
 *         description: Language is required
 *       401:
 *         description: Not authenticated
 */
router.put("/settings/language", protect, updateLanguage);

/**
 * @swagger
 * /api/users/settings/notifications:
 *   put:
 *     summary: Enable or disable notifications
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [enabled]
 *             properties:
 *               enabled:
 *                 type: boolean
 *                 description: Whether to enable notifications
 *                 example: true
 *     responses:
 *       200:
 *         description: Notification preference updated
 *       401:
 *         description: Not authenticated
 */
router.put("/settings/notifications", protect, updateNotifications);

/**
 * @swagger
 * /api/users/account:
 *   delete:
 *     summary: Delete user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Email mismatch or validation error
 *       401:
 *         description: Not authenticated
 */
router.delete("/account", protect, deleteAccount);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *       404:
 *         description: User not found
 *       401:
 *         description: Not authenticated
 */
/**
 * @swagger
 * /api/users/latest-tryon:
 *   get:
 *     summary: Get all latest try-on records for the authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of try-on records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 latestTryOn:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       imageUrl:
 *                         type: string
 *                       taskId:
 *                         type: string
 *                       model:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Not authenticated
 */
router.get("/latest-tryon", protect, getLatestTryOn);

/**
 * @swagger
 * /api/users/latest-tryon:
 *   post:
 *     summary: Add a new try-on record to the user's latest try-on list
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [imageUrl]
 *             properties:
 *               imageUrl:
 *                 type: string
 *                 description: URL of the generated try-on image
 *               taskId:
 *                 type: string
 *                 description: Task ID from the generation service
 *               model:
 *                 type: string
 *                 description: AI model used for generation
 *     responses:
 *       201:
 *         description: Added to latest try-on
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 latestTryOn:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: imageUrl is required
 *       401:
 *         description: Not authenticated
 */
router.post("/latest-tryon", protect, addToLatestTryOn);

/**
 * @swagger
 * /api/users/latest-tryon/{id}:
 *   delete:
 *     summary: Remove a try-on record from the user's latest try-on list
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The _id of the try-on record to remove
 *     responses:
 *       200:
 *         description: Removed from latest try-on
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 latestTryOn:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Try-on record not found
 *       401:
 *         description: Not authenticated
 */
router.delete("/latest-tryon/:id", protect, removeFromLatestTryOn);

router.get("/:id", protect, getUserById);

module.exports = router;
