import { db, ref, get } from "@/lib/firebase";

export type SurgeConfig = {
  multiplier: number;
  reason: string;
  isActive: boolean;
};

export type GlobalDiscount = {
  type: 'percent' | 'fixed';
  value: number;
  isActive: boolean;
};

export type Coupon = {
  code: string;
  value: number; // Changed from discount to match DB
  type: 'percent' | 'fixed';
  minOrder?: number;
  usageLimit?: number;
  usedCount?: number;
  isActive: boolean;
};

// Validation Helpers
function isValidSurgeConfig(data: any): data is SurgeConfig {
  return data && typeof data.multiplier === 'number' && typeof data.isActive === 'boolean' && data.multiplier >= 0;
}

function isValidGlobalDiscount(data: any): data is GlobalDiscount {
  return data && (data.type === 'percent' || data.type === 'fixed') && typeof data.value === 'number' && typeof data.isActive === 'boolean' && data.value >= 0;
}

function isValidCoupon(data: any): data is Coupon {
  return data && typeof data.isActive === 'boolean' && (data.type === 'percent' || data.type === 'fixed') && typeof data.value === 'number';
}

export async function fetchSurgeConfig(): Promise<SurgeConfig | null> {
  try {
    const snap = await get(ref(db, 'system/promotions/surge'));
    if (snap.exists()) {
      const data = snap.val();
      if (isValidSurgeConfig(data)) return data;
      console.warn("[PromotionService] Invalid surge config structure:", data);
    }
    return null;
  } catch (err) {
    console.error("Failed to fetch surge config:", err);
    return null;
  }
}

export async function fetchGlobalDiscount(): Promise<GlobalDiscount | null> {
  try {
    const snap = await get(ref(db, 'system/promotions/globalDiscount'));
    if (snap.exists()) {
      const data = snap.val();
      if (isValidGlobalDiscount(data)) return data;
      console.warn("[PromotionService] Invalid global discount structure:", data);
    }
    return null;
  } catch (err) {
    console.error("Failed to fetch global discount:", err);
    return null;
  }
}

/** 
 * Validates a coupon code against business rules.
 * @param code The promo code to check
 * @param orderAmount Optional order amount to verify minOrder requirement
 */
export async function validateCoupon(code: string, orderAmount?: number): Promise<Coupon | null> {
  if (typeof code !== 'string' || !code.trim()) {
    return null;
  }
  
  const trimmedCode = code.trim().toUpperCase();

  try {
    const snap = await get(ref(db, `system/promotions/coupons/${trimmedCode}`));
    if (snap.exists()) {
      const coupon = snap.val();
      if (!isValidCoupon(coupon)) {
        console.warn(`[PromotionService] Coupon ${trimmedCode} has invalid data structure.`);
        return null;
      }

      if (!coupon.isActive) return null;
      
      // Check Min Order if provided
      if (orderAmount !== undefined && coupon.minOrder && orderAmount < coupon.minOrder) {
        console.warn(`[PromotionService] Order amount ₹${orderAmount} below minOrder ₹${coupon.minOrder}`);
        return null;
      }

      // Check Usage Limit
      if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
        console.warn(`[PromotionService] Coupon ${trimmedCode} usage limit reached.`);
        return null;
      }

      return coupon as Coupon;
    }
    return null;
  } catch (err) {
    console.error("Failed to validate coupon:", err);
    return null;
  }
}
