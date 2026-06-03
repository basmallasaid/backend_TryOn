const express = require("express");
const router = express.Router({ mergeParams: true });
const productController = require("../controllers/productController");
const protect = require("../middlewares/authMiddleware");

// Create a new product
router.post("/", protect, productController.createProduct);

// Get all products (supports ?store_id=&category=&is_active=&try_on_enabled=)
router.get("/", protect, productController.getProducts);

// Get a product by ID
router.get("/:id", protect, productController.getProductById);

// Update a product by ID
router.put("/:id", protect, productController.updateProduct);

// Delete a product by ID
router.delete("/:id", protect, productController.deleteProduct);

module.exports = router;
