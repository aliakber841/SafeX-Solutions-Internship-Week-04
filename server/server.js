import mongoose from "mongoose";
import app from "./app.js";
import { config } from "./config.js";

async function start() {
  try {
    // Connects to the database named in MONGO_URI (local MongoDB or Atlas).
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log("MongoDB connected to database: " + mongoose.connection.name);

    app.listen(config.port, function () {
      console.log("Server running on http://localhost:" + config.port);
    });
  } catch (err) {
    console.error("Could not connect to MongoDB:", err.message);
    process.exit(1);
  }
}

start();
