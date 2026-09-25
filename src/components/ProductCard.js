import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { imageUrl } from "../utils/imageUrl";

const ProductCard = ({ product }) => {
  const outOfStock = product.stock <= 0;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group bg-white rounded-3xl shadow-sm hover:shadow-glow border border-brand-100/70 overflow-hidden transition-shadow"
    >
      <Link to={`/product/${product._id}`}>
        <div className="relative aspect-square bg-brand-50 overflow-hidden">
          <img
            src={imageUrl(product.images?.[0])}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          />
          {outOfStock && (
            <div className="absolute top-3 left-3 bg-gray-900/80 text-white text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full">
              Out of stock
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="text-[11px] text-accent-600 font-semibold uppercase tracking-wider">
            {product.category}
          </p>
          <h3 className="font-display text-lg text-gray-900 mt-1 truncate">{product.name}</h3>
          <div className="flex items-center justify-between mt-2">
            <span className="font-semibold text-brand-800">
              KES {product.price.toLocaleString()}
            </span>
            {!outOfStock && (
              <span className="text-[11px] text-gray-400">{product.stock} left</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
