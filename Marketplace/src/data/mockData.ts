// ─── Mock Data Registry ──────────────────────────────────────────────────────────
// Deprecated: All data is now fetched from Firebase Realtime Database.
// Assets are preserved for UI branding.

import type { Outlet, MenuItem, Review, Order, User } from "@/types";
import heroPng from "@/assets/hero.png";

export const heroBanner: string = heroPng;

// Empty registries to ensure zero dummy data leaks into the live UI
export const mockOutlets: Outlet[] = [];
export const mockMenuItems: MenuItem[] = [];
export const mockReviews: Review[] = [];
export const mockPastOrders: Order[] = [];

export const mockUser: User = {
  id: "user_me",
  name: "Guest User",
  phone: "",
  loyaltyPoints: 0,
  savedAddresses: [],
  createdAt: new Date().toISOString(),
};
