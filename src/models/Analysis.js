const mongoose = require("mongoose");

const garmentSnapshotSchema = new mongoose.Schema({
  category: String,
  specificType: String,
  confidence: Number,
  colors: [{ color: String, percentage: Number }],
  style: String,
  pattern: String,
  season: [String],
  gender: String,
}, { _id: false });

const analysisSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  image_hash: { type: String, default: null, index: true },
  garments: { type: [garmentSnapshotSchema], default: [] },
  detectionType: {
    type: String,
    enum: ["single", "multiple", "outfit", "unknown"],
    default: "unknown",
  },
}, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});

module.exports = mongoose.model("Analysis", analysisSchema);
