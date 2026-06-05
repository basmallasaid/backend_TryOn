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

    res.status(200).json({
      language: user.settings?.language || "en",
      notifications_enabled:
        user.settings?.notifications_enabled !== undefined
          ? user.settings.notifications_enabled
          : true,
      has_mobile_app: user.settings?.has_mobile_app || false,
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

module.exports = {
  updateProfile,
  getSettings,
  updateLanguage,
  updateNotifications,
  deleteAccount,
};
