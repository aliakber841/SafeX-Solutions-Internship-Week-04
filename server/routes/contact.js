import express from "express";
import Message from "../models/Message.js";
import requireAdmin from "../middleware/requireAdmin.js";
import { contactLimiter } from "../middleware/rateLimiters.js";
import { validateBody, contactSchema } from "../middleware/validate.js";

const router = express.Router();

// POST /api/contact  -> anyone can send a message (limited and validated)
router.post("/", contactLimiter, validateBody(contactSchema), async (req, res, next) => {
  try {
    const saved = await Message.create({
      name: req.body.name,
      email: req.body.email,
      message: req.body.message,
    });

    res.status(201).json({ message: "Thank you, we received your message", id: saved._id });
  } catch (err) {
    next(err);
  }
});

// GET /api/contact  -> only the admin can read messages
router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

export default router;
