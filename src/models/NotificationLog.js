const mongoose = require("mongoose");

const notificationLogSchema = new mongoose.Schema({
  title: String,
  body: String,
  deviceCount: Number,
  sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("NotificationLog", notificationLogSchema);