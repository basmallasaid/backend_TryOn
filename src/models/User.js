const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },

    password_hash: String,

    auth_provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    google_id: String,

    userImage: {
      type: String,
      default: "null",
    },

    expoPushToken: {
      type: String,
      default: "null",
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    profile: {
      first_name: {
        type: String,
        default: null,
      },
      last_name: {
        type: String,
        default: null,
      },
      date_of_birth: {
        type: Date,
        default: null,
      },
      gender: {
        type: String,
        default: null,
      },
    },

    profile_completed: {
      type: Boolean,
      default: false,
    },

    settings: {
      language: {
        type: String,
        default: "en",
      },
      notifications_enabled: {
        type: Boolean,
        default: true,
      },
      has_mobile_app: {
        type: Boolean,
        default: false,
      },
    },

    is_verified: {
      type: Boolean,
      default: false,
    },

    verification_token: String,

    verification_token_expires: Date,

    reset_token: String,

    reset_token_expires: Date,

    is_otp_verified: {
      type: Boolean,
      default: false,
    },

    avatars: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Avatar" }],
      default: [],
    },

    stripeCustomerId: {
      type: String,
      default: null,
    },

    subscriptionId: {
      type: String,
      default: null,
    },

    subscriptionStatus: {
      type: String,
      enum: ["active", "canceled", "past_due", "incomplete", null],
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

module.exports = mongoose.model("User", userSchema);
