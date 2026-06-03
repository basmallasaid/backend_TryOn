const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

const registerUser = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        message: "Please fill all fields",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password_hash: hashedPassword,
      auth_provider: "local",
      profile: {
        first_name: null,
        last_name: null,
        gender: null,
      },
    });

    res.status(201).json({
      message: "User registered successfully",
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Please fill all fields",
      });
    }

    // Find user
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // If account created with Google only
    if (!user.password_hash) {
      return res.status(400).json({
        message: "login with Google",
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Success
    res.status(200).json({
      _id: user._id,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Ensure email is verified before proceeding
    if (!user.is_verified) {
      return res.status(400).json({
        message: "Please verify your email before requesting a password reset.",
      });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP before storing
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Save hashed OTP
    user.reset_token = hashedOtp;

    // OTP expires after 5 minutes
    user.reset_token_expires = Date.now() + 5 * 60 * 1000;

    user.is_otp_verified = false;

    await user.save();

    // Send email
    const message = `
      Your password reset code is: ${otp}
      This code expires in 5 minutes.
    `;

    await sendEmail({
      email: user.email,
      subject: "Password Reset OTP",
      message,
    });

    res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Ensure email is verified before verifying OTP
    if (!user.is_verified) {
      return res.status(400).json({
        message: "Please verify your email before verifying the OTP.",
      });
    }

    // Hash incoming OTP
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    // Compare OTP
    if (user.reset_token !== hashedOtp) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // Check expiration
    if (user.reset_token_expires < Date.now()) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    // Mark verified
    user.is_otp_verified = true;

    await user.save();

    res.status(200).json({
      message: "OTP verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Ensure email is verified before resetting password
    if (!user.is_verified) {
      return res.status(400).json({
        message: "Please verify your email before resetting your password.",
      });
    }

    // Must verify OTP first
    if (!user.is_otp_verified) {
      return res.status(400).json({
        message: "OTP not verified",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password_hash = hashedPassword;

    // Clear reset fields
    user.reset_token = undefined;
    user.reset_token_expires = undefined;
    user.is_otp_verified = false;

    await user.save();

    res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const sendVerificationEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.is_verified) {
      return res.status(400).json({ message: "Account is already verified" });
    }

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Hash before storing
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.verification_token = hashedToken;
    // Token expires in 24 hours
    user.verification_token_expires = Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    // Button points directly to the backend verify endpoint
    const verifyUrl = `${process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`}/api/auth/verify-email/${rawToken}`;

    const htmlMessage = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 40px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">ReDolapy</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Virtual Try-On Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 48px 32px;">
              <h2 style="margin:0 0 12px;color:#1a1a2e;font-size:22px;font-weight:600;">Confirm your email address</h2>
              <p style="margin:0 0 24px;color:#555770;font-size:15px;line-height:1.7;">
                Thanks for signing up! Click the button below to verify your email and activate your account.
                This link will expire in <strong>24 hours</strong>.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${verifyUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:16px 48px;border-radius:50px;letter-spacing:0.3px;box-shadow:0 4px 15px rgba(102,126,234,0.4);">
                      ✓ &nbsp; Confirm My Email
                     </a>
                     <p style="margin-top:8px;color:#555770;font-size:13px;">If the button does not work, copy and paste this URL into your browser:<br/><a href="${verifyUrl}" style="color:#667eea;word-break:break-all;">${verifyUrl}</a></p>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#888;font-size:13px;line-height:1.6;">
                If you did not create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9f9fb;padding:20px 48px;border-top:1px solid #ebebf0;text-align:center;">
              <p style="margin:0;color:#aaa;font-size:12px;">© ${new Date().getFullYear()} ReDolapy. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await sendEmail({
      email: user.email,
      subject: "Verify Your Account – ReDolapy",
      message: "Please verify your account by clicking the button in this email.",
      html: htmlMessage,
    });

    return res.status(200).json({ message: "Verification email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Hash the incoming raw token to compare with stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      verification_token: hashedToken,
      verification_token_expires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verification Failed</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f7;display:flex;align-items:center;justify-content:center;min-height:100vh;}
    .card{background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.10);padding:56px 48px;text-align:center;max-width:460px;width:90%;}
    .icon{font-size:64px;margin-bottom:24px;}
    h1{color:#1a1a2e;font-size:24px;font-weight:700;margin-bottom:12px;}
    p{color:#666;font-size:15px;line-height:1.7;}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">❌</div>
    <h1>Verification Failed</h1>
    <p>This verification link is <strong>invalid or has expired</strong>.<br/>Please request a new verification email from the app.</p>
  </div>
</body>
</html>`);
    }

    user.is_verified = true;
    user.verification_token = undefined;
    user.verification_token_expires = undefined;

    await user.save();

    return res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email Verified</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f7;display:flex;align-items:center;justify-content:center;min-height:100vh;}
    .card{background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.10);padding:56px 48px;text-align:center;max-width:460px;width:90%;}
    .icon{font-size:64px;margin-bottom:24px;}
    h1{background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:26px;font-weight:700;margin-bottom:12px;}
    p{color:#555770;font-size:15px;line-height:1.7;margin-bottom:32px;}
    .badge{display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;border-radius:50px;padding:12px 36px;font-size:15px;font-weight:600;letter-spacing:0.3px;}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🎉</div>
    <h1>You're Verified!</h1>
    <p>Your email has been confirmed successfully.<br/>You can now close this tab and log in to your account.</p>
    <span class="badge">✓ &nbsp; Account Activated</span>
  </div>
</body>
</html>`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};
