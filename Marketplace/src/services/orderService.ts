// ─── Order Service ─────────────────────────────────────────────────────────────
// Foodhubbie SaaS — Central Order Management
// Synchronized with Firebase Realtime Database and ShopAdmin ERP.

import { db, ref, get, push, set } from "@/lib/firebase";
import type { Order, CartItem, DeliveryAddress, PaymentMethod } from "@/types";

const STORAGE_KEY = "foodhubbie_orders";

export const STATUS_PIPELINE = ["Placed", "Confirmed", "Preparing", "Packed", "Out for Delivery", "Delivered"];

export function statusIndex(status: string): number {
  return STATUS_PIPELINE.indexOf(status);
}

/** 
 * Submit order to Firebase and sync with ShopAdmin
 */
export async function submitOrder(input: PlaceOrderInput): Promise<string> {
  const now = new Date().toISOString();
  const bid = input.businessId || "business_roshani";
  
  const orderData = {
    customerName: input.deliveryAddress.name,
    phone: input.deliveryAddress.phone,
    email: input.deliveryAddress.email || "",
    address: input.deliveryAddress.address,
    lat: input.deliveryAddress.lat,
    lng: input.deliveryAddress.lng,
    outlet: input.outletId,
    businessId: bid,
    total: input.total,
    subtotal: input.subtotal,
    deliveryFee: input.deliveryFee,
    taxes: input.taxes,
    discount: input.discount || 0,
    paymentMethod: input.paymentMethod,
    status: "Placed",
    type: "Online",
    createdAt: now,
    updatedAt: now,
    cart: input.items.map((i) => ({
      name: i.name,
      qty: i.quantity,
      price: i.price,
      size: i.customization?.size?.name || "Regular",
      addon: i.customization?.addons?.map(a => a.name).join(", ") || "None",
      image: i.image
    }))
  };

  try {
    const path = `businesses/${bid}/outlets/${input.outletId}/orders`;
    const newOrderRef = push(ref(db, path));
    await set(newOrderRef, orderData);

    const finalOrder: Order = {
      id: newOrderRef.key || "unknown",
      userId: "user_me",
      outletId: input.outletId,
      outletName: input.outletName || "Restaurant",
      businessId: bid,
      items: input.items,
      subtotal: input.subtotal,
      deliveryFee: input.deliveryFee,
      taxes: input.taxes,
      total: input.total,
      status: "Placed",
      statusHistory: [{ status: "Placed", timestamp: now }],
      paymentMethod: input.paymentMethod,
      deliveryAddress: input.deliveryAddress,
      createdAt: now,
      updatedAt: now,
      estimatedMinutes: 35
    };

    const currentOrders = loadOrders();
    persistOrders([finalOrder, ...currentOrders]);

    return finalOrder.id;
  } catch (err) {
    console.error("Order submission failed:", err);
    throw new Error("Could not process order. Please try again.");
  }
}

/** Load orders from localStorage (UI Cache) */
export function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Order[];
  } catch {
    // ignore parse errors
  }
  return [];
}

/** Persist orders to localStorage (UI Cache) */
export function persistOrders(orders: Order[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders).slice(0, 500000));
  } catch {
    // storage quota exceeded
  }
}

export type PlaceOrderInput = {
  businessId?: string;
  outletId: string;
  outletName?: string;
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

export function nextStatus(current: string): string | null {
  const idx = STATUS_PIPELINE.indexOf(current);
  return idx !== -1 && idx < STATUS_PIPELINE.length - 1 ? STATUS_PIPELINE[idx + 1] : null;
}
