// ─── Auth Service ─────────────────────────────────────────────────────────────
// Real Firebase Authentication Integration.

import { auth, db, ref, set, googleProvider, signInWithPopup, firebaseSignOut, onAuthStateChanged, getRedirectResult } from "@/lib/firebase";
import { updateProfile as fbUpdateProfile } from "firebase/auth";
import type { User } from "@/types";

/** 
 * Map Firebase Auth User to SaaS User type
 */
function mapFirebaseUser(fbUser: any): User {
  return {
    id: fbUser.uid,
    name: fbUser.displayName || "",
    email: fbUser.email || "",
    avatar: fbUser.photoURL || "",
    phone: fbUser.phoneNumber || "",
    savedAddresses: [],
    loyaltyPoints: 0,
    walletBalance: 0,
    walletHistory: [],
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

/** Handle the redirect result */
export async function handleRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      return mapFirebaseUser(result.user);
    }
  } catch (err) {
    console.error("Redirect result failed:", err);
  }
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
  const fbUser = auth.currentUser;
  if (!fbUser) return null;
  try {
    if (updates.name || updates.phone) {
      await fbUpdateProfile(fbUser, {
        displayName: updates.name || fbUser.displayName || undefined,
      });
    }
    const profileRef = ref(db, `users/${fbUser.uid}`);
    await set(profileRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    return mapFirebaseUser(auth.currentUser);
  } catch (err) {
    console.error("Profile update failed:", err);
    return mapFirebaseUser(fbUser);
  }
}
