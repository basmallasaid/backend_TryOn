const User = require("../models/User");

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
}

const handleWebhook = async (req, res) => {
  if (!stripe) {
    return res.json({ received: true });
  }

  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = session.metadata?.userId;

      if (userId) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription,
        );

        await User.findByIdAndUpdate(userId, {
          stripeCustomerId: session.customer,
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          subscriptionEndDate: new Date(
            subscription.current_period_end * 1000,
          ),
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object;
      const customerId = sub.customer;

      await User.findOneAndUpdate(
        { stripeCustomerId: customerId },
        {
          subscriptionId: sub.id,
          subscriptionStatus: sub.status,
          subscriptionEndDate: new Date(sub.current_period_end * 1000),
        },
      );
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await User.findOneAndUpdate(
        { stripeCustomerId: sub.customer },
        { subscriptionStatus: "canceled" },
      );
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      if (invoice.subscription) {
        await User.findOneAndUpdate(
          { stripeCustomerId: invoice.customer },
          { subscriptionStatus: "active" },
        );
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      if (invoice.subscription) {
        await User.findOneAndUpdate(
          { stripeCustomerId: invoice.customer },
          { subscriptionStatus: "past_due" },
        );
      }
      break;
    }

    default:
      break;
  }

  res.json({ received: true });
};

module.exports = { handleWebhook };
