import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "@/types";
import { subscribeToAuthChanges, signOut as authSignOut, updateProfile, signInWithGoogle as googleSignIn, handleRedirectResult } from "@/services/authService";

type AuthState = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: User | null;
  authState: AuthState;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateUser: (updates: Partial<Pick<User, "name" | "phone" | "email">>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

import { db } from "@/firebase";
import { ref, onValue } from "firebase/database";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    let isRedirecting = true;
    let lastUser: User | null = null;
    let hasStateChanged = false;

    const initAuth = async () => {
      try {
        const redirectUser = await handleRedirectResult();
        if (redirectUser) {
          setUser(redirectUser);
          setAuthState("authenticated");
        }
      } catch (err) {
        console.error("Redirect processing failed:", err);
      } finally {
        isRedirecting = false;
        if (!lastUser && hasStateChanged && !user) {
          setAuthState("unauthenticated");
        }
      }
    };

    initAuth();

    const unsubscribe = subscribeToAuthChanges((u) => {
      lastUser = u;
      hasStateChanged = true;
      if (u) {
        setUser(u);
        setAuthState("authenticated");
      } else if (!isRedirecting) {
        setUser(null);
        setAuthState("unauthenticated");
      }
    });
    
    return () => unsubscribe();
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
                .map(([tid, t]: [string, any]) => ({ id: tid, ...t }))
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
              loyaltyPoints: dbData.loyaltyPoints || 0,
              savedAddresses: dbData.savedAddresses || []
            };
          });
        }
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
