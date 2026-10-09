const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  role: { type: String, default: "admin" },
});

module.exports = mongoose.model("User", userSchema);
