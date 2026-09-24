const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const Admin = require("../models/Admin");

// TEMP: no login — open admin for development
// TODO: re-enable protectAdmin + sessions before production

// POST /api/admin/login — stub (frontend can still call this)
router.post("/login", async (req, res) => {
  res.json({
    token: "dev-no-auth",
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    admin: { id: "dev", name: "Dev Admin", username: "admin", role: "owner" },
  });
});

// POST /api/admin/logout — stub
router.post("/logout", async (req, res) => {
  res.json({ message: "Logged out" });
});

// GET /api/admin/me — always "logged in"
router.get("/me", async (req, res) => {
  res.json({
    admin: { id: "dev", name: "Dev Admin", username: "admin", role: "owner" },
  });
});

// GET /api/admin/analytics
router.get("/analytics", async (req, res) => {
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

// GET /api/admin/users
router.get("/users", async (req, res) => {
  const admins = await Admin.find().select("-pin").sort({ createdAt: -1 });
  res.json(admins);
});

// POST /api/admin/users
router.post("/users", async (req, res) => {
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

// PUT /api/admin/users/:id/pin
router.put("/users/:id/pin", async (req, res) => {
  try {
    const { pin } = req.body;
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    admin.pin = pin;
    await admin.save();
    res.json({ message: "PIN updated" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res) => {
  await Admin.findByIdAndDelete(req.params.id);
  res.json({ message: "Admin removed" });
});

module.exports = router;
