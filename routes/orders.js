const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Checkout = require("../models/Checkout");
const Product = require("../models/Product");
const { stkPush } = require("../utils/mpesa");

// POST /api/orders - start a checkout + trigger the STK push.
// NOTE: no Order exists yet. It is created by the Daraja callback once the
// payment is confirmed (see utils/confirmCheckout.js).
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

    const checkout = await Checkout.create({
      guestId,
      items: orderItems,
      totalAmount,
      customerName,
      customerPhone,
      pickupLocation,
      customLocation,
    });

    try {
      const stk = await stkPush({
        phone: customerPhone,
        amount: totalAmount,
        accountReference: checkout.publicId, // trimmed to 12 chars in utils/mpesa.js
        description: "Order payment",
      });

      if (String(stk.ResponseCode) !== "0") {
        throw new Error(stk.ResponseDescription || "STK push was not accepted");
      }

      // This is what lets the callback find the checkout later
      checkout.checkoutRequestID = stk.CheckoutRequestID;
      checkout.merchantRequestID = stk.MerchantRequestID;
      await checkout.save();
    } catch (mpesaErr) {
      console.error("STK push failed:", mpesaErr.response?.data || mpesaErr.message);
      checkout.status = "failed";
      checkout.failureReason = "The M-Pesa prompt could not be sent";
      await checkout.save();
      return res.status(502).json({
        message: "We couldn't send the M-Pesa prompt. Please check your number and try again.",
        checkoutId: checkout.publicId,
        status: "failed",
      });
    }

    res.status(201).json({
      checkoutId: checkout.publicId,
      message: "M-Pesa prompt sent. Enter your PIN on your phone to confirm.",
      status: "pending",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/orders/checkout/:checkoutId - poll payment state / confirmation details
// Frontend should poll this every 2–3s after checkout until status is confirmed or failed.
//
// Responses:
//   { status: "pending" }
//   { status: "confirmed", order: { trackingCode, receipt, ... } }
//   { status: "failed", message: "..." }
router.get("/checkout/:checkoutId", async (req, res) => {
  try {
    const checkout = await Checkout.findOne({ publicId: req.params.checkoutId }).populate("order");
    if (!checkout) return res.status(404).json({ message: "Checkout not found" });

    if (checkout.status === "confirmed" && checkout.order) {
      const o = checkout.order;
      return res.json({
        status: "confirmed",
        order: {
          trackingCode: o.trackingCode,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          totalAmount: o.totalAmount,
          items: o.items,
          pickupLocation: o.pickupLocation,
          customLocation: o.customLocation,
          receipt: o.payment?.mpesaReceiptNumber,
          createdAt: o.createdAt,
        },
      });
    }

    if (checkout.status === "failed") {
      return res.json({
        status: "failed",
        message: checkout.failureReason || "Payment was not completed",
      });
    }

    // "pending" and the internal "confirming" state both look like "waiting" to the client
    res.json({ status: "pending" });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
