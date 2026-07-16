const { verifyAccessToken } = require("../utils/tokens");

// Verifies the access token and attaches { id, role } to req.user.
// Responds with code: "TOKEN_EXPIRED" specifically so the frontend knows to
// attempt a silent refresh rather than immediately logging the user out.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.id, role: payload.role };
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Access token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ error: "Invalid access token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    return next();
  };
}

// Ensures the authenticated user matches the :paramName in the URL, e.g. a
// porter can only act on their own bookings even though the id is in the path.
function requireSelf(paramName) {
  return (req, res, next) => {
    if (req.user?.id !== req.params[paramName]) {
      return res.status(403).json({ error: "You cannot act on another account's behalf" });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole, requireSelf };
