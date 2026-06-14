const mongoose = require('mongoose');

const automatedNotificationSchema = new mongoose.Schema({
  operation: {
    type: String,
    required: true,
    unique: true,
    enum: ['tryon', 'recycle', 'matching'],
  },
  enabled: { type: Boolean, default: true },
  titleTemplate: {
    type: String,
    required: true,
    default: 'Update from {operation}',
  },
  bodyTemplate: {
    type: String,
    required: true,
    default: 'Your {operation} request has been completed.',
  },
  channels: {
    type: Map,
    of: Boolean,
    default: { app: true, email: true, push: true },
  },
});

module.exports = mongoose.model('AutomatedNotification', automatedNotificationSchema);