const { classifyImage } = require("./classify.js");
const { getDetectionType } = require("./normalizer.js");

async function analyzeClothing(imageDataUrl, options = {}) {
  const { onProgress, ...classifyOptions } = options;

  onProgress?.("AI is examining features…");

  const garments = await classifyImage(imageDataUrl, classifyOptions);
  const detectionType = getDetectionType(garments);

  return {
    garments,
    detectionType,
  };
}

module.exports = { analyzeClothing };
