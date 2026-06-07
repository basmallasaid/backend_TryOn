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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       user_id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       type:
 *                         type: string
 *                       category:
 *                         type: string
 *                         enum: [top, bottom, outerwear, dress, footwear, accessory]
 *                       colors:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             color:
 *                               type: string
 *                             percentage:
 *                               type: number
 *                       color:
 *                         type: string
 *                       style:
 *                         type: string
 *                         enum: [casual, smart-casual, formal, streetwear, sport]
 *                       pattern:
 *                         type: string
 *                         enum: [solid, striped, checked, graphic, floral]
 *                       season:
 *                         type: array
 *                         items:
 *                           type: string
 *                           enum: [spring, summer, autumn, winter]
 *                       gender:
 *                         type: string
 *                         enum: [male, female, unisex]
 *                       confidence:
 *                         type: number
 *                       image:
 *                         type: string
 *                         nullable: true
 *                       analysis_id:
 *                         type: string
 *                         nullable: true
 *                       garment_index:
 *                         type: integer
 *                         nullable: true
 *                       source:
 *                         type: string
 *                         enum: [analysis, manual]
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get("/", getWardrobe);

/**
 * @swagger
 * /api/wardrobe/from-analysis:
 *   post:
 *     summary: Add garment(s) from a previous analysis to wardrobe
 *     description: Imports one or all garments from an existing analysis into the user's wardrobe. Duplicates are rejected with 409.
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
 *                 example: "6658abc123def45678901234"
 *               garment_index:
 *                 type: integer
 *                 description: Index of a specific garment to import (omit to import all garments)
 *                 example: 0
 *     responses:
 *       201:
 *         description: Garment(s) added to wardrobe successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WardrobeItem'
 *       400:
 *         description: analysis_id is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Analysis not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       409:
 *         description: Item already added to wardrobe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: Not authenticated
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
 *         description: Item deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       401:
 *         description: Not authenticated
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
 *         description: Wardrobe cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Not authenticated
 */
router.delete("/", clearWardrobe);

module.exports = router;
