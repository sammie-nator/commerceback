const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const { stkPush } = require("../utils/mpesa");

const genTrackingCode = () => String(Math.floor(1000 + Math.random() * 9000));

// POST /api/orders  - create order + trigger STK push
router.post("/", async (req, res) => {
  try {
    const {
      guestId,
      items, // [{ productId, quantity }]
      customerName,
      customerPhone,
      pickupLocation,
      customLocation,
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Recompute prices from DB (never trust client prices)
    const orderItems = [];
    let totalAmount = 0;

    for (const it of items) {
      const product = await Product.findById(it.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ message: `Product not available: ${it.productId}` });
      }
      if (product.stock < it.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      const lineTotal = product.price * it.quantity;
      totalAmount += lineTotal;
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: it.quantity,
      });
    }

    const trackingCode = genTrackingCode();

    const order = await Order.create({
      guestId,
      items: orderItems,
      totalAmount,
      customerName,
      customerPhone,
      pickupLocation,
      customLocation,
      trackingCode,
      status: "pending_payment",
      payment: { status: "pending" },
    });

    try {
      await stkPush({
        phone: customerPhone,
        amount: totalAmount,
        accountReference: String(order._id),
        transactionDesc: `Order ${trackingCode}`,
      });
    } catch (mpesaErr) {
      console.error("STK push failed:", mpesaErr.response?.data || mpesaErr.message);
      return res.status(502).json({
        message: "Order created but payment prompt failed to send. Please retry payment.",
        order,
      });
    }

    res.status(201).json({ order });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/orders/track?phone=&code=
router.get("/track", async (req, res) => {
  const { phone, code } = req.query;
  if (!phone || !code) {
    return res.status(400).json({ message: "Phone and tracking code are required" });
  }
  const order = await Order.findOne({ customerPhone: phone, trackingCode: code }).sort({
    createdAt: -1,
  });
  if (!order) return res.status(404).json({ message: "No matching order found" });
  res.json({ order });
});

// GET /api/orders/:id/status
router.get("/:id/status", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json({
    status: order.status,
    paymentStatus: order.payment.status,
    trackingCode: order.trackingCode,
  });
});

// ---- Admin (no auth for now) ----

// GET /api/orders
router.get("/", async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Order.countDocuments(filter),
  ]);
  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// PUT /api/orders/:id/status
router.put("/:id/status", async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  const wasPaidBefore = ["paid", "processing", "ready", "completed"].includes(order.status);
  order.status = status;
  await order.save();

  if (!wasPaidBefore && ["paid", "processing", "ready", "completed"].includes(status)) {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }
  }

  res.json(order);
});

module.exports = router;
