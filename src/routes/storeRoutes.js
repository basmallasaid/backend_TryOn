const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeController");
const protect = require("../middlewares/authMiddleware");

// Create a new store
router.post("/", protect, storeController.createStore);

// Get all stores
router.get("/", protect, storeController.getStores);

// Get a store by ID
router.get("/:id", protect, storeController.getStoreById);

// Update a store by ID
router.put("/:id", protect, storeController.updateStore);

// Delete a store by ID
router.delete("/:id", protect, storeController.deleteStore);

module.exports = router;
