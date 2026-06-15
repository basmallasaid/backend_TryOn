const express = require("express");
const { submitContact, getAllContacts, markContactRead, deleteContact } = require("../controllers/contactController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit a contact message
 *     description: Send a message from the Contact Us form. Sends an email notification to the admin.
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, message]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               message:
 *                 type: string
 *                 example: "I have a question about my order."
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Name, email, and message are required
 */
router.post("/", submitContact);

/**
 * @swagger
 * /api/contact:
 *   get:
 *     summary: Get all contact messages (admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of contact messages
 *       401:
 *         description: Not authenticated
 */
router.get("/", protect, getAllContacts);

/**
 * @swagger
 * /api/contact/{id}/read:
 *   put:
 *     summary: Mark a contact message as read (admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Marked as read
 *       404:
 *         description: Message not found
 */
router.put("/:id/read", protect, markContactRead);

/**
 * @swagger
 * /api/contact/{id}:
 *   delete:
 *     summary: Delete a contact message (admin only)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Message not found
 */
router.delete("/:id", protect, deleteContact);

module.exports = router;
