const crypto = require("crypto");
const User = require("../models/User");

const createSubscription = async (req, res) => {
  try {
    const { userId, cardNumber, expiry, cvv, plan } = req.body;

    if (!userId || !cardNumber || !expiry || !cvv || !plan) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const cleanedCard = cardNumber.replace(/\s+/g, "");
    if (!/^\d{16}$/.test(cleanedCard)) {
      return res.status(400).json({ message: "Card number must be 16 digits" });
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      return res.status(400).json({ message: "Expiry must be in MM/YY format" });
    }

    if (!/^\d{3}$/.test(cvv)) {
      return res.status(400).json({ message: "CVV must be 3 digits" });
    }

    if (plan !== "pro") {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Simulated payment — mark subscription as active immediately
    const fakeSubscriptionId = "sub_fake_" + crypto.randomBytes(12).toString("hex");

    user.subscriptionId = fakeSubscriptionId;
    user.subscriptionStatus = "active";
    await user.save();

    res.status(201).json({
      success: true,
      subscriptionId: fakeSubscriptionId,
      status: "active",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createSubscription };
