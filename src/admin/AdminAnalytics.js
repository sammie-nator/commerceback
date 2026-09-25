import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../api/axios";
import Loader from "../components/Loader";

const StatCard = ({ label, value }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl border border-gray-100 p-5"
  >
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </motion.div>
);

const AdminAnalytics = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/analytics").then((res) => setData(res.data));
  }, []);

  if (!data) return <Loader label="Loading analytics..." />;

  const maxDay = Math.max(...data.salesByDay.map((d) => d.revenue), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Revenue" value={`KES ${data.totalRevenue.toLocaleString()}`} />
        <StatCard label="Total Orders" value={data.totalOrders} />
        <StatCard label="Paid Orders" value={data.paidOrders} />
        <StatCard label="Pending Payment" value={data.pendingOrders} />
        <StatCard label="Low Stock Items" value={data.lowStock} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold mb-4">Revenue (last 30 days)</h3>
          <div className="flex items-end gap-1 h-40">
            {data.salesByDay.map((d) => (
              <div key={d._id} className="flex-1 flex flex-col items-center justify-end group">
                <div
                  className="w-full bg-brand-500 rounded-t hover:bg-brand-600 transition"
                  style={{ height: `${(d.revenue / maxDay) * 100}%` }}
                  title={`${d._id}: KES ${d.revenue}`}
                />
              </div>
            ))}
          </div>
          {data.salesByDay.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-10">No sales yet.</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold mb-4">Top Products</h3>
          <div className="space-y-3">
            {data.topProducts.map((p) => (
              <div key={p._id} className="flex justify-between text-sm">
                <span>{p._id}</span>
                <span className="text-gray-500">
                  {p.unitsSold} sold · KES {p.revenue.toLocaleString()}
                </span>
              </div>
            ))}
            {data.topProducts.length === 0 && (
              <p className="text-sm text-gray-400">No sales yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
