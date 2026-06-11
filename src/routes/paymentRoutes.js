const express = require("express");
const { createSubscription, cancelSubscription } = require("../controllers/paymentController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/create-subscription", protect, createSubscription);
router.post("/cancel-subscription", protect, cancelSubscription);

module.exports = router;
