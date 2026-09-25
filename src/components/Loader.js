import React from "react";
import { motion } from "framer-motion";

const Loader = ({ label = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <motion.div
      className="h-12 w-12 rounded-full"
      style={{
        background: "conic-gradient(from 0deg, #9333ea, #db2777, #9333ea)",
        WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0)",
        mask: "radial-gradient(farthest-side, transparent calc(100% - 4px), #000 0)",
      }}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
    />
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-sm text-gray-500 font-medium"
    >
      {label}
    </motion.p>
  </div>
);

export default Loader;
