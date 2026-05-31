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

router.put("/profile", protect, updateProfile);

router.get("/settings", protect, getSettings);

router.put("/settings/language", protect, updateLanguage);

router.put("/settings/notifications", protect, updateNotifications);

router.delete("/account", protect, deleteAccount);

module.exports = router;
