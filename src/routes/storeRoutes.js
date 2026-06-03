const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeController");

// Create a new store
router.post("/", storeController.createStore);

// Get all stores
router.get("/", storeController.getStores);

// Get a store by ID
router.get("/:id", storeController.getStoreById);

// Update a store by ID
router.put("/:id", storeController.updateStore);

// Delete a store by ID
router.delete("/:id", storeController.deleteStore);

module.exports = router;
