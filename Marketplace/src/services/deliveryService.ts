import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { calcDeliveryFee } from "@/lib/deliveryFee";
import type { DeliveryFeeSlot } from "@/types";

/**
 * Fetches the applicable delivery fee structure for an outlet.
 * 1. Checks outlet-specific settings: businesses/business_roshani/outlets/{oid}/settings/Delivery/slabs
 * 2. If empty, checks platform-wide settings: system/settings/delivery/slabs
 * 3. Fallback to hardcoded defaults if both are missing.
 */
export async function getApplicableDeliverySlabs(outletId: string): Promise<DeliveryFeeSlot[]> {
  try {
    // 1. Try Outlet Specific
    const outletRef = ref(db, `businesses/business_roshani/outlets/${outletId}/settings/Delivery/slabs`);
    const outletSnap = await get(outletRef);
    if (outletSnap.exists()) {
      const slabs = outletSnap.val();
      // Map 'km' from ShopAdmin to 'upToKm' for Marketplace compatibility
      return slabs.map((s: any) => ({ upToKm: s.km, fee: s.fee }));
    }

    // 2. Try System Global
    const systemRef = ref(db, `system/settings/delivery/slabs`);
    const systemSnap = await get(systemRef);
    if (systemSnap.exists()) {
      return systemSnap.val();
    }
  } catch (error) {
    console.warn("[DeliveryService] Error fetching slabs:", error);
  }

  // 3. Fallback Defaults
  return [
    { upToKm: 2, fee: 20 },
    { upToKm: 5, fee: 40 },
    { upToKm: 10, fee: 60 }
  ];
}

/**
 * Calculates delivery fee for a specific outlet and distance.
 */
export async function calculateDynamicDeliveryFee(outletId: string, distanceKm: number): Promise<number> {
  const slabs = await getApplicableDeliverySlabs(outletId);
  return calcDeliveryFee(distanceKm, slabs);
}
