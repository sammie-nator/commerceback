import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useCart } from "../context/CartContext";
import { imageUrl } from "../utils/imageUrl";
import Loader from "../components/Loader";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader label="Loading product..." />;
  if (!product) return <p className="text-center py-20">Product not found.</p>;

  const handleAdd = () => {
    addItem(product, qty);
    toast.success(`${product.name} added to cart`);
  };

  const handleBuyNow = () => {
    addItem(product, qty);
    navigate("/checkout");
  };

  const images = product.images || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-10">
      <div>
        <div className="relative aspect-square bg-brand-50 rounded-3xl overflow-hidden mb-3 shadow-sm">
          <AnimatePresence mode="wait">
            <motion.img
              key={activeImg}
              src={imageUrl(images[activeImg])}
              alt={product.name}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              drag={images.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(e, info) => {
                if (info.offset.x < -60) setActiveImg((i) => Math.min(images.length - 1, i + 1));
                else if (info.offset.x > 60) setActiveImg((i) => Math.max(0, i - 1));
              }}
              className="w-full h-full object-cover cursor-grab active:cursor-grabbing"
            />
          </AnimatePresence>
        </div>
        <div className="flex gap-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImg(idx)}
              className={`h-16 w-16 rounded-xl overflow-hidden border-2 transition ${
                activeImg === idx ? "border-brand-600 shadow-glow" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={imageUrl(img)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs text-accent-600 font-semibold uppercase tracking-wider">
          {product.category}
        </p>
        <h1 className="font-display italic text-3xl mt-1 text-gray-900">{product.name}</h1>
        <p className="text-2xl font-semibold text-brand-800 mt-4">
          KES {product.price.toLocaleString()}
        </p>
        <p className="text-gray-600 mt-4 leading-relaxed">{product.description}</p>

        <p className="text-sm mt-4 text-gray-500">
          {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
        </p>

        {product.stock > 0 && (
          <>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="h-9 w-9 rounded-full border border-brand-200 hover:bg-brand-50 transition"
              >
                −
              </button>
              <span className="w-8 text-center font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                className="h-9 w-9 rounded-full border border-brand-200 hover:bg-brand-50 transition"
              >
                +
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ y: -2 }}
                onClick={handleAdd}
                className="flex-1 border-2 border-brand-600 text-brand-700 font-semibold py-3 rounded-xl hover:bg-brand-50 transition"
              >
                Add to Cart
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ y: -2 }}
                onClick={handleBuyNow}
                className="flex-1 bg-brand-gradient text-white font-semibold py-3 rounded-xl shadow-glow hover:shadow-glow-lg transition"
              >
                Buy Now
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ProductDetail;
