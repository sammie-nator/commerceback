import React, { useRef } from "react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";

/**
 * Horizontally draggable / scrollable row of ProductCards — a lightweight
 * "carousel" for featured or trending products.
 */
const ProductRail = ({ products = [], title, subtitle }) => {
  const trackRef = useRef(null);

  const scrollBy = (amount) => {
    trackRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (!products.length) return null;

  return (
    <section className="mb-12">
      {(title || subtitle) && (
        <div className="flex items-end justify-between mb-5">
          <div>
            {subtitle && (
              <p className="uppercase tracking-[0.2em] text-xs font-semibold text-accent-500 mb-1">
                {subtitle}
              </p>
            )}
            {title && (
              <h2 className="font-display italic text-3xl text-gray-900">{title}</h2>
            )}
          </div>
          <div className="hidden sm:flex gap-2">
            <button
              onClick={() => scrollBy(-320)}
              aria-label="Scroll left"
              className="h-9 w-9 rounded-full border border-brand-200 text-brand-700 hover:bg-brand-50 transition flex items-center justify-center"
            >
              ‹
            </button>
            <button
              onClick={() => scrollBy(320)}
              aria-label="Scroll right"
              className="h-9 w-9 rounded-full border border-brand-200 text-brand-700 hover:bg-brand-50 transition flex items-center justify-center"
            >
              ›
            </button>
          </div>
        </div>
      )}

      <motion.div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: -(products.length * 240), right: 0 }}
        dragElastic={0.05}
      >
        {products.map((p, i) => (
          <motion.div
            key={p._id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="min-w-[200px] w-[200px] sm:min-w-[220px] sm:w-[220px] snap-start shrink-0"
          >
            <ProductCard product={p} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default ProductRail;
