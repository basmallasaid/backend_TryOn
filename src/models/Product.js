const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      enum: ["top", "bottom", "dress", "acc"],
      required: true,
    },
    color_tags: {
      type: [String],
      default: [],
    },
    season_tags: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
    },
    purchase_url: {
      type: String,
      required: true,
    },
    try_on_enabled: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

module.exports = mongoose.model("Product", productSchema);
