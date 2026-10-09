import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Project from "./models/Project.js";
import User from "./models/User.js";

// Adds sample projects and the admin user to the database named in MONGO_URI.

const projects = [
  {
    title: "Lakeview Family House",
    location: "Lahore",
    year: 2022,
    category: "Residential",
    description: "A three-generation home built around a shaded courtyard with natural cross ventilation.",
  },
  {
    title: "Old Town Cafe Renovation",
    location: "Lahore",
    year: 2021,
    category: "Commercial",
    description: "Restoration of a 1950s shop front into a warm neighbourhood cafe, keeping the original brick arches.",
  },
  {
    title: "Greenfield Primary School",
    location: "Sheikhupura",
    year: 2023,
    category: "Education",
    description: "A low-cost school with bright classrooms, solar panels and a rainwater collection roof.",
  },
  {
    title: "Canal Road Office Block",
    location: "Lahore",
    year: 2020,
    category: "Commercial",
    description: "A five-storey office building with deep window shading to reduce cooling costs.",
  },
  {
    title: "Hillside Guest House",
    location: "Murree",
    year: 2024,
    category: "Hospitality",
    description: "Eight guest rooms stepped into the slope, built with local stone and timber.",
  },
  {
    title: "Community Health Clinic",
    location: "Kasur",
    year: 2023,
    category: "Healthcare",
    description: "A simple single-floor clinic designed for easy patient flow and good daylight.",
  },
];

async function run() {
  const mongoUri = process.env.MONGO_URI;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!mongoUri) {
    throw new Error("MONGO_URI is missing in .env");
  }

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
  }

  if (adminPassword.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters");
  }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected to MongoDB database: " + mongoose.connection.name);

  await Project.deleteMany({});
  await Project.insertMany(projects);
  console.log("Added " + projects.length + " projects");

  const hash = await bcrypt.hash(adminPassword, 12);
  const email = adminEmail.trim().toLowerCase();

  await User.findOneAndUpdate(
    { email: email },
    { email: email, passwordHash: hash, role: "admin" },
    { upsert: true }
  );
  console.log("Admin user ready: " + email);

  await mongoose.disconnect();
  console.log("Done");
}

run().catch(function (err) {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
