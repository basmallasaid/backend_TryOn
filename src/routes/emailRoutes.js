const express = require("express");
const router = express.Router();
const emailController = require("../controllers/emailController");
const protect = require("../middlewares/authMiddleware");
const adminOnly = require("../middlewares/adminMiddleware");

// ─── Admin Endpoints ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/emails/admin/send-to-user:
 *   post:
 *     summary: Send an email to a specific user (Admin only)
 *     tags: [Email Management - Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiverEmail
 *               - subject
 *               - message
 *             properties:
 *               receiverEmail:
 *                 type: string
 *                 format: email
 *                 description: Email address of the recipient user
 *                 example: user@example.com
 *               subject:
 *                 type: string
 *                 description: Email subject
 *                 example: Welcome to TryOn
 *               message:
 *                 type: string
 *                 description: Email body content
 *                 example: Welcome to our platform! We are excited to have you.
 *     responses:
 *       201:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email sent successfully
 *                 email:
 *                   $ref: '#/components/schemas/Email'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied. Admin only.
 *       404:
 *         description: User not found
 */
router.post("/admin/send-to-user", protect, adminOnly, emailController.adminSendToUser);

/**
 * @swagger
 * /api/emails/admin/send-to-all:
 *   post:
 *     summary: Send an email to all registered users (Admin only)
 *     tags: [Email Management - Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *             properties:
 *               subject:
 *                 type: string
 *                 description: Email subject
 *                 example: Important Update
 *               message:
 *                 type: string
 *                 description: Email body content
 *                 example: We have exciting new features for you!
 *     responses:
 *       201:
 *         description: Emails sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Emails sent
 *                 sentCount:
 *                   type: integer
 *                   example: 150
 *                 failedCount:
 *                   type: integer
 *                   example: 2
 *                 failures:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                       error:
 *                         type: string
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied. Admin only.
 */
router.post("/admin/send-to-all", protect, adminOnly, emailController.adminSendToAll);

/**
 * @swagger
 * /api/emails/admin/all:
 *   get:
 *     summary: View all emails stored in the database (Admin only)
 *     tags: [Email Management - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of emails per page
 *     responses:
 *       200:
 *         description: List of emails with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 emails:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Email'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied. Admin only.
 */
router.get("/admin/all", protect, adminOnly, emailController.adminGetAllEmails);

/**
 * @swagger
 * /api/emails/admin/thread/{parentEmailId}:
 *   get:
 *     summary: View a specific email thread/conversation (Admin only)
 *     tags: [Email Management - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parentEmailId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the parent email (root of the thread)
 *     responses:
 *       200:
 *         description: Email thread with root and replies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 root:
 *                   $ref: '#/components/schemas/Email'
 *                 replies:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Email'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied. Admin only.
 *       404:
 *         description: Email not found
 */
router.get("/admin/thread/:parentEmailId", protect, adminOnly, emailController.adminGetThread);

/**
 * @swagger
 * /api/emails/admin/reply/{parentEmailId}:
 *   post:
 *     summary: Reply to a user message (Admin only)
 *     tags: [Email Management - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parentEmailId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the email to reply to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: Reply message content
 *                 example: Thank you for reaching out. We will look into this.
 *     responses:
 *       201:
 *         description: Reply sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reply sent successfully
 *                 email:
 *                   $ref: '#/components/schemas/Email'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied. Admin only.
 *       404:
 *         description: Parent email not found
 */
router.post("/admin/reply/:parentEmailId", protect, adminOnly, emailController.adminReplyToUser);

/**
 * @swagger
 * /api/emails/admin/mark-read/{id}:
 *   patch:
 *     summary: Mark an email as read or unread (Admin only)
 *     tags: [Email Management - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Email ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isRead:
 *                 type: boolean
 *                 description: Set to true for read, false for unread
 *                 example: true
 *     responses:
 *       200:
 *         description: Read status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 email:
 *                   $ref: '#/components/schemas/Email'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied. Admin only.
 *       404:
 *         description: Email not found
 */
router.patch("/admin/mark-read/:id", protect, adminOnly, emailController.adminMarkRead);

/**
 * @swagger
 * /api/emails/admin/unread-count:
 *   get:
 *     summary: Get unread email count (Admin only)
 *     tags: [Email Management - Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread email count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadCount:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied. Admin only.
 */
router.get("/admin/unread-count", protect, adminOnly, emailController.adminGetUnreadCount);

/**
 * @swagger
 * /api/emails/admin/filter:
 *   get:
 *     summary: Filter emails by sender, receiver, date range, or read status (Admin only)
 *     tags: [Email Management - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: sender
 *         schema:
 *           type: string
 *         description: Filter by sender email (partial match)
 *         example: user@example.com
 *       - in: query
 *         name: receiver
 *         schema:
 *           type: string
 *         description: Filter by receiver email (partial match)
 *         example: admin@example.com
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *         example: "2024-12-31"
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by read status
 *         example: false
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of emails per page
 *     responses:
 *       200:
 *         description: Filtered email list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 emails:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Email'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Access denied. Admin only.
 */
router.get("/admin/filter", protect, adminOnly, emailController.adminFilterEmails);

// ─── User Endpoints ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/emails/contact-admin:
 *   post:
 *     summary: Send an email/message to the admin
 *     tags: [Email Management - User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *             properties:
 *               subject:
 *                 type: string
 *                 description: Message subject
 *                 example: I have a question about my order
 *               message:
 *                 type: string
 *                 description: Message content
 *                 example: Hi, I would like to know more about the subscription plans.
 *     responses:
 *       201:
 *         description: Message sent to admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Message sent to admin successfully
 *                 email:
 *                   $ref: '#/components/schemas/Email'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Not authenticated
 */
router.post("/contact-admin", protect, emailController.userContactAdmin);

/**
 * @swagger
 * /api/emails/sent:
 *   get:
 *     summary: View own sent messages to admin
 *     tags: [Email Management - User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of emails per page
 *     responses:
 *       200:
 *         description: List of sent messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 emails:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Email'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Not authenticated
 */
router.get("/sent", protect, emailController.userGetSentMessages);

/**
 * @swagger
 * /api/emails/admin-replies:
 *   get:
 *     summary: View replies received from the admin
 *     tags: [Email Management - User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of emails per page
 *     responses:
 *       200:
 *         description: List of admin replies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 emails:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Email'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Not authenticated
 */
router.get("/admin-replies", protect, emailController.userGetAdminReplies);

/**
 * @swagger
 * /api/emails/conversation:
 *   get:
 *     summary: View full conversation history with the admin (sent + received)
 *     tags: [Email Management - User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of emails per page
 *     responses:
 *       200:
 *         description: Conversation history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 emails:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Email'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Not authenticated
 */
router.get("/conversation", protect, emailController.userGetConversation);

module.exports = router;
