/**
 * ============================================================
 * FOODHUBBIE SAAS — Global Constants
 * ============================================================
 * Single source of truth for brand identity, theme tokens,
 * and SaaS configuration across all modules.
 * ============================================================
 */

const FOODHUBBIE = {
  // ─── Brand Identity ──────────────────────────────────────
  brand: {
    name: "Foodhubbie",
    tagline: "Your Neighbourhood Food Hub",
    logo: "/assets/foodhubbie-logo.svg",
    favicon: "/assets/foodhubbie-favicon.png",
    version: "1.0.0"
  },

  // ─── Theme Tokens (Forest Green / Amber / Cream) ─────────
  theme: {
    primary: "#065F46",        // Forest Green
    primaryHSL: "160 91% 20%",
    secondary: "#F59E0B",      // Amber/Orange
    secondaryHSL: "38 92% 50%",
    background: "#FFFBEB",     // Warm Cream
    backgroundHSL: "48 100% 97%",
    foreground: "#0A2E1E",     // Dark Green-Black
    foregroundHSL: "160 50% 8%",
    card: "#FFFDF5",           // Off-white card
    cardHSL: "48 80% 98%",
    muted: "#F5ECD4",          // Muted cream
    mutedHSL: "48 60% 92%",
    destructive: "#EF4444",    // Red
    fontSans: "'Plus Jakarta Sans', sans-serif",
    fontHeading: "'Syne', sans-serif",
    borderRadius: "0.75rem"
  },

  // ─── SaaS Configuration ──────────────────────────────────
  saas: {
    maxOutletsPerBusiness: 50,
    defaultDeliveryRadiusKm: 15,
    orderAutoCancel_hours: 5,
    riderHeartbeat_seconds: 30,
    botSessionTimeout_minutes: 30,
    otpLength: 4,
    maxQuantityPerItem: 50,
    gstPercent: 5,
    platformFeePercent: 2
  },

  // ─── Default Delivery Fee Slabs ──────────────────────────
  defaultDeliveryFeeStructure: [
    { upToKm: 2, fee: 20 },
    { upToKm: 5, fee: 35 },
    { upToKm: 10, fee: 50 },
    { upToKm: 15, fee: 70 }
  ],

  // ─── Order Status Pipeline ───────────────────────────────
  orderStatuses: [
    "Placed",
    "Confirmed",
    "Preparing",
    "Cooked",
    "Ready",
    "Out for Delivery",
    "Reached Drop Location",
    "Delivered",
    "Cancelled"
  ],

  // ─── Rider Status Pipeline ───────────────────────────────
  riderStatuses: [
    "ASSIGNED",
    "PICKED_UP",
    "REACHED",
    "DELIVERED"
  ],

  // ─── Bot Steps (State Machine) ───────────────────────────
  botSteps: [
    "START",
    "CATEGORY",
    "DISH",
    "SIZE",
    "ADDONS",
    "QUANTITY",
    "CART_VIEW",
    "LOCATION",
    "REUSE_PROFILE",
    "CONFIRM_PAY",
    "PLACE_ORDER"
  ],

  // ─── Payment Methods ─────────────────────────────────────
  paymentMethods: ["upi", "card", "wallet", "cod"],

  // ─── Infrastructure Refs ──────────────────────────────────
  firebase: {
    projectId: "food-hubbie",
    databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com",
    github: "https://github.com/nexorasoftwareagency-rgb/Food-Hubbie.git"
  },

  // ─── Database Path Templates ─────────────────────────────
  dbPaths: {
    outlet:       (bId, oId) => `businesses/${bId}/outlets/${oId}`,
    menu:         (bId, oId) => `businesses/${bId}/outlets/${oId}/menu`,
    orders:       (bId, oId) => `businesses/${bId}/outlets/${oId}/orders`,
    inventory:    (bId, oId) => `businesses/${bId}/outlets/${oId}/inventory`,
    settings:     (bId, oId) => `businesses/${bId}/outlets/${oId}/settings`,
    botUsers:     (bId, oId) => `businesses/${bId}/outlets/${oId}/botUsers`,
    botCommands:  (bId, oId) => `bot/${bId}/${oId}/commands`,
    botStatus:    (bId, oId) => `bot/${bId}/${oId}/status`,
    riders:       () => `riders`,
    riderLocation:(uid) => `riders/${uid}/location`,
    admins:       () => `admins`,
    businesses:   () => `businesses`,
    profiles:     (bId, oId) => `businesses/${bId}/outlets/${oId}/profiles`
  }
};

// Export for different module systems
if (typeof window !== 'undefined') {
  window.FOODHUBBIE = FOODHUBBIE;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FOODHUBBIE;
}
