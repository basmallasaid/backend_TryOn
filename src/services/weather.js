const { CONFIG } = require("../config/api");

const WMO_CONDITIONS = {
  0: "clear",
  1: "mainly_clear",
  2: "partly_cloudy",
  3: "overcast",
  45: "fog",
  48: "fog",
  51: "drizzle",
  53: "drizzle",
  55: "drizzle",
  56: "drizzle",
  57: "drizzle",
  61: "rain",
  63: "rain",
  65: "rain",
  66: "rain",
  67: "rain",
  71: "snow",
  73: "snow",
  75: "snow",
  77: "snow",
  80: "rain_showers",
  81: "rain_showers",
  82: "rain_showers",
  85: "snow",
  86: "snow",
  95: "thunderstorm",
  96: "thunderstorm",
  99: "thunderstorm",
};

function mapWeatherCode(code) {
  return WMO_CONDITIONS[code] || "unknown";
}

function weatherToSeasons(temp) {
  if (temp < 5) return ["winter"];
  if (temp < 10) return ["winter", "autumn"];
  if (temp < 18) return ["autumn", "spring"];
  if (temp < 26) return ["spring", "summer"];
  return ["summer"];
}

function scoreItemWeatherRelevance(item, weatherData) {
  const { temperature, condition } = weatherData;
  const relevantSeasons = weatherToSeasons(temperature);

  const itemSeasons = item.season || [];
  if (!itemSeasons.length) return 5;

  const overlap = itemSeasons.filter((s) => relevantSeasons.includes(s)).length;
  let score = overlap >= 2 ? 10 : overlap === 1 ? 8 : 3;

  if (["rain", "drizzle", "rain_showers", "thunderstorm", "snow"].includes(condition)) {
    if (item.category === "outerwear") score = Math.min(score + 3, 10);
    if (item.category === "footwear" && condition === "snow") score = Math.min(score + 2, 10);
  }

  if (condition === "thunderstorm" || condition === "snow") {
    if (item.category === "accessory" || item.category === "dress") score = Math.max(score - 2, 0);
  }

  return score;
}

async function getWeather(latitude, longitude, options = {}) {
  const { retries = 2, retryDelay = 1000 } = options;
  const url = `${CONFIG.WEATHER_API_BASE}/v1/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day`;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`Weather API returned ${res.status}`);
      const data = await res.json();
      const current = data.current;
      if (!current) throw new Error("Weather API returned no current data");
      return {
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        condition: mapWeatherCode(current.weather_code),
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        isDay: current.is_day === 1,
        weatherCode: current.weather_code,
      };
    } catch (err) {
      lastError = err;
      if (attempt < retries) await new Promise((r) => setTimeout(r, retryDelay));
    }
  }
  throw lastError;
}

module.exports = { getWeather, scoreItemWeatherRelevance, weatherToSeasons };
