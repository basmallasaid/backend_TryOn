const { CONFIG } = require("../config/api");
const { translateUpcycleResult } = require("./translationService");

const PRODUCT_SHOT_SUFFIX = "Product shot, standalone garment, flat lay display, NO people, NO models, NO mannequins, clean studio background.";

function bufferToDataUrl(buffer, mimeType) {
  return `data:${mimeType || "image/jpeg"};base64,${buffer.toString("base64")}`;
}

function ensureProductShotSuffix(prompt) {
  const lower = prompt.toLowerCase();
  if (lower.includes("no people") && lower.includes("flat lay")) return prompt;
  return `${prompt.trim().replace(/\.\s*$/, "")}. ${PRODUCT_SHOT_SUFFIX}`;
}

function parseJsonFromGpt(content) {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Failed to parse JSON from GPT response");
  }
}

function buildUpcycleSystemPrompt(imageCount) {
  if (imageCount === 1) {
    return [
      "You are an expert sustainable fashion designer and garment upcycling specialist.",
      "",
      "The user uploaded ONE clothing/garment image. Your job:",
      "1. Analyze the garment in extreme detail: exact material/fabric type (denim, cotton, lace, silk, etc.), exact colors and shades, patterns, prints, hardware (buttons, zippers), seams, silhouette, length, fit, sleeves, neckline, hem, condition, and every visible construction detail.",
      "2. Generate exactly 3 DIFFERENT wearable upcycling design ideas that transform THIS SAME garment using the SAME material and SAME colors. Do not invent new fabrics or colors.",
      "3. Each idea must be a realistic wearable piece (skirt, dress, blouse, vest, top, trousers, bag, jumpsuit, jacket, etc.) — be creative but grounded in the actual fabric available.",
      "4. For each idea, write a detailed design_description explaining the cutting, restructuring, and sewing steps.",
      `5. For each idea, write an image_prompt for an image-to-image AI model. Start with "Image-to-image garment modification:" then describe the transformation concisely. MUST end with: "${PRODUCT_SHOT_SUFFIX}"`,
      "",
      'Return ONLY valid JSON (no markdown) in this exact structure:',
      JSON.stringify({
        mode: "single_garment_redesign",
        garment_analysis: "Detailed analysis of the single garment...",
        upcycling_ideas: [
          {
            id: 1,
            title: "Short descriptive name",
            design_description: "Step-by-step transformation description...",
            image_prompt: `Image-to-image garment modification: ... ${PRODUCT_SHOT_SUFFIX}`,
          },
        ],
      }, null, 2),
      "",
      "Rules:",
      "- Exactly 3 ideas in upcycling_ideas",
      "- Preserve original material type and colors in every idea",
      "- image_prompt must be actionable for image-to-image editing",
    ].join("\n");
  }

  return [
    "You are an expert sustainable fashion designer and garment upcycling specialist.",
    "",
    `The user uploaded ${imageCount} different clothing/garment images. Your job:`,
    "1. Analyze EACH garment separately in extreme detail: exact material/fabric type, exact colors, patterns, hardware, seams, silhouette, length, and all construction details. Identify what each piece contributes (e.g., Piece 1: denim dress, Piece 2: navy lace dress).",
    "2. Generate exactly 3 DIFFERENT creative upcycling design ideas that REMIX and COMBINE materials/elements from ALL uploaded pieces into new wearable garments.",
    "3. Each idea must clearly reference which pieces are used and how their materials are combined (cut, layered, attached, etc.).",
    "4. Each idea must be a realistic wearable piece (skirt, dress, blouse, vest, top, trousers, bag, jumpsuit, etc.).",
    "5. For each idea, write a detailed design_description explaining the cutting, combining, and sewing steps across the pieces.",
    `6. For each idea, write an image_prompt for an image-to-image AI model. Start with "Image-to-image garment modification:" then describe the transformation. MUST end with: "${PRODUCT_SHOT_SUFFIX}"`,
    "",
    "Return ONLY valid JSON (no markdown) in this exact structure:",
    JSON.stringify({
      mode: "multiple_garments_remix",
      garment_analysis: "Detailed analysis of each garment and their materials...",
      upcycling_ideas: [
        {
          id: 1,
          title: "Short descriptive name",
          design_description: "Step-by-step remix description referencing pieces...",
          image_prompt: `Image-to-image garment modification: ... ${PRODUCT_SHOT_SUFFIX}`,
        },
      ],
    }, null, 2),
    "",
    "Rules:",
    "- Exactly 3 ideas in upcycling_ideas",
    "- Each idea must combine elements from multiple uploaded pieces",
    "- image_prompt must be actionable for multi-image image-to-image editing",
  ].join("\n");
}

function normalizeUpcycleResult(parsed, imageCount) {
  const ideas = (parsed.upcycling_ideas || []).slice(0, 3).map((idea, index) => ({
    id: idea.id || index + 1,
    title: idea.title || `Design ${index + 1}`,
    design_description: idea.design_description || "",
    image_prompt: ensureProductShotSuffix(idea.image_prompt || ""),
  }));

  while (ideas.length < 3) {
    ideas.push({
      id: ideas.length + 1,
      title: `Design ${ideas.length + 1}`,
      design_description: "Additional design concept based on the uploaded garment(s).",
      image_prompt: ensureProductShotSuffix("Image-to-image garment modification: Creative upcycled wearable garment from the provided piece(s)."),
    });
  }

  const garmentAnalysis = parsed.garment_analysis || parsed.analysis || "";
  return {
    mode: parsed.mode || (imageCount === 1 ? "single_garment_redesign" : "multiple_garments_remix"),
    garment_analysis: typeof garmentAnalysis === "string" ? garmentAnalysis : JSON.stringify(garmentAnalysis),
    upcycling_ideas: ideas,
  };
}

async function analyzeImages(imageDataUrls, count, apiKey) {
  if (!apiKey) {
    throw new Error("GitHub token is required. Provide it via x-github-token header.");
  }

  const visionContent = [];
  imageDataUrls.forEach((url) => {
    visionContent.push({ type: "image_url", image_url: { url } });
  });

  const userText = count === 1
    ? "Analyze this garment and generate 3 upcycling design ideas using the SAME material and colors. Return the JSON as specified."
    : `Analyze these ${count} garments and generate 3 creative remix upcycling ideas that combine their materials. Return the JSON as specified.`;

  visionContent.push({ type: "text", text: userText });

  const res = await fetch(`${CONFIG.GITHUB_MODELS_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: CONFIG.GITHUB_MODELS_MODEL,
      messages: [
        { role: "system", content: buildUpcycleSystemPrompt(count) },
        { role: "user", content: visionContent },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Analysis failed (${res.status}): ${errText || res.statusText}`);
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content || "";
  const parsed = parseJsonFromGpt(raw);
  return normalizeUpcycleResult(parsed, count);
}

function buildImagePayload(model, prompt, images, size) {
  const content = [];

  (images || []).forEach((image) => {
    content.push({ image });
  });
  content.push({ text: prompt });

  return {
    model,
    input: {
      messages: [{
        role: "user",
        content,
      }],
    },
    parameters: {
      n: 1,
      negative_prompt: " ",
      prompt_extend: true,
      watermark: false,
      size: size || "1024*1024",
    },
  };
}

async function generateRecycleImage(model, prompt, sourceImages, size, apiKey) {
  if (!apiKey) {
    throw new Error("DashScope API key is required. Provide it via x-dashscope-api-key header.");
  }

  const endpoint = CONFIG.DASHSCOPE_ENDPOINT;
  if (!endpoint) {
    throw new Error("DashScope endpoint is not configured.");
  }

  const payload = buildImagePayload(model || "qwen-image-2.0-pro", prompt, sourceImages, size);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`DashScope generation failed (${res.status}): ${errText || res.statusText}`);
  }

  const data = await res.json();

  if (data?.output?.choices?.[0]?.message?.content) {
    const images = data.output.choices[0].message.content
      .filter((item) => item.image)
      .map((item) => item.image);

    if (images.length) return images[0];
  }

  throw new Error(data.message || "No image in DashScope response");
}

module.exports = {
  analyzeImages,
  generateRecycleImage,
  ensureProductShotSuffix,
  bufferToDataUrl,
  translateUpcycleResult,
};
