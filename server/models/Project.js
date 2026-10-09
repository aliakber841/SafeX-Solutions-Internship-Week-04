const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: String,
  location: String,
  year: Number,
  category: String,
  description: String,
});

module.exports = mongoose.model("Project", projectSchema);
