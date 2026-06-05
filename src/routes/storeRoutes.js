const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeController");
const protect = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /api/stores:
 *   post:
 *     summary: Create a new store
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               logo:
 *                 type: string
 *               description:
 *                 type: string
 *               discount:
 *                 type: number
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Store created
 *       401:
 *         description: Not authenticated
 */
router.post("/", protect, storeController.createStore);

/**
 * @swagger
 * /api/stores:
 *   get:
 *     summary: Get all stores (filterable)
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: List of stores
 *       401:
 *         description: Not authenticated
 */
router.get("/", protect, storeController.getStores);

/**
 * @swagger
 * /api/stores/{id}:
 *   get:
 *     summary: Get a store by ID
 *     tags: [Stores]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Store ID
 *     responses:
 *       200:
 *         description: Store details
 *       404:
 *         description: Store not found
 */
router.get("/:id", protect, storeController.getStoreById);

/**
 * @swagger
 * /api/stores/{id}:
 *   put:
 *     summary: Update a store
 *     tags: [Stores]
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
 *               logo:
 *                 type: string
 *               description:
 *                 type: string
 *               discount:
 *                 type: number
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Store updated
 *       404:
 *         description: Store not found
 */
router.put("/:id", protect, storeController.updateStore);

/**
 * @swagger
 * /api/stores/{id}:
 *   delete:
 *     summary: Delete a store
 *     tags: [Stores]
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
 *         description: Store deleted
 *       404:
 *         description: Store not found
 */
router.delete("/:id", protect, storeController.deleteStore);

module.exports = router;
