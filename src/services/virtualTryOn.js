const { CONFIG } = require('../config/api.js');

const KIE_API_BASE = CONFIG.KIE_API_BASE;
const KIE_UPLOAD_BASE = CONFIG.KIE_UPLOAD_BASE;

function requireKey(key, label) {
  if (!key) {
    throw new Error(
      `${label} is required. Add your key in Settings to use virtual try-on.`,
    );
  }
}

const DEFAULT_TRYON_PROMPT = [
  'Use the first image as the person reference and the second image as the garment reference.',
  '',
  'Dress the person from the first image in the garment from the second image.',
].join('\n');

const OUTFIT_TRYON_PROMPT = [
  'Use the first image as the person reference, the second image as the top garment,',
  'and the third image as the bottom garment.',
  '',
  'Dress the person in the top and bottom garments shown in the second and third images.',
].join('\n');

function getApiKey(options = {}) {
  requireKey(options.apiKey, 'Kie AI API key');
  return options.apiKey;
}

async function uploadImage(imageDataUrl, options = {}) {
  const apiKey = getApiKey(options);

  const res = await fetch(`${KIE_UPLOAD_BASE}/api/file-base64-upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base64Data: imageDataUrl,
      uploadPath: 'virtual-tryon',
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(
      `Upload failed (${res.status}): ${errText || res.statusText}`,
    );
  }

  const data = await res.json();

  if (data.code !== 200 || !data.data?.downloadUrl) {
    throw new Error(`Upload failed: ${data.msg || 'Unknown error'}`);
  }

  return data.data.downloadUrl;
}

async function createTask(
  personImageUrl,
  garmentImageUrls,
  prompt,
  options = {},
) {
  const apiKey = getApiKey(options);
  const imageInput = Array.isArray(garmentImageUrls)
    ? [personImageUrl, ...garmentImageUrls]
    : [personImageUrl, garmentImageUrls];

  const res = await fetch(`${KIE_API_BASE}/api/v1/jobs/createTask`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'nano-banana-2',
      input: {
        prompt,
        image_input: imageInput,
        aspect_ratio: 'auto',
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`API ${res.status} — ${errText || res.statusText}`);
  }

  const data = await res.json();

  if (data.code !== 200 || !data.data?.taskId) {
    throw new Error(`Task creation failed: ${data.msg || 'Unknown error'}`);
  }

  return data.data.taskId;
}

async function pollTask(taskId, options = {}) {
  const apiKey = getApiKey(options);
  const maxAttempts = options.maxRetries ?? 60;
  const interval = options.pollInterval ?? 3000;
  let attempt = 0;

  while (attempt < maxAttempts) {
    const res = await fetch(
      `${KIE_API_BASE}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(
        `Status check failed (${res.status}): ${errText || res.statusText}`,
      );
    }

    const data = await res.json();

    if (data.code !== 200) {
      throw new Error(`Status check failed: ${data.msg || 'Unknown error'}`);
    }

    const state = data.data.state;

    if (state === 'success') {
      const resultJson = JSON.parse(data.data.resultJson || '{}');
      const resultUrls = resultJson.resultUrls || [];

      if (!resultUrls.length) {
        throw new Error('Generation completed but no result URL was returned');
      }

      return {
        imageUrl: resultUrls[0],
        metadata: {
          taskId,
          costTime: data.data.costTime,
          model: data.data.model,
          creditsConsumed: data.data.creditsConsumed,
        },
      };
    }

    if (state === 'fail') {
      throw new Error(
        `Generation failed: ${data.data.failMsg || 'Unknown error'}`,
      );
    }

    await new Promise(resolve => setTimeout(resolve, interval));
    attempt++;
  }

  const seconds = Math.round((maxAttempts * interval) / 1000);
  throw new Error(
    `Generation timed out after ${seconds} seconds. Please try again.`,
  );
}

async function generateVirtualTryOn({
  personImage,
  garmentImage,
  prompt = DEFAULT_TRYON_PROMPT,
  onProgress,
  ...options
}) {
  onProgress?.('Uploading person image…');
  const personImageUrl = await uploadImage(personImage, options);

  onProgress?.('Uploading garment image…');
  const garmentImageUrl = await uploadImage(garmentImage, options);

  onProgress?.('Starting generation…');
  const taskId = await createTask(
    personImageUrl,
    garmentImageUrl,
    prompt,
    options,
  );

  onProgress?.('Generating virtual try-on…');
  const result = await pollTask(taskId, options);

  return result;
}

async function generateOutfitTryOn({
  personImage,
  topImage,
  bottomImage,
  prompt = OUTFIT_TRYON_PROMPT,
  onProgress,
  ...options
}) {
  onProgress?.('Uploading person image…');
  const personImageUrl = await uploadImage(personImage, options);

  onProgress?.('Uploading top garment image…');
  const topImageUrl = await uploadImage(topImage, options);

  onProgress?.('Uploading bottom garment image…');
  const bottomImageUrl = await uploadImage(bottomImage, options);

  onProgress?.('Starting generation…');
  const taskId = await createTask(
    personImageUrl,
    [topImageUrl, bottomImageUrl],
    prompt,
    options,
  );

  onProgress?.('Generating virtual try-on…');
  const result = await pollTask(taskId, options);

  return result;
}

module.exports = {
  generateVirtualTryOn,
  generateOutfitTryOn,
  DEFAULT_TRYON_PROMPT,
  OUTFIT_TRYON_PROMPT,
  uploadImage,
  createTask,
  pollTask,
};
