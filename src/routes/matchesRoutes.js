const { Router } = require("express");
const { findMatchesForItem } = require("../services/recommendationEngine");
const WardrobeItem = require("../models/WardrobeItem");
const MatchHistory = require("../models/MatchHistory");
const protect = require("../middlewares/authMiddleware");

const router = Router();

function toEngineItem(doc) {
  return {
    id: doc._id.toString(),
    name: doc.name || doc.type,
    type: doc.type,
    category: doc.category,
    colors: doc.colors || [],
    color: doc.color || "unknown",
    style: doc.style || "casual",
    pattern: doc.pattern || "solid",
    season: doc.season || [],
    gender: doc.gender || "unisex",
  };
}

/**
 * @swagger
 * /api/matches:
 *   get:
 *     summary: Get match history for the user
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results (max 100)
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: Match history
 *       401:
 *         description: Not authenticated
 */
router.get("/", protect, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = parseInt(req.query.skip) || 0;
    const history = await MatchHistory.find({ user_id: req.user._id })
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(skip);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/matches:
 *   post:
 *     summary: Find matching items for a wardrobe item
 *     tags: [Matches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [wardrobe_item_id]
 *             properties:
 *               wardrobe_item_id:
 *                 type: string
 *                 description: ID of the wardrobe item to match
 *     responses:
 *       200:
 *         description: Matching items returned
 *       400:
 *         description: wardrobe_item_id is required
 *       404:
 *         description: Wardrobe item not found
 */
router.post("/", protect, async (req, res) => {
  try {
    const { wardrobe_item_id } = req.body;
    if (!wardrobe_item_id) {
      return res.status(400).json({ error: "wardrobe_item_id is required" });
    }

    const sourceItem = await WardrobeItem.findOne({
      _id: wardrobe_item_id,
      user_id: req.user._id,
    });
    if (!sourceItem) {
      return res.status(404).json({ error: "Wardrobe item not found" });
    }

    const allItems = await WardrobeItem.find({
      user_id: req.user._id,
      _id: { $ne: sourceItem._id },
    });

    const uploadedItem = toEngineItem(sourceItem);
    const wardrobe = allItems.map(toEngineItem);

    const matches = findMatchesForItem(uploadedItem, wardrobe);

    await MatchHistory.create({
      user_id: req.user._id,
      source_garment: uploadedItem,
      matches,
    });

    res.json({ matches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
