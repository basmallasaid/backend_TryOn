const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: String,

    googleId: String,

    // Profile Information
    firstName: {
      type: String,
      default: "",
    },

    lastName: {
      type: String,
      default: "",
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: ["Male", "Female"],
      default: null,
    },

    // Helps frontend know whether user completed profile
    profileCompleted: {
      type: Boolean,
      default: false,
    },

    // Reset Password
    resetOtp: String,

    resetOtpExpire: Date,

    isOtpVerified: {
      type: Boolean,
      default: false,
    },

    // Settings
    language: {
      type: String,
      default: "en",
    },

    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
