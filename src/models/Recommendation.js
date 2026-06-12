const mongoose = require("mongoose");

const outfitSchema = new mongoose.Schema({
  score: Number,
  breakdown: mongoose.Schema.Types.Mixed,
  items: [mongoose.Schema.Types.Mixed],
}, { _id: false });

const recommendationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  outfits: { type: [outfitSchema], default: [] },
  weather: { type: mongoose.Schema.Types.Mixed, default: null },
  top_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WardrobeItem",
    default: null,
  },
  bottom_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WardrobeItem",
    default: null,
  },
  composite_image: { type: String, default: null },
  score: { type: Number, default: null },
}, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});

recommendationSchema.index({ user_id: 1, top_id: 1, bottom_id: 1 });

module.exports = mongoose.model("Recommendation", recommendationSchema);
