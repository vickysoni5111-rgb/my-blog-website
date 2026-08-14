const jwt = require("jsonwebtoken");

// ======================================================
// JWT SECRET
// ======================================================

const JWT_SECRET =
  "8f7d9a2c4e1b6f9a7d3c5e8b2a1f6d4c";

// ======================================================
// AUTH MIDDLEWARE
// ======================================================

const authMiddleware = (req, res, next) => {
  try {
    // Authorization header
    const authHeader =
      req.headers.authorization;

    // Token nahi mila
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message:
          "Authorization token is required",
      });
    }

    // Expected format:
    // Bearer TOKEN

    const parts =
      authHeader.split(" ");

    if (
      parts.length !== 2 ||
      parts[0] !== "Bearer"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authorization format",
      });
    }

    const token = parts[1];

    // JWT verify
    const decoded =
      jwt.verify(token, JWT_SECRET);

    // Decoded user information
    req.user = decoded;

    // Continue request
    next();

  } catch (error) {
    console.error(
      "❌ Auth Middleware Error:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired token",
    });
  }
};

// ======================================================
// EXPORT
// ======================================================

module.exports = authMiddleware;