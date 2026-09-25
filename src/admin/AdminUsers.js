import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loader from "../components/Loader";

const emptyForm = { name: "", username: "", pin: "", role: "staff" };

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get("/admin/users")
      .then((res) => setUsers(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(form.pin)) {
      toast.error("PIN must be exactly 4 digits");
      return;
    }
    try {
      await api.post("/admin/users", form);
      toast.success("Staff user created");
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user");
    }
  };

  const handleResetPin = async (id) => {
    const newPin = window.prompt("Enter a new 4-digit PIN for this user:");
    if (!newPin) return;
    if (!/^\d{4}$/.test(newPin)) {
      toast.error("PIN must be exactly 4 digits");
      return;
    }
    try {
      await api.put(`/admin/users/${id}/pin`, { pin: newPin });
      toast.success("PIN updated — they'll need to log in again");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset PIN");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this staff user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success("User removed");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Staff & PINs</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="bg-brand-600 text-white font-medium px-4 py-2 rounded-lg text-sm hover:bg-brand-700"
        >
          {showForm ? "Cancel" : "+ New Staff User"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-gray-100 rounded-xl p-5 mb-6 grid sm:grid-cols-2 gap-4"
        >
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2"
          />
          <input
            required
            placeholder="Username (for login)"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2"
          />
          <input
            required
            placeholder="4-digit PIN"
            maxLength={4}
            inputMode="numeric"
            value={form.pin}
            onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })}
            className="border border-gray-200 rounded-lg px-3 py-2 tracking-widest"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2"
          >
            <option value="staff">Staff</option>
            <option value="owner">Owner</option>
          </select>
          <button
            type="submit"
            className="sm:col-span-2 bg-brand-600 text-white font-semibold py-2.5 rounded-lg hover:bg-brand-700"
          >
            Create Staff User
          </button>
        </form>
      )}

      {loading ? (
        <Loader />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.username}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full bg-gray-100 text-xs">{u.role}</span>
                  </td>
                  <td className="px-4 py-3 flex gap-3">
                    <button
                      onClick={() => handleResetPin(u._id)}
                      className="text-brand-600 text-xs hover:underline"
                    >
                      Reset PIN
                    </button>
                    <button
                      onClick={() => handleDelete(u._id)}
                      className="text-red-500 text-xs hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-center text-gray-400 py-10">No staff users yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
