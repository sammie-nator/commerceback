const Session = require("../models/Session");

// No JWT: the token is a random opaque string looked up in the Session
// collection on every request. Expired sessions are rejected (and cleaned
// up by MongoDB's TTL index automatically).
const protectAdmin = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
  try {
    const token = header.split(" ")[1];
    const session = await Session.findOne({ token }).populate("admin", "-pin");
    if (!session || session.expiresAt < new Date() || !session.admin) {
      return res.status(401).json({ message: "Session expired, please log in again" });
    }
    req.admin = session.admin;
    req.sessionToken = token;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized" });
  }
};

// Use AFTER protectAdmin:  router.delete("/:id", protectAdmin, requireRole("owner"), ...)
const requireRole = (...roles) => (req, res, next) => {
  if (!req.admin || !roles.includes(req.admin.role)) {
    return res.status(403).json({ message: "You don't have permission to do that" });
  }
  next();
};

module.exports = { protectAdmin, requireRole };
