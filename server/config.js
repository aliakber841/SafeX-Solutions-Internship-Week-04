import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET;
const mongoUri = process.env.MONGO_URI;

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET is missing or too short. Use at least 32 characters (see .env.example).");
}

if (!mongoUri) {
  throw new Error("MONGO_URI is missing. Add your MongoDB address to the .env file.");
}

const nodeEnv = process.env.NODE_ENV || "development";
const port = process.env.PORT || 5001;

export const config = {
  nodeEnv: nodeEnv,
  isProduction: nodeEnv === "production",
  port: port,
  mongoUri: mongoUri,
  jwtSecret: jwtSecret,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:" + port,
};
