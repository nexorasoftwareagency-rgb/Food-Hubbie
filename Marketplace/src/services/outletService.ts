// ─── Outlet Service ────────────────────────────────────────────────────────────
// Backed by Firebase Realtime Database.

import { db, ref, get } from "@/lib/firebase";
import type { Outlet, AvailabilityStatus } from "@/types";
import { mockOutlets } from "@/data/mockData";
import { defaultDeliveryFeeStructure } from "@/lib/deliveryFee";

/** Simulated async fetch latency (ms) */
const MOCK_DELAY = 300;

function delay<T>(value: T, ms = MOCK_DELAY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** 
 * Map Firebase outlet data to SaaS Outlet type
 */
function mapFirebaseOutlet(id: string, data: any): Outlet {
  const meta = data.meta || {};
  const settings = data.settings || {};

  return {
    id: id,
    businessId: "business_roshani",
    name: meta.name || "Roshani Restaurant",
    slug: meta.slug || id,
    cuisine: meta.cuisine || "Indian, Fast Food",
    logo: meta.logo || "https://picsum.photos/id/102/100/100",
    coverImage: meta.coverImage || "https://picsum.photos/id/102/800/400",
    rating: meta.rating || 4.5,
    ratingCount: meta.ratingCount || 100,
    deliveryTimeMin: settings.deliveryTimeMin || 30,
    deliveryTimeMax: settings.deliveryTimeMax || 45,
    distanceKm: 0.5, // Logic for distance depends on user location
    availability: (settings.shopOpen ? "open" : "closed") as AvailabilityStatus,
    openingTime: settings.openingTime || "10:00",
    closingTime: settings.closingTime || "22:00",
    minOrderAmount: settings.minOrderAmount || 0,
    deliveryFeeStructure: settings.deliveryFees || defaultDeliveryFeeStructure,
    offers: meta.offers || [],
    tags: meta.tags || ["New"],
    address: settings.address || "Main Road, Bihar",
    location: { lat: 25.0, lng: 85.0 }, // fallback
    isVegOnly: meta.isVegOnly || false,
    featured: meta.featured || false,
    createdAt: meta.createdAt || new Date().toISOString(),
  };
}

/** Fetch all outlets */
export async function fetchOutlets(): Promise<Outlet[]> {
  try {
    const path = `businesses/business_roshani/outlets`;
    const snapshot = await get(ref(db, path));
    
    if (snapshot.exists()) {
      const outlets = snapshot.val();
      return Object.entries(outlets).map(([id, data]) => mapFirebaseOutlet(id, data));
    }
    
    return delay([...mockOutlets]);
  } catch (err) {
    console.error("Firebase outlets fetch error:", err);
    return delay([...mockOutlets]);
  }
}

/** Fetch a single outlet by id */
export async function fetchOutletById(id: string): Promise<Outlet | null> {
  try {
    const path = `businesses/business_roshani/outlets/${id}`;
    const snapshot = await get(ref(db, path));
    
    if (snapshot.exists()) {
      return mapFirebaseOutlet(id, snapshot.val());
    }
    
    return delay(mockOutlets.find((o) => o.id === id) ?? null, 400);
  } catch (err) {
    console.error("Firebase outlet fetch error:", err);
    return null;
  }
}

/** Fetch a single outlet by slug */
export async function fetchOutletBySlug(slug: string): Promise<Outlet | null> {
  // Simplified for demo: fetch all and find
  const outlets = await fetchOutlets();
  return outlets.find((o) => o.slug === slug) ?? null;
}

/** Filter outlets by search query + filter chip */
export function filterOutlets(
  outlets: Outlet[],
  query: string,
  filter: string
): Outlet[] {
  let result = outlets;

  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.cuisine.toLowerCase().includes(q) ||
        o.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  switch (filter) {
    case "Veg Only":
      result = result.filter((o) => o.isVegOnly);
      break;
    case "Top Rated":
      result = result.filter((o) => o.rating >= 4.5);
      break;
    case "Fastest Delivery":
      result = [...result].sort((a, b) => a.deliveryTimeMin - b.deliveryTimeMin);
      break;
    case "Offers":
      result = result.filter((o) => o.offers.length > 0);
      break;
    case "Open Now":
      result = result.filter(
        (o) => o.availability === "open" || o.availability === "busy"
      );
      break;
  }

  return result;
}

/** Get outlets sorted by distance (nearest first) */
export function sortByDistance(outlets: Outlet[]): Outlet[] {
  return [...outlets].sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Get featured outlets */
export function getFeaturedOutlets(outlets: Outlet[]): Outlet[] {
  return outlets.filter((o) => o.featured);
}

/** Get outlet name by id */
export function getOutletName(id: string): string {
  // Use a synchronous version for cart display if needed, or update components to handle async
  return mockOutlets.find((o) => o.id === id)?.name ?? "Unknown Restaurant";
}

/** Human-readable availability label */
export function availabilityLabel(status: AvailabilityStatus): string {
  switch (status) {
    case "open": return "Open";
    case "closed": return "Closed";
    case "busy": return "Busy";
    case "closing_soon": return "Closing Soon";
  }
}

/** Tailwind classes for availability badge */
export function availabilityClasses(status: AvailabilityStatus): string {
  switch (status) {
    case "open": return "bg-green-100 text-green-700 border-green-200";
    case "closed": return "bg-red-100 text-red-600 border-red-200";
    case "busy": return "bg-orange-100 text-orange-700 border-orange-200";
    case "closing_soon": return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }
}

/** Whether customers can currently order from this outlet */
export function canOrder(status: AvailabilityStatus): boolean {
  return status === "open" || status === "busy";
}

/** Formatted delivery time string */
export function deliveryTimeString(outlet: Outlet): string {
  return `${outlet.deliveryTimeMin}–${outlet.deliveryTimeMax} min`;
}
