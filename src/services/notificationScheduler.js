const Notification = require("../models/Notification");
const User = require("../models/User");
const { Expo } = require("expo-server-sdk");
const sendEmail = require("../utils/sendEmail");

const expo = new Expo();

const processScheduledNotifications = async () => {
  try {
    const now = new Date();
    const pending = await Notification.find({
      status: "pending",
      scheduledAt: { $lte: now },
    }).limit(50);

    for (const notif of pending) {
      try {
        const user = await User.findById(notif.userId);
        if (!user) {
          notif.status = "failed";
          await notif.save();
          continue;
        }

        if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
          await expo.sendPushNotificationsAsync([
            {
              to: user.expoPushToken,
              sound: "default",
              title: notif.title,
              body: notif.body,
            },
          ]);
        }

        notif.status = "sent";
        await notif.save();
      } catch (err) {
        console.error(`[Scheduler] Failed to send notification ${notif._id}:`, err.message);
        notif.status = "failed";
        await notif.save();
      }
    }

    if (pending.length > 0) {
      console.log(`[Scheduler] Processed ${pending.length} scheduled notifications`);
    }
  } catch (err) {
    console.error("[Scheduler] Error:", err.message);
  }
};

const startScheduler = () => {
  console.log("[Scheduler] Notification scheduler started (checks every 30s)");
  setInterval(processScheduledNotifications, 30 * 1000);
};

module.exports = { startScheduler, processScheduledNotifications };