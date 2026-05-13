import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "@/types";
import { subscribeToAuthChanges, signOut as authSignOut, updateProfile, signInWithGoogle as googleSignIn } from "@/services/authService";

type AuthState = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: User | null;
  authState: AuthState;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateUser: (updates: Partial<Pick<User, "name" | "phone" | "email">>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    // 1. Process redirect result first
    const processRedirect = async () => {
      try {
        const redirectUser = await handleRedirectResult();
        if (redirectUser) {
          setUser(redirectUser);
          setAuthState("authenticated");
        }
      } catch (err) {
        console.error("Redirect processing failed:", err);
      }
    };

    processRedirect();

    // 2. Subscribe to standard auth changes
    const unsubscribe = subscribeToAuthChanges((u) => {
      if (u) {
        setUser(u);
        setAuthState("authenticated");
      } else {
        // Only set to unauthenticated if we're not still checking redirect
        // We give onAuthStateChanged a moment to settle
        setUser(null);
        setAuthState("unauthenticated");
      }
    });
    return () => unsubscribe();
  }, []);

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
