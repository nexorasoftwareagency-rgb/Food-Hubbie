// === src/types/index.ts ===
// All TypeScript interfaces for the FoodHubbie Rider App.
// Mirrors the exact Firebase Realtime Database schema (PRD §3, §8).

export type RiderStatus = "Online" | "Offline";

export type Rider = {
  uid: string;
  name: string;
  fatherName: string;
  age: string;
  aadharNo: string;
  aadharPhoto: string;
  qualification: string;
  phone: string;
  address: string;
  profilePhoto: string;
  status: RiderStatus;
  lastSeen: number;
  fcmToken: string;
  businessId: string;
  isAdmin: boolean;
  /** Optional — no rating pipeline exists yet platform-wide; renders as "New" until SupremeAdmin adds one. */
  rating?: number;
  wallet: RiderWallet;
  ledger?: Record<string, LedgerEntry>;
  notifications?: Record<string, RiderNotification>;
  location?: RiderLocation;
};

export type RiderWallet = {
  balance: number;
  totalEarned: number;
  lastTx: string;
  lastTxAt: number;
};

export type LedgerEntry = {
  txId: string;
  orderId: string;
  amount: number;
  type: "EARNING" | "SETTLEMENT" | "ADJUSTMENT";
  description: string;
  timestamp: number;
  outlet: string;
  method?: string;
};

export type RiderNotification = {
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  type: "info" | "success" | "warning";
  icon: string;
};

export type RiderLocation = {
  lat: number;
  lng: number;
  accuracy: number;
  ts: number;
  lastUpdate: number;
  signalLost?: boolean;
};

export type RiderStats = {
  totalOrders: number;
  totalEarnings: number;
  deliveriesToday?: number;
  earningsToday?: number;
};

export type OrderStatus =
  | "Placed"
  | "Confirmed"
  | "Preparing"
  | "Cooked"
  | "Ready"
  | "Out for Delivery"
  | "Reached Drop Location"
  | "Delivered"
  | "Cancelled";

export type OrderItem = {
  menuItemId: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
};

export type RiderOrder = {
  id: string;
  orderId?: string;
  outletId: string;
  businessId: string;
  outletName: string;
  outletPhone?: string;
  outletAddress?: string;
  outletLat?: number;
  outletLng?: number;

  assignedRider?: string;
  riderId?: string;
  riderPhone?: string;
  acceptedAt?: number;

  status: OrderStatus;
  statusUpdatedAt?: number;
  statusUpdatedBy?: string;
  arrivedAtRestaurantAt?: number;
  pickedUpAt?: number;
  reachedDropAt?: number;
  deliveredAt?: number;

  deliveryOTP?: string;
  otp?: string;
  otpVerifiedAt?: number;

  customerName?: string;
  customerPhone?: string;
  phone?: string;
  address: string;
  lat: number;
  lng: number;

  items: OrderItem[];
  normalizedItems?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  discount?: number;
  couponCode?: string;
  couponDiscount?: number;
  globalDiscount?: number;
  paymentMethod: "cod" | "upi" | "card" | "wallet";
  paymentCollected?: boolean;
  verifiedBy?: string;
  estimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
};

/** Convenience shape used in the Pickup / Available Orders list */
export type AvailableOrder = {
  id: string;
  outletName: string;
  outletId: string;
  businessId: string;
  outletPhone?: string;
  outletAddress?: string;
  outletLat: number;
  outletLng: number;
  status: string;
  address: string;
  lat: number;
  lng: number;
  deliveryFee: number;
  total: number;
  subtotal: number;
  discount?: number;
  items: OrderItem[];
  distance?: number;
  createdAt: string;
};

export type DeliveryStep = "accepted" | "reached_outlet" | "picked_up" | "reached_drop" | "completed";

export type Settlement = {
  id: string;
  amountCollected: number;
  ordersClearedCount: number;
  settledByAdmin: string;
  timestamp: number;
};

export type OfflineAction = {
  type: "ACCEPT_ORDER" | "UPDATE_STATUS" | "REACHED_OUTLET";
  payload: any;
  queuedAt: number;
  id: string;
};

export type OutletSettings = {
  Store: { lat: string; lng: string };
  Delivery: {
    riderAcceptanceRadius: number;
    backupCode: string;
  };
};

export type Outlet = {
  name: string;
  address: string;
  location?: { lat: number; lng: number };
  phone: string;
  settings: OutletSettings;
};

export type Business = {
  name: string;
  outlets: Record<string, Outlet>;
};

export type OtpAttemptRecord = {
  count: number;
  lastTry: number;
  blockedUntil: number;
  lastResend: number;
  resendCount: number;
};

export type ToastVariant = "success" | "error" | "warning" | "info";

export type OutletRef = { bid: string; oid: string };
