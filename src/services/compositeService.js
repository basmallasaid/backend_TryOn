const sharp = require('sharp');
const { uploadImage, createGarmentTask, pollTask } = require('./virtualTryOn');

const COMPOSITE_PROMPT = [
  'Automatically remove the background from both garment images if a background exists.',
  'Preserve the original garment colors, textures, patterns, logos, and details.',
  'Position the top garment above the bottom garment in a realistic outfit layout.',
  'Ensure proper alignment between both garments.',
  'Keep only a very small natural gap between the top and bottom pieces.',
  'Scale garments proportionally to create a balanced outfit composition.',
  'Do not overlap garments unnaturally.',
  'Do not crop any important garment details.',
  'Center the final outfit in the image.',
  'Use a pure white (#FFFFFF) background for the final output.',
  'Output should look like a professional fashion catalog product image.',
  'Maintain high resolution and sharp edges.',
  'Remove shadows, noise, unwanted artifacts, and background remnants.',
  'Ensure the final outfit appears symmetrical and visually appealing.',
  'If one garment image is larger than the other, automatically resize while preserving aspect ratio.',
  'Keep consistent spacing and margins around the outfit.',
  'Do not generate a human model, mannequin, hanger, or body parts.',
  'Display garments only.',
  'Return a single merged image containing both garments.',
  '',
  'Combine the provided TOP garment image and BOTTOM garment image into a single outfit image.',
  '- Remove background from both garments.',
  '- Preserve exact garment appearance.',
  '- Place TOP centered above BOTTOM.',
  '- Keep a minimal realistic spacing (2-5% of image height) between garments.',
  '- Align garments vertically.',
  '- Automatically adjust scale for visual balance.',
  '- White background only.',
  '- No mannequin.',
  '- No model.',
  '- No hanger.',
  '- No extra objects.',
  '- No shadows.',
  '- No text.',
  '- No watermark.',
  '- No cropping.',
  '- High-resolution fashion catalog style.',
  '- Clean edges and professional product photography appearance.',
  '',
  'Return a single PNG image containing the complete outfit.',
  '- Do not use original image dimensions as the sizing reference.',
  '-Use garment segmentation and visible garment boundaries to determine actual garment size before scaling.',
  '-The final composition should be based on garment proportions, not source image resolution.'
].join('\n');

async function toBuffer(source) {
  if (Buffer.isBuffer(source)) return source;
  if (typeof source !== 'string') throw new Error('Invalid image source');

  if (source.startsWith('data:')) {
    const idx = source.indexOf('base64,');
    if (idx === -1) throw new Error('Invalid data URL');
    return Buffer.from(source.slice(idx + 7), 'base64');
  }

  const res = await fetch(source);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function generateWithAI(topImageSource, bottomImageSource, apiKey) {
  console.log('[AI Composite] Uploading garment images...');
  const options = { apiKey, maxRetries: 20, pollInterval: 3000 };

  const [topUrl, bottomUrl] = await Promise.all([
    uploadImage(topImageSource, options),
    uploadImage(bottomImageSource, options),
  ]);

  console.log('[AI Composite] Creating garment-only task...');
  const taskId = await createGarmentTask(
    [topUrl, bottomUrl],
    COMPOSITE_PROMPT,
    options,
  );

  console.log('[AI Composite] Polling for result...');
  const result = await pollTask(taskId, options);

  console.log('[AI Composite] Result URL:', result.imageUrl);
  return result.imageUrl;
}

async function generateWithSharp(topImageSource, bottomImageSource, apiKey) {
  console.log('[Sharp Composite] Generating composite image...');

  const [topBuf, bottomBuf] = await Promise.all([
    toBuffer(topImageSource),
    toBuffer(bottomImageSource),
  ]);
  console.log(`[Sharp Composite] Top: ${topBuf.length}B, Bottom: ${bottomBuf.length}B`);

  const maxWidth = 800;

  const [topResized, bottomResized] = await Promise.all([
    sharp(topBuf).resize({ width: maxWidth, withoutEnlargement: true }).png().toBuffer(),
    sharp(bottomBuf).resize({ width: maxWidth, withoutEnlargement: true }).png().toBuffer(),
  ]);

  const [topMeta, bottomMeta] = await Promise.all([
    sharp(topResized).metadata(),
    sharp(bottomResized).metadata(),
  ]);

  const gap = Math.round(Math.max(topMeta.height, bottomMeta.height) * 0.03);
  const canvasWidth = Math.max(topMeta.width, bottomMeta.width);
  const canvasHeight = topMeta.height + gap + bottomMeta.height;

  const leftTop = Math.round((canvasWidth - topMeta.width) / 2);
  const leftBottom = Math.round((canvasWidth - bottomMeta.width) / 2);

  const buffer = await sharp({
    create: {
      width: Math.max(canvasWidth, 1),
      height: Math.max(canvasHeight, 1),
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: topResized, top: 0, left: leftTop },
      { input: bottomResized, top: topMeta.height + gap, left: leftBottom },
    ])
    .png()
    .toBuffer();

  if (apiKey) {
    const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
    console.log('[Sharp Composite] Uploading to KIE for hosting...');
    return uploadImage(dataUrl, { apiKey });
  }

  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function generateCompositeForOutfit(topImageSource, bottomImageSource) {
  return generateWithSharp(topImageSource, bottomImageSource);
}

async function generateCompositeForOutfitWithUrl(topImageSource, bottomImageSource, apiKey) {
  const key = apiKey || process.env.KIE_API_key;
  if (key) {
    try {
      console.log('[Composite] Attempting AI compositing...');
      const result = await generateWithAI(topImageSource, bottomImageSource, key);
      console.log('[Composite] AI compositing succeeded');
      return result;
    } catch (err) {
      console.warn(`[Composite] AI compositing failed: ${err.message}, falling back to sharp`);
    }
  } else {
    console.log('[Composite] No KIE API key, using sharp fallback');
  }

  return generateWithSharp(topImageSource, bottomImageSource, key);
}

module.exports = { generateCompositeForOutfit, generateCompositeForOutfitWithUrl };
