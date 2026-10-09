require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const projectRoutes = require("./routes/projects");
const contactRoutes = require("./routes/contact");
const authRoutes = require("./routes/auth");

const app = express();

// ---------------------------------------------------------------
// BASELINE VERSION (Week 4, before hardening)
// This app is kept simple on purpose. Security is added later:
// helmet, CSP, CSRF, rate limiting, validation, secure cookies.
// ---------------------------------------------------------------

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// API routes
app.use("/api/projects", projectRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/auth", authRoutes);

// Serve the built React app (run "npm run build" inside /client first)
const clientBuildPath = path.join(__dirname, "..", "client", "dist");

if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

// Error handler (baseline: it shows too much detail)
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, stack: err.stack });
});

const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log("Server running on http://localhost:" + PORT);
    });
  })
  .catch((err) => {
    console.log("Could not connect to MongoDB:", err.message);
  });
