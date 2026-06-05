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
