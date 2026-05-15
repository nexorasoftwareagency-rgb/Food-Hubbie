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
  platformFee: number;
  total: number;
  savings: number;
};

/** Calculate the full bill summary for the cart */
export function calcCartSummary(
  items: CartItem[],
  outlet: Outlet | null,
  promotions: {
    couponDiscount?: number;
    surgeMultiplier?: number;
    globalDiscount?: { type: 'percent' | 'fixed', value: number };
    platformFee?: number;
    isFreeDelivery?: boolean;
  } = {}
): CartSummary {
  let subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const { couponDiscount = 0, surgeMultiplier = 1, globalDiscount, platformFee = 0 } = promotions;

  // 1. Apply Global Discount first
  let globalSavings = 0;
  if (globalDiscount) {
    if (globalDiscount.type === 'percent') {
      globalSavings = Math.round(subtotal * (globalDiscount.value / 100));
    } else {
      globalSavings = Math.round(globalDiscount.value);
    }
  }

  const baseSubtotal = Math.max(0, subtotal - globalSavings);
  const afterCouponSubtotal = Math.max(0, baseSubtotal - couponDiscount);

  // 2. Delivery Fee calculation
  let deliveryFee = 0;
  if (outlet) {
    deliveryFee = calcDeliveryFee(
      outlet.distanceKm,
      outlet.deliveryFeeStructure
    );
  }

  // 3. Apply Surge Pricing to delivery (Standard Industry Practice)
  let finalDeliveryFee = Math.round(deliveryFee * surgeMultiplier);
  
  // Handle Free Delivery Coupon
  const isFreeDelivery = promotions.isFreeDelivery || false;
  const deliverySavings = isFreeDelivery ? finalDeliveryFee : 0;
  finalDeliveryFee = Math.max(0, finalDeliveryFee - deliverySavings);

  // 4. Tax Calculation
  const isDeliveryFeeTaxable = false; // Configurable
  const isPlatformFeeTaxable = false; // Configurable
  
  const taxableBase = afterCouponSubtotal + (isDeliveryFeeTaxable ? finalDeliveryFee : 0) + (isPlatformFeeTaxable ? platformFee : 0);
  const taxes = Math.round(taxableBase * GST_RATE);
  
  const total = afterCouponSubtotal + finalDeliveryFee + taxes + platformFee;
  const savings = globalSavings + couponDiscount + deliverySavings;

  return { 
    subtotal: subtotal, 
    deliveryFee: finalDeliveryFee, 
    taxes, 
    platformFee,
    total, 
    savings 
  };
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
