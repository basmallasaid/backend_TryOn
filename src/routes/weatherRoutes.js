const { Router } = require("express");
const protect = require("../middlewares/authMiddleware");
const { getWeather } = require("../services/weather");

const router = Router();

/**
 * @swagger
 * /api/weather:
 *   get:
 *     summary: Get current weather for coordinates
 *     description: Fetches real-time weather data from Open-Meteo (free, no API key). Temperature, feels-like, condition, humidity, wind speed.
 *     tags: [Weather]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Latitude (e.g. 30.0444)
 *         example: 30.0444
 *       - in: query
 *         name: lon
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Longitude (e.g. 31.2357)
 *         example: 31.2357
 *     responses:
 *       200:
 *         description: Current weather data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 weather:
 *                   type: object
 *                   properties:
 *                     temperature:
 *                       type: number
 *                       description: Current temperature in °C
 *                       example: 22.5
 *                     feelsLike:
 *                       type: number
 *                       description: Apparent (feels-like) temperature in °C
 *                       example: 21.8
 *                     condition:
 *                       type: string
 *                       enum: [clear, mainly_clear, partly_cloudy, overcast, fog, drizzle, rain, snow, rain_showers, thunderstorm]
 *                       example: clear
 *                     humidity:
 *                       type: number
 *                       description: Relative humidity percentage
 *                       example: 45
 *                     windSpeed:
 *                       type: number
 *                       description: Wind speed in km/h
 *                       example: 12.3
 *                     isDay:
 *                       type: boolean
 *                       description: Whether it is currently daytime
 *                       example: true
 *                     weatherCode:
 *                       type: integer
 *                       description: Raw WMO weather code
 *                       example: 0
 *       400:
 *         description: lat and lon query parameters are required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "lat and lon query parameters are required"
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Weather API fetch failed
 */
router.get("/", protect, async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: "lat and lon query parameters are required" });
    }
    const weather = await getWeather(Number(lat), Number(lon));
    res.json({ weather });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
