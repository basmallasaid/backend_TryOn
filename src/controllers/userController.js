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

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    user.gender = gender || user.gender;

    // If user entered all fields
    if (user.firstName && user.lastName && user.dateOfBirth && user.gender) {
      user.profileCompleted = true;
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
  res.status(200).json({
    language: req.user.language,
    notificationsEnabled: req.user.notificationsEnabled,
  });
};

const updateLanguage = async (req, res) => {
  const { language } = req.body;

  const user = req.user;

  user.language = language;

  await user.save();

  res.status(200).json({
    message: "Language updated",
    language,
  });
};

const updateNotifications = async (req, res) => {
  const { enabled } = req.body;

  req.user.notificationsEnabled = enabled;

  await req.user.save();

  res.status(200).json({
    message: "Notification settings updated",
  });
};

const deleteAccount = async (req, res) => {
  await req.user.deleteOne();

  res.status(200).json({
    message: "Account deleted successfully",
  });
};

module.exports = {
  updateProfile,
  getSettings,
  updateLanguage,
  updateNotifications,
  deleteAccount,
};
