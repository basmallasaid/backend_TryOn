const { findMatchesForItem, getTopMatchingColors } = require("./recommendationEngine.js");
const { getItemColors } = require("./normalizer.js");

function toUploadedItem(garment) {
  return {
    id: "__uploaded__",
    name: garment.specificType,
    type: garment.specificType,
    category: garment.category,
    colors: garment.colors,
    color: getItemColors(garment)[0]?.color || "unknown",
    style: garment.style,
    pattern: garment.pattern,
    season: garment.season,
    gender: garment.gender,
  };
}

function filterDuplicates(uploadedItem, wardrobe) {
  return wardrobe.filter(
    (w) =>
      w.type !== uploadedItem.type ||
      w.color !== uploadedItem.color ||
      w.style !== uploadedItem.style ||
      w.pattern !== uploadedItem.pattern
  );
}

function findMatches(clothingData, wardrobe, options = {}) {
  const { limit = 8 } = options;

  if (!clothingData.garments || clothingData.garments.length === 0) {
    return [];
  }

  const uploadedItem = toUploadedItem(clothingData.garments[0]);
  const candidates = filterDuplicates(uploadedItem, wardrobe);

  return findMatchesForItem(uploadedItem, candidates).slice(0, limit);
}

function getMatchingColors(clothingData, limit = 5) {
  if (!clothingData.garments || clothingData.garments.length === 0) return [];
  const dominantColor = clothingData.garments[0].colors[0]?.color;
  if (!dominantColor || dominantColor === "unknown") return [];
  return getTopMatchingColors(dominantColor, limit);
}

module.exports = { findMatches, getMatchingColors };
