import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { calcDeliveryFee, defaultDeliveryFeeConfig } from "@/lib/deliveryFee";
import type { DeliveryFeeConfig } from "@/types";

/**
 * Fetches the applicable delivery fee config from SuperAdmin system settings.
 * Supports both modes: per_100m (rate per 100 metres) and slabs (km-based tiers).
 * Falls back to hardcoded defaults if missing.
 */
export async function getApplicableDeliveryConfig(): Promise<DeliveryFeeConfig> {
  try {
    const snap = await get(ref(db, `system/settings/delivery`));

    if (snap.exists()) {
      const val = snap.val();
      return {
        mode: val.mode || "slabs",
        per100mRate: val.per100mRate || 0,
        slabs: val.slabs || defaultDeliveryFeeConfig.slabs,
      };
    }
  } catch (error) {
    console.warn("[DeliveryService] Error fetching config:", error);
  }

  return defaultDeliveryFeeConfig;
}

/**
 * Calculates delivery fee for a specific distance using the system delivery config.
 */
export async function calculateDynamicDeliveryFee(distanceKm: number): Promise<number> {
  const config = await getApplicableDeliveryConfig();
  return calcDeliveryFee(distanceKm, config);
}
