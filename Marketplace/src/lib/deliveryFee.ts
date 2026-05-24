import type { DeliveryFeeConfig, DeliveryFeeSlot } from "@/types";

/**
 * Calculate delivery fee based on distance and the delivery fee config.
 * Supports two mutually exclusive modes:
 *   - "per_100m": Flat rate per 100 metres (e.g. ₹2 per 100m → ₹20/km)
 *   - "slabs":    Progressive slabs (e.g. ₹20 for up to 2 km, ₹40 for up to 5 km)
 */
export function calcDeliveryFee(
  distanceKm: number,
  config: DeliveryFeeConfig
): number {
  if (config.mode === "per_100m") {
    const units = Math.ceil(distanceKm * 10);
    return units * config.per100mRate;
  }

  return calcSlabFee(distanceKm, config.slabs);
}

function calcSlabFee(distanceKm: number, slots: DeliveryFeeSlot[]): number {
  if (!slots || slots.length === 0) return 0;
  const sorted = [...slots].sort((a, b) => a.upToKm - b.upToKm);
  for (const slot of sorted) {
    if (distanceKm <= slot.upToKm) return slot.fee;
  }
  return sorted[sorted.length - 1].fee;
}

/** Default delivery config (slab mode) used when Firebase config is missing */
export const defaultDeliveryFeeConfig: DeliveryFeeConfig = {
  mode: "slabs",
  per100mRate: 0,
  slabs: [
    { upToKm: 2, fee: 20 },
    { upToKm: 5, fee: 40 },
    { upToKm: 8, fee: 60 },
    { upToKm: 12, fee: 80 },
  ],
};

/** Format delivery fee label for display */
export function deliveryFeeLabel(fee: number): string {
  if (fee === 0) return "FREE";
  return `₹${fee}`;
}
