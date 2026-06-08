const mongoose = require("mongoose");

const ideaSchema = new mongoose.Schema({
  id: Number,
  title: String,
  title_ar: { type: String, default: null },
  design_description: String,
  design_description_ar: { type: String, default: null },
  image_prompt: String,
  generated_image_url: { type: String, default: null },
  generation_status: {
    type: String,
    enum: ["pending", "generating", "done", "failed"],
    default: "pending",
  },
  generation_error: { type: String, default: null },
  generated_at: { type: Date, default: null },
}, { _id: false });

const recycleSessionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  input_images: [{
    url: String,
    original_name: String,
    mime_type: String,
    size_bytes: Number,
  }],
  image_count: Number,
  mode: String,
  garment_analysis: String,
  garment_analysis_ar: { type: String, default: null },
  ideas: [ideaSchema],
  status: {
    type: String,
    enum: ["uploaded", "analyzed", "partial", "completed"],
    default: "analyzed",
  },
  model_used: String,
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });

recycleSessionSchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model("RecycleSession", recycleSessionSchema);
