const { Router } = require("express");
const { getRecommendations } = require("../services/recommendationEngine");
const { getUserWardrobe } = require("../services/wardrobe");
const Recommendation = require("../models/Recommendation");
const protect = require("../middlewares/authMiddleware");
const { getWeather, scoreItemWeatherRelevance } = require("../services/weather");

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
    const { lat, lon, limit: reqLimit } = req.body;
    const limit = reqLimit || 10;

    const wardrobe = await getUserWardrobe(req.user._id);

    let weatherData = null;
    if (lat !== undefined && lon !== undefined) {
      try {
        weatherData = await getWeather(Number(lat), Number(lon));
      } catch {
        // weather fetch failed silently
      }
    }

    let filteredWardrobe = wardrobe;
    if (weatherData) {
      filteredWardrobe = wardrobe.map((item) => {
        const weatherScore = scoreItemWeatherRelevance(item, weatherData);
        return { ...item.toObject?.() || item, weatherScore };
      }).filter((item) => item.weatherScore >= 3);
    }

    const outfits = getRecommendations(filteredWardrobe, limit);
    const enriched = outfits.map((outfit) => ({
      ...outfit,
      weather: weatherData
        ? {
            ...weatherData,
            avgWeatherScore: Math.round(
              outfit.items.reduce((s, i) => s + (i.weatherScore ?? 5), 0) / outfit.items.length
            ),
          }
        : null,
    }));

    if (enriched.length) {
      await Recommendation.create({
        user_id: req.user._id,
        outfits: enriched,
        weather: weatherData,
      });
    }

    res.json({ outfits: enriched, weather: weatherData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
