require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Project = require("./models/Project");
const User = require("./models/User");

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
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  await Project.deleteMany({});
  await Project.insertMany(projects);
  console.log("Added " + projects.length + " projects");

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  await User.deleteMany({ email: adminEmail });
  const hash = await bcrypt.hash(adminPassword, 10);
  await User.create({ email: adminEmail, passwordHash: hash, role: "admin" });
  console.log("Admin user ready: " + adminEmail);

  await mongoose.disconnect();
  console.log("Done");
}

run().catch((err) => {
  console.log("Seed failed:", err.message);
  process.exit(1);
});
