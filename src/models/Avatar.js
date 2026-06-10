const mongoose = require("mongoose");

const avatarSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    age: {
      type: String,
      required: true,
    },
    height: {
      type: String,
      required: true,
    },
    weight: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    skin_tone: {
      type: String,
      enum: ["very-light", "light", "medium", "tan", "brown", "dark"],
      required: true,
    },
    face_shape: {
      type: String,
      enum: ["oval", "round", "square", "heart shaped", "sharp jawline"],
      required: true,
    },
    hair_color: {
      type: String,
      enum: ["black", "dark-brown", "brown", "light-brown", "blonde", "red"],
      required: true,
    },
    eye_color: {
      type: String,
      enum: ["brown eyes", "black eyes", "hazel eyes", "green eyes", "blue eyes"],
      required: true,
    },
    beard_style: {
      type: String,
      enum: ["clean shave", "stubble beard", "trimmed beard", "full beard", "goatee"],
      required: true,
    },
    facial_expression: {
      type: String,
      enum: ["smiling", "serious", "neutral", "confident", "thoughtful", "angry", "happy"],
      required: true,
    },
    image_url: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

module.exports = mongoose.model("Avatar", avatarSchema);
