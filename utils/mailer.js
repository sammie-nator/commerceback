const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT || 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // 465 = implicit TLS, 587 = STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
};

// Customer-supplied text (name, custom pickup spot) ends up in HTML, so escape it
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const money = (n) => `KES ${Number(n || 0).toLocaleString()}`;

/**
 * Emails the seller a confirmed order. Never throws into the payment flow:
 * callers should still .catch() it, but a missing config only logs a warning.
 */
const sendOrderEmail = async (order) => {
  const to = process.env.ORDER_NOTIFY_EMAIL;
  if (!to || !process.env.SMTP_HOST) {
    console.warn("Order email skipped: set ORDER_NOTIFY_EMAIL and SMTP_* in .env");
    return;
  }

  const pickup =
    order.pickupLocation === "Custom"
      ? `Custom: ${order.customLocation || "not specified"}`
      : order.pickupLocation;

  const lines = order.items.map((i) => ({
    name: i.name,
    qty: i.quantity,
    total: i.price * i.quantity,
  }));

  const text = [
    `New confirmed order - tracking code ${order.trackingCode}`,
    "",
    `Customer: ${order.customerName}`,
    `Phone: ${order.customerPhone}`,
    `Pickup: ${pickup}`,
    `M-Pesa receipt: ${order.payment?.mpesaReceiptNumber || "n/a"}`,
    "",
    ...lines.map((l) => `${l.qty} x ${l.name} - ${money(l.total)}`),
    "",
    `Total paid: ${money(order.totalAmount)}`,
  ].join("\n");

  const rows = lines
    .map(
      (l) =>
        `<tr><td style="padding:6px 12px 6px 0">${esc(l.qty)} &times; ${esc(l.name)}</td>` +
        `<td style="padding:6px 0;text-align:right">${esc(money(l.total))}</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:520px">
      <h2 style="margin:0 0 4px">New confirmed order</h2>
      <p style="margin:0 0 16px;color:#666">Payment confirmed by M-Pesa. Tracking code
        <strong style="font-size:18px;color:#222">${esc(order.trackingCode)}</strong></p>
      <table style="border-collapse:collapse;margin-bottom:16px">
        <tr><td style="padding:4px 16px 4px 0;color:#666">Customer</td><td>${esc(order.customerName)}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#666">Phone</td><td>${esc(order.customerPhone)}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#666">Pickup</td><td>${esc(pickup)}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;color:#666">M-Pesa receipt</td><td>${esc(order.payment?.mpesaReceiptNumber || "n/a")}</td></tr>
      </table>
      <table style="border-collapse:collapse;width:100%;border-top:1px solid #ddd">${rows}
        <tr><td style="padding:10px 0 0;border-top:1px solid #ddd"><strong>Total paid</strong></td>
            <td style="padding:10px 0 0;border-top:1px solid #ddd;text-align:right"><strong>${esc(money(order.totalAmount))}</strong></td></tr>
      </table>
    </div>`;

  await getTransporter().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: `New confirmed order #${order.trackingCode} - ${money(order.totalAmount)}`,
    text,
    html,
  });
};

module.exports = { sendOrderEmail };
