const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  expoPushToken: { type: String, required: true },
  deviceType: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("UserToken", tokenSchema);