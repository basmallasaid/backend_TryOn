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
  addToLatestRecycle,
  getLatestRecycle,
  removeFromLatestRecycle,
  getFavorites,
  addFavorite,
  updateFavorite,
  removeFavorite,
  updateDarkMode,
  updateUserImage,
  deleteUserImage,
} = require("../controllers/userController");

const protect = require("../middlewares/authMiddleware");
const adminOnly = require("../middlewares/adminMiddleware");

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

router.get("/latest-recycle", protect, getLatestRecycle);
router.post("/latest-recycle", protect, addToLatestRecycle);
router.delete("/latest-recycle/:id", protect, removeFromLatestRecycle);

/**
 * @swagger
 * /api/users/favorites:
 *   get:
 *     summary: Get all favorites for the authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 favorites:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       itemType:
 *                         type: string
 *                         enum: [PRODUCT, WARDROBE, TRYON]
 *                       itemId:
 *                         type: string
 *       401:
 *         description: Not authenticated
 */
router.get("/favorites", protect, getFavorites);

/**
 * @swagger
 * /api/users/favorites:
 *   post:
 *     summary: Add an item to favorites
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemType, itemId]
 *             properties:
 *               itemType:
 *                 type: string
 *                 enum: [PRODUCT, WARDROBE, TRYON]
 *                 description: Type of the item to favorite
 *               itemId:
 *                 type: string
 *                 description: ID of the item to favorite
 *     responses:
 *       201:
 *         description: Added to favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 favorites:
 *                   type: array
 *       400:
 *         description: Validation error or already in favorites
 *       401:
 *         description: Not authenticated
 */
router.post("/favorites", protect, addFavorite);

/**
 * @swagger
 * /api/users/favorites/{id}:
 *   put:
 *     summary: Update a favorite item
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The _id of the favorite entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itemType:
 *                 type: string
 *                 enum: [PRODUCT, WARDROBE, TRYON]
 *               itemId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Favorite updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 favorites:
 *                   type: array
 *       404:
 *         description: Favorite not found
 *       401:
 *         description: Not authenticated
 */
router.put("/favorites/:id", protect, updateFavorite);

/**
 * @swagger
 * /api/users/favorites/{id}:
 *   delete:
 *     summary: Remove a favorite item
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The _id of the favorite entry to remove
 *     responses:
 *       200:
 *         description: Removed from favorites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 favorites:
 *                   type: array
 *       404:
 *         description: Favorite not found
 *       401:
 *         description: Not authenticated
 */
router.delete("/favorites/:id", protect, removeFavorite);

/**
 * @swagger
 * /api/users/settings/dark-mode:
 *   put:
 *     summary: Update dark mode preference
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [darkMode]
 *             properties:
 *               darkMode:
 *                 type: boolean
 *                 description: Whether to enable dark mode
 *                 example: true
 *     responses:
 *       200:
 *         description: Dark mode updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 darkMode:
 *                   type: boolean
 *       400:
 *         description: darkMode must be a boolean
 *       401:
 *         description: Not authenticated
 */
router.put("/settings/dark-mode", protect, updateDarkMode);

/**
 * @swagger
 * /api/users/user-image:
 *   put:
 *     summary: Add or update user profile image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userImage]
 *             properties:
 *               userImage:
 *                 type: string
 *                 description: URL of the user image
 *                 example: "https://example.com/image.jpg"
 *     responses:
 *       200:
 *         description: User image updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userImage:
 *                   type: string
 *       400:
 *         description: userImage is required
 *       401:
 *         description: Not authenticated
 */
router.put("/user-image", protect, updateUserImage);

/**
 * @swagger
 * /api/users/user-image:
 *   delete:
 *     summary: Remove user profile image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User image removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Not authenticated
 */
router.delete("/user-image", protect, deleteUserImage);

const { getAllUsers, getUserStats, createAdminUser, deleteUser, markUserDeletionNotified, updateUser } = require("../controllers/userController");
const { getLimitsForUser } = require("../middlewares/usageLimit");

router.get("/stats", protect, adminOnly, getUserStats);

router.get("/usage", protect, async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const limits = getLimitsForUser(user);
    res.json({
      tryon: { used: user.usage.tryonUsed, limit: limits.tryon },
      recycle: { used: user.usage.recycleUsed, limit: limits.recycle },
      avatar: { used: user.usage.avatarUsed || 0, limit: limits.avatar },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/", protect, adminOnly, getAllUsers);
router.post("/", protect, adminOnly, createAdminUser);
router.patch("/:id/mark-notified", protect, adminOnly, markUserDeletionNotified);
router.put("/:id", protect, adminOnly, updateUser);
router.delete("/:id", protect, adminOnly, deleteUser);

router.get("/:id", protect, getUserById);

module.exports = router;
