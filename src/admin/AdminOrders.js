import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loader from "../components/Loader";

const STATUS_OPTIONS = [
  "pending_payment",
  "paid",
  "processing",
  "ready",
  "completed",
  "cancelled",
];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get("/orders", { params: statusFilter ? { status: statusFilter } : {} })
      .then((res) => setOrders(res.data.orders))
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      toast.success("Order updated");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Update</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-mono">{o.trackingCode}</td>
                  <td className="px-4 py-3">{o.customerName}</td>
                  <td className="px-4 py-3">{o.customerPhone}</td>
                  <td className="px-4 py-3">KES {o.totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {o.pickupLocation === "Custom" ? o.customLocation : o.pickupLocation}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full bg-gray-100 text-xs">{o.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      defaultValue=""
                      onChange={(e) => e.target.value && updateStatus(o._id, e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs"
                    >
                      <option value="">Change...</option>
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <p className="text-center text-gray-400 py-10">No orders found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
