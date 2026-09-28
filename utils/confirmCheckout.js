const Checkout = require("../models/Checkout");
const Order = require("../models/Order");
const Product = require("../models/Product");

const genTrackingCode = () => String(Math.floor(1000 + Math.random() * 9000));

// trackingCode is unique on the Order model, so retry if we land on a taken code
const createOrderWithUniqueCode = async (data) => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      return await Order.create({ ...data, trackingCode: genTrackingCode() });
    } catch (err) {
      const isCodeClash = err.code === 11000 && err.keyPattern?.trackingCode;
      if (!isCodeClash) throw err;
    }
  }
  throw new Error("Could not allocate a unique tracking code");
};

const metaValue = (callback, name) =>
  callback.CallbackMetadata?.Item?.find((i) => i.Name === name)?.Value;

/**
 * Handles Safaricom's STK callback.
 *
 * This is the ONLY place an Order is created, and only when Daraja reports a
 * successful payment for a pending Checkout.
 */
const handleStkCallback = async (callback) => {
  const { CheckoutRequestID, ResultCode, ResultDesc } = callback;

  // Claim the checkout atomically. Safaricom can deliver a callback twice, and
  // only the first one may create an order.
  const checkout = await Checkout.findOneAndUpdate(
    { checkoutRequestID: CheckoutRequestID, status: "pending" },
    { $set: { status: "confirming", rawCallback: callback } },
    { new: true }
  );
  if (!checkout) return { handled: false };

  // Payment failed / cancelled: no order is ever created
  if (Number(ResultCode) !== 0) {
    checkout.status = "failed";
    checkout.failureReason = ResultDesc || "Payment was not completed";
    await checkout.save();
    return { handled: true, confirmed: false };
  }

  const receipt = metaValue(callback, "MpesaReceiptNumber");
  const paidAmount = Number(metaValue(callback, "Amount"));

  // Sanity check: what was paid must match what we asked for. A mismatch means
  // this isn't a genuine callback, so release the claim and ignore it.
  if (!receipt || paidAmount !== Math.round(checkout.totalAmount)) {
    console.error(
      `Callback ignored for checkout ${checkout.publicId}: receipt=${receipt}, ` +
        `paid=${paidAmount}, expected=${Math.round(checkout.totalAmount)}`
    );
    checkout.status = "pending";
    await checkout.save();
    return { handled: false };
  }

  let order;
  try {
    order = await createOrderWithUniqueCode({
      guestId: checkout.guestId,
      items: checkout.items,
      totalAmount: checkout.totalAmount,
      customerName: checkout.customerName,
      customerPhone: checkout.customerPhone,
      pickupLocation: checkout.pickupLocation,
      customLocation: checkout.customLocation,
      status: "paid",
      payment: {
        method: "mpesa",
        checkoutRequestID: checkout.checkoutRequestID,
        merchantRequestID: checkout.merchantRequestID,
        mpesaReceiptNumber: receipt,
        status: "success",
        rawCallback: callback,
      },
    });
  } catch (err) {
    // Money was received but the order couldn't be saved. The checkout stays in
    // "confirming" with the raw callback stored, so nothing is lost silently.
    console.error(
      `PAID BUT ORDER NOT SAVED - receipt ${receipt}, phone ${checkout.customerPhone}, ` +
        `checkout ${checkout.publicId}: ${err.message}`
    );
    throw err;
  }

  // Paid orders reduce stock here (the admin status route only does it on a
  // non-paid -> paid change, which the callback path never triggers).
  try {
    for (const item of order.items) {
      await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } });
      await Product.updateOne({ _id: item.product, stock: { $lt: 0 } }, { $set: { stock: 0 } });
    }
  } catch (err) {
    console.error(`Stock update failed for order ${order.trackingCode}:`, err.message);
  }

  checkout.status = "confirmed";
  checkout.order = order._id;
  await checkout.save();

  return { handled: true, confirmed: true, order };
};

module.exports = { handleStkCallback };
