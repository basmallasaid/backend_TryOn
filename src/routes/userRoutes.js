const express = require("express");

const {
  updateProfile,
  getSettings,
  updateLanguage,
  updateNotifications,
  deleteAccount,
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
 *               last_name:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Not authenticated
 */
router.put("/profile", protect, updateProfile);

/**
 * @swagger
 * /api/users/settings:
 *   get:
 *     summary: Get user settings (language, notifications, mobile app)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User settings retrieved
 *       401:
 *         description: Not authenticated
 */
router.get("/settings", protect, getSettings);

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
 *     responses:
 *       200:
 *         description: Language updated
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
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Not authenticated
 *       400:
 *         description: Email mismatch
 */
router.delete("/account", protect, deleteAccount);

module.exports = router;
