import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { imageUrl } from "../utils/imageUrl";

const Cart = () => {
  const { items, updateQuantity, removeItem, totalAmount } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="h-16 w-16 rounded-full bg-brand-gradient-soft mx-auto mb-5 flex items-center justify-center text-2xl"
        >
          🛍️
        </motion.div>
        <p className="text-gray-500 mb-4">Your cart is empty.</p>
        <Link to="/" className="text-brand-600 font-semibold hover:text-brand-700 hover:underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display italic text-3xl text-gray-900 mb-6">Your Cart</h1>
      <div className="space-y-4">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.productId}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex items-center gap-4 bg-white rounded-2xl p-3 border border-brand-100/70 shadow-sm"
            >
              <img
                src={imageUrl(item.image)}
                alt={item.name}
                className="h-16 w-16 rounded-xl object-cover"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-500">KES {item.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="h-8 w-8 rounded-full border border-brand-200 hover:bg-brand-50 transition"
                >
                  −
                </button>
                <span className="w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="h-8 w-8 rounded-full border border-brand-200 hover:bg-brand-50 transition"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItem(item.productId)}
                className="text-accent-600 text-sm hover:underline ml-2"
              >
                Remove
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-brand-100 pt-4">
        <span className="text-lg font-semibold text-gray-900">Total</span>
        <span className="text-lg font-bold text-brand-800">
          KES {totalAmount.toLocaleString()}
        </span>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        whileHover={{ y: -2 }}
        onClick={() => navigate("/checkout")}
        className="w-full mt-6 bg-brand-gradient text-white font-semibold py-3 rounded-xl shadow-glow hover:shadow-glow-lg transition"
      >
        Proceed to Checkout
      </motion.button>
    </div>
  );
};

export default Cart;
