import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "../context/CartContext";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/track", label: "Track Order" },
];

const Navbar = () => {
  const { totalItems } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-40 backdrop-blur transition-all duration-300 ${
        scrolled
          ? "bg-white/90 shadow-sm border-b border-brand-100"
          : "bg-white/60 border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-display italic text-2xl font-semibold text-gradient tracking-wide">
          The Store
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-8 text-sm font-medium text-gray-600">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `relative py-1 transition ${isActive ? "text-brand-700" : "hover:text-brand-600"}`
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute left-0 right-0 -bottom-1 h-0.5 rounded-full bg-brand-gradient"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
          <Link
            to="/cart"
            className="relative inline-flex items-center gap-2 bg-brand-gradient text-white text-sm font-semibold px-4 py-2 rounded-full shadow-glow hover:shadow-glow-lg transition"
          >
            Cart
            {totalItems > 0 && (
              <motion.span
                key={totalItems}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-accent-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center border-2 border-white"
              >
                {totalItems}
              </motion.span>
            )}
          </Link>
        </div>

        {/* Mobile controls */}
        <div className="flex sm:hidden items-center gap-3">
          <Link to="/cart" className="relative text-gray-700">
            <span className="text-sm font-semibold text-brand-700">Cart</span>
            {totalItems > 0 && (
              <motion.span
                key={totalItems}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-3 bg-accent-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center"
              >
                {totalItems}
              </motion.span>
            )}
          </Link>
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((o) => !o)}
            className="h-9 w-9 rounded-full border border-brand-200 flex items-center justify-center text-brand-700"
          >
            <motion.span animate={{ rotate: open ? 45 : 0 }} className="block w-4 h-0.5 bg-current relative">
              <motion.span
                animate={{ rotate: open ? -90 : 0, opacity: open ? 1 : 1 }}
                className="absolute left-0 top-0 w-4 h-0.5 bg-current"
                style={{ transformOrigin: "center" }}
              />
            </motion.span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="sm:hidden overflow-hidden border-t border-brand-100 bg-white/95"
          >
            <div className="px-4 py-4 flex flex-col gap-4 text-sm font-medium text-gray-700">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) => (isActive ? "text-brand-700" : "hover:text-brand-600")}
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
