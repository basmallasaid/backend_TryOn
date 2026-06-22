const ApiKey = require("../models/ApiKey");

const SERVICE_TO_KEY_MAP = {
  "Try On Image Generation": "KIE_API_KEY",
  "Avatar Generation Model": "KIE_API_KEY",
  "Recycle Analysis Model": "HF_TOKEN",
  "Try On Analysis Model": "HF_TOKEN",
  "Recycle Image Generation": "DASHSCOPE_API_KEY",
};

async function extractKeys(req, res, next) {
  const fromDb = {};

  try {
    const activeKeys = await ApiKey.find({ status: "Active" }).lean();
    for (const ak of activeKeys) {
      const envKey = SERVICE_TO_KEY_MAP[ak.service];
      if (envKey && ak.key) {
        fromDb[envKey] = ak.key;
      }
    }
  } catch (e) {
    console.error("[extractKeys] Failed to load API keys from DB:", e.message);
  }

  req.apiKeys = {
    HF_TOKEN: req.headers["x-hf-token"] || req.headers["x-huggingface-token"] || fromDb.HF_TOKEN,
    KIE_API_KEY: req.headers["x-kie-api-key"] || fromDb.KIE_API_KEY,
    DASHSCOPE_API_KEY: req.headers["x-dashscope-api-key"] || fromDb.DASHSCOPE_API_KEY,
    GITHUB_TOKEN: req.headers["x-github-token"],
  };

  next();
}

module.exports = { extractKeys };
