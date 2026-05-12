const jwt = require("jsonwebtoken");

/**
 * Middleware: Verify JWT from cookie or Authorization header, attach user info to req.user
 */
function authenticate(req, res, next) {
  // Check cookie first, then Authorization header
  let token = req.cookies.token;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Not authenticated. Please log in." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session. Please log in again." });
  }
}

/**
 * Middleware: Check that the authenticated user has the admin role
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin privileges required." });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
