const { Router } = require("express");
const { getRecommendations } = require("../services/recommendationEngine.js");
const { loadWardrobe } = require("../services/wardrobe.js");

const router = Router();

router.post("/", (req, res) => {
  try {
    const wardrobe = loadWardrobe();
    const limit = req.body?.limit || 10;
    const outfits = getRecommendations(wardrobe, limit);
    res.json({ outfits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
