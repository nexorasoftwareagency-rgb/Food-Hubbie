// ─── Auth Service ─────────────────────────────────────────────────────────────
// Real Firebase Authentication Integration.

import { auth, googleProvider, signInWithPopup, firebaseSignOut, onAuthStateChanged } from "@/lib/firebase";
import type { User } from "@/types";

/** 
 * Map Firebase Auth User to SaaS User type
 */
function mapFirebaseUser(fbUser: any): User {
  return {
    id: fbUser.uid,
    name: fbUser.displayName || "Customer",
    email: fbUser.email || "",
    avatar: fbUser.photoURL || "",
    phone: fbUser.phoneNumber || "",
    savedAddresses: [], 
    loyaltyPoints: 0,
    createdAt: fbUser.metadata.creationTime || new Date().toISOString()
  };
}

/** Get current session user */
export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (fbUser) => {
    if (fbUser) {
      callback(mapFirebaseUser(fbUser));
    } else {
      callback(null);
    }
  });
}

/** Sign in with Google (Popup) */
export async function signInWithGoogle(): Promise<User | null> {
  const result = await signInWithPopup(auth, googleProvider);
  if (result.user) {
    return mapFirebaseUser(result.user);
  }
  return null;
}

/** Handle the redirect result (Keep for compatibility, though we use popup now) */
export async function handleRedirectResult(): Promise<User | null> {
  return null;
}

/** Sign out */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/** Update profile */
export async function updateProfile(
  updates: Partial<Pick<User, "name" | "phone" | "email">>
): Promise<User | null> {
  // In production: use firebase updateProfile and update DB user node
  console.log("Profile update requested:", updates);
  if (auth.currentUser) {
     return mapFirebaseUser(auth.currentUser);
  }
  return null;
}
