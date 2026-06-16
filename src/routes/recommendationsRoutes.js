const { Router } = require("express");
const { getRotatedRecommendations } = require("../services/recommendationEngine");
const { getUserWardrobe } = require("../services/wardrobe");
const Recommendation = require("../models/Recommendation");
const OutfitUsage = require("../models/OutfitUsage");
const protect = require("../middlewares/authMiddleware");
const { getWeather } = require("../services/weather");
const { generateCompositeForOutfitWithUrl } = require("../services/compositeService");

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
      .skip(skip)
      .lean();

    const sanitized = history.map((rec) => ({
      ...rec,
      outfits: (rec.outfits || []).map((outfit) => {
        const topItem = outfit.items?.find(i => i.category === 'top');
        const bottomItem = outfit.items?.find(i => i.category === 'bottom');
        return {
          ...outfit,
          items: (outfit.items || []).map((item) => ({
            ...item,
            image: null,
          })),
          top_id: topItem?._id || topItem?.id || null,
          bottom_id: bottomItem?._id || bottomItem?.id || null,
        };
      }),
    }));

    res.json({ history: sanitized });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/recommendations:
 *   post:
 *     summary: Generate new outfit recommendations from the user's wardrobe
 *     description: Generates scored outfit combinations from wardrobe items. Uses rotation logic to avoid repeating outfits. Optionally accepts lat/lon for weather-aware filtering.
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
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                       weather:
 *                         type: object
 *                       compositeImage:
 *                         type: string
 *                       top_id:
 *                         type: string
 *                       bottom_id:
 *                         type: string
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
    const useLat = lat !== undefined ? Number(lat) : 30.0444;
    const useLon = lon !== undefined ? Number(lon) : 31.2357;
    try {
      weatherData = await getWeather(useLat, useLon);
    } catch (err) {
      console.error('Weather fetch failed:', err.message);
    }

    const outfits = await getRotatedRecommendations(
      wardrobe,
      weatherData,
      req.user._id,
      limit,
    );

    const enriched = [];
    const usageUpdates = [];

    for (const outfit of outfits) {
      const topItem = outfit.items.find(i => i.category === 'top');
      const bottomItem = outfit.items.find(i => i.category === 'bottom');

      const apiKey = req.apiKeys?.KIE_API_KEY || process.env.KIE_API_key;

      let compositeImage = null;
      if (topItem?.image && bottomItem?.image) {
        try {
          compositeImage = await generateCompositeForOutfitWithUrl(
            topItem.image,
            bottomItem.image,
            apiKey,
          );
          console.log(`Composite generated successfully, length: ${compositeImage.length}`);
        } catch (err) {
          console.error('Composite image generation failed:', err.message);
        }
      } else {
        console.warn('Cannot generate composite: top or bottom image missing');
      }

      const topWeatherScore = topItem?.weatherScore ?? 5;
      const bottomWeatherScore = bottomItem?.weatherScore ?? 5;

      const enrichedOutfit = {
        ...outfit,
        weather: weatherData
          ? {
              ...weatherData,
              avgWeatherScore: outfit.weather?.avgWeatherScore ?? Math.round((topWeatherScore + bottomWeatherScore) / 2),
            }
          : null,
        compositeImage,
        top_id: topItem?._id || topItem?.id || null,
        bottom_id: bottomItem?._id || bottomItem?.id || null,
      };

      enriched.push(enrichedOutfit);

      if (topItem?._id && bottomItem?._id) {
        usageUpdates.push({
          updateOne: {
            filter: {
              user_id: req.user._id,
              top_id: topItem._id,
              bottom_id: bottomItem._id,
            },
            update: {
              $inc: { usage_count: 1 },
              $set: { last_used_at: new Date() },
            },
            upsert: true,
          },
        });
      }
    }

    if (usageUpdates.length) {
      try {
        await OutfitUsage.bulkWrite(usageUpdates);
      } catch (err) {
        console.error('Failed to update outfit usage:', err.message);
      }
    }

    if (enriched.length) {
      const topItem = enriched[0].items.find(i => i.category === 'top');
      const bottomItem = enriched[0].items.find(i => i.category === 'bottom');

      await Recommendation.create({
        user_id: req.user._id,
        outfits: enriched,
        weather: weatherData,
        top_id: topItem?._id || null,
        bottom_id: bottomItem?._id || null,
        composite_image: enriched[0]?.compositeImage || null,
        score: enriched[0]?.score || null,
      });
    }

    const responseOutfits = enriched.map((o) => ({
      score: o.score,
      breakdown: o.breakdown,
      items: (o.items || []).map((item) => ({
        ...item,
        image: null,
      })),
      weather: o.weather,
      compositeImage: o.compositeImage,
      top_id: o.top_id,
      bottom_id: o.bottom_id,
    }));

    res.json({ outfits: responseOutfits, weather: weatherData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/recommendations:
 *   delete:
 *     summary: Delete all recommendations for the authenticated user
 *     description: Removes all saved outfit recommendations for the current user.
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommendations deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: All recommendations deleted
 *                 deletedCount:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: Not authenticated
 */
router.delete("/", protect, async (req, res) => {
  try {
    const result = await Recommendation.deleteMany({ user_id: req.user._id });
    res.json({ message: "All recommendations deleted", deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
