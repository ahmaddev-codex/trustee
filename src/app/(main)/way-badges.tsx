"use client";

import { motion, type Easing } from "framer-motion";

// A real drop-and-bounce path: falls fast, bounces twice with decreasing
// height, then settles - fires once via whileInView + once: true.
function dropBounce(restY: number, delay = 0) {
  return {
    initial: { y: restY - 260, opacity: 0 },
    whileInView: { y: [restY - 260, restY, restY - 34, restY, restY - 12, restY], opacity: 1 },
    viewport: { once: true, amount: 0.6 },
    transition: {
      duration: 1.1,
      delay,
      times: [0, 0.45, 0.62, 0.78, 0.9, 1],
      ease: ["easeIn", "easeOut", "easeIn", "easeOut", "easeIn"] as Easing[],
      opacity: { duration: 0.2, delay },
    },
  };
}

export function WayBadges() {
  return (
    <div className="relative z-10 mt-8 mb-[-2.25rem] flex items-center justify-center">
      <motion.span
        {...dropBounce(6)}
        style={{ rotate: -3 }}
        className="relative z-0 -mr-5 rounded-full bg-lime px-8 py-4 font-display text-xl font-bold whitespace-nowrap text-brand-deep shadow-lg sm:text-2xl"
      >
        The Old Way
      </motion.span>
      <motion.span
        {...dropBounce(-27, 0.15)}
        style={{ rotate: 3 }}
        className="relative z-20 -ml-5 rounded-full bg-brand-deep px-8 py-4 font-display text-xl font-bold whitespace-nowrap text-white shadow-lg sm:text-2xl"
      >
        The Trustee Way
      </motion.span>
    </div>
  );
}
