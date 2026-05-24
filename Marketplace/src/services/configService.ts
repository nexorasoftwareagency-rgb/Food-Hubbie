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
    
    return [];
  } catch (err) {
    console.error("Error fetching cuisines:", err);
    return [];
  }
};
