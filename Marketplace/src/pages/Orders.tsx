import { useOrderContext } from "@/context/OrderContext";
import { Link } from "wouter";
import { ArrowRight, Clock, Receipt, RotateCcw, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import type { Order } from "@/types";
import { useState } from "react";
import ReviewModal from "@/components/modals/ReviewModal";

function statusBadgeClass(status: Order["status"]): string {
  switch (status) {
    case "Delivered":
      return "bg-green-100 text-green-700 border-green-200";
    case "Cancelled":
      return "bg-red-100 text-red-600 border-red-200";
    case "Out for Delivery":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Preparing":
    case "Ready":
      return "bg-secondary/15 text-secondary border-secondary/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export default function Orders() {
  const { orders, markOrderAsReviewed } = useOrderContext();
  const { dispatch } = useCart();
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);

  const handleReorder = (order: Order) => {
    dispatch({ type: "CLEAR_CART" });
    order.items.forEach((item) => {
      dispatch({
        type: "ADD_ITEM",
        payload: {
          id: `${item.menuItemId}-reorder`,
          menuItemId: item.menuItemId,
          businessId: order.businessId,
          outletId: order.outletId,
          name: item.name,
          image: item.image,
          basePrice: item.price,
          price: item.price,
          quantity: item.quantity,
          customization: item.customization ?? {
            addons: [],
            extraCheese: false,
            instructions: "",
          },
        },
      });
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl pb-24">
      <h1 className="text-3xl font-heading font-black mb-8">My Orders</h1>

      {(orders || []).length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 bg-card rounded-3xl border border-border shadow-sm"
        >
          <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Receipt className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-bold text-foreground mb-2">
            No orders yet
          </p>
          <p className="text-muted-foreground mb-6">
            When you order something, it'll show up here.
          </p>
          <Link
            href="/outlets"
            data-testid="btn-order-now"
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors"
          >
            Order Now
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {(orders || []).map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-5 shadow-sm"
              data-testid={`order-${order.id}`}
            >
              <div className="flex justify-between items-start mb-4 border-b border-border pb-4">
                <div>
                  <h3 className="font-bold text-lg text-card-foreground">
                    {order.outletName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    at{" "}
                    {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    {order.id}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${statusBadgeClass(order.status)}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                {(order.items || []).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-muted-foreground">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border border-dashed gap-3 flex-wrap">
                <span className="font-bold text-foreground">
                  Total: ₹{order.total.toFixed(0)}
                </span>

                <div className="flex gap-3">
                  {order.status === "Delivered" && !order.isReviewed && (
                    <button
                      onClick={() => setReviewOrder(order)}
                      className="flex items-center gap-1.5 text-sm font-bold text-primary bg-primary/10 px-3 py-2 rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      <Star className="h-4 w-4 fill-primary" />
                      Rate Order
                    </button>
                  )}
                  {order.status !== "Cancelled" && (
                    <button
                      onClick={() => handleReorder(order)}
                      data-testid={`btn-reorder-${order.id}`}
                      className="flex items-center gap-1.5 text-sm font-bold text-foreground bg-muted px-3 py-2 rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reorder
                    </button>
                  )}
                  <Link
                    href={`/tracking/${order.id}`}
                    data-testid={`btn-track-${order.id}`}
                    className="text-primary font-bold text-sm flex items-center gap-1 hover:underline"
                  >
                    Track <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {reviewOrder && (
        <ReviewModal
          isOpen={!!reviewOrder}
          onClose={() => setReviewOrder(null)}
          order={reviewOrder}
          onSuccess={() => markOrderAsReviewed(reviewOrder.id)}
        />
      )}
    </div>
  );
}
