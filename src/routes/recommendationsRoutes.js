const { Router } = require("express");
const { getRecommendations } = require("../services/recommendationEngine");
const { getUserWardrobe } = require("../services/wardrobe");
const Recommendation = require("../models/Recommendation");
const protect = require("../middlewares/authMiddleware");

const router = Router();

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
