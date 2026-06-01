const { Expo } = require("expo-server-sdk");
const expo = new Expo();
const NotificationLog = require("../models/NotificationLog");

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

module.exports = { sendNotification };