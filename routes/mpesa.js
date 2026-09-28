const express = require("express");
const router = express.Router();
const { stkQuery } = require("../utils/mpesa");
const { handleStkCallback } = require("../utils/confirmCheckout");

// POST /api/mpesa/callback - Safaricom calls this after STK push completes.
// An Order is only created here, when Daraja confirms the payment.
router.post("/callback", async (req, res) => {
  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback) return res.status(400).json({ message: "Invalid callback payload" });

    await handleStkCallback(callback);
    res.status(200).json({ message: "Callback processed" });
  } catch (err) {
    console.error("Callback error:", err.message);
    // Always ack 200 to Safaricom, even on our own errors, to stop retries
    res.status(200).json({ message: "Callback received" });
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
