const express = require("express");
const router = express.Router({ mergeParams: true });
const productController = require("../controllers/productController");
const protect = require("../middlewares/authMiddleware");
const adminOnly = require("../middlewares/adminMiddleware");

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
 *                 description: ID of the store this product belongs to
 *                 example: "6658abc123def45678901234"
 *               name:
 *                 type: string
 *                 example: "Blue Denim Jacket"
 *               description:
 *                 type: string
 *                 example: "A stylish blue denim jacket"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://example.com/jacket.jpg"]
 *               category:
 *                 type: string
 *                 enum: [top, bottom, dress, acc]
 *                 example: "top"
 *               color_tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["blue", "denim"]
 *               season_tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [spring, summer, autumn, winter]
 *                 example: ["spring", "autumn"]
 *               price:
 *                 type: number
 *                 example: 79.99
 *               currency:
 *                 type: string
 *                 default: "USD"
 *                 example: "USD"
 *               purchase_url:
 *                 type: string
 *                 example: "https://example.com/buy/jacket"
 *               try_on_enabled:
 *                 type: boolean
 *                 default: false
 *               is_active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   type: object
 *       400:
 *         description: Name and category are required
 *       401:
 *         description: Not authenticated
 */
router.post("/", protect, adminOnly, productController.createProduct);

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
 *         description: Filter by store ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [top, bottom, dress, acc]
 *         description: Filter by category
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Filter by active status
 *       - in: query
 *         name: try_on_enabled
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Filter by try-on availability
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       store_id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 *                       category:
 *                         type: string
 *                         enum: [top, bottom, dress, acc]
 *                       color_tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       season_tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       price:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       purchase_url:
 *                         type: string
 *                       try_on_enabled:
 *                         type: boolean
 *                       is_active:
 *                         type: boolean
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   type: object
 *       404:
 *         description: Product not found
 *       401:
 *         description: Not authenticated
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
 *         description: Product ID
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
 *                 enum: [top, bottom, dress, acc]
 *               color_tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               season_tags:
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
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   type: object
 *       404:
 *         description: Product not found
 *       401:
 *         description: Not authenticated
 */
router.put("/:id", protect, adminOnly, productController.updateProduct);

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
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Product not found
 *       401:
 *         description: Not authenticated
 */
router.delete("/:id", protect, adminOnly, productController.deleteProduct);

module.exports = router;
