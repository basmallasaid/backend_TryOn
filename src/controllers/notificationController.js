const User = require("../models/User");
const UserToken = require("../models/UserToken");
const Notification = require("../models/Notification");
const { sendNotification } = require("../services/notificationService");


// ─── In-App Notification CRUD ────────────────────────────────────────────────

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );
    res.status(200).json({ message: "All marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res.status(200).json({ message: "All notifications cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper: create an in-app notification for a user
exports.createInAppNotification = async (userId, title, body, type = "general") => {
  try {
    return await Notification.create({ userId, title, body, type });
  } catch (error) {
    console.error("Failed to create in-app notification:", error.message);
  }
};


exports.registerToken = async (req, res) => {
  try {
    const { token, deviceType } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });

    const existing = await UserToken.findOne({ expoPushToken: token });
    if (existing) {
      if (existing.userId && existing.userId.toString() !== req.user._id.toString()) {
        existing.userId = req.user._id;
        await existing.save();
      } else if (!existing.userId) {
        existing.userId = req.user._id;
        await existing.save();
      }
    } else {
      await UserToken.create({ expoPushToken: token, userId: req.user._id, deviceType });
    }
    res.status(200).json({ message: "Token registered" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendNotificationsByEmail = async (req, res) => {
  try {
    const { email, title, body } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.expoPushToken) return res.status(400).json({ message: "No push token registered for this user" });

    if (user.settings?.notifications_enabled === false) {
      return res.status(400).json({ message: "Notifications are disabled for this user" });
    }

    await sendNotification(
      [{ expoPushToken: user.expoPushToken }],
      title || "Notification",
      body || "You have a new notification."
    );

    await exports.createInAppNotification(user._id, title || "Notification", body || "You have a new notification.");

    res.status(200).json({ message: "Notification sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendToAll = async (req, res) => {
  try {
    const { message } = req.body;

    const users = await User.find({
      expoPushToken: { $ne: null, $exists: true },
      "settings.notifications_enabled": { $ne: false },
    });

    const tokens = users.map((u) => ({ expoPushToken: u.expoPushToken }));
    await sendNotification(tokens, "TryOn Update", message || "Check out the latest features in TryOn!");
    res.json({ message: "Sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// إرسال إشعار بنتيجة الذكاء الاصطناعي (عند الربط مستقبلاً)
exports.sendTryOnReady = async (req, res) => {
    try {
        const { token } = req.body;
        await sendNotification(
            [{ expoPushToken: token }],
            "Style Ready! ✨",
            "Your virtual try-on result is ready to view."
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.sendToUser = async (req, res) => {
  try {
    const { email, title, message, data } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.settings?.notifications_enabled === false) {
      return res.status(400).json({ message: "Notifications are disabled for this user" });
    }

    const tokens = await UserToken.find({ userId: user._id });
    if (!tokens.length) {
      return res.status(400).json({ message: "No registered devices found for this user" });
    }

    await sendNotification(
      tokens.map(t => ({ expoPushToken: t.expoPushToken })),
      title || "Notification",
      message || "You have a new notification.",
      data || {}
    );

    await exports.createInAppNotification(user._id, title || "Notification", message || "You have a new notification.", data?.type || "general");

    res.status(200).json({ message: "Notification sent successfully", deviceCount: tokens.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.broadcast = async (req, res) => {
  try {
    const { title, message, data } = req.body;

    const users = await User.find({
      "settings.notifications_enabled": { $ne: false },
    }).select("_id");

    const userIds = users.map(u => u._id);
    const tokens = await UserToken.find({ userId: { $in: userIds } });

    if (!tokens.length) {
      return res.status(400).json({ message: "No registered devices found" });
    }

    await sendNotification(
      tokens.map(t => ({ expoPushToken: t.expoPushToken })),
      title || "TryOn Update",
      message || "Check out the latest features in TryOn!",
      data || {}
    );

    // Create in-app notifications for all users
    const notifTitle = title || "TryOn Update";
    const notifBody = message || "Check out the latest features in TryOn!";
    const notifType = data?.type || "general";
    const inAppNotifs = userIds.map(userId => ({
      userId,
      title: notifTitle,
      body: notifBody,
      type: notifType,
    }));
    await Notification.insertMany(inAppNotifs);

    res.status(200).json({ message: "Broadcast sent successfully", deviceCount: tokens.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};