import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useCart } from "../context/CartContext";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 90000;

const inputClass =
  "mt-1 w-full border border-brand-100 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 transition";

const Checkout = () => {
  const { items, totalAmount, guestId, clearCart } = useCart();
  const navigate = useNavigate();

  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    pickupLocation: "",
    customLocation: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const [waitingPayment, setWaitingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null); // 'success' | 'failed' | 'timeout'

  useEffect(() => {
    api.get("/locations").then((res) => setLocations(res.data));
  }, []);

  if (items.length === 0 && !order) {
    navigate("/cart");
    return null;
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        guestId,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        ...form,
      };
      const res = await api.post("/orders", payload);
      setOrder(res.data.order);
      toast.success("Check your phone for the M-Pesa prompt");
      pollPaymentStatus(res.data.order._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  const pollPaymentStatus = (orderId) => {
    setWaitingPayment(true);
    const start = Date.now();

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/orders/${orderId}/status`);
        if (res.data.paymentStatus === "success") {
          clearInterval(interval);
          setWaitingPayment(false);
          setPaymentResult("success");
          clearCart();
        } else if (res.data.paymentStatus === "failed") {
          clearInterval(interval);
          setWaitingPayment(false);
          setPaymentResult("failed");
        } else if (Date.now() - start > POLL_TIMEOUT_MS) {
          clearInterval(interval);
          setWaitingPayment(false);
          setPaymentResult("timeout");
        }
      } catch {
        // keep polling silently
      }
    }, POLL_INTERVAL_MS);
  };

  // ---- Payment result screens ----
  if (paymentResult === "success") {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="text-5xl mb-4"
        >
          ✅
        </motion.div>
        <h2 className="font-display italic text-2xl mb-2 text-gray-900">Payment received!</h2>
        <p className="text-gray-600 mb-2">
          Your order is confirmed. Save your tracking code:
        </p>
        <p className="text-3xl font-bold tracking-widest text-gradient my-4">
          {order.trackingCode}
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Use this code with your phone number on the Track Order page to check status.
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(`/track?phone=${order.customerPhone}&code=${order.trackingCode}`)}
          className="bg-brand-gradient text-white font-semibold py-3 px-6 rounded-xl shadow-glow hover:shadow-glow-lg transition"
        >
          Track My Order
        </motion.button>
      </div>
    );
  }

  if (paymentResult === "failed") {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="font-display italic text-2xl mb-2 text-gray-900">
          Payment failed or cancelled
        </h2>
        <p className="text-gray-600 mb-6">You can try again below.</p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setOrder(null);
            setPaymentResult(null);
          }}
          className="bg-brand-gradient text-white font-semibold py-3 px-6 rounded-xl shadow-glow hover:shadow-glow-lg transition"
        >
          Retry Payment
        </motion.button>
      </div>
    );
  }

  if (paymentResult === "timeout") {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <h2 className="font-display italic text-2xl mb-2 text-gray-900">
          Still waiting on confirmation
        </h2>
        <p className="text-gray-600 mb-6">
          If you completed the M-Pesa prompt, your order will update shortly. You can check its
          status on the Track Order page using code{" "}
          <span className="font-semibold text-brand-700">{order.trackingCode}</span>.
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(`/track?phone=${order.customerPhone}&code=${order.trackingCode}`)}
          className="bg-brand-gradient text-white font-semibold py-3 px-6 rounded-xl shadow-glow hover:shadow-glow-lg transition"
        >
          Go to Tracking
        </motion.button>
      </div>
    );
  }

  if (waitingPayment) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <motion.div
          className="h-16 w-16 mx-auto rounded-full mb-6"
          style={{
            background: "conic-gradient(from 0deg, #9333ea, #db2777, #9333ea)",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 0)",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 0)",
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
        />
        <h2 className="font-display italic text-2xl mb-2 text-gray-900">Check your phone</h2>
        <p className="text-gray-600">
          Enter your M-Pesa PIN on the prompt sent to {order?.customerPhone} to complete payment.
        </p>
      </div>
    );
  }

  // ---- Checkout form ----
  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="font-display italic text-3xl text-gray-900 mb-6">Checkout</h1>

      <div className="bg-white rounded-2xl border border-brand-100/70 shadow-sm p-4 mb-6">
        {items.map((i) => (
          <div key={i.productId} className="flex justify-between text-sm py-1">
            <span>
              {i.name} × {i.quantity}
            </span>
            <span>KES {(i.price * i.quantity).toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold border-t border-brand-100 mt-2 pt-2">
          <span>Total</span>
          <span className="text-brand-800">KES {totalAmount.toLocaleString()}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Full Name</label>
          <input
            name="customerName"
            required
            value={form.customerName}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">M-Pesa Phone Number</label>
          <input
            name="customerPhone"
            required
            placeholder="07XXXXXXXX"
            value={form.customerPhone}
            onChange={handleChange}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Pickup Location</label>
          <select
            name="pickupLocation"
            required
            value={form.pickupLocation}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Select a location</option>
            {locations.map((loc) => (
              <option key={loc._id} value={loc.name}>
                {loc.name}
              </option>
            ))}
            <option value="Custom">Custom location</option>
          </select>
        </div>

        {form.pickupLocation === "Custom" && (
          <div>
            <label className="text-sm font-medium text-gray-700">Describe your location</label>
            <input
              name="customLocation"
              required
              value={form.customLocation}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ y: -2 }}
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-gradient text-white font-semibold py-3 rounded-xl shadow-glow hover:shadow-glow-lg transition disabled:opacity-60"
        >
          {submitting ? "Sending prompt..." : `Pay KES ${totalAmount.toLocaleString()} with M-Pesa`}
        </motion.button>
      </form>
    </div>
  );
};

export default Checkout;
