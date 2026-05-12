// ─── Menu Service ─────────────────────────────────────────────────────────────
// Backed by Firebase Realtime Database.
// Automatically maps legacy Roshani dishes to SaaS MenuItem structure.

import { db, ref, get } from "@/lib/firebase";
import type { MenuItem, MenuItemSize, MenuItemAddon } from "@/types";
import { fetchOutlets } from "./outletService";

/** 
 * Map legacy dish format to SaaS MenuItem
 */
function mapLegacyDish(id: string, dish: any, outletId: string, businessId: string): MenuItem {
  const sizes: MenuItemSize[] = [];
  if (dish.sizes) {
    for (const sId in dish.sizes) {
      const sData = dish.sizes[sId];
      sizes.push({
        id: sId,
        name: sData.name || sId,
        price: typeof sData === 'number' ? sData : (sData.price || 0)
      });
    }
  }

  const addons: MenuItemAddon[] = [];
  if (dish.addons) {
    for (const aId in dish.addons) {
      const aData = dish.addons[aId];
      addons.push({
        id: aId,
        name: aData.name || aId,
        price: typeof aData === 'number' ? aData : (aData.price || 0)
      });
    }
  }

  return {
    id: id,
    outletId: outletId,
    businessId: businessId,
    name: dish.name || "Unknown Dish",
    description: dish.description || dish.name || "",
    image: dish.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591",
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
export async function fetchMenuByOutlet(outletId: string, businessId: string = "business_roshani"): Promise<MenuItem[]> {
  try {
    // Try multiple paths for flexibility (SaaS structure can vary)
    const paths = [
      `businesses/${businessId}/outlets/${outletId}`,
      `outlets/${outletId}`,
      `Pizza-Shop`, // Legacy Fallback
      `Cake-Shop`   // Legacy Fallback
    ];

    for (const path of paths) {
      const snap = await get(ref(db, path));
      if (snap.exists()) {
        const data = snap.val();
        // Potential item nodes: dishes, menu/items, Menu/Items
        const dishes = data.dishes || 
                       (data.menu && data.menu.items) || 
                       (data.Menu && data.Menu.Items);
        
        if (dishes) {
          const result: MenuItem[] = [];
          for (const id in dishes) {
            result.push(mapLegacyDish(id, dishes[id], outletId, businessId));
          }
          if (result.length > 0) return result;
        }
      }
    }
    
    // Final fallback: Check root dishes (Oldest legacy)
    const rootSnap = await get(ref(db, "dishes"));
    if (rootSnap.exists()) {
       const allDishes = rootSnap.val();
       const result: MenuItem[] = [];
       for (const id in allDishes) {
         const dish = allDishes[id];
         // Only include if it belongs to this outlet or is generic
         if (!dish.outlet || dish.outlet.toLowerCase() === outletId.toLowerCase() || 
             dish.outlet.toLowerCase().includes(outletId.toLowerCase())) {
           result.push(mapLegacyDish(id, dish, outletId, businessId));
         }
       }
       return result;
    }

    return [];
  } catch (err) {
    console.error("Firebase menu fetch error:", err);
    return [];
  }
}

/** Fetch a single menu item by id (across all outlets if needed) */
export async function fetchMenuItemById(id: string, outletId?: string, businessId?: string): Promise<MenuItem | null> {
  if (outletId && businessId) {
    const items = await fetchMenuByOutlet(outletId, businessId);
    return items.find(i => i.id === id) || null;
  }
  
  // fallback search (slow)
  const allOutlets = await fetchOutlets();
  for (const outlet of allOutlets) {
     const items = await fetchMenuByOutlet(outlet.id, outlet.businessId);
     const found = items.find(i => i.id === id);
     if (found) return found;
  }
  return null;
}

/** Get all best-seller items globally */
export async function getGlobalBestSellers(limit = 8): Promise<MenuItem[]> {
  try {
    const outlets = await fetchOutlets();
    let allBestSellers: MenuItem[] = [];
    
    // Fetch in parallel for performance
    const menuPromises = outlets.map(o => fetchMenuByOutlet(o.id, o.businessId));
    const results = await Promise.all(menuPromises);
    
    results.forEach((menu, idx) => {
      const outlet = outlets[idx];
      const items = menu.filter(i => i.isBestSeller && i.isAvailable).map(item => ({
        ...item,
        outletName: outlet.name
      }));
      allBestSellers = [...allBestSellers, ...items];
    });
    
    return allBestSellers.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, limit);
  } catch {
    return [];
  }
}

/** Get recommended items globally */
export async function getGlobalRecommended(limit = 8): Promise<MenuItem[]> {
  try {
    const outlets = await fetchOutlets();
    let allRecommended: MenuItem[] = [];
    
    const menuPromises = outlets.map(o => fetchMenuByOutlet(o.id, o.businessId));
    const results = await Promise.all(menuPromises);
    
    results.forEach((menu, idx) => {
      const outlet = outlets[idx];
      const items = menu.slice(0, 5).map(item => ({
        ...item,
        outletName: outlet.name
      }));
      allRecommended = [...allRecommended, ...items];
    });
    
    return allRecommended.sort(() => Math.random() - 0.5).slice(0, limit);
  } catch {
    return [];
  }
}

/** Get unique categories for an outlet's menu */
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

/** Filter menu items by search query - Resilient Fuzzy Search */
export function searchMenu(items: MenuItem[], query: string): MenuItem[] {
  if (!query) return items;
  const q = query.toLowerCase().trim();
  
  return items.filter((item) => {
    const name = (item.name || "").toLowerCase();
    const desc = (item.description || "").toLowerCase();
    const cat = (item.category || "").toLowerCase();
    
    // Check for exact category match or inclusion
    return name.includes(q) || desc.includes(q) || cat.includes(q) || q.includes(cat);
  });
}

/** Fetch ALL menu items (for global search) */
export async function fetchAllMenuItems(): Promise<MenuItem[]> {
  try {
    const [dishesSnap, outletsSnap] = await Promise.all([
      get(ref(db, "dishes")),
      get(ref(db, "outlets"))
    ]);

    if (dishesSnap.exists()) {
      const allDishes = dishesSnap.val();
      const allOutlets = outletsSnap.val() || {};
      const result: MenuItem[] = [];
      
      for (const id in allDishes) {
        const dish = allDishes[id];
        const outletId = dish.outlet || "Pizza-Shop";
        const outletName = allOutlets[outletId]?.name || "Roshani Restaurant";
        
        result.push({
          ...mapLegacyDish(id, dish, outletId, "business_roshani"),
          outletName
        });
      }
      return result;
    }
    return [];
  } catch (err) {
    console.error("Fetch all menu items error:", err);
    return [];
  }
}

/** Filter menu items by category */
export function filterByCategory(items: MenuItem[], category: string): MenuItem[] {
  switch (category) {
    case "All": return items;
    case "Recommended": return items.filter((i) => i.isRecommended);
    case "Best Sellers": return items.filter((i) => i.isBestSeller);
    default: return items.filter((i) => i.category === category);
  }
}
