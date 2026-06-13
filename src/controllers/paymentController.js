const User = require("../models/User");

const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY)
  : null;

const PLAN_PRICE_IDS = {
  pro: {
    month: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    year: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  },
};

const VALID_PLANS = Object.keys(PLAN_PRICE_IDS);
const VALID_INTERVALS = ["month", "year"];

const createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    const { userId, plan, interval } = req.body;

    if (!userId || !plan || !interval) {
      return res
        .status(400)
        .json({ message: "userId, plan, and interval are required" });
    }

    if (!VALID_PLANS.includes(plan)) {
      return res.status(400).json({
        message: `Invalid plan. Must be one of: ${VALID_PLANS.join(", ")}`,
      });
    }

    if (!VALID_INTERVALS.includes(interval)) {
      return res.status(400).json({
        message: `Invalid interval. Must be one of: ${VALID_INTERVALS.join(", ")}`,
      });
    }

    const priceId = PLAN_PRICE_IDS[plan][interval];
    if (!priceId) {
      return res
        .status(500)
        .json({ message: `Price ID not configured for ${plan} ${interval}` });
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

    const successUrl =
      req.body.success_url || `${process.env.CLIENT_URL}/pricing?success=true`;
    const cancelUrl =
      req.body.cancel_url || `${process.env.CLIENT_URL}/pricing?canceled=true`;

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user._id.toString(),
        plan,
        interval,
      },
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
      return res
        .status(400)
        .json({ message: "No active subscription to cancel" });
    }

    if (
      stripe &&
      user.subscriptionId.startsWith("sub_") &&
      !user.subscriptionId.startsWith("sub_fake_")
    ) {
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

const syncSubscription = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!stripe) {
      return res.status(500).json({ message: "Stripe not configured" });
    }

    if (!user.stripeCustomerId) {
      return res.json({ subscriptionStatus: null });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      limit: 1,
      status: "all",
    });

    const sub = subscriptions.data[0];
    if (sub && sub.status === "active") {
      user.subscriptionId = sub.id;
      user.subscriptionStatus = sub.status;
      let periodEnd = sub.current_period_end;
      if (!periodEnd) {
        const invoices = await stripe.invoices.list({
          subscription: sub.id,
          limit: 1,
        });
        const inv = invoices.data[0];
        if (inv?.lines?.data[0]?.period?.end) {
          periodEnd = inv.lines.data[0].period.end;
        }
      }
      if (periodEnd) {
        user.subscriptionEndDate = new Date(periodEnd * 1000);
      }
      const price = sub.items.data[0]?.price;
      if (price) {
        const monthlyId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
        const yearlyId = process.env.STRIPE_PRO_YEARLY_PRICE_ID;
        if (price.id === monthlyId) {
          user.subscriptionPlan = "pro";
          user.subscriptionInterval = "month";
        } else if (price.id === yearlyId) {
          user.subscriptionPlan = "pro";
          user.subscriptionInterval = "year";
        }
      }
      await user.save();
      return res.json({
        subscriptionStatus: "active",
        subscriptionId: sub.id,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionInterval: user.subscriptionInterval,
        subscriptionEndDate: user.subscriptionEndDate,
      });
    }

    if (sub) {
      user.subscriptionStatus = sub.status;
      await user.save();
    }

    res.json({ subscriptionStatus: sub?.status || null });
  } catch (error) {
    console.error("syncSubscription error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCheckoutSession,
  cancelSubscription,
  syncSubscription,
};
