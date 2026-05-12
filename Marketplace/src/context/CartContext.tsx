import { ReactNode, createContext, useContext, useReducer, useState } from "react";
import type { CartItem } from "@/types";
import { buildCartItemId, computeUnitPrice } from "@/services/cartService";

type CartState = {
  items: CartItem[];
  outletId: string | null;
  pendingItem: CartItem | null;
};

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "SET_PENDING"; payload: CartItem | null }
  | { type: "CONFIRM_SWITCH_OUTLET" };

const initialState: CartState = {
  items: [],
  outletId: null,
  pendingItem: null,
};

function calcDerived(items: CartItem[]) {
  return {
    total: items.reduce((s, i) => s + i.price * i.quantity, 0),
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
  };
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const conflict =
        state.outletId && state.outletId !== action.payload.outletId;
      if (conflict) {
        // Store pending item and let UI show confirmation dialog
        return { ...state, pendingItem: action.payload };
      }
      const existingIdx = state.items.findIndex(
        (i) => i.id === action.payload.id
      );
      let newItems: CartItem[];
      if (existingIdx > -1) {
        newItems = state.items.map((i, idx) =>
          idx === existingIdx
            ? { ...i, quantity: i.quantity + action.payload.quantity }
            : i
        );
      } else {
        newItems = [...state.items, action.payload];
      }
      return {
        ...state,
        items: newItems,
        outletId: action.payload.outletId,
        pendingItem: null,
      };
    }

    case "CONFIRM_SWITCH_OUTLET": {
      if (!state.pendingItem) return state;
      return {
        items: [state.pendingItem],
        outletId: state.pendingItem.outletId,
        pendingItem: null,
      };
    }

    case "SET_PENDING":
      return { ...state, pendingItem: action.payload };

    case "REMOVE_ITEM": {
      const newItems = state.items.filter((i) => i.id !== action.payload.id);
      return {
        ...state,
        items: newItems,
        outletId: newItems.length > 0 ? state.outletId : null,
      };
    }

    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        return cartReducer(state, {
          type: "REMOVE_ITEM",
          payload: { id: action.payload.id },
        });
      }
      const newItems = state.items.map((i) =>
        i.id === action.payload.id
          ? { ...i, quantity: action.payload.quantity }
          : i
      );
      return { ...state, items: newItems };
    }

    case "CLEAR_CART":
      return initialState;

    default:
      return state;
  }
}

type CartContextValue = {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  total: number;
  itemCount: number;
  confirmSwitchOutlet: () => void;
  cancelSwitchOutlet: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { total, itemCount } = calcDerived(state.items);

  const confirmSwitchOutlet = () => dispatch({ type: "CONFIRM_SWITCH_OUTLET" });
  const cancelSwitchOutlet = () => dispatch({ type: "SET_PENDING", payload: null });

  return (
    <CartContext.Provider
      value={{ state, dispatch, total, itemCount, confirmSwitchOutlet, cancelSwitchOutlet }}
    >
      {children}

      {/* Outlet-switch confirmation dialog */}
      {state.pendingItem && (
        <OutletSwitchDialog
          onConfirm={confirmSwitchOutlet}
          onCancel={cancelSwitchOutlet}
        />
      )}
    </CartContext.Provider>
  );
}

function OutletSwitchDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-border">
        <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z"
            />
          </svg>
        </div>
        <h2 className="font-heading font-bold text-xl text-foreground mb-2">
          Start a new cart?
        </h2>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          Your cart already has items from another restaurant. Adding this item
          will clear your existing cart.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-border rounded-xl font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Keep Cart
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-md"
          >
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
