const express = require("express");

const passport = require("passport");

const {
  registerUser,
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require("../controllers/authController");
const generateToken = require("../utils/generateToken");

const router = express.Router();

// Manual Signup
router.post("/signup", registerUser);

// Manual Login
router.post("/login", loginUser);

// Forgot Password
router.post("/forgot-password", forgotPassword);

// Verify OTP
router.post("/verify-otp", verifyOtp);

// Reset Password
router.put("/reset-password", resetPassword);

// Google Signup/Login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),

  (req, res) => {
    res.status(200).json({
      _id: req.user._id,
      email: req.user.email,
      token: generateToken(req.user._id),
    });
  },
);

module.exports = router;
