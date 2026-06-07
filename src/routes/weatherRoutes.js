const { Router } = require("express");
const protect = require("../middlewares/authMiddleware");
const { getWeather } = require("../services/weather");

const router = Router();

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
