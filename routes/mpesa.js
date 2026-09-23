const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { stkQuery } = require("../utils/mpesa");

// POST /api/mpesa/callback - Safaricom calls this after STK push completes
router.post("/callback", async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback) return res.status(400).json({ message: "Invalid callback payload" });

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = callback;

    const order = await Order.findOne({ "payment.checkoutRequestID": CheckoutRequestID });
    if (!order) {
      // Always ack 200 to Safaricom even if we can't match it, to stop retries
      return res.status(200).json({ message: "Order not found, acknowledged" });
    }

    order.payment.rawCallback = callback;

    if (ResultCode === 0) {
      const items = CallbackMetadata?.Item || [];
      const getVal = (name) => items.find((i) => i.Name === name)?.Value;

      order.payment.status = "success";
      order.payment.mpesaReceiptNumber = getVal("MpesaReceiptNumber");
      order.status = "paid";
    } else {
      order.payment.status = "failed";
      order.status = "cancelled";
    }

    await order.save();
    res.status(200).json({ message: "Callback processed" });
  } catch (err) {
    console.error("Callback error:", err.message);
    res.status(200).json({ message: "Callback received" }); // still ack
  }
});

// GET /api/mpesa/query/:checkoutRequestId - manual fallback poll
router.get("/query/:checkoutRequestId", async (req, res) => {
  try {
    const data = await stkQuery(req.params.checkoutRequestId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.response?.data || err.message });
  }
});

module.exports = router;
