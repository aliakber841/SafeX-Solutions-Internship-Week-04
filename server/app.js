import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { config } from "./config.js";
import projectRoutes from "./routes/projects.js";
import contactRoutes from "./routes/contact.js";
import authRoutes from "./routes/auth.js";
import { checkCsrf, sendCsrfToken } from "./middleware/csrf.js";
import { apiLimiter } from "./middleware/rateLimiters.js";

const app = express();

// Fix 1: do not tell attackers we use Express.
app.disable("x-powered-by");

// Fix 2: security headers + strict Content-Security-Policy.
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'"],
  imgSrc: ["'self'", "data:"],
  fontSrc: ["'self'"],
  connectSrc: ["'self'"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
};

// "upgrade-insecure-requests" only makes sense on HTTPS, so we skip it while developing on http://localhost.
if (!config.isProduction) {
  cspDirectives.upgradeInsecureRequests = null;
}

app.use(
  helmet({
    contentSecurityPolicy: { directives: cspDirectives },
  })
);

// Fix 3: CORS only for our own website (not for every website).
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  })
);

// Fix 4: small request body limit.
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// API rules: no caching, rate limit, CSRF check.
app.use("/api", function (req, res, next) {
  res.set("Cache-Control", "no-store");
  next();
});
app.use("/api", apiLimiter);
app.use("/api", checkCsrf);

app.get("/api/csrf-token", sendCsrfToken);
app.use("/api/projects", projectRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/auth", authRoutes);

// Unknown API address -> clean 404 (not the React page).
app.use("/api", function (req, res) {
  res.status(404).json({ error: "Not found" });
});

// Serve the built React app (run "npm run build" inside /client first).
const currentFolder = path.dirname(fileURLToPath(import.meta.url));
const clientBuildPath = path.join(currentFolder, "..", "client", "dist");

if (fs.existsSync(clientBuildPath)) {
  app.use(
    express.static(clientBuildPath, {
      maxAge: "1y",
      immutable: true,
      setHeaders: function (res, filePath) {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    })
  );

  app.get("*", function (req, res) {
    res.set("Cache-Control", "no-cache");
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

// Fix 5: safe error handler. Details go to the server log, not to the visitor.
app.use(function (err, req, res, next) {
  const isClientError = err.status >= 400 && err.status < 500;

  if (isClientError) {
    return res.status(err.status).json({ error: "Bad request" });
  }

  console.error("Server error:", err);
  res.status(500).json({ error: "Something went wrong. Please try again later." });
});

export default app;
