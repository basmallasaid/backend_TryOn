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
      enum: ["child", "teenager", "young adult", "adult", "old man", "old woman"],
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    skin_tone: {
      type: String,
      enum: ["pale", "fair", "olive", "tan", "brown", "dark"],
      required: true,
    },
    face_shape: {
      type: String,
      enum: ["oval", "round", "square", "heart shaped", "sharp jawline"],
      required: true,
    },
    hair_style: {
      type: String,
      enum: [
        "short hair",
        "curly hair",
        "messy hair",
        "fade haircut",
        "buzz cut",
        "long hair",
        "wavy hair",
      ],
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
