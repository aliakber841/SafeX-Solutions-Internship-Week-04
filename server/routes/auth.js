const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({ error: "Wrong email or password" });
    }

    const passwordIsCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!passwordIsCorrect) {
      return res.status(401).json({ error: "Wrong email or password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Baseline version: the cookie has no security options on purpose.
    res.cookie("token", token);
    res.json({ message: "Logged in", email: user.email });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me  -> who is logged in?
router.get("/me", requireAdmin, (req, res) => {
  res.json({ email: req.user.email, role: req.user.role });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

module.exports = router;
