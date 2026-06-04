const { getItemColors } = require("./normalizer.js");

let _store = [];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function buildWardrobeItem(garment, image) {
  return {
    id: generateId(),
    name: garment.specificType,
    type: garment.specificType,
    category: garment.category,
    colors: garment.colors,
    color: getItemColors(garment)[0]?.color || "unknown",
    style: garment.style,
    pattern: garment.pattern,
    season: garment.season,
    gender: garment.gender,
    confidence: garment.confidence,
    image,
  };
}

function loadWardrobe() {
  return [..._store];
}

function saveWardrobe(items) {
  _store = [...items];
}

function removeFromWardrobe(items, id) {
  return items.filter((i) => i.id !== id);
}

module.exports = {
  generateId,
  buildWardrobeItem,
  loadWardrobe,
  saveWardrobe,
  removeFromWardrobe,
};
