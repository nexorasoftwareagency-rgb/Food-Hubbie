// === src/lib/constants.ts ===
// Firebase path helpers, status enums, proximity gates, rate limits,
// and WhatsApp message templates — extracted 1:1 from legacy app.js (PRD §3.1, §12).

/** Firebase Realtime Database path helpers */
export const dbPaths = {
  rider: (rId: string) => `riders/${rId}`,
  riderWallet: (rId: string) => `riders/${rId}/wallet`,
  riderLedger: (rId: string) => `riders/${rId}/ledger`,
  riderNotifs: (rId: string) => `riders/${rId}/notifications`,
  riderLocation: (rId: string) => `riders/${rId}/location`,
  riderStats: (rId: string) => `riderStats/${rId}`,
  orders: (bId: string, oId: string) => `businesses/${bId}/outlets/${oId}/orders`,
  singleOrder: (bId: string, oId: string, orderId: string) =>
    `businesses/${bId}/outlets/${oId}/orders/${orderId}`,
  outlet: (bId: string, oId: string) => `businesses/${bId}/outlets/${oId}`,
  outletSettings: (bId: string, oId: string) => `businesses/${bId}/outlets/${oId}/settings`,
  businesses: () => `businesses`,
  ordersIndex: () => `orders`,
  // NOTE: matches database.rules.json's businesses/{bid}/outlets/{oid}/botCommands,
  // which explicitly grants write access to any authenticated rider.
  botCommands: (bId: string, oId: string) => `businesses/${bId}/outlets/${oId}/botCommands`,
  // NOTE: matches database.rules.json's businesses/{bid}/outlets/{oid}/otpAttempts/{orderId}
  // (there is no top-level otpAttempts node in the deployed rules — nesting under the
  // owning outlet is required for rider writes to be permitted at all).
  otpAttempts: (bId: string, oId: string, orderId: string) =>
    `businesses/${bId}/outlets/${oId}/otpAttempts/${orderId}`,
  settlements: (rId: string) => `settlements/${rId}`,
  riderErrors: (rId: string) => `logs/riderErrors/${rId}`,
};

/** Rider-facing order status pipeline (PRD §3.2) */
export const ORDER_STATUSES = [
  "Placed",
  "Confirmed",
  "Preparing",
  "Cooked",
  "Ready",
  "Out for Delivery",
  "Reached Drop Location",
  "Delivered",
  "Cancelled",
] as const;

/** Proximity gate values — hardcoded, DO NOT change without updating legacy portals too (PRD §12.3) */
export const PROXIMITY = {
  ACCEPT_ORDER_KM: 1.0,
  REACHED_OUTLET_KM: 1.0,
  CONFIRM_PICKUP_KM: 0.3,
  DEFAULT_DROP_RADIUS_KM: 1.0,
};

/** OTP rate limiting (PRD §12.4 / §12.5) */
export const OTP_LIMITS = {
  MAX_ATTEMPTS: 10,
  BLOCK_DURATION_MS: 60 * 1000,
  RESEND_COOLDOWN_MS: 60 * 1000,
};

/** Ghost-order filtering window (PRD §12.11) */
export const GHOST_ORDER_WINDOW_MS = 12 * 60 * 60 * 1000;

/** GPS sync interval while Online (PRD §12.9) */
export const LOCATION_SYNC_INTERVAL_MS = 10 * 1000;

/** New-order ping countdown duration */
export const PING_COUNTDOWN_SECONDS = 30;

/** WhatsApp message templates — exact strings (PRD §12.12) */
export const WHATSAPP_TEMPLATES = {
  ACCEPTED: (riderName: string, orderId: string) =>
    `Hello! I am ${riderName}, your delivery partner for Foodhubbie order #${orderId}. I am on my way to pick up your order! \u{1F6F5}`,

  PICKED_UP: (riderName: string, riderPhone: string, orderId: string) =>
    `Great news! I have picked up your order #${orderId}. If you need anything, you can call me at ${riderPhone}. I am on my way! \u{1F355}\u{1F382}`,

  REACHED_DROP: (orderId: string) =>
    `I have arrived at your drop location with your order #${orderId}! Please have your 4-digit OTP ready. \u2705`,

  SEND_OTP: (orderId: string, otp: string) =>
    `Your Foodhubbie order #${orderId} has arrived! \u{1F4CD} \n\nTo safely receive your order, please provide this 4-digit OTP to the rider: *${otp}* \u2705`,

  ARRIVED: (orderId: string) =>
    `I have arrived with your order #${orderId}! Please have your 4-digit OTP ready. \u2705`,
};

/** Design tokens mirrored for JS-side usage (map markers, confetti, charts) */
export const BRAND = {
  primary: "#FF5200",
  primaryDark: "#E64A00",
  primaryLight: "#FFF5F1",
  success: "#10B981",
  info: "#3B82F6",
  warning: "#F59E0B",
  danger: "#EF4444",
};

export const CONFETTI_COLORS = ["#FF5200", "#FF7A00", "#22C55E"];

export const APP_VERSION = "5.0.0";

/** Motivational weekly earnings target shown on the Earnings page. No backend field
 *  for this exists yet — safe to wire to a real Firebase setting later if needed. */
export const WEEKLY_EARNINGS_TARGET = 5000;
