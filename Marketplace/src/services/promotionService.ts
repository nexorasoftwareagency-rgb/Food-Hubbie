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

export async function fetchSurgeConfig(): Promise<SurgeConfig | null> {
  try {
    const snap = await get(ref(db, 'system/promotions/surge'));
    return snap.exists() ? snap.val() as SurgeConfig : null;
  } catch (err) {
    console.error("Failed to fetch surge config:", err);
    return null;
  }
}

export async function fetchGlobalDiscount(): Promise<GlobalDiscount | null> {
  try {
    const snap = await get(ref(db, 'system/promotions/globalDiscount'));
    return snap.exists() ? snap.val() as GlobalDiscount : null;
  } catch (err) {
    console.error("Failed to fetch global discount:", err);
    return null;
  }
}

export async function validateCoupon(code: string): Promise<Coupon | null> {
  try {
    const snap = await get(ref(db, `system/promotions/coupons/${code.toUpperCase()}`));
    if (snap.exists()) {
      const coupon = snap.val() as Coupon;
      if (!coupon.isActive) return null;
      
      // Check Usage Limit
      if (coupon.usageLimit && (coupon.usedCount || 0) >= coupon.usageLimit) {
        console.warn(`Coupon ${code} usage limit reached.`);
        return null;
      }

      return coupon;
    }
    return null;
  } catch (err) {
    console.error("Failed to validate coupon:", err);
    return null;
  }
}
