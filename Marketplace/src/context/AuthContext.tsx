import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "@/types";
import { subscribeToAuthChanges, signOut as authSignOut, updateProfile, signInWithGoogle as googleSignIn, handleRedirectResult } from "@/services/authService";
import { requestNotificationPermission } from "@/services/notificationService";

type AuthState = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: User | null;
  authState: AuthState;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateUser: (updates: Partial<Pick<User, "name" | "phone" | "email">>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | null = null;

    const initAuth = async () => {
      try {
        const redirectUser = await handleRedirectResult();
        if (active && redirectUser) {
          setUser(redirectUser);
          setAuthState("authenticated");
          requestNotificationPermission(redirectUser.id);
        }
      } catch (err) {
        console.error("Redirect processing failed:", err);
      }

      if (active) {
        unsubscribe = subscribeToAuthChanges((u) => {
          if (!active) return;
          if (u) {
            setUser(u);
            setAuthState("authenticated");
            requestNotificationPermission(u.id);
          } else {
            setUser(null);
            setAuthState("unauthenticated");
          }
        });
      }
    };

    initAuth();

    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Sync profile data from Realtime Database
  useEffect(() => {
    if (authState === "authenticated" && user?.id) {
      const userRef = ref(db, `users/${user.id}`);
      const unsubscribe = onValue(userRef, (snap) => {
        const dbData = snap.val();
        if (dbData) {
          setUser(prev => {
            if (!prev) return null;
            return {
              ...prev,
              name: dbData.name || prev.name,
              phone: dbData.phone || prev.phone,
              walletBalance: dbData.wallet?.balance || 0,
              walletHistory: Object.entries(dbData.wallet?.history || {})
                .map(([tid, t]: [string, any]) => {
                  const timestamp = Date.parse(t.createdAt);
                  return { id: tid, ...t, _ts: isNaN(timestamp) ? 0 : timestamp };
                })
                .sort((a, b) => b._ts - a._ts),
              loyaltyPoints: dbData.loyaltyPoints || 0,
              savedAddresses: dbData.savedAddresses || []
            };
          });
        }
      }, (error) => {
        console.error("[AuthContext] Firebase User Sync Error:", error);
      });
      return () => unsubscribe();
    }
  }, [authState, user?.id]);

  const signInWithGoogle = async () => {
    try {
      setAuthState("loading");
      await googleSignIn();
      // Browser will redirect, so we don't need to do anything else here
    } catch (err) {
      console.error("Google sign in failed:", err);
      setAuthState("unauthenticated");
    }
  };

  const signOut = async () => {
    await authSignOut();
    setUser(null);
    setAuthState("unauthenticated");
  };

  const updateUser = async (
    updates: Partial<Pick<User, "name" | "phone" | "email">>
  ) => {
    const updated = await updateProfile(updates);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, authState, signOut, signInWithGoogle, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
