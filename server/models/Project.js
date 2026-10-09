import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  location: { type: String, trim: true, maxlength: 80 },
  year: { type: Number, min: 1900, max: 2100 },
  category: { type: String, trim: true, maxlength: 60 },
  description: { type: String, trim: true, maxlength: 600 },
});

export default mongoose.model("Project", projectSchema);
