const mongoose = require("mongoose");
const crypto = require("crypto");

const checkoutItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: String,
    price: Number,
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

/**
 * A Checkout is a payment ATTEMPT, not an order. It holds the cart while the
 * customer answers the M-Pesa prompt. An Order is only created from it once
 * Daraja's callback confirms the payment (see utils/confirmCheckout.js).
 */
const checkoutSchema = new mongoose.Schema(
  {
    // Random, unguessable reference the frontend uses to poll / show the confirmation page
    publicId: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(12).toString("hex"),
    },

    guestId: { type: String, required: true, index: true },
    items: [checkoutItemSchema],
    totalAmount: { type: Number, required: true },

    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },

    pickupLocation: { type: String, required: true },
    customLocation: { type: String, default: "" },

    checkoutRequestID: { type: String, index: true },
    merchantRequestID: String,

    // pending    -> STK prompt sent, waiting for the customer / Daraja
    // confirming -> callback received, order is being created (internal lock)
    // confirmed  -> Daraja confirmed payment, `order` is set
    // failed     -> cancelled / insufficient funds / timed out / prompt never sent
    status: {
      type: String,
      enum: ["pending", "confirming", "confirmed", "failed"],
      default: "pending",
    },
    failureReason: String,

    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    rawCallback: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

// Abandoned attempts clean themselves up after 7 days (confirmed orders live on in Orders)
checkoutSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

module.exports = mongoose.model("Checkout", checkoutSchema);
