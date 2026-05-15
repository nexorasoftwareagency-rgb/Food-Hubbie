import { db, ref, get } from "@/lib/firebase";

export type Cuisine = {
  id: string;
  name: string;
  image: string;
};

export const fetchCuisines = async (): Promise<Cuisine[]> => {
  try {
    const cuisinesRef = ref(db, 'system/platformConfig/cuisines');
    const snapshot = await get(cuisinesRef);
    if (snapshot.exists()) {
      return Object.values(snapshot.val());
    }
    
    // Fallback default cuisines
    return [
      { id: "pizza", name: "Pizza", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200" },
      { id: "burgers", name: "Burgers", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200" },
      { id: "chinese", name: "Chinese", image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=200" },
      { id: "indian", name: "Indian", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200" },
      { id: "desserts", name: "Desserts", image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200" },
      { id: "healthy", name: "Healthy", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200" },
    ];
  } catch (err) {
    console.error("Error fetching cuisines:", err);
    return [];
  }
};
