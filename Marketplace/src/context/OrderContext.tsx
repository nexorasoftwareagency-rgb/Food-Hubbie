import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import type { Order, OrderStatus } from "@/types";
import {
  buildOrder,
  loadOrders,
  persistOrders,
  nextStatus,
  type PlaceOrderInput,
} from "@/services/orderService";

type OrderContextValue = {
  currentOrder: Order | null;
  orders: Order[];
  placeOrder: (input: PlaceOrderInput) => string;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  advanceOrderStatus: (id: string) => void;
  getOrderById: (id: string) => Order | undefined;
};

const OrderContext = createContext<OrderContextValue | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() => loadOrders());
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);

  const placeOrder = useCallback((input: PlaceOrderInput): string => {
    const order = buildOrder(input);
    setOrders((prev) => {
      const updated = [order, ...prev];
      persistOrders(updated);
      return updated;
    });
    setCurrentOrder(order);
    return order.id;
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

  const advanceOrderStatus = useCallback(
    (id: string) => {
      const order = orders.find((o) => o.id === id);
      if (!order) return;
      const next = nextStatus(order.status);
      if (next) updateOrderStatus(id, next);
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
