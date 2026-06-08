const MYMEMORY_ENDPOINT = "https://api.mymemory.translated.net/get";
const MAX_CHUNK_CHARS = 500;
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Split text into chunks of at most MAX_CHUNK_CHARS, breaking at sentence boundaries.
 */
function splitIntoChunks(text) {
  if (text.length <= MAX_CHUNK_CHARS) return [text];

  const chunks = [];
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > MAX_CHUNK_CHARS) {
      if (current.trim()) chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [text.slice(0, MAX_CHUNK_CHARS)];
}

/**
 * Translate a single chunk (≤500 chars) to Arabic via MyMemory.
 */
async function translateChunk(chunk) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const params = new URLSearchParams({
      q: chunk,
      langpair: "en|ar",
    });

    const res = await fetch(`${MYMEMORY_ENDPOINT}?${params}`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[Translation] Chunk failed (${res.status})`);
      return chunk;
    }

    const data = await res.json();
    if (data?.responseStatus === 200 && data?.responseData?.translatedText) {
      return data.responseData.translatedText;
    }

    return chunk;
  } catch (err) {
    clearTimeout(timeout);
    console.error("[Translation] Chunk call failed:", err.message);
    return chunk;
  }
}

/**
 * Translate a single English text string to Arabic using MyMemory.
 */
async function translateToArabic(text) {
  if (!text || typeof text !== "string" || !text.trim()) return text;

  const chunks = splitIntoChunks(text);
  const translatedChunks = [];

  for (const chunk of chunks) {
    translatedChunks.push(await translateChunk(chunk));
  }

  return translatedChunks.join(" ");
}

/**
 * Translate all text fields in an upcycle result object.
 */
async function translateUpcycleResult(result) {
  const textsToTranslate = [result.garment_analysis];
  for (const idea of result.upcycling_ideas) {
    textsToTranslate.push(idea.title);
    textsToTranslate.push(idea.design_description);
  }

  console.log(`[Translation] Translating ${textsToTranslate.length} text fields to Arabic...`);

  const translations = [];
  for (const t of textsToTranslate) {
    translations.push(await translateToArabic(t));
  }

  let idx = 0;
  const garment_analysis_ar = translations[idx++];
  const ideas_with_ar = result.upcycling_ideas.map((idea) => ({
    ...idea,
    title_ar: translations[idx++],
    design_description_ar: translations[idx++],
  }));

  console.log("[Translation] Done");
  return {
    ...result,
    garment_analysis_ar,
    upcycling_ideas: ideas_with_ar,
  };
}

module.exports = { translateToArabic, translateUpcycleResult };