const express = require("express");
const { createCheckoutSession, cancelSubscription, syncSubscription } = require("../controllers/paymentController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/create-checkout-session", protect, createCheckoutSession);
router.post("/cancel-subscription", protect, cancelSubscription);
router.post("/sync-subscription", protect, syncSubscription);

module.exports = router;
