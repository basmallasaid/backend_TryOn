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

/**
 * @swagger
 * /api/notifications/send-to-user:
 *   post:
 *     summary: Send a push notification to a specific user by email (all registered devices)
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
 *                 description: User email to send notification to
 *                 example: "user@example.com"
 *               title:
 *                 type: string
 *                 description: Notification title
 *                 example: "New Match!"
 *               message:
 *                 type: string
 *                 description: Notification body message
 *                 example: "You have a new outfit match!"
 *               data:
 *                 type: object
 *                 description: Optional custom data payload
 *                 example: {"type": "match", "matchId": "abc123"}
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
 *                   example: "Notification sent successfully"
 *                 deviceCount:
 *                   type: integer
 *                   example: 2
 *       400:
 *         description: Email is required / No registered devices / Notifications disabled
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 */
router.post("/send-to-user", protect, notificationController.sendToUser);

/**
 * @swagger
 * /api/notifications/broadcast:
 *   post:
 *     summary: Send a push notification to all users with registered devices
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Notification title
 *                 example: "TryOn Update"
 *               message:
 *                 type: string
 *                 description: Notification body message
 *                 example: "Check out the latest features!"
 *               data:
 *                 type: object
 *                 description: Optional custom data payload
 *                 example: {"type": "update", "version": "2.0"}
 *     responses:
 *       200:
 *         description: Broadcast sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Broadcast sent successfully"
 *                 deviceCount:
 *                   type: integer
 *                   example: 150
 *       400:
 *         description: No registered devices found
 *       401:
 *         description: Not authenticated
 */
router.post("/broadcast", protect, notificationController.broadcast);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get current user's in-app notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications with unread count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       body:
 *                         type: string
 *                       type:
 *                         type: string
 *                       read:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 unreadCount:
 *                   type: integer
 *       401:
 *         description: Not authenticated
 */
router.get("/", protect, notificationController.getNotifications);
router.get("/all", protect, notificationController.getAllNotifications);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All marked as read
 *       401:
 *         description: Not authenticated
 */
router.patch("/read-all", protect, notificationController.markAllAsRead);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Marked as read
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Not authenticated
 */
router.patch("/:id/read", protect, notificationController.markAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a single notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Not authenticated
 */
router.delete("/:id", protect, notificationController.deleteNotification);

/**
 * @swagger
 * /api/notifications:
 *   delete:
 *     summary: Clear all notifications for current user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications cleared
 *       401:
 *         description: Not authenticated
 */
router.delete("/", protect, notificationController.clearAll);

router.get("/scheduled", protect, notificationController.getScheduledNotifications);
router.delete("/scheduled/:id", protect, notificationController.cancelScheduledNotification);

module.exports = router;
