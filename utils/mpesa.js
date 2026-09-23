const axios = require("axios");

const BASE_URL =
  process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

let cachedToken = null;
let tokenExpiry = 0;

// OAuth token, cached until expiry
const getAccessToken = async () => {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  const { data } = await axios.get(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );

  cachedToken = data.access_token;
  // refresh a minute early
  tokenExpiry = Date.now() + (parseInt(data.expires_in, 10) - 60) * 1000;
  return cachedToken;
};

const timestamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
};

const formatPhone = (phone) => {
  let p = phone.trim().replace(/\s+/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0")) p = "254" + p.slice(1);
  if (p.startsWith("7") || p.startsWith("1")) p = "254" + p;
  return p;
};

/**
 * STK Push for a Till Number (Buy Goods). Store/agent number setups
 * use PartyB = shortcode and BusinessShortCode = shortcode as well;
 * if you're on a paybill with a store number, set MPESA_STORE_NUMBER.
 */
const stkPush = async ({ phone, amount, accountReference, description }) => {
  const token = await getAccessToken();
  const ts = timestamp();
  const shortcode = process.env.MPESA_SHORTCODE;
  const password = Buffer.from(
    `${shortcode}${process.env.MPESA_PASSKEY}${ts}`
  ).toString("base64");

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: ts,
    TransactionType: process.env.MPESA_TRANSACTION_TYPE || "CustomerBuyGoodsOnline",
    Amount: Math.round(amount),
    PartyA: formatPhone(phone),
    PartyB: process.env.MPESA_STORE_NUMBER || shortcode,
    PhoneNumber: formatPhone(phone),
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: accountReference.slice(0, 12),
    TransactionDesc: description || "Order Payment",
  };

  const { data } = await axios.post(
    `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return data; // contains CheckoutRequestID, MerchantRequestID
};

const stkQuery = async (checkoutRequestID) => {
  const token = await getAccessToken();
  const ts = timestamp();
  const shortcode = process.env.MPESA_SHORTCODE;
  const password = Buffer.from(
    `${shortcode}${process.env.MPESA_PASSKEY}${ts}`
  ).toString("base64");

  const { data } = await axios.post(
    `${BASE_URL}/mpesa/stkpushquery/v1/query`,
    {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      CheckoutRequestID: checkoutRequestID,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return data;
};

module.exports = { stkPush, stkQuery, formatPhone };
