const axios = require("axios");

const SEQUENZY_URL = "https://api.sequenzy.com/api/v1/transactional/send";

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const money = (n) => `KES ${Number(n || 0).toLocaleString()}`;

/**
 * Notify the seller of a confirmed paid order via Sequenzy transactional API.
 * Never throws into the payment flow — callers should .catch() it.
 *
 * Env:
 *   SEQUENZY_API_KEY     – from Sequenzy dashboard → Settings → API Keys
 *   ORDER_NOTIFY_EMAIL   – your inbox (where order alerts go)
 *   MAIL_FROM            – optional verified from address (e.g. orders@yourdomain.com)
 */
const sendOrderEmail = async (order) => {
  const to = process.env.ORDER_NOTIFY_EMAIL;
  const apiKey = process.env.SEQUENZY_API_KEY;

  if (!to || !apiKey) {
    console.warn(
      "Order email skipped: set ORDER_NOTIFY_EMAIL and SEQUENZY_API_KEY in .env"
    );
    return;
  }

  const pickup =
    order.pickupLocation === "Custom"
      ? `Custom: ${order.customLocation || "not specified"}`
      : order.pickupLocation;

  const receipt = order.payment?.mpesaReceiptNumber || "n/a";
  const tracking = order.trackingCode;

  const lines = (order.items || []).map((i) => ({
    name: i.name,
    qty: i.quantity,
    total: i.price * i.quantity,
  }));

  const rows = lines
    .map(
      (l) =>
        `<tr><td style="padding:6px 12px 6px 0">${esc(l.qty)} &times; ${esc(l.name)}</td>` +
        `<td style="padding:6px 0;text-align:right">${esc(money(l.total))}</td></tr>`
    )
    .join("");

  // Sequenzy rejects when both body and html are set and do not match.
  // Send a single HTML body only.
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:520px">
      <h2 style="margin:0 0 4px">New confirmed order</h2>
      <p style="margin:0 0 16px;color:#666">Payment confirmed by M-Pesa.</p>

      <table style="border-collapse:collapse;margin-bottom:16px;width:100%">
        <tr>
          <td style="padding:8px 16px 8px 0;color:#666">Tracking code (PIN)</td>
          <td style="padding:8px 0;font-size:22px;font-weight:bold;letter-spacing:0.15em">${esc(tracking)}</td>
        </tr>
        <tr>
          <td style="padding:8px 16px 8px 0;color:#666">M-Pesa receipt</td>
          <td style="padding:8px 0;font-weight:600">${esc(receipt)}</td>
        </tr>
        <tr>
          <td style="padding:8px 16px 8px 0;color:#666">Customer</td>
          <td style="padding:8px 0">${esc(order.customerName)}</td>
        </tr>
        <tr>
          <td style="padding:8px 16px 8px 0;color:#666">Phone</td>
          <td style="padding:8px 0">${esc(order.customerPhone)}</td>
        </tr>
        <tr>
          <td style="padding:8px 16px 8px 0;color:#666">Pickup</td>
          <td style="padding:8px 0">${esc(pickup)}</td>
        </tr>
      </table>

      <table style="border-collapse:collapse;width:100%;border-top:1px solid #ddd">${rows}
        <tr>
          <td style="padding:10px 0 0;border-top:1px solid #ddd"><strong>Total paid</strong></td>
          <td style="padding:10px 0 0;border-top:1px solid #ddd;text-align:right">
            <strong>${esc(money(order.totalAmount))}</strong>
          </td>
        </tr>
      </table>

      <p style="margin:20px 0 0;color:#888;font-size:13px">
        Customer tracks with phone <strong>${esc(order.customerPhone)}</strong>
        + code <strong>${esc(tracking)}</strong>.
      </p>
    </div>`;

  const payload = {
    to,
    subject: `New order #${tracking} — ${money(order.totalAmount)}`,
    html,
  };

  if (process.env.MAIL_FROM) {
    payload.from = process.env.MAIL_FROM;
  }

  const { data } = await axios.post(SEQUENZY_URL, payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    timeout: 15000,
  });

  console.log(
    `[sequenzy] order email sent for tracking ${tracking}:`,
    data?.emailSendId || data?.success || "ok"
  );
  return data;
};

module.exports = { sendOrderEmail };
