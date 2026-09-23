const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: String,
    price: Number,
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    guestId: { type: String, required: true, index: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },

    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true, index: true },

    pickupLocation: { type: String, required: true }, // fixed location name or "Custom"
    customLocation: { type: String, default: "" },

    // 4-digit code used with phone number for order tracking
    trackingCode: { type: String, required: true, unique: true },

    status: {
      type: String,
      enum: ["pending_payment", "paid", "processing", "ready", "completed", "cancelled"],
      default: "pending_payment",
    },

    payment: {
      method: { type: String, default: "mpesa" },
      checkoutRequestID: String,
      merchantRequestID: String,
      mpesaReceiptNumber: String,
      status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
      rawCallback: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
