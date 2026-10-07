const Checkout = require("../models/Checkout");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { sendOrderEmail } = require("./mailer");

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
 * Shared path that turns a pending checkout into a paid Order.
 * Used by both the Safaricom callback and the STK-query fallback on poll.
 */
const finalizePaidCheckout = async (checkout, { receipt, raw }) => {
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
        mpesaReceiptNumber: receipt || undefined,
        status: "success",
        rawCallback: raw,
      },
    });
  } catch (err) {
    console.error(
      `PAID BUT ORDER NOT SAVED - receipt ${receipt}, phone ${checkout.customerPhone}, ` +
        `checkout ${checkout.publicId}: ${err.message}`
    );
    throw err;
  }

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
  if (raw) checkout.rawCallback = raw;
  await checkout.save();

  // Fire-and-forget: email must never undo a confirmed order
  sendOrderEmail(order).catch((err) =>
    console.error(
      `Order email failed for ${order.trackingCode}:`,
      err.response?.data || err.message
    )
  );

  return order;
};

/**
 * Handles Safaricom's STK callback.
 * An Order is only created when Daraja reports a successful payment.
 */
const handleStkCallback = async (callback) => {
  const { CheckoutRequestID, ResultCode, ResultDesc } = callback;

  console.log(
    `[mpesa callback] CheckoutRequestID=${CheckoutRequestID} ResultCode=${ResultCode} ResultDesc=${ResultDesc}`
  );

  // Claim the checkout atomically (prevents double-processing)
  const checkout = await Checkout.findOneAndUpdate(
    { checkoutRequestID: CheckoutRequestID, status: "pending" },
    { $set: { status: "confirming", rawCallback: callback } },
    { new: true }
  );
  if (!checkout) {
    console.log(
      `[mpesa callback] no pending checkout for ${CheckoutRequestID} (already handled or unknown)`
    );
    return { handled: false };
  }

  // Payment failed / cancelled
  if (Number(ResultCode) !== 0) {
    checkout.status = "failed";
    checkout.failureReason = ResultDesc || "Payment was not completed";
    await checkout.save();
    console.log(`[mpesa callback] marked failed: ${checkout.publicId}`);
    return { handled: true, confirmed: false };
  }

  const receipt = metaValue(callback, "MpesaReceiptNumber");
  const paidAmount = Number(metaValue(callback, "Amount"));

  // Amount sanity check (callback path only — query fallback may not have amount)
  if (receipt && paidAmount && paidAmount !== Math.round(checkout.totalAmount)) {
    console.error(
      `Callback ignored for checkout ${checkout.publicId}: receipt=${receipt}, ` +
        `paid=${paidAmount}, expected=${Math.round(checkout.totalAmount)}`
    );
    checkout.status = "pending";
    await checkout.save();
    return { handled: false };
  }

  const order = await finalizePaidCheckout(checkout, { receipt, raw: callback });
  console.log(
    `[mpesa callback] confirmed order ${order.trackingCode} for checkout ${checkout.publicId}`
  );
  return { handled: true, confirmed: true, order };
};

/**
 * Fallback used when the callback never arrives (common in local/dev or misconfigured URL).
 * Call Daraja STK Query; if ResultCode is 0, create the order the same way the callback would.
 */
const confirmFromStkQuery = async (checkout, queryResult) => {
  if (!checkout || checkout.status !== "pending") return null;

  const resultCode = String(queryResult.ResultCode ?? "");
  // "0" = success. Other codes mean still processing, cancelled, failed, etc.
  if (resultCode !== "0") {
    // Terminal failure codes from Daraja query (not exhaustive, but common ones)
    const failedCodes = new Set(["1032", "1037", "1", "2001", "17"]);
    if (failedCodes.has(resultCode)) {
      const claimed = await Checkout.findOneAndUpdate(
        { _id: checkout._id, status: "pending" },
        {
          $set: {
            status: "failed",
            failureReason: queryResult.ResultDesc || "Payment was not completed",
            rawCallback: queryResult,
          },
        },
        { new: true }
      );
      if (claimed) {
        console.log(
          `[stk query] marked failed ${checkout.publicId}: ${resultCode} ${queryResult.ResultDesc}`
        );
      }
    }
    return null;
  }

  // Success via query — claim and finalize
  const claimed = await Checkout.findOneAndUpdate(
    { _id: checkout._id, status: "pending" },
    { $set: { status: "confirming", rawCallback: queryResult } },
    { new: true }
  );
  if (!claimed) return null;

  const receipt =
    queryResult.MpesaReceiptNumber || queryResult.mpesaReceiptNumber || undefined;

  const order = await finalizePaidCheckout(claimed, { receipt, raw: queryResult });
  console.log(`[stk query] confirmed order ${order.trackingCode} for checkout ${claimed.publicId}`);
  return order;
};

module.exports = { handleStkCallback, confirmFromStkQuery };
