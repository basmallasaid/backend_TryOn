const express = require("express");

const passport = require("passport");

const {
  registerUser,
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  googleMobileLogin,
  changePassword,
} = require("../controllers/authController");
const protect = require("../middlewares/authMiddleware");
const generateToken = require("../utils/generateToken");

const router = express.Router();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, confirmPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *               confirmPassword:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully. Please verify your email."
 *                 token:
 *                   type: string
 *       400:
 *         description: Validation error (missing fields, password mismatch, email exists)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post("/signup", registerUser);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email & password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token and user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 _id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 fname:
 *                   type: string
 *                 lname:
 *                   type: string
 *                 image:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post("/login", loginUser);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: OTP sent to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Email not found
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify the OTP sent for password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               otp:
 *                 type: string
 *                 description: 6-digit OTP received via email
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid or expired OTP
 */
router.post("/verify-otp", verifyOtp);

/**
 * @swagger
 * /api/auth/reset-password:
 *   put:
 *     summary: Reset password after OTP verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "newSecurePass123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Error resetting password
 */
router.put("/reset-password", resetPassword);

router.put("/change-password", protect, changePassword);

/**
 * @swagger
 * /api/auth/send-verification:
 *   post:
 *     summary: Send email verification link to logged-in user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification email sent
 *       401:
 *         description: Not authenticated
 */
router.post("/send-verification", protect, sendVerificationEmail);

/**
 * @swagger
 * /api/auth/verify-email/{token}:
 *   get:
 *     summary: Verify email via link clicked from inbox
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully (renders HTML)
 *       400:
 *         description: Invalid or expired token
 */
router.get("/verify-email/:token", verifyEmail);

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth 2.0 login flow
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: device_id
 *         schema:
 *           type: string
 *         description: Device ID for push notifications
 *       - in: query
 *         name: device_name
 *         schema:
 *           type: string
 *         description: Device name
 *     responses:
 *       302:
 *         description: Redirects to Google login page
 */
function checkGoogleStrategy(req, res, next) {
  if (!passport._strategy("google")) {
    return res.status(500).json({ message: "Google Sign-In is not configured" });
  }
  next();
}

router.get(
  "/google",
  checkGoogleStrategy,
  (req, res, next) => {
    passport.authenticate("google", {
      scope: ["profile", "email"],
      device_id: req.query.device_id,
      device_name: req.query.device_name,
    })(req, res, next);
  },
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback, returns JWT token
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to frontend callback URL with token and user data as query params
 *       401:
 *         description: Authentication failed
 */
router.get(
  "/google/callback",
  checkGoogleStrategy,
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
      if (err || !user) {
        const errorMsg = encodeURIComponent(err?.message || "google_login_failed");
        return res.redirect(`${process.env.CLIENT_URL}/auth/callback?error=${errorMsg}`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },

  (req, res) => {
    console.log(`[Google Callback] User authenticated: ${req.user?._id} / ${req.user?.email}`);
    const token = generateToken(req.user._id);
    const fname = req.user.profile?.first_name || "";
    const lname = req.user.profile?.last_name || "";
    const image = req.user.userImage || "";
    const role = req.user.role || "user";
    const url = `${process.env.CLIENT_URL}/auth/callback?token=${token}&_id=${req.user._id}&email=${req.user.email}&role=${role}&fname=${encodeURIComponent(fname)}&lname=${encodeURIComponent(lname)}&image=${encodeURIComponent(image)}`;
    console.log(`[Google Callback] Redirecting to frontend callback`);
    res.redirect(url);
  },
);

/**
 * @swagger
 * /api/auth/google/mobile:
 *   post:
 *     summary: Mobile Google login using ID token (bypasses redirect flow)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from mobile Sign-In SDK
 *                 example: "ya29.a0ARrdaM8..."
 *     responses:
 *       200:
 *         description: Login successful, returns user and JWT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: idToken is required
 *       401:
 *         description: Invalid token
 */
router.post("/google/mobile", googleMobileLogin);

module.exports = router;
