const { Router } = require("express");
const protect = require("../middlewares/authMiddleware");
const {
  getWardrobe,
  addFromAnalysis,
  deleteItem,
  clearWardrobe,
} = require("../controllers/wardrobeController");

const router = Router();

router.use(protect);

/**
 * @swagger
 * /api/wardrobe:
 *   get:
 *     summary: Get all wardrobe items for the user
 *     tags: [Wardrobe]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of wardrobe items
 *       401:
 *         description: Not authenticated
 */
router.get("/", getWardrobe);

/**
 * @swagger
 * /api/wardrobe/from-analysis:
 *   post:
 *     summary: Add garment(s) from a previous analysis to wardrobe
 *     tags: [Wardrobe]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [analysis_id]
 *             properties:
 *               analysis_id:
 *                 type: string
 *                 description: ID of the analysis to import garments from
 *               garment_index:
 *                 type: integer
 *                 description: Index of a specific garment (omit for all)
 *     responses:
 *       200:
 *         description: Garment(s) added to wardrobe
 *       404:
 *         description: Analysis not found
 */
router.post("/from-analysis", addFromAnalysis);

/**
 * @swagger
 * /api/wardrobe/{id}:
 *   delete:
 *     summary: Delete a specific wardrobe item
 *     tags: [Wardrobe]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Wardrobe item ID
 *     responses:
 *       200:
 *         description: Item deleted
 *       404:
 *         description: Item not found
 */
router.delete("/:id", deleteItem);

/**
 * @swagger
 * /api/wardrobe:
 *   delete:
 *     summary: Clear entire wardrobe
 *     tags: [Wardrobe]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wardrobe cleared
 *       401:
 *         description: Not authenticated
 */
router.delete("/", clearWardrobe);

module.exports = router;
