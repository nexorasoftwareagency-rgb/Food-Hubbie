import type { DeliveryFeeSlot } from "@/types";

/**
 * Calculate delivery fee based on distance and the outlet's fee structure.
 * Slots are checked in order; the first slot whose upToKm >= distanceKm wins.
 * Falls back to the last slot's fee for distances beyond all defined slots.
 */
export function calcDeliveryFee(
  distanceKm: number,
  slots: DeliveryFeeSlot[]
): number {
  if (!slots || slots.length === 0) return 0;
  const sorted = [...slots].sort((a, b) => a.upToKm - b.upToKm);
  for (const slot of sorted) {
    if (distanceKm <= slot.upToKm) return slot.fee;
  }
  return sorted[sorted.length - 1].fee;
}

/** Standard delivery fee structure used by most outlets */
export const defaultDeliveryFeeStructure: DeliveryFeeSlot[] = [
  { upToKm: 2, fee: 20 },
  { upToKm: 5, fee: 40 },
  { upToKm: 8, fee: 60 },
  { upToKm: 12, fee: 80 },
];

/** Free delivery (used for premium / subscription flow) */
export const freeDeliveryStructure: DeliveryFeeSlot[] = [
  { upToKm: 99, fee: 0 },
];

/** Format delivery fee label for display */
export function deliveryFeeLabel(fee: number): string {
  if (fee === 0) return "FREE";
  return `₹${fee}`;
}
