const { classifyImage } = require("./classify.js");
const { getDetectionType } = require("./normalizer.js");
const http = require("http");
const https = require("https");

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

function imageUrlToDataUrl(url, maxRedirects = 3) {
  return new Promise((resolve, reject) => {
    const transport = url.startsWith("https") ? https : http;

    const req = transport.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && maxRedirects > 0) {
        req.destroy();
        return resolve(imageUrlToDataUrl(res.headers.location, maxRedirects - 1));
      }

      if (res.statusCode !== 200) {
        req.destroy();
        return reject(new Error(`Failed to fetch image: HTTP ${res.statusCode}`));
      }

      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const buffer = Buffer.concat(chunks);
        const contentType = res.headers["content-type"] || "image/jpeg";
        resolve(`data:${contentType};base64,${buffer.toString("base64")}`);
      });
      res.on("error", reject);
    });

    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Image fetch timed out")); });
  });
}

module.exports = { analyzeClothing, imageUrlToDataUrl };
