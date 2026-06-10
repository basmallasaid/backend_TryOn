const User = require("../models/User");

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, gender } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!user.profile) {
      user.profile = {};
    }

    user.profile.first_name = firstName || user.profile.first_name;
    user.profile.last_name = lastName || user.profile.last_name;
    user.profile.date_of_birth = dateOfBirth || user.profile.date_of_birth;
    user.profile.gender = gender || user.profile.gender;

    // If user entered all fields
    if (
      user.profile.first_name &&
      user.profile.last_name &&
      user.profile.date_of_birth &&
      user.profile.gender
    ) {
      user.profile_completed = true;
    }

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getSettings = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (req.user.email !== email) {
      return res.status(403).json({ message: "Email does not match authenticated user" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fake auto-renewal — if subscription is active but end date passed, renew
    if (
      user.subscriptionStatus === "active" &&
      user.subscriptionEndDate &&
      new Date() > user.subscriptionEndDate
    ) {
      const now = new Date();
      user.subscriptionEndDate = new Date(now.setMonth(now.getMonth() + 1));
      await user.save();
    }

    res.status(200).json({
      language: user.settings?.language || "en",
      notifications_enabled:
        user.settings?.notifications_enabled !== undefined
          ? user.settings.notifications_enabled
          : true,
      has_mobile_app: user.settings?.has_mobile_app || false,
      subscriptionId: user.subscriptionId || null,
      subscriptionStatus: user.subscriptionStatus || null,
      subscriptionEndDate: user.subscriptionEndDate || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    const user = req.user;

    if (!user.settings) {
      user.settings = {};
    }

    user.settings.language = language;
    await user.save();

    res.status(200).json({
      message: "Language updated",
      language,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateNotifications = async (req, res) => {
  try {
    const { enabled } = req.body;
    const user = req.user;

    if (!user.settings) {
      user.settings = {};
    }

    user.settings.notifications_enabled = enabled;
    await user.save();

    res.status(200).json({
      message: "Notification settings updated",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only view your own profile" });
    }

    const user = await User.findById(req.params.id).select("-password_hash -verification_token -verification_token_expires -reset_token -reset_token_expires");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    if (req.user.email !== email) {
      return res.status(403).json({
        message: "You are not authorized to delete this account",
      });
    }

    await req.user.deleteOne();

    res.status(200).json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const addToLatestTryOn = async (req, res) => {
  try {
    const { imageUrl, taskId, model } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: "imageUrl is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.latestTryOn.push({ imageUrl, taskId, model });
    await user.save();

    res.status(201).json({
      message: "Added to latest try-on",
      latestTryOn: user.latestTryOn,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeFromLatestTryOn = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const item = user.latestTryOn.id(id);
    if (!item) {
      return res.status(404).json({ message: "Try-on record not found" });
    }

    item.deleteOne();
    await user.save();

    res.status(200).json({
      message: "Removed from latest try-on",
      latestTryOn: user.latestTryOn,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLatestTryOn = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ latestTryOn: user.latestTryOn });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  updateProfile,
  getSettings,
  updateLanguage,
  updateNotifications,
  getUserById,
  deleteAccount,
  addToLatestTryOn,
  removeFromLatestTryOn,
  getLatestTryOn,
};
