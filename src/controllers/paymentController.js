const User = require("../models/User");

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
}

const createSubscription = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

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

    const testTokens = {
      "4242424242424242": "tok_visa",
      "4000056655665556": "tok_visa_debit",
      "5555555555554444": "tok_mastercard",
      "2223003122003222": "tok_mastercard_2",
      "378282246310005": "tok_amex",
      "6011111111111117": "tok_discover",
    };

    const tokenId = testTokens[cleanedCard];
    if (!tokenId) {
      return res.status(400).json({ message: "Unsupported test card. Use a Stripe test card number." });
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

    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: { token: tokenId },
    });

    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: stripeCustomerId,
    });

    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethod.id },
    });

    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: process.env.STRIPE_PRO_PRICE_ID }],
      payment_behavior: "error_if_incomplete",
      expand: ["latest_invoice.payment_intent"],
      metadata: { userId: user._id.toString() },
    });

    if (subscription.latest_invoice?.payment_intent?.status === "requires_confirmation") {
      await stripe.paymentIntents.confirm(
        subscription.latest_invoice.payment_intent.id,
      );
    }

    const updatedSubscription = await stripe.subscriptions.retrieve(
      subscription.id,
    );

    user.subscriptionId = updatedSubscription.id;
    user.subscriptionStatus = updatedSubscription.status;
    await user.save();

    res.status(201).json({
      success: true,
      subscriptionId: updatedSubscription.id,
      status: updatedSubscription.status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createSubscription };
