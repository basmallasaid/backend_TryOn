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
 *               password:
 *                 type: string
 *                 minLength: 6
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid credentials
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
 *     responses:
 *       200:
 *         description: OTP sent to email
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
 *               otp:
 *                 type: string
 *                 description: 6-digit OTP
 *     responses:
 *       200:
 *         description: OTP verified successfully
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
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Error resetting password
 */
router.put("/reset-password", resetPassword);

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
 *     responses:
 *       302:
 *         description: Redirects to Google login page
 */
router.get(
  "/google",
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
 *       200:
 *         description: Authentication successful, returns user and JWT
 *       401:
 *         description: Authentication failed
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),

  (req, res) => {
    console.log(`[Google Callback] User authenticated: ${req.user?._id} / ${req.user?.email}`);
    const token = generateToken(req.user._id);
    const fname = req.user.profile?.first_name || "";
    const lname = req.user.profile?.last_name || "";
    const image = req.user.userImage || "";
    const url = `http://localhost:5173/auth/callback?token=${token}&_id=${req.user._id}&email=${req.user.email}&fname=${encodeURIComponent(fname)}&lname=${encodeURIComponent(lname)}&image=${encodeURIComponent(image)}`;
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
 *     responses:
 *       200:
 *         description: Login successful, returns user and JWT
 *       400:
 *         description: idToken is required
 *       401:
 *         description: Invalid token
 */
router.post("/google/mobile", googleMobileLogin);

module.exports = router;
