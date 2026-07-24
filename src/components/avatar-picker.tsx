"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { TbArrowsShuffle, TbCheck } from "react-icons/tb";

import { generateAvatarUrl, randomSeed, AVATAR_PALETTE } from "@/lib/avatar";

// 6 shuffleable DiceBear options, each pinned to a brand-accent background so
// the set reads as a designed choice rather than DiceBear's own per-seed
// defaults.
export function AvatarPicker({
  selectedUrl,
  onSelect,
}: {
  selectedUrl: string | null;
  onSelect: (url: string) => void;
}) {
  const [seeds, setSeeds] = useState<string[]>([]);
  const [shuffleSpins, setShuffleSpins] = useState(0);

  // Seeded client-side only — Math.random() during SSR would produce a
  // different set of seeds than the client's hydration pass and trigger a
  // mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: this is the one-time client-only randomization the mismatch note above describes, not state synced from props.
    setSeeds(Array.from({ length: 6 }, randomSeed));
  }, []);

  function shuffle() {
    setSeeds(Array.from({ length: 6 }, randomSeed));
    setShuffleSpins((s) => s + 1);
  }

  return (
    <div className="inline-flex w-fit max-w-full flex-col rounded-xl border bg-popover p-4">
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-xs font-medium whitespace-nowrap text-muted-foreground">
          Pick an avatar, or shuffle for more options
        </p>
        <button
          type="button"
          onClick={shuffle}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium whitespace-nowrap text-brand transition-colors hover:bg-brand/10"
        >
          <motion.span
            key={shuffleSpins}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="flex"
          >
            <TbArrowsShuffle size={13} aria-hidden="true" />
          </motion.span>
          Shuffle
        </button>
      </div>
      <motion.div
        key={seeds.join("-")}
        className="flex flex-wrap items-center gap-3"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      >
        {seeds.map((seed, i) => {
          const url = generateAvatarUrl(seed, AVATAR_PALETTE[i % AVATAR_PALETTE.length]);
          const selected = selectedUrl === url;
          return (
            <motion.button
              key={seed}
              type="button"
              onClick={() => onSelect(url)}
              variants={{
                hidden: { opacity: 0, scale: 0.6, y: 8 },
                visible: { opacity: 1, scale: 1, y: 0 },
              }}
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.94 }}
              className={`relative size-14 overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-popover transition-shadow ${
                selected ? "ring-brand" : "ring-transparent hover:ring-border"
              }`}
              aria-label="Select this avatar"
            >
              <Image src={url} alt="" width={56} height={56} className="size-full object-cover" unoptimized />
              <AnimatePresence>
                {selected && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.4 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/30"
                  >
                    <TbCheck size={18} className="text-white" aria-hidden="true" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
