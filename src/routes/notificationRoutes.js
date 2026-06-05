const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

/**
 * @swagger
 * /api/notifications/register:
 *   post:
 *     summary: Register an Expo push token
 *     tags: [Notifications]
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
 *     responses:
 *       200:
 *         description: Token registered
 *       400:
 *         description: Token is required
 */
router.post("/register", notificationController.registerToken);

/**
 * @swagger
 * /api/notifications/send-test:
 *   get:
 *     summary: Send a test notification to all registered tokens
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Test notification sent
 */
router.get("/send-test", notificationController.sendToAll);

/**
 * @swagger
 * /api/notifications/tryon-ready:
 *   post:
 *     summary: Send a try-on ready notification to a specific token
 *     tags: [Notifications]
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
 *     responses:
 *       200:
 *         description: Notification sent
 *       400:
 *         description: Token is required
 */
router.post("/tryon-ready", notificationController.sendTryOnReady);

module.exports = router;