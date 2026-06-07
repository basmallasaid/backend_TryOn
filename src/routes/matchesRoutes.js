const { Router } = require("express");
const { findMatchesForItem } = require("../services/recommendationEngine");
const WardrobeItem = require("../models/WardrobeItem");
const Product = require("../models/Product");
const MatchHistory = require("../models/MatchHistory");
const protect = require("../middlewares/authMiddleware");
const { getWeather, scoreItemWeatherRelevance } = require("../services/weather");

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

function productToEngineItem(product) {
  const colors = (product.color_tags || []).map((c) => ({ color: c, percentage: 100 }));
  return {
    id: `store_${product._id.toString()}`,
    name: product.name,
    type: product.name,
    category: product.category === "acc" ? "accessory" : product.category,
    colors,
    color: colors[0]?.color || "unknown",
    style: "casual",
    pattern: "solid",
    season: product.season_tags || [],
    gender: "unisex",
    _store: true,
    store_id: product.store_id,
    price: product.price,
    currency: product.currency,
    purchase_url: product.purchase_url,
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
    const { wardrobe_item_id, lat, lon } = req.body;
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

    const [allItems, rawProducts] = await Promise.all([
      WardrobeItem.find({ user_id: req.user._id, _id: { $ne: sourceItem._id } }),
      Product.find({ is_active: true }),
    ]);

    let weatherData = null;
    if (lat !== undefined && lon !== undefined) {
      try {
        weatherData = await getWeather(Number(lat), Number(lon));
      } catch {
        // weather fetch failed silently - return results without weather
      }
    }

    const uploadedItem = toEngineItem(sourceItem);
    const wardrobeCandidates = allItems.map(toEngineItem);
    const productCandidates = rawProducts.map(productToEngineItem);

    const allCandidates = [...wardrobeCandidates, ...productCandidates];

    const matches = findMatchesForItem(uploadedItem, allCandidates).map((m) => {
      const candidate = m.item;
      let weatherScore = null;
      if (weatherData) {
        weatherScore = scoreItemWeatherRelevance(candidate, weatherData);
      }
      const enrichedItem = {
        ...candidate,
        source: candidate._store ? "store" : "wardrobe",
        weatherScore,
        ...(candidate._store
          ? {
              store_id: candidate.store_id,
              price: candidate.price,
              currency: candidate.currency,
              purchase_url: candidate.purchase_url,
            }
          : {}),
      };
      delete enrichedItem._store;
      return { ...m, item: enrichedItem };
    });

    if (weatherData) {
      matches.sort((a, b) => {
        const aWs = a.weatherScore ?? 5;
        const bWs = b.weatherScore ?? 5;
        return bWs - aWs || b.score - a.score;
      });
    }

    await MatchHistory.create({
      user_id: req.user._id,
      source_garment: uploadedItem,
      matches,
      weather: weatherData,
    });

    res.json({ matches, weather: weatherData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
