// ─── Cart Service ─────────────────────────────────────────────────────────────
// Business logic for cart operations — delivery fee calculation, cart validation,
// and outlet-lock enforcement. Decoupled from React state.

import type { CartItem, Outlet } from "@/types";
import { calcDeliveryFee } from "@/lib/deliveryFee";

export const GST_RATE = 0.05; // 5% GST

export type CartSummary = {
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  total: number;
  savings: number;
};

/** Calculate the full bill summary for the cart */
export function calcCartSummary(
  items: CartItem[],
  outlet: Outlet | null,
  couponDiscount = 0
): CartSummary {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  let deliveryFee = 0;
  if (outlet) {
    deliveryFee = calcDeliveryFee(
      outlet.distanceKm,
      outlet.deliveryFeeStructure
    );
  }

  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);
  const taxes = Math.round(discountedSubtotal * GST_RATE);
  const total = discountedSubtotal + deliveryFee + taxes;
  const savings = couponDiscount;

  return { subtotal, deliveryFee, taxes, total, savings };
}

/** Check if an item from a different outlet would conflict with the current cart */
export function detectOutletConflict(
  currentOutletId: string | null,
  incomingOutletId: string
): boolean {
  return !!currentOutletId && currentOutletId !== incomingOutletId;
}

/** Validate minimum order requirement */
export function validateMinOrder(
  subtotal: number,
  outlet: Outlet
): { valid: boolean; shortfall: number } {
  const shortfall = Math.max(0, outlet.minOrderAmount - subtotal);
  return { valid: shortfall === 0, shortfall };
}

/** Build a unique cart item id from item + customization to allow multi-variant */
export function buildCartItemId(
  menuItemId: string,
  sizeId?: string,
  crustId?: string,
  addonIds: string[] = []
): string {
  const parts = [menuItemId, sizeId ?? "", crustId ?? "", ...addonIds.sort()];
  return parts.filter(Boolean).join("|");
}

/** Compute the price of one unit including selected customizations */
export function computeUnitPrice(
  basePrice: number,
  sizePrice?: number,
  crustExtraPrice = 0,
  addonPrices: number[] = [],
  extraCheese = false
): number {
  const base = sizePrice !== undefined ? sizePrice : basePrice;
  const addonTotal = addonPrices.reduce((s, p) => s + p, 0);
  const cheeseFee = extraCheese ? 40 : 0;
  return base + crustExtraPrice + addonTotal + cheeseFee;
}
