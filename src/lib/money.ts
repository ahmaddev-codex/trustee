export function formatNaira(kobo: bigint | number): string {
  const naira = Number(kobo) / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(naira);
}

export function nairaToKobo(naira: number): bigint {
  return BigInt(Math.round(naira * 100));
}

// Monnify's `amount` field is denominated in whole Naira, not kobo.
export function koboToNairaAmount(kobo: bigint | number): number {
  return Number(kobo) / 100;
}
