import { db, ref, get } from "@/lib/firebase";
import type { Review } from "@/types";

/**
 * Fetches reviews globally from all business outlets.
 */
export async function fetchGlobalReviews(limit = 6): Promise<Review[]> {
  try {
    const snapshot = await get(ref(db, 'businesses'));
    
    if (snapshot.exists()) {
      const businesses = snapshot.val();
      const allReviews: Review[] = [];
      
      for (const bid in businesses) {
        const bData = businesses[bid];
        if (bData.outlets) {
          for (const oid in bData.outlets) {
            const oData = bData.outlets[oid];
            if (oData.feedbacks) {
              for (const fid in oData.feedbacks) {
                const fData = oData.feedbacks[fid];
                allReviews.push({
                  id: fid,
                  userId: fData.userId || "anonymous",
                  userName: fData.customerName || fData.name || "Customer",
                  userAvatar: fData.avatar || `https://ui-avatars.com/api/?name=${fData.customerName || 'C'}`,
                  outletId: oid,
                  outletName: oData.settings?.Store?.storeName || "Restaurant",
                  rating: fData.rating || 5,
                  comment: fData.comment || fData.feedback || "",
                  date: fData.timestamp || fData.createdAt || new Date().toISOString(),
                  likes: 0
                });
              }
            }
          }
        }
      }
      
      return allReviews
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    }
    return [];
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}
