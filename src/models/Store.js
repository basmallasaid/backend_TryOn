const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  logo_url: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  website_url: {
    type: String,
    required: true,
  },
  discount_code: {
    type: String,
    default: null,
  },
  discount_percent: {
    type: Number,
    default: null,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Store", storeSchema);
