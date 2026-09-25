import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, animate } from "framer-motion";

// Simple count-up number that animates into view once.
const Counter = ({ to, suffix = "" }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (v) => setValue(Math.floor(v)),
    });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <span ref={ref} className="font-display text-4xl sm:text-5xl text-gradient font-semibold">
      {value.toLocaleString()}
      {suffix}
    </span>
  );
};

const VALUES = [
  {
    title: "Thoughtfully Curated",
    body: "Every product is chosen for quality and character, never just to fill a shelf.",
  },
  {
    title: "Honest & Transparent",
    body: "Clear pricing, real stock levels, and order tracking you can actually trust.",
  },
  {
    title: "Built Around You",
    body: "From easy checkout to fast pickup, every detail is designed with the customer in mind.",
  },
];

const STATS = [
  { to: 5, suffix: "+", label: "Years serving customers" },
  { to: 12000, suffix: "+", label: "Orders fulfilled" },
  { to: 98, suffix: "%", label: "Customer satisfaction" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const About = () => {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-gradient-soft">
        <div className="absolute inset-0 bg-brand-radial" />
        <div className="relative max-w-4xl mx-auto px-4 py-24 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="uppercase tracking-[0.3em] text-xs font-semibold text-accent-600 mb-4"
          >
            Our Story
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display italic text-4xl sm:text-6xl text-gray-900 leading-tight"
          >
            A little more thought,
            <br /> in every order.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 mt-6 max-w-xl mx-auto leading-relaxed"
          >
            We started The Store to make everyday shopping feel a little more
            personal — fewer, better products, honest service, and a
            checkout experience that respects your time.
          </motion.p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-5xl mx-auto px-4 py-20 grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop"
            alt="Our workspace"
            className="rounded-3xl shadow-glow-lg object-cover w-full h-[360px]"
          />
        </motion.div>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <h2 className="font-display italic text-3xl text-gray-900 mb-4">
            Why we do this
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            What began as a small, local idea has grown into a shop trusted
            by customers who care about quality as much as convenience. We
            work directly with a small set of sellers so every listing means
            something.
          </p>
          <p className="text-gray-600 leading-relaxed">
            No gimmicks, no clutter — just a clean shopping experience and
            real people behind every order.
          </p>
        </motion.div>
      </section>

      {/* Values */}
      <section className="bg-brand-50/60 py-20">
        <div className="max-w-5xl mx-auto px-4">
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="font-display italic text-3xl text-gray-900 text-center mb-12"
          >
            What we stand for
          </motion.h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className="bg-white rounded-3xl p-7 shadow-sm hover:shadow-glow transition-shadow border border-brand-100/70"
              >
                <div className="h-10 w-10 rounded-full bg-brand-gradient mb-5" />
                <h3 className="font-display text-xl text-gray-900 mb-2">{v.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{v.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="grid sm:grid-cols-3 gap-10 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <Counter to={s.to} suffix={s.suffix} />
              <p className="text-gray-500 text-sm mt-2">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-gradient" />
        <div className="relative max-w-3xl mx-auto px-4 py-20 text-center">
          <h2 className="font-display italic text-3xl sm:text-4xl text-white mb-4">
            Ready to find something you'll love?
          </h2>
          <p className="text-white/80 mb-8">
            Browse the full collection and get it delivered to your door.
          </p>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="inline-block">
            <Link
              to="/"
              className="inline-block bg-white text-brand-800 font-semibold px-8 py-3 rounded-full shadow-glow-lg"
            >
              Start Shopping
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
