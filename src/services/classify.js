const { CONFIG } = require("../config/api.js");
const { parseGarments } = require("./normalizer.js");

const categoryOptions = ["top", "bottom", "outerwear", "dress", "footwear", "accessory"];
const styleOptions = ["casual", "smart-casual", "formal", "streetwear", "sport"];
const patternOptions = ["solid", "striped", "checked", "graphic", "floral"];
const seasonOptions = ["spring", "summer", "autumn", "winter"];
const genderOptions = ["male", "female", "unisex"];

const systemPrompt = [
  "You are a precise fashion analyst. Analyze the garment(s) in the image and return ONLY valid JSON.",
  "Do NOT include markdown, code blocks, or any text outside the JSON.",
  "",
  "Examples:",
  'Single garment → {"garments":[{"category":"top","specificType":"blue t-shirt","confidence":0.95,"colors":[{"color":"blue","percentage":70},{"color":"white","percentage":30}],"style":"casual","pattern":"solid","season":["spring","summer"],"gender":"male"}]}',
  'Multiple garments → {"garments":[{"category":"top","specificType":"white shirt","confidence":0.95,"colors":[{"color":"white","percentage":100}],"style":"formal","pattern":"solid","season":["spring","autumn"],"gender":"male"},{"category":"bottom","specificType":"black trousers","confidence":0.9,"colors":[{"color":"black","percentage":100}],"style":"formal","pattern":"solid","season":["spring","autumn"],"gender":"male"}]}',
  "",
  "Detection rules:",
  "- List every clearly visible garment as a separate entry in the garments array.",
  "- If a shirt and pants are visible, return two objects in the array.",
  "- If a jacket is worn over a shirt, return both.",
  "- If a dress is present, return it alone unless other items are visible.",
  "- Ignore mannequins, furniture, and background objects.",
  "",
  `category must be one of: ${categoryOptions.join(", ")}.`,
  'specificType should be exact (e.g., "blue and white striped button-down shirt").',
  "confidence must be a number 0–1.",
  "colors must be an array of up to 5 dominant colors with percentages summing to ~100.",
  `style must be one of: ${styleOptions.join(", ")}.`,
  `pattern must be one of: ${patternOptions.join(", ")}.`,
  `season must be an array with one or more of: ${seasonOptions.join(", ")}.`,
  `gender must be one of: ${genderOptions.join(", ")}.`,
  "",
  "CRITICAL: Return ONLY a single JSON object. No markdown formatting. No backticks. No explanations.",
].join("\n");

async function classifyImage(imageDataUrl, options = {}) {
  const HF_TOKEN = options.HF_TOKEN ?? CONFIG.HF_TOKEN;
  const MODEL_URL = options.MODEL_URL ?? CONFIG.MODEL_URL;
  const MODEL_ID = options.MODEL_ID ?? CONFIG.MODEL_ID;

  if (!HF_TOKEN) {
    throw new Error(
      "Hugging Face API key is required. " +
      "Add your key in Settings to use garment analysis."
    );
  }

  const base64 = imageDataUrl.split(",")[1];

  const res = await fetch(MODEL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL_ID,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } },
            { type: "text", text: "Analyze this garment photo. Respond only with valid JSON." },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`API ${res.status} — ${errText || res.statusText}`);
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content || "";
  return parseGarments(raw);
}

module.exports = { classifyImage, categoryOptions, styleOptions, patternOptions, seasonOptions, genderOptions };
