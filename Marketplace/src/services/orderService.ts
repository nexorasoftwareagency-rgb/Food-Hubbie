// ─── Order Service ─────────────────────────────────────────────────────────────
// Foodhubbie SaaS — Central Order Management
// Synchronized with Firebase Realtime Database and ShopAdmin ERP.

import { db, ref, get, push, set, auth } from "@/lib/firebase";
import { update } from "firebase/database";
import type { Order, CartItem, DeliveryAddress, PaymentMethod, OrderStatus } from "@/types";
import { logMarketplaceAudit } from "./auditService";

const STORAGE_KEY = "foodhubbie_orders";

export const STATUS_PIPELINE = ["Placed", "Confirmed", "Preparing", "Cooked", "Ready", "Out for Delivery", "Reached Drop Location", "Delivered"];

export function statusIndex(status: string): number {
  return STATUS_PIPELINE.indexOf(status);
}

/** 
 * Submit order to Firebase and sync with ShopAdmin
 */
export async function submitOrder(input: PlaceOrderInput): Promise<string> {
  const now = new Date().toISOString();
  const bid = input.businessId || "business_roshani";
  
  // 1. Fetch Business Commission Config
  let commissionConfig = { percentage: 0, fixed: 0 };
  try {
    const bizSnap = await get(ref(db, `businesses/${bid}/commission`));
    if (bizSnap.exists()) {
      commissionConfig = bizSnap.val();
    }
  } catch (err) {
    console.warn("Could not fetch commission config, defaulting to zero:", err);
  }

  // 2. Calculate Platform Revenue
  const netCommissionableAmount = Math.max(0, input.subtotal - (input.discount || 0));
  const commissionAmount = (netCommissionableAmount * (commissionConfig.percentage / 100)) + commissionConfig.fixed;
  
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
    couponCode: input.couponCode || null,
    couponDiscount: input.couponDiscount || 0,
    globalDiscount: input.globalDiscountAmount || 0,
    platformFee: input.platformFee || 0,
    cashbackBonus: input.cashbackBonus || 0,
    paymentMethod: input.paymentMethod,
    status: "Placed",
    type: "Online",
    createdAt: now,
    updatedAt: now,
    cart: input.items.map((i) => ({
      id: i.menuItemId,
      name: i.name,
      qty: i.quantity,
      price: i.price,
      size: i.customization?.size?.name || "Regular",
      addon: i.customization?.addons?.map(a => a.name).join(", ") || "None",
      image: i.image
    })),
    commission: {
      amount: parseFloat(commissionAmount.toFixed(2)),
      percentage: commissionConfig.percentage,
      fixed: commissionConfig.fixed,
      calculatedAt: now
    },
    userId: auth.currentUser?.uid || "anonymous"
  };

  try {
    const path = `businesses/${bid}/outlets/${input.outletId}/orders`;
    const newOrderRef = input.pregeneratedOrderId
      ? ref(db, `${path}/${input.pregeneratedOrderId}`)
      : push(ref(db, path));
    await set(newOrderRef, orderData);

    // Increment Coupon usage if applied (Atomic Transaction)
    if (input.couponCode) {
      try {
        const { increment } = await import("firebase/database");
        const couponRef = ref(db, `system/promotions/coupons/${input.couponCode.toUpperCase()}/usedCount`);
        await update(ref(db, `system/promotions/coupons/${input.couponCode.toUpperCase()}`), {
          usedCount: increment(1)
        });
        
        await logMarketplaceAudit('COUPON_REDEEM', {
          couponCode: input.couponCode.toUpperCase(),
          orderId: newOrderRef.key || "unknown",
          userId: auth.currentUser?.uid || "anonymous"
        });

        console.log(`[OrderService] Coupon ${input.couponCode} incremented and audited.`);
      } catch (cErr) {
        console.error("Failed to increment coupon usedCount atomically:", cErr);
      }
    }

    const finalOrder: Order = {
      id: newOrderRef.key || "unknown",
      userId: auth.currentUser?.uid || "anonymous",
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
      couponCode: input.couponCode,
      couponDiscount: input.couponDiscount,
      globalDiscount: input.globalDiscountAmount,
      platformFee: input.platformFee,
      cashbackBonus: input.cashbackBonus,
      createdAt: now,
      updatedAt: now,
      estimatedMinutes: 35
    };

    const currentOrders = loadOrders();
    persistOrders([finalOrder, ...currentOrders]);

    // 🚀 AUDIT LOG
    await logMarketplaceAudit('ORDER_PLACED', {
      orderId: newOrderRef.key || "unknown",
      userId: auth.currentUser?.uid || "anonymous",
      total: input.total
    });
    
    // 🚀 INVENTORY SYNC: Atomic Stock Decrement
    const { increment } = await import("firebase/database");
    for (const item of input.items) {
      try {
        const dishRef = ref(db, `businesses/${bid}/outlets/${input.outletId}/dishes/${item.menuItemId}`);
        // Only update if it exists to avoid creating empty dish nodes
        const dishSnap = await get(dishRef);
        if (dishSnap.exists()) {
          const dish = dishSnap.val();
          if (dish.stock !== undefined) {
            await update(dishRef, {
              stock: increment(-item.quantity),
              updatedAt: now
            });
            console.log(`[OrderService] Stock decremented for ${item.name} (-${item.quantity})`);
          }
        }
      } catch (invErr) {
        console.warn(`[OrderService] Stock decrement failed for ${item.menuItemId}:`, invErr);
      }
    }

    return finalOrder.id;
  } catch (err) {
    console.error("Order submission failed:", err);
    throw new Error("Could not process order. Please try again.");
  }
}

/** Update order status in Firebase */
export async function updateOrderStatus(orderId: string, status: OrderStatus, note?: string): Promise<void> {
  // Find order path (bid/oid/orders/orderId)
  // For simplicity in this demo, we might need to store the path in localOrder or search.
  // In a real multi-tenant app, the path should be known or stored.
  // We'll search the local cache to find bid and oid.
  const orders = loadOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) throw new Error("Order not found in local cache.");

  const path = `businesses/${order.businessId}/outlets/${order.outletId}/orders/${orderId}`;
  const now = new Date().toISOString();
  
  await update(ref(db, path), {
    status,
    updatedAt: now,
    [`statusHistory/${Date.now()}`]: { status, timestamp: now, note: note || "" }
  });

  // 🚀 AUDIT LOG
  await logMarketplaceAudit('ORDER_STATUS_UPDATE', {
    orderId,
    status,
    note
  });

  // Sync local cache
  order.status = status;
  order.statusHistory.push({ status, timestamp: now });
  persistOrders(orders);
}

/** Mark cashback as pending for an order */
export async function markCashbackPending(orderId: string, amount: number): Promise<void> {
  const orders = loadOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  const path = `businesses/${order.businessId}/outlets/${order.outletId}/orders/${orderId}`;
  await update(ref(db, path), {
    cashbackStatus: "pending",
    cashbackBonus: amount
  });

  // 🚀 AUDIT LOG
  await logMarketplaceAudit('CASHBACK_PENDING', {
    orderId,
    amount
  });

  order.cashbackStatus = "pending";
  persistOrders(orders);
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
  pregeneratedOrderId?: string;
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
  couponDiscount?: number;
  globalDiscountAmount?: number;
  platformFee?: number;
  cashbackBonus?: number;
};

export function nextStatus(current: string): string | null {
  const idx = STATUS_PIPELINE.indexOf(current);
  return idx !== -1 && idx < STATUS_PIPELINE.length - 1 ? STATUS_PIPELINE[idx + 1] : null;
}

/** Fetch orders from Firebase for a user */
export async function fetchOrdersFromFirebase(userId: string): Promise<Order[]> {
  try {
    const businessesSnap = await get(ref(db, 'businesses'));
    if (!businessesSnap.exists()) return [];
    
    const businesses = businessesSnap.val();
    const userOrders: Order[] = [];
    
    for (const bid in businesses) {
      const bData = businesses[bid];
      if (bData.outlets) {
        for (const oid in bData.outlets) {
          const outletData = bData.outlets[oid];
          if (outletData.orders) {
            for (const orderId in outletData.orders) {
              const o = outletData.orders[orderId];
              if (o.userId === userId) {
                const statusHistory = o.statusHistory
                  ? Object.entries(o.statusHistory).map(([key, val]: [string, any]) => ({
                      status: val.status,
                      timestamp: val.timestamp
                    })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                  : [{ status: o.status || "Placed", timestamp: o.createdAt }];

                userOrders.push({
                  id: orderId,
                  userId: o.userId,
                  outletId: oid,
                  outletName: outletData.settings?.Store?.storeName || outletData.meta?.name || "Restaurant",
                  businessId: bid,
                  items: o.cart ? o.cart.map((c: any) => ({
                    menuItemId: c.id,
                    name: c.name,
                    quantity: c.qty,
                    price: c.price,
                    image: c.image
                  })) : [],
                  subtotal: o.subtotal,
                  deliveryFee: o.deliveryFee,
                  taxes: o.taxes,
                  total: o.total,
                  status: o.status,
                  statusHistory,
                  paymentMethod: o.paymentMethod,
                  deliveryAddress: {
                    name: o.customerName,
                    phone: o.phone,
                    email: o.email,
                    address: o.address,
                    lat: o.lat,
                    lng: o.lng
                  },
                  couponCode: o.couponCode,
                  couponDiscount: o.couponDiscount,
                  globalDiscount: o.globalDiscount,
                  platformFee: o.platformFee,
                  cashbackBonus: o.cashbackBonus,
                  createdAt: o.createdAt,
                  updatedAt: o.updatedAt,
                  estimatedMinutes: 35
                });
              }
            }
          }
        }
      }
    }
    
    userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return userOrders;
  } catch (err) {
    console.error("fetchOrdersFromFirebase error:", err);
    return [];
  }
}
