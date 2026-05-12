// ─── Menu Service ─────────────────────────────────────────────────────────────
// Backed by Firebase Realtime Database.
// Automatically maps legacy Roshani dishes to SaaS MenuItem structure.

import { db, ref, get, child } from "@/lib/firebase";
import type { MenuItem, MenuItemSize, MenuItemAddon } from "@/types";
import { mockMenuItems } from "@/data/mockData";

/** 
 * Map legacy dish format to SaaS MenuItem
 */
function mapLegacyDish(id: string, dish: any, outletId: string): MenuItem {
  // Extract sizes from sizes object or use default price
  const sizes: MenuItemSize[] = [];
  if (dish.sizes) {
    Object.entries(dish.sizes).forEach(([sId, sData]: [string, any]) => {
      sizes.push({
        id: sId,
        name: sData.name || sId,
        price: sData.price || 0
      });
    });
  }

  // Extract addons
  const addons: MenuItemAddon[] = [];
  if (dish.addons) {
    Object.entries(dish.addons).forEach(([aId, aData]: [string, any]) => {
      addons.push({
        id: aId,
        name: aData.name || aId,
        price: aData.price || 0
      });
    });
  }

  return {
    id: id,
    outletId: outletId,
    businessId: "business_roshani",
    name: dish.name || "Unknown Dish",
    description: dish.description || dish.name || "",
    image: dish.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591", // fallback
    category: dish.category || "General",
    isVeg: dish.isVeg !== undefined ? dish.isVeg : true,
    price: dish.price || (sizes.length > 0 ? sizes[0].price : 0),
    rating: dish.rating || 4.5,
    ratingCount: dish.ratingCount || 10,
    isBestSeller: dish.isBestSeller || false,
    isRecommended: dish.isRecommended || false,
    isSpicy: dish.isSpicy || false,
    isAvailable: dish.stock !== undefined ? dish.stock : true,
    customizable: sizes.length > 0 || addons.length > 0,
    addons: addons,
    sizes: sizes,
    crusts: [],
    preparationTimeMin: dish.prepTime || 20,
    sortOrder: dish.sortOrder || 100
  };
}

/** Fetch all menu items for a given outlet */
export async function fetchMenuByOutlet(outletId: string): Promise<MenuItem[]> {
  try {
    // Try to fetch from real Firebase first
    const path = `businesses/business_roshani/outlets/${outletId}/dishes`;
    const snapshot = await get(ref(db, path));
    
    if (snapshot.exists()) {
      const dishes = snapshot.val();
      return Object.entries(dishes).map(([id, dish]) => mapLegacyDish(id, dish, outletId));
    }
    
    // Fallback to mock data if not found in Firebase
    console.warn(`⚠️ No live dishes found for ${outletId} at ${path}. Falling back to mock data.`);
    return mockMenuItems
      .filter((i) => i.outletId === outletId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (err) {
    console.error("Firebase fetch error:", err);
    return mockMenuItems.filter((i) => i.outletId === outletId);
  }
}

/** Fetch a single menu item by id */
export async function fetchMenuItemById(id: string): Promise<MenuItem | null> {
  // Simplified for now: fetch full menu and find. 
  // In production: fetch by specific ID or keep a cache.
  const allItems = await fetchMenuByOutlet("outlet_pizza");
  return allItems.find(i => i.id === id) || null;
}

/** Get all unique categories for an outlet's menu (ordered by first appearance) */
export function getCategories(items: MenuItem[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    if (!seen.has(item.category)) {
      seen.add(item.category);
      result.push(item.category);
    }
  }
  return result;
}

/** Filter menu items by search query */
export function searchMenu(items: MenuItem[], query: string): MenuItem[] {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  return items.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      i.category.toLowerCase().includes(q)
  );
}

/** Filter menu items by category (special keys: "All", "Recommended", "Best Sellers") */
export function filterByCategory(items: MenuItem[], category: string): MenuItem[] {
  switch (category) {
    case "All":
      return items;
    case "Recommended":
      return items.filter((i) => i.isRecommended);
    case "Best Sellers":
      return items.filter((i) => i.isBestSeller);
    default:
      return items.filter((i) => i.category === category);
  }
}

/** Get best-seller items across all outlets (for Home page) */
export function getBestSellers(limit = 6): MenuItem[] {
  // This is a global call. For now, using mock for global trending.
  return mockMenuItems
    .filter((i) => i.isBestSeller && i.isAvailable)
    .slice(0, limit);
}

/** Get recommended items across all outlets */
export function getRecommended(limit = 6): MenuItem[] {
  return mockMenuItems
    .filter((i) => i.isRecommended && i.isAvailable)
    .slice(0, limit);
}
