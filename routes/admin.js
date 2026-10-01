const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const Admin = require("../models/Admin");
const Session = require("../models/Session");
const { protectAdmin, requireRole } = require("../middleware/auth");

const SESSION_HOURS = Number(process.env.SESSION_HOURS) || 12;
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const shape = (a) => ({ id: a._id, name: a.name, username: a.username, role: a.role });

const issueSession = async (admin) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  await Session.create({ token, admin: admin._id, expiresAt });
  return { token, expiresAt, admin: shape(admin) };
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ---------------- PUBLIC ---------------- */

// First-run check: lets the login page offer "create the owner account"
router.get("/setup-status", async (req, res) => {
  res.json({ needsSetup: (await Admin.countDocuments()) === 0 });
});

// Only works while there are ZERO admins. Creates the first owner.
router.post("/setup", async (req, res) => {
  try {
    if ((await Admin.countDocuments()) > 0) {
      return res.status(403).json({ message: "Setup already completed" });
    }
    const name = String(req.body.name || "").trim();
    const pin = String(req.body.pin || "");
    if (!name) return res.status(400).json({ message: "Name is required" });
    if (!/^\d{4}$/.test(pin)) return res.status(400).json({ message: "PIN must be exactly 4 digits" });

    const admin = await Admin.create({ name, username: name.toLowerCase(), pin, role: "owner" });
    res.status(201).json(await issueSession(admin));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login with name (or username) + 4-digit PIN
router.post("/login", async (req, res) => {
  try {
    const name = String(req.body.name || req.body.username || "").trim();
    const pin = String(req.body.pin || "");
    if (!name || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ message: "Enter your name and 4-digit PIN" });
    }

    const candidates = await Admin.find({
      $or: [{ username: name.toLowerCase() }, { name: new RegExp(`^${escapeRegex(name)}$`, "i") }],
    });

    const now = new Date();
    let matched = null;
    for (const a of candidates) {
      if (a.isLocked()) continue;
      if (await a.comparePin(pin)) {
        matched = a;
        break;
      }
    }

    if (!matched) {
      for (const a of candidates) {
        if (a.isLocked()) continue;
        a.failedAttempts = (a.failedAttempts || 0) + 1;
        if (a.failedAttempts >= MAX_ATTEMPTS) {
          a.lockUntil = new Date(now.getTime() + LOCK_MINUTES * 60 * 1000);
          a.failedAttempts = 0;
        }
        await a.save();
      }
      const allLocked = candidates.length > 0 && candidates.every((a) => a.isLocked());
      return res.status(allLocked ? 429 : 401).json({
        message: allLocked
          ? `Too many wrong attempts. Try again in ${LOCK_MINUTES} minutes.`
          : "Invalid name or PIN",
      });
    }

    matched.failedAttempts = 0;
    matched.lockUntil = null;
    await matched.save();
    res.json(await issueSession(matched));
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

/* ---------------- ANY LOGGED-IN ADMIN ---------------- */

router.use(protectAdmin);

router.post("/logout", async (req, res) => {
  await Session.deleteOne({ token: req.sessionToken });
  res.json({ message: "Logged out" });
});

router.get("/me", (req, res) => {
  res.json({ admin: shape(req.admin) });
});

/* ---------------- OWNER ONLY ---------------- */

router.get("/analytics", requireRole("owner"), async (req, res) => {
  const PAID = ["paid", "processing", "ready", "completed"];
  const [totalOrders, paidOrders, pendingOrders, totalProducts, lowStock] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: { $in: PAID } }),
    Order.countDocuments({ status: "pending_payment" }),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, stock: { $lte: 5 } }),
  ]);

  const revenueAgg = await Order.aggregate([
    { $match: { status: { $in: PAID } } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  const totalRevenue = revenueAgg[0]?.total || 0;

  const topProductsAgg = await Order.aggregate([
    { $match: { status: { $in: PAID } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.name",
        unitsSold: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: 5 },
  ]);

  const salesByDayAgg = await Order.aggregate([
    { $match: { status: { $in: PAID } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 30 },
  ]);

  res.json({
    totalOrders,
    paidOrders,
    pendingOrders,
    totalProducts,
    lowStock,
    totalRevenue,
    topProducts: topProductsAgg,
    salesByDay: salesByDayAgg,
  });
});

router.use("/users", requireRole("owner"));

router.get("/users", async (req, res) => {
  const admins = await Admin.find().select("-pin -failedAttempts -lockUntil").sort({ createdAt: -1 });
  res.json(admins);
});

router.post("/users", async (req, res) => {
  try {
    const { name, username, pin, role } = req.body;
    if (!name || !username || !pin) {
      return res.status(400).json({ message: "Name, username and PIN are required" });
    }
    if (!/^\d{4}$/.test(String(pin))) {
      return res.status(400).json({ message: "PIN must be exactly 4 digits" });
    }
    const existing = await Admin.findOne({ username: username.toLowerCase() });
    if (existing) return res.status(400).json({ message: "Username already taken" });

    const admin = await Admin.create({
      name,
      username: username.toLowerCase(),
      pin: String(pin),
      role: role === "owner" ? "owner" : "staff",
    });
    res.status(201).json(shape(admin));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/users/:id/pin", async (req, res) => {
  try {
    const pin = String(req.body.pin || "");
    if (!/^\d{4}$/.test(pin)) return res.status(400).json({ message: "PIN must be exactly 4 digits" });

    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    admin.pin = pin;
    admin.failedAttempts = 0;
    admin.lockUntil = null;
    await admin.save();

    // Force re-login everywhere (except the session making this change)
    await Session.deleteMany({ admin: admin._id, token: { $ne: req.sessionToken } });
    res.json({ message: "PIN updated" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    if (String(req.params.id) === String(req.admin._id)) {
      return res.status(400).json({ message: "You can't remove your own account" });
    }
    const target = await Admin.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "Admin not found" });

    if (target.role === "owner" && (await Admin.countDocuments({ role: "owner" })) <= 1) {
      return res.status(400).json({ message: "You can't remove the last owner" });
    }

    await Admin.findByIdAndDelete(target._id);
    await Session.deleteMany({ admin: target._id });
    res.json({ message: "Admin removed" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
