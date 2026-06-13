const User = require("../models/User");
const UserToken = require("../models/UserToken");
const Notification = require("../models/Notification");
const { sendNotification } = require("../services/notificationService");
const sendEmail = require("../utils/sendEmail");


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

exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('userId', 'email profile')
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ notifications });
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
    const { email, title, message, data, channels = ["app"] } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.settings?.notifications_enabled === false) {
      return res.status(400).json({ message: "Notifications are disabled for this user" });
    }

    const notifTitle = title || "Notification";
    const notifBody = message || "You have a new notification.";
    const results = { app: false, email: false, website: false };

    // App channel — in-app notification
    if (channels.includes("app")) {
      await exports.createInAppNotification(user._id, notifTitle, notifBody, data?.type || "general");
      results.app = true;
    }

    // Email channel
    if (channels.includes("email")) {
      try {
        await sendEmail({
          email: user.email,
          subject: notifTitle,
          message: notifBody,
          html: `<h2>${notifTitle}</h2><p>${notifBody}</p>`,
        });
        results.email = true;
      } catch (err) {
        console.error("Email send failed:", err.message);
      }
    }

    // Website channel — push notification via Expo
    let deviceCount = 0;
    if (channels.includes("website")) {
      const tokens = await UserToken.find({ userId: user._id });
      if (tokens.length) {
        await sendNotification(
          tokens.map(t => ({ expoPushToken: t.expoPushToken })),
          notifTitle, notifBody, data || {}
        );
        deviceCount = tokens.length;
        results.website = true;
      } else if (user.expoPushToken) {
        await sendNotification(
          [{ expoPushToken: user.expoPushToken }],
          notifTitle, notifBody, data || {}
        );
        deviceCount = 1;
        results.website = true;
      }
    }

    res.status(200).json({ message: "Notification sent successfully", deviceCount, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.broadcast = async (req, res) => {
  try {
    const { title, message, data, channels = ["app"] } = req.body;

    const users = await User.find({
      "settings.notifications_enabled": { $ne: false },
    });

    const userIds = users.map(u => u._id);
    const notifTitle = title || "TryOn Update";
    const notifBody = message || "Check out the latest features in TryOn!";
    const notifType = data?.type || "general";
    const results = { app: false, email: false, website: false };

    // App channel — in-app notifications
    if (channels.includes("app")) {
      const inAppNotifs = userIds.map(userId => ({
        userId,
        title: notifTitle,
        body: notifBody,
        type: notifType,
      }));
      await Notification.insertMany(inAppNotifs);
      results.app = true;
    }

    // Email channel
    if (channels.includes("email")) {
      let emailCount = 0;
      for (const user of users) {
        if (!user.email) continue;
        try {
          await sendEmail({
            email: user.email,
            subject: notifTitle,
            message: notifBody,
            html: `<h2>${notifTitle}</h2><p>${notifBody}</p>`,
          });
          emailCount++;
        } catch (err) {
          console.error(`Email failed for ${user.email}:`, err.message);
        }
      }
      results.email = true;
      results.emailCount = emailCount;
    }

    // Website channel — push notifications via Expo
    let deviceCount = 0;
    if (channels.includes("website")) {
      const tokens = await UserToken.find({ userId: { $in: userIds } });
      if (tokens.length) {
        await sendNotification(
          tokens.map(t => ({ expoPushToken: t.expoPushToken })),
          notifTitle, notifBody, data || {}
        );
        deviceCount = tokens.length;
      }
      results.website = true;
    }

    res.status(200).json({ message: "Broadcast sent successfully", deviceCount, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};