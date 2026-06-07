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
}, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});

module.exports = mongoose.model("Recommendation", recommendationSchema);
