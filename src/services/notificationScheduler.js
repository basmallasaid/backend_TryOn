const Notification = require("../models/Notification");
const User = require("../models/User");
const UserToken = require("../models/UserToken");
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

        // Send push notification
        const tokens = await UserToken.find({ userId: user._id });
        const pushTokens = tokens.map(t => t.expoPushToken).filter(t => Expo.isExpoPushToken(t));

        if (pushTokens.length > 0) {
          const messages = pushTokens.map(token => ({
            to: token,
            sound: "default",
            title: notif.title,
            body: notif.body,
            channelId: "default",
            priority: "high",
          }));
          const chunks = expo.chunkPushNotifications(messages);
          for (const chunk of chunks) {
            await expo.sendPushNotificationsAsync(chunk);
          }
        }

        // Send email
        if (user.email) {
          try {
            await sendEmail({
              email: user.email,
              subject: notif.title,
              message: notif.body,
            });
          } catch (e) {
            console.error(`[Scheduler] Email failed for ${user.email}:`, e.message);
          }
        }

        // Mark as sent — backdate createdAt to scheduledAt so it appears at the top with the correct date
        notif.status = "sent";
        notif.createdAt = notif.scheduledAt;
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
