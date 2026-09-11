// === src/services/authService.ts ===
import {
  auth,
  db,
  ref,
  update,
  onDisconnect,
  serverTimestamp,
  signInWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
} from "@/lib/firebase";
import type { User } from "firebase/auth";
import { dbPaths } from "@/lib/constants";

/** Riders authenticate with {10-digit phone}@rider.com, OR a raw email if one was provided. */
export function normalizeIdentifier(identifier: string): string {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  const digits = trimmed.replace(/\D/g, "");
  const last10 = digits.slice(-10);
  return `${last10}@rider.com`;
}

export type AuthErrorInfo = { code: string; message: string };

function mapAuthError(err: any): AuthErrorInfo {
  const code = err?.code || "auth/unknown";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return { code, message: "Incorrect mobile number or password. Please try again." };
    case "auth/too-many-requests":
      return { code, message: "Too many attempts. Please wait a moment and try again." };
    case "auth/network-request-failed":
      return { code, message: "Network error. Check your internet connection and try again." };
    case "auth/user-disabled":
      return { code, message: "Your account has been disabled. Please contact your admin." };
    default:
      return { code, message: "Sign in failed. Please try again or contact your admin." };
  }
}

export async function loginRider(identifier: string, password: string): Promise<User> {
  const email = normalizeIdentifier(identifier);
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    try {
      localStorage.setItem("isLoggedIn", "true");
    } catch {
      /* ignore storage errors (private mode) */
    }
    return cred.user;
  } catch (err: any) {
    throw mapAuthError(err);
  }
}

export async function logoutRider(uid?: string): Promise<void> {
  try {
    if (uid) {
      await update(ref(db, dbPaths.rider(uid)), {
        status: "Offline",
        lastSeen: serverTimestamp(),
      });
    }
  } catch {
    /* best-effort — proceed with sign out regardless */
  }
  try {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("activeOrderId");
    localStorage.removeItem("activeOrderData");
  } catch {
    /* ignore */
  }
  await firebaseSignOut(auth);
}

/** Marks the rider Offline automatically if the browser/tab disconnects ungracefully (PRD §12.8) */
export function armDisconnectHandlers(uid: string) {
  const riderRef = ref(db, dbPaths.rider(uid));
  onDisconnect(riderRef).update({
    status: "Offline",
    lastSeen: serverTimestamp(),
  });
  const locRef = ref(db, dbPaths.riderLocation(uid));
  onDisconnect(locRef).update({
    signalLost: true,
    lastSeen: serverTimestamp(),
  });
}

export function subscribeAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function wasPreviouslyLoggedIn(): boolean {
  try {
    return localStorage.getItem("isLoggedIn") === "true";
  } catch {
    return false;
  }
}
