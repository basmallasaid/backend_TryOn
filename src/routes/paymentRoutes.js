const express = require("express");
const { createCheckoutSession, cancelSubscription } = require("../controllers/paymentController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/create-checkout-session", protect, createCheckoutSession);
router.post("/cancel-subscription", protect, cancelSubscription);

module.exports = router;
