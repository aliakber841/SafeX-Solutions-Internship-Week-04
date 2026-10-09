import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import requireAdmin from "../middleware/requireAdmin.js";
import { loginLimiter } from "../middleware/rateLimiters.js";
import { validateBody, loginSchema } from "../middleware/validate.js";
import { config } from "../config.js";

const router = express.Router();

// Secure cookie settings:
// httpOnly -> JavaScript cannot read the cookie (protects from XSS theft)
// sameSite -> the browser does not send it from other websites (protects from CSRF)
// secure   -> sent only over HTTPS (switched on when NODE_ENV=production)
function loginCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: config.isProduction,
    maxAge: 60 * 60 * 1000,
    path: "/",
  };
}

// POST /api/auth/login
router.post("/login", loginLimiter, validateBody(loginSchema), async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const user = await User.findOne({ email: email });

    // Same message for "no such user" and "wrong password",
    // so attackers cannot find out which emails exist.
    if (!user) {
      return res.status(401).json({ error: "Wrong email or password" });
    }

    const passwordIsCorrect = await bcrypt.compare(password, user.passwordHash);

    if (!passwordIsCorrect) {
      return res.status(401).json({ error: "Wrong email or password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      config.jwtSecret,
      { algorithm: "HS256", expiresIn: "1h" }
    );

    res.cookie("token", token, loginCookieOptions());
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
  res.clearCookie("token", loginCookieOptions());
  res.json({ message: "Logged out" });
});

export default router;
