const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// @route POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role === "restaurant" ? "restaurant" : "customer", // admin can't self-register
    });
    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, preferredCity: user.preferredCity },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, preferredCity: user.preferredCity },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.json({ user: req.user });
});

// @route POST /api/auth/forgot-password
// This capstone project has no email server configured, so instead of
// emailing a reset link, we generate a reset token and return it directly
// in the response (and log it to the server console) so it can be used
// right away in the demo. In a production app this token would only ever
// be sent via email, never returned in the API response.
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const user = await User.findOne({ email });

    // Always respond the same way whether or not the account exists,
    // so the endpoint can't be used to check which emails are registered.
    const genericResponse = {
      message: "If an account with that email exists, reset instructions have been generated.",
    };

    if (!user) {
      return res.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordTokenHash = tokenHash;
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    console.log(`\n[Password Reset] Email: ${email}`);
    console.log(`[Password Reset] Token (demo only — normally emailed): ${rawToken}`);
    console.log(`[Password Reset] Expires in 30 minutes\n`);

    res.json({
      ...genericResponse,
      // demo-only fields so the reset can be completed without a real mail server
      demoToken: rawToken,
      demoNote: "No email server is configured for this project — use this token directly on the Reset Password page.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: "Email, token, and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      email,
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = newPassword; // pre-save hook hashes this automatically
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password has been reset successfully. You can now log in." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PUT /api/auth/city - save preferred city (used to auto-load nearby restaurants)
router.put("/city", protect, async (req, res) => {
  try {
    const { city } = req.body;
    if (!city || !city.trim()) {
      return res.status(400).json({ message: "city is required" });
    }
    const user = await User.findById(req.user._id);
    user.preferredCity = city.trim();
    await user.save();
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, preferredCity: user.preferredCity } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PUT /api/auth/address - add a delivery address
router.put("/address", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses.push(req.body);
    await user.save();
    res.json({ addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
