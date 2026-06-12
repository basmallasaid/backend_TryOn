const sharp = require('sharp');
const { uploadImage, createTask, pollTask } = require('./virtualTryOn');

const COMPOSITE_PROMPT = `Task:
Create a garment-composition AI service that receives exactly two garment images:

1. Top garment image (shirt, t-shirt, hoodie, jacket, etc.)
2. Bottom garment image (pants, jeans, shorts, skirt, etc.)

The AI must generate a single clean outfit image following these requirements:

Requirements:
- Automatically remove the background from both garment images if a background exists.
- Preserve the original garment colors, textures, patterns, logos, and details.
- Position the top garment above the bottom garment in a realistic outfit layout.
- Ensure proper alignment between both garments.
- Keep only a very small natural gap between the top and bottom pieces.
- Scale garments proportionally to create a balanced outfit composition.
- Do not overlap garments unnaturally.
- Do not crop any important garment details.
- Center the final outfit in the image.
- Use a pure white (#FFFFFF) background for the final output.
- Output should look like a professional fashion catalog product image.
- Maintain high resolution and sharp edges.
- Remove shadows, noise, unwanted artifacts, and background remnants.
- Ensure the final outfit appears symmetrical and visually appealing.
- If one garment image is larger than the other, automatically resize while preserving aspect ratio.
- Keep consistent spacing and margins around the outfit.
- Do not generate a human model, mannequin, hanger, or body parts.
- Display garments only.
- Return a single merged image containing both garments.

Output:
- One high-quality PNG image.
- White background.
- Transparent garment edges handled cleanly.
- Professional e-commerce/catalog appearance. Combine the provided TOP garment image and BOTTOM garment image into a single outfit image.

Instructions:
- Remove background from both garments.
- Preserve exact garment appearance.
- Place TOP centered above BOTTOM.
- Keep a minimal realistic spacing (2-5% of image height) between garments.
- Align garments vertically.
- Automatically adjust scale for visual balance.
- White background only.
- No mannequin.
- No model.
- No hanger.
- No extra objects.
- No shadows.
- No text.
- No watermark.
- No cropping.
- High-resolution fashion catalog style.
- Clean edges and professional product photography appearance.

Return a single PNG image containing the complete outfit.`;

async function generateCompositeForOutfit(topDataUrl, bottomDataUrl, apiKey) {
  const options = { apiKey };

  const blankCanvas = await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  }).jpeg().toBuffer();
  const blankBase64 = `data:image/jpeg;base64,${blankCanvas.toString('base64')}`;

  const personImageUrl = await uploadImage(blankBase64, options);
  const topImageUrl = await uploadImage(topDataUrl, options);
  const bottomImageUrl = await uploadImage(bottomDataUrl, options);

  const taskId = await createTask(
    personImageUrl,
    [topImageUrl, bottomImageUrl],
    COMPOSITE_PROMPT,
    options,
  );

  const result = await pollTask(taskId, options);

  return result.imageUrl;
}

module.exports = { generateCompositeForOutfit };
