const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  expoPushToken: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  deviceType: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UserToken", tokenSchema);
