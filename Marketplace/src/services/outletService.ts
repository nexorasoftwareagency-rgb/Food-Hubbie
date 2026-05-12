// ─── Outlet Service ────────────────────────────────────────────────────────────
// Backed by Firebase Realtime Database.

import { db, ref, get } from "@/lib/firebase";
import type { Outlet, AvailabilityStatus } from "@/types";
import { defaultDeliveryFeeStructure } from "@/lib/deliveryFee";

/** 
 * Map Firebase outlet data to SaaS Outlet type
 */
function mapFirebaseOutlet(id: string, data: any, businessId: string): Outlet {
  const meta = data.meta || {};
  const settings = data.settings || {};

  return {
    id: id,
    businessId: businessId,
    name: settings.Store?.storeName || meta.name || "Roshani Restaurant",
    slug: meta.slug || id,
    cuisine: meta.cuisine || "Indian, Fast Food",
    logo: meta.logo || "https://picsum.photos/id/102/100/100",
    coverImage: meta.coverImage || "https://picsum.photos/id/102/800/400",
    rating: meta.rating || 4.5,
    ratingCount: meta.ratingCount || 10,
    deliveryTimeMin: settings.deliveryTimeMin || 30,
    deliveryTimeMax: settings.deliveryTimeMax || 45,
    distanceKm: 0, // Dynamic calculation based on user location
    availability: (settings.shopOpen ? "open" : "closed") as AvailabilityStatus,
    openingTime: settings.openingTime || "10:00",
    closingTime: settings.closingTime || "22:00",
    minOrderAmount: settings.minOrderAmount || 0,
    deliveryFeeStructure: settings.deliveryFees || defaultDeliveryFeeStructure,
    offers: meta.offers || [],
    tags: meta.tags || [],
    address: settings.address || "Main Road, Bihar",
    location: { 
      lat: settings.location?.lat || 25.0, 
      lng: settings.location?.lng || 85.0 
    },
    isVegOnly: meta.isVegOnly || false,
    featured: meta.featured || false,
    createdAt: meta.createdAt || new Date().toISOString(),
  };
}

/** Fetch all outlets globally */
export async function fetchOutlets(): Promise<Outlet[]> {
  try {
    const path = `businesses`;
    const snapshot = await get(ref(db, path));
    
    if (snapshot.exists()) {
      const businesses = snapshot.val();
      const allOutlets: Outlet[] = [];
      
      for (const bid in businesses) {
        const bData = businesses[bid];
        if (bData.outlets) {
          for (const oid in bData.outlets) {
            allOutlets.push(mapFirebaseOutlet(oid, bData.outlets[oid], bid));
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
export async function fetchOutletById(id: string, businessId: string = "business_roshani"): Promise<Outlet | null> {
  try {
    const path = `businesses/${businessId}/outlets/${id}`;
    const snapshot = await get(ref(db, path));
    
    if (snapshot.exists()) {
      return mapFirebaseOutlet(id, snapshot.val(), businessId);
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
      const outletRef = ref(db, `businesses/${businessId}/outlets/${outletId}`);
      const outletSnap = await get(outletRef);
      
      if (outletSnap.exists()) {
        return mapFirebaseOutlet(outletId, outletSnap.val(), businessId);
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

/** Get outlets sorted by distance (nearest first) using user coordinates */
export function sortByDistance(outlets: Outlet[], userCoords: { lat: number, lng: number } | null): Outlet[] {
  if (!userCoords) return outlets;

  const withDistance = outlets.map(o => {
    const d = calculateDistance(userCoords.lat, userCoords.lng, o.location.lat, o.location.lng);
    return { ...o, distanceKm: parseFloat(d.toFixed(1)) };
  });

  return [...withDistance].sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Haversine formula for distance in KM */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
  return outlets.find(o => o.id === id)?.name ?? "Restaurant";
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
