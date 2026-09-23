const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const { protectAdmin } = require("../middleware/auth");
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
        return res.status(400).json({ message: `Product unavailable: ${it.productId}` });
      }
      if (product.stock < it.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: it.quantity,
      });
      totalAmount += product.price * it.quantity;
    }

    // ensure unique 4-digit tracking code
    let trackingCode;
    let exists = true;
    while (exists) {
      trackingCode = genTrackingCode();
      exists = await Order.findOne({ trackingCode });
    }

    const order = await Order.create({
      guestId,
      items: orderItems,
      totalAmount,
      customerName,
      customerPhone,
      pickupLocation,
      customLocation: pickupLocation === "Custom" ? customLocation : "",
      trackingCode,
    });

    // Trigger M-Pesa STK Push
    try {
      const stkRes = await stkPush({
        phone: customerPhone,
        amount: totalAmount,
        accountReference: trackingCode,
        description: `Order ${trackingCode}`,
      });

      order.payment.checkoutRequestID = stkRes.CheckoutRequestID;
      order.payment.merchantRequestID = stkRes.MerchantRequestID;
      await order.save();
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

// GET /api/orders/:id/status - poll for payment/order status (by order id)
router.get("/:id/status", async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json({
    status: order.status,
    paymentStatus: order.payment.status,
    trackingCode: order.trackingCode,
  });
});

// GET /api/orders/track?phone=&code= - customer order tracking
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

// ---- Admin-only ----

// GET /api/orders - admin, list all with filters
router.get("/", protectAdmin, async (req, res) => {
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

// PUT /api/orders/:id/status - admin updates status, decrements stock when moving to "paid"
router.put("/:id/status", protectAdmin, async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });

  const wasPaidBefore = ["paid", "processing", "ready", "completed"].includes(order.status);
  order.status = status;
  await order.save();

  // decrement stock the first time an order is confirmed paid
  if (!wasPaidBefore && ["paid", "processing", "ready", "completed"].includes(status)) {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }
  }

  res.json(order);
});

module.exports = router;
