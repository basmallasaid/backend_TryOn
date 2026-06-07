const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const protect = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/notifications/register:
 *   post:
 *     summary: Register an Expo push token
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Expo push token
 *                 example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
 *     responses:
 *       200:
 *         description: Token registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Push token registered"
 *       400:
 *         description: Token is required
 *       401:
 *         description: Not authenticated
 */
router.post("/register", protect, notificationController.registerToken);

/**
 * @swagger
 * /api/notifications/send-by-email:
 *   post:
 *     summary: Send a push notification to a user by email using their saved Expo token
 *     tags: [Notifications]
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
 *               title:
 *                 type: string
 *                 description: Notification title (optional, defaults to "Notification")
 *                 example: "New Match!"
 *               body:
 *                 type: string
 *                 description: Notification body (optional, defaults to "You have a new notification.")
 *                 example: "You have a new outfit match!"
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Push notification sent successfully"
 *       400:
 *         description: Email is required / No push token registered
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 */
router.post("/send-by-email", protect, notificationController.sendNotificationsByEmail);

/**
 * @swagger
 * /api/notifications/send-test:
 *   post:
 *     summary: Send a test notification to all registered tokens
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: Custom notification body (optional)
 *                 example: "This is a test notification"
 *     responses:
 *       200:
 *         description: Test notification sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Test notification sent to all tokens"
 *       401:
 *         description: Not authenticated
 */
router.post("/send-test", protect, notificationController.sendToAll);

/**
 * @swagger
 * /api/notifications/tryon-ready:
 *   post:
 *     summary: Send a try-on ready notification to a specific token
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Expo push token
 *                 example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
 *     responses:
 *       200:
 *         description: Notification sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Try-on ready notification sent"
 *       400:
 *         description: Token is required
 *       401:
 *         description: Not authenticated
 */
router.post("/tryon-ready", protect, notificationController.sendTryOnReady);

module.exports = router;
