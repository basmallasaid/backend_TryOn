const { Router } = require("express");
const { getRecommendations } = require("../services/recommendationEngine");
const { getUserWardrobe } = require("../services/wardrobe");
const Recommendation = require("../models/Recommendation");
const protect = require("../middlewares/authMiddleware");

const router = Router();

/**
 * @swagger
 * /api/recommendations:
 *   get:
 *     summary: Get past recommendation history
 *     tags: [Recommendations]
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
 *         description: Recommendation history
 *       401:
 *         description: Not authenticated
 */
router.get("/", protect, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = parseInt(req.query.skip) || 0;
    const history = await Recommendation.find({ user_id: req.user._id })
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
 * /api/recommendations:
 *   post:
 *     summary: Generate new outfit recommendations from the user's wardrobe
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: integer
 *                 default: 10
 *                 description: Maximum number of outfits to recommend
 *     responses:
 *       200:
 *         description: Outfit recommendations
 *       401:
 *         description: Not authenticated
 */
router.post("/", protect, async (req, res) => {
  try {
    const wardrobe = await getUserWardrobe(req.user._id);
    const limit = req.body?.limit || 10;
    const outfits = getRecommendations(wardrobe, limit);

    if (outfits.length) {
      await Recommendation.create({
        user_id: req.user._id,
        outfits,
      });
    }

    res.json({ outfits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
