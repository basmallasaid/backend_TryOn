const WardrobeItem = require("../models/WardrobeItem");
const { getItemColors } = require("./normalizer");

function buildWardrobeItem(garment, image) {
  return {
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

const getUserWardrobe = async (userId) => {
  return await WardrobeItem.find({ user_id: userId }).sort({ created_at: -1 });
};

function garmentFingerprint(userId, garment) {
  const dominant = getItemColors(garment)[0]?.color || "unknown";
  return `${userId}|${garment.category}|${String(garment.specificType).toLowerCase().trim()}|${dominant}`;
}

const addFromAnalysis = async (userId, analysis, garmentIndex) => {
  const query = { user_id: userId, analysis_id: analysis._id };
  if (garmentIndex !== undefined) {
    query.garment_index = garmentIndex;
  }

  const existing = await WardrobeItem.findOne(query);
  if (existing) {
    throw Object.assign(new Error("Already added to wardrobe"), { status: 409 });
  }

  const garments = garmentIndex !== undefined
    ? [analysis.garments[garmentIndex]]
    : analysis.garments;

  const docs = garments.map((g, i) => ({
    user_id: userId,
    garment_index: garmentIndex !== undefined ? garmentIndex : i,
    ...buildWardrobeItem(g, null),
    analysis_id: analysis._id,
    source: "analysis",
  }));

  return await WardrobeItem.insertMany(docs);
};

const deleteItem = async (userId, itemId) => {
  return await WardrobeItem.findOneAndDelete({ _id: itemId, user_id: userId });
};

const clearUserWardrobe = async (userId) => {
  return await WardrobeItem.deleteMany({ user_id: userId });
};

module.exports = {
  getUserWardrobe,
  addFromAnalysis,
  deleteItem,
  clearUserWardrobe,
};
