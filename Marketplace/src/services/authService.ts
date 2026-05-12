// ─── Auth Service ─────────────────────────────────────────────────────────────
// Mock auth layer — returns the demo user immediately.
// Future: replace with Firebase Auth SDK calls:
//   signInWithPhoneNumber, onAuthStateChanged, signOut, etc.

import { mockUser } from "@/data/mockData";
import type { User } from "@/types";

const MOCK_DELAY = 400;

function delay<T>(value: T, ms = MOCK_DELAY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Get the currently signed-in user (null if not logged in) */
export async function getCurrentUser(): Promise<User | null> {
  // Mock: always "logged in" with demo user
  return delay(mockUser);
}

/** Sign in with phone + OTP (mock — always succeeds) */
export async function signInWithPhone(
  _phone: string,
  _otp: string
): Promise<User> {
  return delay(mockUser, 800);
}

/** Sign out */
export async function signOut(): Promise<void> {
  return delay(undefined as unknown as void, 300);
}

/** Update user profile fields */
export async function updateProfile(
  updates: Partial<Pick<User, "name" | "phone" | "email">>
): Promise<User> {
  return delay({ ...mockUser, ...updates }, 600);
}
