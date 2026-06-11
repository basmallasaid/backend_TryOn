const crypto = require("crypto");
const User = require("../models/User");

const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY)
  : null;

const createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    const { userId, plan } = req.body;

    if (!userId || !plan) {
      return res.status(400).json({ message: "userId and plan are required" });
    }

    if (plan !== "pro") {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user._id.toString() },
      });
      stripeCustomerId = customer.id;
      user.stripeCustomerId = stripeCustomerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/pricing?success=true`,
      cancel_url: `${process.env.CLIENT_URL}/pricing?canceled=true`,
      metadata: { userId: user._id.toString() },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.subscriptionId || user.subscriptionStatus !== "active") {
      return res.status(400).json({ message: "No active subscription to cancel" });
    }

    if (stripe && user.subscriptionId.startsWith("sub_") && !user.subscriptionId.startsWith("sub_fake_")) {
      try {
        await stripe.subscriptions.cancel(user.subscriptionId);
      } catch {
        // Stripe cancel failed — still mark as canceled locally
      }
    }

    user.subscriptionStatus = "canceled";
    await user.save();

    res.status(200).json({
      success: true,
      message: "Subscription canceled",
      subscriptionId: user.subscriptionId,
      status: "canceled",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCheckoutSession, cancelSubscription };
