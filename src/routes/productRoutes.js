const express = require("express");
const router = express.Router({ mergeParams: true });
const productController = require("../controllers/productController");
const protect = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, category]
 *             properties:
 *               store_id:
 *                 type: string
 *               name:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *               colors:
 *                 type: array
 *                 items:
 *                   type: string
 *               seasons:
 *                 type: array
 *                 items:
 *                   type: string
 *               price:
 *                 type: number
 *               purchase_url:
 *                 type: string
 *               try_on_enabled:
 *                 type: boolean
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Product created
 *       401:
 *         description: Not authenticated
 */
router.post("/", protect, productController.createProduct);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with filters
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: store_id
 *         schema:
 *           type: string
 *         description: Filter by store
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *         description: Filter by active status
 *       - in: query
 *         name: try_on_enabled
 *         schema:
 *           type: string
 *         description: Filter by try-on availability
 *     responses:
 *       200:
 *         description: List of products
 *       401:
 *         description: Not authenticated
 */
router.get("/", protect, productController.getProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get("/:id", protect, productController.getProductById);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *               colors:
 *                 type: array
 *                 items:
 *                   type: string
 *               seasons:
 *                 type: array
 *                 items:
 *                   type: string
 *               price:
 *                 type: number
 *               purchase_url:
 *                 type: string
 *               try_on_enabled:
 *                 type: boolean
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Product not found
 */
router.put("/:id", protect, productController.updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
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
 *         description: Product deleted
 *       404:
 *         description: Product not found
 */
router.delete("/:id", protect, productController.deleteProduct);

/**
 * @swagger
 * /api/stores/{store_id}/products:
 *   get:
 *     summary: Get products by store
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: store_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of products for the store
 *       401:
 *         description: Not authenticated
 */
router.get("/", protect, productController.getProducts);

module.exports = router;
