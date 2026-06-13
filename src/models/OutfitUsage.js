const mongoose = require("mongoose");

const outfitUsageSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  top_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WardrobeItem",
    required: true,
  },
  bottom_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "WardrobeItem",
    required: true,
  },
  usage_count: {
    type: Number,
    default: 1,
    min: 0,
  },
  last_used_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});

outfitUsageSchema.index({ user_id: 1, top_id: 1, bottom_id: 1 }, { unique: true });
outfitUsageSchema.index({ user_id: 1, last_used_at: 1 });
outfitUsageSchema.index({ user_id: 1, usage_count: 1 });

module.exports = mongoose.model("OutfitUsage", outfitUsageSchema);
