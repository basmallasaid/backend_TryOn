const express = require("express");
const router = express.Router();
const protect = require("../middlewares/authMiddleware");
const {
  getAllApiKeys,
  getApiKey,
  updateApiKey,
  deleteApiKey,
} = require("../controllers/apiKeyController");

router.get("/", protect, getAllApiKeys);
router.get("/:id", protect, getApiKey);
router.put("/:id", protect, updateApiKey);
router.delete("/:id", protect, deleteApiKey);

module.exports = router;
