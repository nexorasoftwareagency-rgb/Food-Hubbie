import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import {
  CheckCircle2,
  Clock,
  ChefHat,
  PackageCheck,
  Bike,
  Home,
  Phone,
  ArrowLeft,
  Star,
} from "lucide-react";
import { useOrderContext } from "@/context/OrderContext";
import { motion, AnimatePresence } from "framer-motion";
import { STATUS_PIPELINE, statusIndex } from "@/services/orderService";
import type { OrderStatus } from "@/types";
import ReviewModal from "@/components/modals/ReviewModal";

const stageIcons: Record<OrderStatus, typeof CheckCircle2> = {
  Placed: CheckCircle2,
  Confirmed: Clock,
  Preparing: ChefHat,
  Packed: PackageCheck,
  "Out for Delivery": Bike,
  Delivered: Home,
  Cancelled: CheckCircle2,
};

const stageMessages: Partial<Record<OrderStatus, string>> = {
  Placed: "Your order has been received.",
  Confirmed: "The restaurant confirmed your order.",
  Preparing: "The chef is working their magic.",
  Packed: "Your order is packed and ready.",
  "Out for Delivery": "Your rider is on the way!",
  Delivered: "Enjoy your meal!",
};

export default function Tracking() {
  const { orderId } = useParams<{ orderId: string }>();
  const { orders, updateOrderStatus, getOrderById, markOrderAsReviewed } = useOrderContext();
  const order = getOrderById(orderId ?? "");

  const [currentIdx, setCurrentIdx] = useState(0);
  const [eta, setEta] = useState(35);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    if (!order) return;
    setCurrentIdx(statusIndex(order.status));

    if (order.status === "Delivered" || order.status === "Cancelled") return;

    // Simulate order advancing every 6 seconds for demo
    const advance = setInterval(() => {
      setCurrentIdx((prev) => {
        if (prev >= STATUS_PIPELINE.length - 1) {
          clearInterval(advance);
          return prev;
        }
        const nextStatus = STATUS_PIPELINE[prev + 1] as any;
        updateOrderStatus(order.id, nextStatus);
        return prev + 1;
      });
    }, 6000);

    // Countdown ETA
    const countdown = setInterval(() => {
      setEta((prev) => Math.max(0, prev - 1));
    }, 60000);

    return () => {
      clearInterval(advance);
      clearInterval(countdown);
    };
  }, [order?.id]);

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Link href="/orders" className="text-primary font-bold mt-4 block">
          View all orders
        </Link>
      </div>
    );
  }

  const isDelivered = order.status === "Delivered";
  const stages = STATUS_PIPELINE.filter((s: string) => s !== "Cancelled");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/orders" className="p-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-heading font-bold text-xl">Track Order</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-lg space-y-5">
        {/* ETA card */}
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm text-center">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
            Order ID
          </p>
          <p className="font-mono text-sm text-muted-foreground mb-4">
            {order.id}
          </p>

          {isDelivered ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-lg font-heading font-bold text-foreground">
                Delivered Successfully!
              </p>
              
              {!order.isReviewed ? (
                <div className="mt-4 w-full pt-4 border-t border-border border-dashed">
                  <p className="text-sm text-muted-foreground mb-4">How was your experience with {order.outletName}?</p>
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    <Star className="h-4 w-4 fill-primary-foreground" />
                    Rate Now
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Thanks for your feedback!
                </p>
              )}
            </motion.div>
          ) : (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                Estimated Arrival
              </p>
              <p className="text-5xl font-heading font-bold text-primary">
                {eta}
              </p>
              <p className="text-muted-foreground text-sm mt-1">minutes</p>
            </>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-card rounded-3xl border border-border shadow-sm p-6">
          <div className="relative">
            {(Array.isArray(stages) ? stages : []).map((stage: string, idx: number) => {
              const isCompleted = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              const isLast = idx === (Array.isArray(stages) ? stages.length : 0) - 1;
              const Icon = stageIcons[stage as OrderStatus] ?? CheckCircle2;
              const historyItem = Array.isArray(order.statusHistory) 
                ? order.statusHistory.find((h) => h.status === stage) 
                : null;

              return (
                <div
                  key={stage}
                  className="flex items-start gap-4 mb-8 last:mb-0 relative"
                  data-testid={`stage-${stage.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {!isLast && (
                    <motion.div
                      className="absolute left-[15px] top-8 bottom-[-28px] w-0.5"
                      initial={{ backgroundColor: "hsl(var(--muted))" }}
                      animate={{
                        backgroundColor: isCompleted
                          ? "hsl(var(--primary))"
                          : "hsl(var(--muted))",
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  )}

                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                      isCurrent
                        ? "bg-secondary text-secondary-foreground shadow-lg ring-4 ring-secondary/25"
                        : isCompleted
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </motion.div>

                  <div className="flex-1 pt-1">
                    <h3
                      className={`font-bold transition-colors ${
                        isCompleted ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {stage}
                    </h3>
                    <AnimatePresence>
                      {isCurrent && stageMessages[stage as OrderStatus] && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-xs text-primary font-medium mt-0.5"
                        >
                          {stageMessages[stage as OrderStatus]}
                        </motion.p>
                      )}
                    </AnimatePresence>
                    {historyItem && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(historyItem.timestamp).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rider card */}
        <AnimatePresence>
          {currentIdx >= 4 && !isDelivered && order.riderName && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-primary/5 border border-primary/20 rounded-3xl p-5 flex items-center gap-4"
            >
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(order.riderName || "Rider")}&background=random&color=fff`}
                alt="Rider"
                className="w-16 h-16 rounded-2xl object-cover shadow-sm"
              />
              <div className="flex-1">
                <p className="text-xs text-primary font-bold uppercase tracking-wider mb-0.5">
                  Your Delivery Partner
                </p>
                <h4 className="font-bold text-foreground text-lg">
                  {order.riderName}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {order.riderVehicle}
                </p>
              </div>
              <a
                href={`tel:${order.riderPhone}`}
                className="bg-primary text-primary-foreground h-12 w-12 rounded-full flex items-center justify-center shadow-md"
                data-testid="btn-call-rider"
                title="Call Rider"
              >
                <Phone className="h-5 w-5" />
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map placeholder */}
        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden h-48 relative">
          <div
            className="w-full h-full"
            style={{
              background:
                "linear-gradient(135deg, hsl(160 30% 90%) 0%, hsl(160 40% 85%) 50%, hsl(48 60% 90%) 100%)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg"
              >
                <Bike className="h-6 w-6 text-primary-foreground" />
              </motion.div>
              <p className="text-xs font-semibold text-muted-foreground">
                Live tracking coming soon
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/"
          className="block text-center text-primary font-bold py-3 hover:underline"
        >
          Continue Ordering
        </Link>
      </div>

      {order && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          order={order}
          onSuccess={() => markOrderAsReviewed(order.id)}
        />
      )}
    </div>
  );
}
