import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { imageUrl } from "../utils/imageUrl";
import Loader from "../components/Loader";

const emptyForm = {
  name: "",
  description: "",
  category: "",
  price: "",
  stock: "",
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get("/products", { params: { limit: 100 } })
      .then((res) => setProducts(res.data.products))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const resetForm = () => {
    setForm(emptyForm);
    setFiles([]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    files.forEach((f) => fd.append("images", f));

    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Product updated");
      } else {
        await api.post("/products", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Product created");
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    }
  };

  const handleEdit = (p) => {
    setForm({
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.price,
      stock: p.stock,
    });
    setEditingId(p._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
          className="bg-brand-600 text-white font-medium px-4 py-2 rounded-lg text-sm hover:bg-brand-700"
        >
          {showForm ? "Cancel" : "+ New Product"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-100 rounded-xl p-5 mb-6 grid sm:grid-cols-2 gap-4"
        >
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2"
          />
          <input
            required
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2"
          />
          <input
            required
            type="number"
            min="0"
            placeholder="Price (KES)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2"
          />
          <input
            required
            type="number"
            min="0"
            placeholder="Stock quantity"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 sm:col-span-2"
            rows={3}
          />
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setFiles(Array.from(e.target.files))}
            className="sm:col-span-2 text-sm"
          />
          <button
            type="submit"
            className="sm:col-span-2 bg-brand-600 text-white font-semibold py-2.5 rounded-lg hover:bg-brand-700"
          >
            {editingId ? "Update Product" : "Create Product"}
          </button>
        </form>
      )}

      {loading ? (
        <Loader />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p._id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <img
                src={imageUrl(p.images?.[0])}
                alt={p.name}
                className="h-36 w-full object-cover"
              />
              <div className="p-3">
                <p className="font-semibold">{p.name}</p>
                <p className="text-xs text-gray-500">{p.category}</p>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="font-bold">KES {p.price.toLocaleString()}</span>
                  <span className="text-gray-500">{p.stock} in stock</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(p)}
                    className="flex-1 text-xs border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="flex-1 text-xs border border-red-200 text-red-500 rounded-lg py-1.5 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
