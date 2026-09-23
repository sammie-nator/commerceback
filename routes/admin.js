const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const Admin = require("../models/Admin");
const Session = require("../models/Session");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { protectAdmin } = require("../middleware/auth");

const SESSION_TTL_HOURS = 12;

const createSession = async (adminId) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
  await Session.create({ token, admin: adminId, expiresAt });
  return { token, expiresAt };
};

// POST /api/admin/login  { username, pin }
router.post("/login", async (req, res) => {
  try {
    const { username, pin } = req.body;
    if (!username || !/^\d{4}$/.test(pin || "")) {
      return res.status(400).json({ message: "Username and 4-digit PIN are required" });
    }
    const admin = await Admin.findOne({ username: username.toLowerCase() });
    if (!admin || !(await admin.comparePin(pin))) {
      return res.status(401).json({ message: "Invalid username or PIN" });
    }
    const { token, expiresAt } = await createSession(admin._id);
    res.json({
      token,
      expiresAt,
      admin: { id: admin._id, name: admin.name, username: admin.username, role: admin.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/logout - invalidate current session
router.post("/logout", protectAdmin, async (req, res) => {
  await Session.deleteOne({ token: req.sessionToken });
  res.json({ message: "Logged out" });
});

// GET /api/admin/me - confirm current session + who's logged in
router.get("/me", protectAdmin, async (req, res) => {
  res.json({ admin: req.admin });
});

// GET /api/admin/analytics - dashboard metrics
router.get("/analytics", protectAdmin, async (req, res) => {
  const [totalOrders, paidOrders, pendingOrders, totalProducts, lowStock] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: { $in: ["paid", "processing", "ready", "completed"] } }),
    Order.countDocuments({ status: "pending_payment" }),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, stock: { $lte: 5 } }),
  ]);

  const revenueAgg = await Order.aggregate([
    { $match: { status: { $in: ["paid", "processing", "ready", "completed"] } } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  const totalRevenue = revenueAgg[0]?.total || 0;

  const topProductsAgg = await Order.aggregate([
    { $match: { status: { $in: ["paid", "processing", "ready", "completed"] } } },
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
    { $match: { status: { $in: ["paid", "processing", "ready", "completed"] } } },
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

// ---- Staff (admin user) management ----

// GET /api/admin/users - list staff (no PINs returned)
router.get("/users", protectAdmin, async (req, res) => {
  const admins = await Admin.find().select("-pin").sort({ createdAt: -1 });
  res.json(admins);
});

// POST /api/admin/users - create a new staff user with a 4-digit PIN
router.post("/users", protectAdmin, async (req, res) => {
  try {
    const { name, username, pin, role } = req.body;
    if (!name || !username || !pin) {
      return res.status(400).json({ message: "Name, username and PIN are required" });
    }
    const existing = await Admin.findOne({ username: username.toLowerCase() });
    if (existing) return res.status(400).json({ message: "Username already taken" });

    const admin = await Admin.create({
      name,
      username: username.toLowerCase(),
      pin,
      role: role === "owner" ? "owner" : "staff",
    });
    res
      .status(201)
      .json({ id: admin._id, name: admin.name, username: admin.username, role: admin.role });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id/pin - reset a staff member's PIN
router.put("/users/:id/pin", protectAdmin, async (req, res) => {
  try {
    const { pin } = req.body;
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    admin.pin = pin; // re-hashed by pre-save hook
    await admin.save();
    // force re-login everywhere for this admin
    await Session.deleteMany({ admin: admin._id });
    res.json({ message: "PIN updated" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id - remove a staff user
router.delete("/users/:id", protectAdmin, async (req, res) => {
  if (req.params.id === String(req.admin._id)) {
    return res.status(400).json({ message: "You can't delete your own account while logged in" });
  }
  await Admin.findByIdAndDelete(req.params.id);
  await Session.deleteMany({ admin: req.params.id });
  res.json({ message: "Admin removed" });
});

module.exports = router;
