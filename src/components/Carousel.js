import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Full-width hero carousel with autoplay, drag-to-swipe, arrows and dots.
 * slides: [{ image, eyebrow, title, subtitle, ctaLabel, ctaTo }]
 */
const variants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60, scale: 1.02 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60, scale: 0.98 }),
};

const Carousel = ({ slides = [], autoPlay = true, interval = 5500, renderSlide }) => {
  const [[index, direction], setIndex] = useState([0, 0]);
  const timerRef = useRef(null);
  const count = slides.length;

  const paginate = useCallback(
    (dir) => {
      setIndex(([prev]) => [(prev + dir + count) % count, dir]);
    },
    [count]
  );

  const goTo = (i) => setIndex(([prev]) => [i, i > prev ? 1 : -1]);

  useEffect(() => {
    if (!autoPlay || count <= 1) return;
    timerRef.current = setInterval(() => paginate(1), interval);
    return () => clearInterval(timerRef.current);
  }, [autoPlay, interval, paginate, count]);

  if (!count) return null;
  const slide = slides[index];

  return (
    <div className="relative w-full overflow-hidden rounded-3xl shadow-glow-lg select-none">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={index}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, info) => {
            if (info.offset.x < -80) paginate(1);
            else if (info.offset.x > 80) paginate(-1);
          }}
          className="relative w-full"
        >
          {renderSlide ? (
            renderSlide(slide, index)
          ) : (
            <div
              className="relative h-[420px] sm:h-[480px] w-full bg-cover bg-center flex items-end"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-brand-900/70 via-brand-900/20 to-transparent" />
              <div className="relative z-10 p-8 sm:p-12 max-w-xl">
                {slide.eyebrow && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="uppercase tracking-[0.25em] text-xs font-semibold text-accent-200 mb-3"
                  >
                    {slide.eyebrow}
                  </motion.p>
                )}
                {slide.title && (
                  <motion.h2
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="font-display italic text-4xl sm:text-5xl text-white leading-tight mb-3"
                  >
                    {slide.title}
                  </motion.h2>
                )}
                {slide.subtitle && (
                  <motion.p
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="text-white/80 mb-6 leading-relaxed"
                  >
                    {slide.subtitle}
                  </motion.p>
                )}
                {slide.ctaLabel && (
                  <motion.a
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    href={slide.ctaTo || "#"}
                    className="inline-block bg-white text-brand-800 font-semibold px-6 py-3 rounded-full shadow-glow hover:shadow-glow-lg transition"
                  >
                    {slide.ctaLabel}
                  </motion.a>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {count > 1 && (
        <>
          <button
            aria-label="Previous slide"
            onClick={() => paginate(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-white/25 backdrop-blur hover:bg-white/40 text-white flex items-center justify-center transition"
          >
            ‹
          </button>
          <button
            aria-label="Next slide"
            onClick={() => paginate(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-white/25 backdrop-blur hover:bg-white/40 text-white flex items-center justify-center transition"
          >
            ›
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Carousel;
