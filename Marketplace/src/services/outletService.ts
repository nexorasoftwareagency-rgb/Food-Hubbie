// ─── Outlet Service ────────────────────────────────────────────────────────────
// Backed by Firebase Realtime Database.

import { db, ref, get } from "@/lib/firebase";
import type { Outlet, AvailabilityStatus, DeliveryFeeConfig } from "@/types";
import { defaultDeliveryFeeConfig } from "@/lib/deliveryFee";

/** 
 * Map Firebase outlet data to SaaS Outlet type
 */
function mapFirebaseOutlet(id: string, data: any, businessId: string, globalConfig: DeliveryFeeConfig): Outlet {
  const meta = data.meta || {};
  const settings = data.settings || {};
  const store = settings.Store || {};

  const outletSlabs = settings.deliveryFees;
  const deliveryFeeConfig: DeliveryFeeConfig = outletSlabs && outletSlabs.length > 0
    ? { mode: "slabs", per100mRate: 0, slabs: outletSlabs }
    : globalConfig;

  const locLat = settings.location?.lat ?? store.lat ?? meta?.lat ?? 0;
  const locLng = settings.location?.lng ?? store.lng ?? meta?.lng ?? 0;

  return {
    id: id,
    businessId: businessId,
    name: store.storeName || meta.name || data.name || "",
    slug: meta.slug || id,
    cuisine: meta.cuisine || "",
    logo: meta.logo || "",
    coverImage: meta.coverImage || "",
    rating: meta.rating || 0,
    ratingCount: meta.ratingCount || 0,
    deliveryTimeMin: settings.deliveryTimeMin || 0,
    deliveryTimeMax: settings.deliveryTimeMax || 0,
    distanceKm: 0,
    availability: (settings.shopOpen ? "open" : "closed") as AvailabilityStatus,
    openingTime: settings.openingTime || "",
    closingTime: settings.closingTime || "",
    minOrderAmount: settings.minOrderAmount || 0,
    deliveryFeeConfig,
    offers: meta.offers || [],
    tags: meta.tags || [],
    address: settings.address || store.address || meta.address || "",
    location: { lat: locLat, lng: locLng },
    isVegOnly: meta.isVegOnly || false,
    featured: meta.featured || false,
    createdAt: meta.createdAt || new Date().toISOString(),
  };
}

/** Fetch all outlets globally */
export async function fetchOutlets(): Promise<Outlet[]> {
  try {
    const [bizSnap, configSnap] = await Promise.all([
      get(ref(db, 'businesses')),
      get(ref(db, 'system/settings/delivery')),
    ]);

    const globalConfig: DeliveryFeeConfig = configSnap.exists()
      ? {
          mode: configSnap.val().mode || "slabs",
          per100mRate: configSnap.val().per100mRate || 0,
          slabs: configSnap.val().slabs || defaultDeliveryFeeConfig.slabs,
        }
      : defaultDeliveryFeeConfig;
    
    if (bizSnap.exists()) {
      const businesses = bizSnap.val();
      const allOutlets: Outlet[] = [];
      
      for (const bid in businesses) {
        const bData = businesses[bid];
        if (bData.outlets) {
          for (const oid in bData.outlets) {
            allOutlets.push(mapFirebaseOutlet(oid, bData.outlets[oid], bid, globalConfig));
          }
        }
      }
      return allOutlets;
    }
    return [];
  } catch (err) {
    console.error("Firebase outlets fetch error:", err);
    return [];
  }
}

/** Fetch a single outlet by id */
export async function fetchOutletById(id: string, businessId: string = ""): Promise<Outlet | null> {
  try {
    const [snapshot, configSnap] = await Promise.all([
      get(ref(db, `businesses/${businessId}/outlets/${id}`)),
      get(ref(db, 'system/settings/delivery')),
    ]);

    const globalConfig: DeliveryFeeConfig = configSnap.exists()
      ? {
          mode: configSnap.val().mode || "slabs",
          per100mRate: configSnap.val().per100mRate || 0,
          slabs: configSnap.val().slabs || defaultDeliveryFeeConfig.slabs,
        }
      : defaultDeliveryFeeConfig;
    
    if (snapshot.exists()) {
      return mapFirebaseOutlet(id, snapshot.val(), businessId, globalConfig);
    }
    return null;
  } catch (err) {
    console.error("Firebase outlet fetch error:", err);
    return null;
  }
}

/** Fetch a single outlet by slug */
export async function fetchOutletBySlug(slug: string): Promise<Outlet | null> {
  try {
    const slugRef = ref(db, `slugs/outlets/${slug}`);
    const slugSnap = await get(slugRef);
    
    if (slugSnap.exists()) {
      const { businessId, outletId } = slugSnap.val();
      const [outletSnap, configSnap] = await Promise.all([
        get(ref(db, `businesses/${businessId}/outlets/${outletId}`)),
        get(ref(db, 'system/settings/delivery')),
      ]);

      const globalConfig: DeliveryFeeConfig = configSnap.exists()
        ? {
            mode: configSnap.val().mode || "slabs",
            per100mRate: configSnap.val().per100mRate || 0,
            slabs: configSnap.val().slabs || defaultDeliveryFeeConfig.slabs,
          }
        : defaultDeliveryFeeConfig;
      
      if (outletSnap.exists()) {
        return mapFirebaseOutlet(outletId, outletSnap.val(), businessId, globalConfig);
      }
    }
    return null;
  } catch (err) {
    console.error("Slug fetch error:", err);
    return null;
  }
}

/** Filter outlets by search query + filter chip */
export function filterOutlets(outlets: Outlet[], query: string, filter: string): Outlet[] {
  let result = outlets;
  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(o => 
      o.name.toLowerCase().includes(q) || 
      o.cuisine.toLowerCase().includes(q)
    );
  }

  switch (filter) {
    case "Veg Only": result = result.filter(o => o.isVegOnly); break;
    case "Top Rated": result = result.filter(o => o.rating >= 4.5); break;
    case "Open Now": result = result.filter(o => o.availability === "open"); break;
  }
  return result;
}

/** Get outlets within 10km radius, sorted by distance (nearest first) */
export function sortByDistance(outlets: Outlet[], userCoords: { lat: number, lng: number } | null): Outlet[] {
  if (!userCoords) return outlets;

  const MAX_RADIUS_KM = 10;

  const withDistance = outlets.map(o => {
    const d = calculateDistance(userCoords.lat, userCoords.lng, o.location.lat, o.location.lng);
    return { ...o, distanceKm: parseFloat(d.toFixed(1)) };
  });

  return withDistance
    .filter(o => o.distanceKm <= MAX_RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Haversine formula for distance in KM */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Get outlet name by id (requires sync fallback or state) */
export function getOutletName(id: string, outlets: Outlet[]): string {
  return outlets.find(o => o.id === id)?.name ?? "";
}

export function availabilityLabel(status: AvailabilityStatus): string {
  switch (status) {
    case "open": return "Open";
    case "closed": return "Closed";
    case "busy": return "Busy";
    case "closing_soon": return "Closing Soon";
  }
}

export function availabilityClasses(status: AvailabilityStatus): string {
  switch (status) {
    case "open": return "bg-green-100 text-green-700 border-green-200";
    case "closed": return "bg-red-100 text-red-600 border-red-200";
    case "busy": return "bg-orange-100 text-orange-700 border-orange-200";
    default: return "bg-gray-100 text-gray-600";
  }
}

export function canOrder(status: AvailabilityStatus): boolean {
  return status === "open" || status === "busy";
}

export function deliveryTimeString(outlet: Outlet): string {
  return `${outlet.deliveryTimeMin}-${outlet.deliveryTimeMax} min`;
}
