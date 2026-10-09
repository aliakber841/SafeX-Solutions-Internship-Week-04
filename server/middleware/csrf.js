import crypto from "crypto";
import { config } from "../config.js";

// CSRF protection (double-submit token).
//
// How it works:
// 1. The browser asks GET /api/csrf-token. The server makes a random token,
//    stores it in a cookie, and also sends it back in the response.
// 2. For every POST/PUT/DELETE the React app sends the same token in a header.
// 3. The server checks: cookie token == header token.
//
// A fake website cannot read our response (CORS blocks it), so it cannot
// know the token and cannot build a valid request.

const COOKIE_NAME = "csrf_token";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: config.isProduction,
    path: "/",
  };
}

export function sendCsrfToken(req, res) {
  let token = req.cookies[COOKIE_NAME];

  if (!token) {
    token = crypto.randomBytes(32).toString("hex");
    res.cookie(COOKIE_NAME, token, cookieOptions());
  }

  res.json({ csrfToken: token });
}

export function checkCsrf(req, res, next) {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];

  if (safeMethods.includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies[COOKIE_NAME];
  const headerToken = req.get("x-csrf-token");

  if (!cookieToken || !headerToken) {
    return res.status(403).json({ error: "Missing security token. Please refresh the page." });
  }

  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);

  if (cookieBuffer.length !== headerBuffer.length) {
    return res.status(403).json({ error: "Invalid security token. Please refresh the page." });
  }

  const tokensMatch = crypto.timingSafeEqual(cookieBuffer, headerBuffer);

  if (!tokensMatch) {
    return res.status(403).json({ error: "Invalid security token. Please refresh the page." });
  }

  next();
}
