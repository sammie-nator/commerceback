import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

const AdminLocations = () => {
  const [locations, setLocations] = useState([]);
  const [name, setName] = useState("");

  const load = () => api.get("/locations").then((res) => setLocations(res.data));
  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.post("/locations", { name });
      setName("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add");
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/locations/${id}`);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pickup Locations</h1>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6 max-w-md">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. CBD Pickup Point"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="bg-brand-600 text-white font-medium px-4 py-2 rounded-lg text-sm hover:bg-brand-700"
        >
          Add
        </button>
      </form>

      <div className="bg-white border border-gray-100 rounded-xl divide-y max-w-md">
        {locations.map((loc) => (
          <div key={loc._id} className="flex items-center justify-between px-4 py-3">
            <span>{loc.name}</span>
            <button
              onClick={() => handleDelete(loc._id)}
              className="text-red-500 text-sm hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
        {locations.length === 0 && (
          <p className="text-center text-gray-400 py-6 text-sm">No locations yet.</p>
        )}
      </div>
    </div>
  );
};

export default AdminLocations;
