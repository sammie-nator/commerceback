import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../api/axios";

const STATUS_STEPS = ["paid", "processing", "ready", "completed"];
const STATUS_LABELS = {
  pending_payment: "Awaiting Payment",
  paid: "Payment Confirmed",
  processing: "Preparing Order",
  ready: "Ready for Pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

const inputClass =
  "mt-1 w-full border border-brand-100 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 transition";

const OrderTracking = () => {
  const [params] = useSearchParams();
  const [phone, setPhone] = useState(params.get("phone") || "");
  const [code, setCode] = useState(params.get("code") || "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setOrder(null);
    try {
      const res = await api.get("/orders/track", { params: { phone, code } });
      setOrder(res.data.order);
    } catch (err) {
      toast.error(err.response?.data?.message || "Order not found");
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="font-display italic text-3xl text-gray-900 mb-6">Track Your Order</h1>

      <form onSubmit={handleSearch} className="space-y-4 mb-8">
        <div>
          <label className="text-sm font-medium text-gray-700">Phone Number</label>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07XXXXXXXX"
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">4-Digit Tracking Code</label>
          <input
            required
            maxLength={4}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={`${inputClass} tracking-widest`}
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ y: -2 }}
          type="submit"
          disabled={loading}
          className="w-full bg-brand-gradient text-white font-semibold py-3 rounded-xl shadow-glow hover:shadow-glow-lg transition disabled:opacity-60"
        >
          {loading ? "Searching..." : "Track Order"}
        </motion.button>
      </form>

      {order && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-brand-100/70 shadow-sm p-5"
        >
          <p className="text-sm text-gray-500">Order for {order.customerName}</p>
          <p className="font-display italic text-xl mb-4 text-gray-900">
            {STATUS_LABELS[order.status]}
          </p>

          {order.status !== "cancelled" && order.status !== "pending_payment" && (
            <div className="flex items-center justify-between mb-6">
              {STATUS_STEPS.map((step, idx) => (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center flex-1">
                    <motion.div
                      initial={false}
                      animate={{ scale: idx === currentStepIndex ? 1.3 : 1 }}
                      className={`h-3 w-3 rounded-full ${
                        idx <= currentStepIndex ? "bg-brand-gradient" : "bg-gray-200"
                      }`}
                    />
                    <span className="text-[10px] text-gray-500 mt-1 text-center">
                      {STATUS_LABELS[step]}
                    </span>
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 -mt-4 ${
                        idx < currentStepIndex ? "bg-brand-gradient" : "bg-gray-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          <div className="border-t border-brand-100 pt-4 space-y-1 text-sm">
            {order.items.map((i, idx) => (
              <div key={idx} className="flex justify-between">
                <span>
                  {i.name} × {i.quantity}
                </span>
                <span>KES {(i.price * i.quantity).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-2">
              <span>Total</span>
              <span className="text-brand-800">KES {order.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Pickup: {order.pickupLocation === "Custom" ? order.customLocation : order.pickupLocation}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default OrderTracking;
