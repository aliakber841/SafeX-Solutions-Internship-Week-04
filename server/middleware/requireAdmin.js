import jwt from "jsonwebtoken";
import { config } from "../config.js";

// Checks the "token" cookie. Only a valid token that belongs to an admin can continue.
function requireAdmin(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Please log in first" });
  }

  try {
    const data = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });

    if (data.role !== "admin") {
      return res.status(403).json({ error: "You are not allowed to do this" });
    }

    req.user = data;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired login" });
  }
}

export default requireAdmin;
