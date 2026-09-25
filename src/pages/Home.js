import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";
import ProductRail from "../components/ProductRail";
import Carousel from "../components/Carousel";
import Loader from "../components/Loader";

const HERO_SLIDES = [
  {
    eyebrow: "New Season",
    title: "Curated pieces, chosen with care",
    subtitle:
      "Discover a hand-picked edit of quality goods — thoughtfully sourced, beautifully simple.",
    ctaLabel: "Shop the Collection",
    ctaTo: "#shop",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop",
  },
  {
    eyebrow: "Trending Now",
    title: "Elegance, delivered to your door",
    subtitle: "Fast, reliable pickup and delivery across every location we serve.",
    ctaLabel: "Explore Products",
    ctaTo: "#shop",
    image:
      "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1600&auto=format&fit=crop",
  },
  {
    eyebrow: "Customer Favorites",
    title: "Loved by our community",
    subtitle: "Join thousands of happy customers who shop with us every week.",
    ctaLabel: "Start Shopping",
    ctaTo: "#shop",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1600&auto=format&fit=crop",
  },
];

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/products/categories").then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (activeCategory) params.category = activeCategory;
    if (search) params.search = search;

    const timeout = setTimeout(() => {
      api
        .get("/products", { params })
        .then((res) => setProducts(res.data.products))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [activeCategory, search]);

  const trending = useMemo(() => products.slice(0, 8), [products]);

  return (
    <div>
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Carousel slides={HERO_SLIDES} />
      </div>

      <div id="shop" className="max-w-6xl mx-auto px-4 py-10">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display italic text-3xl text-gray-900 mb-6"
        >
          Shop our latest products
        </motion.h1>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="flex-1 border border-brand-100 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 transition"
          />
        </div>

        <div className="flex gap-2 mb-10 flex-wrap">
          <button
            onClick={() => setActiveCategory("")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
              activeCategory === ""
                ? "bg-brand-gradient text-white border-transparent shadow-glow"
                : "bg-white text-gray-600 border-brand-100 hover:border-brand-300"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
                activeCategory === cat
                  ? "bg-brand-gradient text-white border-transparent shadow-glow"
                  : "bg-white text-gray-600 border-brand-100 hover:border-brand-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {!loading && !search && !activeCategory && trending.length > 0 && (
          <ProductRail products={trending} subtitle="Hand Picked" title="Trending Now" />
        )}

        {loading ? (
          <Loader label="Fetching products..." />
        ) : products.length === 0 ? (
          <p className="text-gray-500 text-center py-16">No products found.</p>
        ) : (
          <>
            <div className="flex items-end justify-between mb-5">
              <h2 className="font-display italic text-3xl text-gray-900">All Products</h2>
            </div>
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {products.map((p, i) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.35, delay: (i % 8) * 0.04 }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
