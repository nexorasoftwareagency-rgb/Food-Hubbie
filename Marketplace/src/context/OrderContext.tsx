import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from "react";
import type { Order, OrderStatus } from "@/types";
import {
  loadOrders,
  persistOrders,
  nextStatus,
  submitOrder,
  fetchOrdersFromFirebase,
  type PlaceOrderInput,
} from "@/services/orderService";
import { useAuth } from "./AuthContext";
import { db, ref, onValue, off } from "@/lib/firebase";

type OrderContextValue = {
  currentOrder: Order | null;
  orders: Order[];
  placeOrder: (input: PlaceOrderInput) => Promise<string>;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  advanceOrderStatus: (id: string) => void;
  markOrderAsReviewed: (id: string) => void;
  getOrderById: (id: string) => Order | undefined;
};

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const { user, authState } = useAuth();
  const [orders, setOrders] = useState<Order[]>(() => loadOrders());
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const unsubRefs = useRef<Array<() => void>>([]);

  // Cleanup all Firebase listeners
  const cleanupListeners = useCallback(() => {
    unsubRefs.current.forEach(unsub => unsub());
    unsubRefs.current = [];
  }, []);

  useEffect(() => {
    if (authState === "authenticated" && user?.id) {
      let cancelled = false;

      const loadUserOrders = async () => {
        try {
          const fbOrders = await fetchOrdersFromFirebase(user.id);
          if (cancelled) return;
          setOrders(fbOrders);
          persistOrders(fbOrders);

          // Set up real-time listeners for each business/outlet pair
          cleanupListeners();
          const listenedPaths = new Set<string>();

          for (const order of fbOrders) {
            const path = `businesses/${order.businessId}/outlets/${order.outletId}/orders`;
            if (listenedPaths.has(path)) continue;
            listenedPaths.add(path);

            const ordersRef = ref(db, path);
            const unsub = () => off(ordersRef);
            unsubRefs.current.push(unsub);

            onValue(ordersRef, (snapshot) => {
              if (cancelled) return;
              const data = snapshot.val();
              if (!data) return;

              setOrders(prev => {
                const updated = prev.map(o => {
                  const fbOrder = data[o.id];
                  if (fbOrder && fbOrder.status !== o.status) {
                    return { ...o, status: fbOrder.status, statusHistory: fbOrder.statusHistory || o.statusHistory, updatedAt: fbOrder.updatedAt || o.updatedAt };
                  }
                  return o;
                });
                persistOrders(updated);
                return updated;
              });
            });
          }
        } catch (err) {
          console.error("[OrderContext] Failed to fetch orders from Firebase:", err);
        }
      };
      loadUserOrders();

      return () => {
        cancelled = true;
        cleanupListeners();
      };
    } else if (authState === "unauthenticated") {
      cleanupListeners();
      setOrders([]);
      persistOrders([]);
      setCurrentOrder(null);
    }
  }, [authState, user?.id, cleanupListeners]);

  const placeOrder = useCallback(async (input: PlaceOrderInput): Promise<string> => {
    try {
      const orderId = await submitOrder(input);
      
      const updated = loadOrders();
      setOrders(updated);
      
      const newOrder = updated.find(o => o.id === orderId) || null;
      setCurrentOrder(newOrder);
      return orderId;
    } catch (err) {
      console.error("OrderContext placeOrder error:", err);
      throw err;
    }
  }, []);

  const updateOrderStatus = useCallback(
    (id: string, status: OrderStatus) => {
      const timestamp = new Date().toISOString();
      setOrders((prev) => {
        const updated = prev.map((o) =>
          o.id === id
            ? {
                ...o,
                status,
                statusHistory: [
                  ...o.statusHistory,
                  { status, timestamp },
                ],
                updatedAt: timestamp,
              }
            : o
        );
        persistOrders(updated);
        return updated;
      });
      setCurrentOrder((prev) =>
        prev?.id === id ? { ...prev, status, updatedAt: timestamp } : prev
      );
    },
    []
  );

  const markOrderAsReviewed = useCallback(
    (id: string) => {
      setOrders((prev) => {
        const updated = prev.map((o) =>
          o.id === id ? { ...o, isReviewed: true } : o
        );
        persistOrders(updated);
        return updated;
      });
    },
    []
  );

  const advanceOrderStatus = useCallback(
    (id: string) => {
      const order = orders.find((o) => o.id === id);
      if (!order) return;
      const next = nextStatus(order.status);
      if (next) updateOrderStatus(id, next as any);
    },
    [orders, updateOrderStatus]
  );

  const getOrderById = useCallback(
    (id: string) => orders.find((o) => o.id === id),
    [orders]
  );

  return (
    <OrderContext.Provider
      value={{
        currentOrder,
        orders,
        placeOrder,
        updateOrderStatus,
        advanceOrderStatus,
        markOrderAsReviewed,
        getOrderById,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrderContext() {
  const context = useContext(OrderContext);
  if (!context)
    throw new Error("useOrderContext must be used within OrderProvider");
  return context;
}
