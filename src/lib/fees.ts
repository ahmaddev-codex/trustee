export function computePlatformFeeKobo(amountKobo: bigint): bigint {
  const bps = BigInt(process.env.PLATFORM_FEE_BPS ?? "500");
  return (amountKobo * bps) / 10000n;
}
