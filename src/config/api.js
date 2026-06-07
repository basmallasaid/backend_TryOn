const CONFIG = Object.freeze({
  MODEL_URL: "https://router.huggingface.co/v1/chat/completions",
  MODEL_ID: "Qwen/Qwen3-VL-8B-Instruct",
  KIE_API_BASE: "https://api.kie.ai",
  KIE_UPLOAD_BASE: "https://kieai.redpandaai.co",
  KIE_TTI_MODEL: process.env.KIE_TTI_MODEL || "nano-banana-2",
  DASHSCOPE_ENDPOINT: process.env.DASHSCOPE_ENDPOINT,
  GITHUB_MODELS_BASE_URL: "https://models.github.ai/inference",
  GITHUB_MODELS_MODEL: "gpt-4o-mini",
  WEATHER_API_BASE: "https://api.open-meteo.com",
});

module.exports = { CONFIG };
