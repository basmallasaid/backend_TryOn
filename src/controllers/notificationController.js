const UserToken = require("../models/UserToken");
const { sendNotification } = require("../services/notificationService");


exports.registerToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });

    const existing = await UserToken.findOne({ expoPushToken: token });
    if (!existing) {
      await UserToken.create({ expoPushToken: token });
    }
    res.status(200).json({ message: "Token Registered" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sendToAll = async (req, res) => {
  try {
    const tokens = await UserToken.find();
    await sendNotification(tokens, "TryOn Update", "Hello everyone!");
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