export const ORANGE = "#E84908";

export const COLORS = {
  primary: "#E84908",
  success: "#22c55e",
  warning: "#f59e0b",
  info: "#3b82f6",
  error: "#ef4444",
  muted: "#64748b",
};

export const PIE_COLORS = ["#E84908", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"];

export const ORDER_STATUSES = {
  pending:          { label: "Pending",         color: "#f59e0b", bg: "#fef3c7" },
  confirmed:        { label: "Confirmed",        color: "#3b82f6", bg: "#dbeafe" },
  preparing:        { label: "Preparing",        color: "#8b5cf6", bg: "#ede9fe" },
  ready:            { label: "Ready",            color: "#06b6d4", bg: "#cffafe" },
  out_for_delivery: { label: "Out for Delivery", color: "#E84908", bg: "#ffedd5" },
  delivered:        { label: "Delivered",        color: "#22c55e", bg: "#dcfce7" },
  cancelled:        { label: "Cancelled",        color: "#ef4444", bg: "#fee2e2" },
};

export const statusColors = {
  ok:       { color: COLORS.success, bg: "#dcfce7" },
  low:      { color: COLORS.warning, bg: "#fef3c7" },
  critical: { color: COLORS.error,   bg: "#fee2e2" },
};

export const stockStatus = (stock, thr) =>
  stock === 0 ? "critical" : stock <= thr ? "low" : "ok";

export const STATUS_FLOW = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"];

export const SETTINGS_PATHS = {
  STORE: "settings/Store",
  DELIVERY: "settings/Delivery",
  BOT: "settings/Bot",
  DISPLAY: "settings/Display"
};
