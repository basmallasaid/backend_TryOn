const mongoose = require("mongoose");

const emailSchema = new mongoose.Schema(
  {
    senderUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    receiverUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    senderEmail: {
      type: String,
      required: true,
    },
    receiverEmail: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "failed"],
      default: "sent",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    emailType: {
      type: String,
      enum: ["ADMIN_TO_USER", "ADMIN_TO_ALL", "USER_TO_ADMIN"],
      required: true,
    },
    parentEmailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Email",
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

emailSchema.index({ senderEmail: 1 });
emailSchema.index({ receiverEmail: 1 });
emailSchema.index({ emailType: 1 });
emailSchema.index({ isRead: 1 });
emailSchema.index({ senderUserId: 1 });
emailSchema.index({ receiverUserId: 1 });
emailSchema.index({ parentEmailId: 1 });
emailSchema.index({ created_at: -1 });

module.exports = mongoose.model("Email", emailSchema);
