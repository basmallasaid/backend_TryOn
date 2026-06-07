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
 *     description: Returns previously generated outfit recommendations, including weather data if available.
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of results (max 100)
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: Recommendation history retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       user_id:
 *                         type: string
 *                       outfits:
 *                         type: array
 *                         items:
 *                           type: object
 *                       weather:
 *                         $ref: '#/components/schemas/WeatherData'
 *                       created_at:
 *                         type: string
 *                         format: date-time
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
 *     description: Generates scored outfit combinations from wardrobe items. Optionally accepts lat/lon for weather-aware filtering (items unsuitable for current weather are excluded).
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
 *                 description: Maximum number of outfit recommendations to return
 *                 example: 10
 *               lat:
 *                 type: number
 *                 format: float
 *                 description: Latitude for weather-aware filtering (optional)
 *                 example: 30.0444
 *               lon:
 *                 type: number
 *                 format: float
 *                 description: Longitude for weather-aware filtering (optional)
 *                 example: 31.2357
 *     responses:
 *       200:
 *         description: Outfit recommendations generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 outfits:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       score:
 *                         type: integer
 *                         description: Total compatibility score (0-1000 scale)
 *                       breakdown:
 *                         type: object
 *                         properties:
 *                           color:
 *                             type: number
 *                           style:
 *                             type: number
 *                           season:
 *                             type: number
 *                           pattern:
 *                             type: number
 *                           gender:
 *                             type: number
 *                           category:
 *                             type: number
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             category:
 *                               type: string
 *                             color:
 *                               type: string
 *                             style:
 *                               type: string
 *                             weatherScore:
 *                               type: number
 *                       weather:
 *                         type: object
 *                         properties:
 *                           temperature:
 *                             type: number
 *                           feelsLike:
 *                             type: number
 *                           condition:
 *                             type: string
 *                           avgWeatherScore:
 *                             type: number
 *                             description: Average weather relevance score across all items in the outfit
 *                 weather:
 *                   $ref: '#/components/schemas/WeatherData'
 *       400:
 *         description: Invalid parameters
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
