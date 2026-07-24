// Trustee's own brand accents, so a shuffled avatar set always reads as a
// designed choice rather than DiceBear's own per-seed default backgrounds.
export const AVATAR_PALETTE = [
  "4334d3", // brand
  "251377", // brand-deep
  "7147f6", // brand-bright
  "e1ef9a", // lime
  "90eaf2", // cyan
  "ecc89d", // sand
] as const;

// backgroundColor is a hex value without the leading `#` (DiceBear's own convention).
export function generateAvatarUrl(seed: string, backgroundColor?: string): string {
  const bg = backgroundColor ? `&backgroundColor=${backgroundColor}` : "";
  return `https://api.dicebear.com/9.x/avataaars/png?seed=${encodeURIComponent(seed)}${bg}`;
}

export function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}
