const mongoose = require("mongoose");

const matchItemSchema = new mongoose.Schema({
  item: mongoose.Schema.Types.Mixed,
  score: Number,
  reason: mongoose.Schema.Types.Mixed,
  raw: mongoose.Schema.Types.Mixed,
  explanation: String,
}, { _id: false });

const matchHistorySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  source_garment: { type: mongoose.Schema.Types.Mixed, required: true },
  matches: { type: [matchItemSchema], default: [] },
  weather: { type: mongoose.Schema.Types.Mixed, default: null },
}, {
  timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
});

module.exports = mongoose.model("MatchHistory", matchHistorySchema);
