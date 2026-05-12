// ─── Order Service ─────────────────────────────────────────────────────────────
// Currently persists to localStorage for demo continuity across refreshes.
// Future: replace persist/load with Firebase RTDB / REST API.

import type { Order, OrderStatus, CartItem, DeliveryAddress, PaymentMethod } from "@/types";
import { getOutletName } from "./outletService";
import { mockPastOrders } from "@/data/mockData";

const STORAGE_KEY = "foodhubbie_orders";

/** Generate a human-friendly order ID */
function generateOrderId(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `ORD_${num}`;
}

/** Load orders from localStorage, seeded with mock past orders on first load */
export function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Order[];
  } catch {
    // ignore parse errors
  }
  // First visit: seed with demo history
  persistOrders(mockPastOrders);
  return [...mockPastOrders];
}

/** Persist orders to localStorage */
export function persistOrders(orders: Order[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // storage quota exceeded — silently continue
  }
}

export type PlaceOrderInput = {
  outletId: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  taxes: number;
  total: number;
  paymentMethod: PaymentMethod;
  deliveryAddress: DeliveryAddress;
  couponCode?: string;
  discount?: number;
};

/** Create a new order object (does NOT yet write to DB — caller handles state) */
export function buildOrder(input: PlaceOrderInput): Order {
  const now = new Date().toISOString();
  const id = generateOrderId();

  return {
    id,
    userId: "user_me",
    outletId: input.outletId,
    outletName: getOutletName(input.outletId),
    businessId: "business_mock",
    items: input.items.map((i) => ({
      menuItemId: i.menuItemId,
      name: i.name,
      image: i.image,
      quantity: i.quantity,
      price: i.price,
      customization: i.customization,
    })),
    subtotal: input.subtotal,
    deliveryFee: input.deliveryFee,
    taxes: input.taxes,
    total: input.total,
    status: "Placed",
    statusHistory: [{ status: "Placed", timestamp: now }],
    paymentMethod: input.paymentMethod,
    deliveryAddress: input.deliveryAddress,
    couponCode: input.couponCode,
    discount: input.discount ?? 0,
    estimatedMinutes: 35,
    riderName: "Ramesh K.",
    riderPhone: "+91 9988776655",
    riderVehicle: "KA-01-AB-1234",
    createdAt: now,
    updatedAt: now,
  };
}

/** Next status in the delivery pipeline */
const STATUS_PIPELINE: OrderStatus[] = [
  "Placed",
  "Confirmed",
  "Preparing",
  "Packed",
  "Out for Delivery",
  "Delivered",
];

export function nextStatus(current: OrderStatus): OrderStatus | null {
  const idx = STATUS_PIPELINE.indexOf(current);
  if (idx === -1 || idx >= STATUS_PIPELINE.length - 1) return null;
  return STATUS_PIPELINE[idx + 1];
}

export function statusIndex(status: OrderStatus): number {
  return STATUS_PIPELINE.indexOf(status);
}

export { STATUS_PIPELINE };
