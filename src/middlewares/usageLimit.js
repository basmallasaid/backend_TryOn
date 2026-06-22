const User = require("../models/User");

const LIMITS = {
  normal: { tryon: 5, recycle: 4, avatar: 1 },
  premium_monthly: { tryon: 50, recycle: 40, avatar: 15 },
  premium_yearly: { tryon: 600, recycle: 480, avatar: 180 },
};

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getLimitsForUser(user) {
  if (user.subscriptionStatus === "active") {
    if (user.subscriptionInterval === "year") return LIMITS.premium_yearly;
    if (user.subscriptionInterval === "month") return LIMITS.premium_monthly;
  }
  return LIMITS.normal;
}

async function resetIfNeeded(user) {
  const currentMonth = getCurrentMonth();
  if (user.usage?.usageMonth !== currentMonth) {
    user.usage = { tryonUsed: 0, recycleUsed: 0, avatarUsed: 0, usageMonth: currentMonth };
    await user.save();
  }
}

function checkLimit(feature) {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });

      await resetIfNeeded(user);

      const limits = getLimitsForUser(user);
      const usedMap = { tryon: user.usage.tryonUsed, recycle: user.usage.recycleUsed, avatar: user.usage.avatarUsed || 0 };
      const limitMap = { tryon: limits.tryon, recycle: limits.recycle, avatar: limits.avatar };
      const used = usedMap[feature] || 0;
      const limit = limitMap[feature] || 0;

      if (used >= limit) {
        return res.status(403).json({
          message: `Usage limit reached for this billing period.`,
          used,
          limit,
          feature,
        });
      }

      req.userDoc = user;
      req.usageLimits = limits;
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}

async function incrementUsage(userId, feature) {
  const user = await User.findById(userId);
  if (!user) return;

  const currentMonth = getCurrentMonth();
  if (user.usage?.usageMonth !== currentMonth) {
    user.usage = { tryonUsed: 0, recycleUsed: 0, avatarUsed: 0, usageMonth: currentMonth };
  }

  if (feature === "tryon") user.usage.tryonUsed += 1;
  else if (feature === "recycle") user.usage.recycleUsed += 1;
  else if (feature === "avatar") user.usage.avatarUsed = (user.usage.avatarUsed || 0) + 1;

  await user.save();
}

function getUsageLimits() {
  return LIMITS;
}

module.exports = { checkLimit, incrementUsage, getLimitsForUser, getUsageLimits, getCurrentMonth };
