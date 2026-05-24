import { db, ref, get, push, set, update } from "@/lib/firebase";
import type { Review } from "@/types";
import { logMarketplaceAudit } from "./auditService";

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
            if (oData.reviews) {
              for (const rid in oData.reviews) {
                const rData = oData.reviews[rid];
                allReviews.push({
                  id: rid,
                  userId: rData.userId || "anonymous",
                  userName: rData.userName || "",
                  userAvatar: rData.userAvatar || `https://ui-avatars.com/api/?name=${rData.userName || 'C'}`,
                  outletId: oid,
                  outletName: oData.settings?.Store?.storeName || "Restaurant",
                  rating: rData.rating || 5,
                  riderRating: rData.riderRating,
                  riderId: rData.riderId,
                  riderName: rData.riderName,
                  comment: rData.comment || "",
                  date: rData.date || rData.createdAt || new Date().toISOString(),
                  likes: rData.likes || 0
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

/**
 * Submit a new review for an order (includes optional rider rating).
 */
export async function submitReview(
  businessId: string,
  outletId: string,
  orderId: string,
  reviewData: Omit<Review, "id" | "date" | "likes">
): Promise<void> {
  try {
    const path = `businesses/${businessId}/outlets/${outletId}/reviews`;
    const reviewsRef = ref(db, path);
    const newReviewRef = push(reviewsRef);
    
    const finalReview = {
      ...reviewData,
      orderId,
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
      date: new Date().toISOString(),
      likes: 0
    };

    const updates: Record<string, any> = {};
    updates[newReviewRef.key as string] = finalReview;

    // If rider rating provided, also save to rider ratings aggregation
    if (reviewData.riderRating && reviewData.riderId) {
      const riderRatingPath = `riders/${reviewData.riderId}/ratings`;
      const riderRatingRef = push(ref(db, riderRatingPath));
      updates[`riders/${reviewData.riderId}/ratings/${riderRatingRef.key}`] = {
        rating: reviewData.riderRating,
        orderId,
        userId: reviewData.userId,
        userName: reviewData.userName,
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
      };

      // Update rider aggregate stats
      await updateRiderRatingStats(reviewData.riderId, reviewData.riderRating);
    }

    await update(reviewsRef, updates);

    // Audit Log
    await logMarketplaceAudit('ORDER_REVIEW_SUBMITTED', {
      orderId,
      rating: reviewData.rating,
      riderRating: reviewData.riderRating,
      outletId
    });

    console.log(`[ReviewService] Review submitted for order ${orderId}`);
  } catch (error) {
    console.error("Error submitting review:", error);
    throw new Error("Could not submit your review. Please try again.");
  }
}

/**
 * Update rider's aggregate rating stats
 */
async function updateRiderRatingStats(riderId: string, newRating: number): Promise<void> {
  try {
    const riderSnap = await get(ref(db, `riders/${riderId}`));
    const riderData = riderSnap.val() || {};
    
    const currentAvg = riderData.averageRating || 0;
    const currentCount = riderData.ratingCount || 0;
    
    const newCount = currentCount + 1;
    const newAvg = ((currentAvg * currentCount) + newRating) / newCount;
    
    await update(ref(db, `riders/${riderId}`), {
      averageRating: Math.round(newAvg * 10) / 10,
      ratingCount: newCount,
      lastRatingAt: Date.now()
    });
  } catch (error) {
    console.error("Error updating rider rating stats:", error);
  }
}
