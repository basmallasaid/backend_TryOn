const express = require("express");
const { createSubscription } = require("../controllers/paymentController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/create-subscription", protect, createSubscription);

module.exports = router;
