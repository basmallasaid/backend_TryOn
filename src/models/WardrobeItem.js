const mongoose = require("mongoose");

const colorSchema = new mongoose.Schema({
  color: { type: String, default: "unknown" },
  percentage: { type: Number, default: 100 },
}, { _id: false });

const wardrobeItemSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  name: { type: String },
  type: { type: String },
  category: {
    type: String,
    enum: ["top", "bottom", "outerwear", "dress", "footwear", "accessory"],
    required: true,
  },
  colors: { type: [colorSchema], default: [] },
  color: { type: String, default: "unknown" },
  style: { type: String, default: "casual" },
  pattern: { type: String, default: "solid" },
  season: { type: [String], default: ["spring", "summer"] },
  gender: { type: String, default: "unisex" },
  confidence: { type: Number, default: 1, min: 0, max: 1 },
  image: { type: String, default: null },
  fingerprint: { type: String, default: null, index: true },
  garment_index: { type: Number, default: null },
  analysis_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Analysis",
    default: null,
  },
  source: {
    type: String,
    enum: ["analysis", "manual"],
    default: "manual",
  },
}, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});

module.exports = mongoose.model("WardrobeItem", wardrobeItemSchema);
