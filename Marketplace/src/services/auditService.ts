import { db, ref, push, set, auth } from "@/lib/firebase";
import { serverTimestamp } from "firebase/database";

/**
 * Log a security or operational event to the marketplace audit trail
 */
export async function logMarketplaceAudit(action: string, details: any = {}): Promise<void> {
  try {
    const user = auth.currentUser;
    const auditRef = push(ref(db, 'logs/marketplaceAudit'));
    
    await set(auditRef, {
        timestamp: serverTimestamp(),
        action,
        details,
        userId: user ? user.uid : 'anonymous',
        userEmail: user ? user.email : 'anonymous',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server'
    });
    console.log(`[Audit] Marketplace Action Logged: ${action}`);
  } catch (e) {
    // Fail gracefully but log to console for debugging
    console.warn('[Audit] Marketplace audit log failed:', e);
  }
}
