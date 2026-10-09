const express = require("express");
const Message = require("../models/Message");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// POST /api/contact  -> anyone can send a message
router.post("/", async (req, res, next) => {
  try {
    const saved = await Message.create(req.body);
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

module.exports = router;
