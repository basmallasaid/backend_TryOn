const { Expo } = require("expo-server-sdk");
const expo = new Expo();
const NotificationLog = require("../models/NotificationLog");
const Notification = require("../models/Notification");
const AutomatedNotification = require("../models/AutomatedNotification");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const interpolate = (template, vars) => {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
  }
  return result;
};

const sendAutomated = async (operation, userId, vars = {}) => {
  try {
    const config = await AutomatedNotification.findOne({ operation });
    if (!config || !config.enabled) return;

    const user = await User.findById(userId);
    if (!user) return;

    const title = interpolate(config.titleTemplate, { ...vars, operation, userName: user.name || 'User' });
    const body = interpolate(config.bodyTemplate, { ...vars, operation, userName: user.name || 'User' });

    const channels = config.channels || { app: true };

    if (channels.get ? channels.get('app') : channels.app) {
      await Notification.create({
        userId: user._id,
        title,
        body,
        type: 'general',
      });
    }

    if ((channels.get ? channels.get('email') : channels.email) && user.email) {
      try {
        await sendEmail({
          email: user.email,
          subject: title,
          message: body,
        });
      } catch (e) {
        console.error('Automated email failed:', e.message);
      }
    }

    if ((channels.get ? channels.get('push') : channels.push) && user.expoPushToken) {
      try {
        if (Expo.isExpoPushToken(user.expoPushToken)) {
          await expo.sendPushNotificationsAsync([{ to: user.expoPushToken, sound: 'default', title, body }]);
        }
      } catch (e) {
        console.error('Automated push failed:', e.message);
      }
    }
  } catch (err) {
    console.error('sendAutomated error:', err.message);
  }
};

const sendNotification = async (tokens, title, body, data = {}) => {
  let messages = [];
  for (let userToken of tokens) {
    if (!Expo.isExpoPushToken(userToken.expoPushToken)) continue;
    messages.push({
      to: userToken.expoPushToken,
      sound: "default",
      title,
      body,
      data,
    });
  }

  let chunks = expo.chunkPushNotifications(messages);
  for (let chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error("Error sending chunk:", error);
    }
  }

  // حفظ سجل في القاعدة
  await NotificationLog.create({ title, body, deviceCount: tokens.length });
};

module.exports = { sendNotification, sendAutomated };