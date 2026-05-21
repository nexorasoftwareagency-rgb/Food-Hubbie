import { useState } from "react";
import { Link } from "wouter";
import { useCart } from "@/context/CartContext";
import { Plus, Minus, ArrowRight, Receipt, Trash2, Tag, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { calcCartSummary } from "@/services/cartService";
import { fetchOutletById } from "@/services/outletService";
import { deliveryFeeLabel } from "@/lib/deliveryFee";
import type { Outlet } from "@/types";
import { useEffect } from "react";
import { validateCoupon } from "@/services/promotionService";

export default function Cart() {
  const { state, dispatch, total, itemCount, platformFee } = useCart();
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [couponInput, setCouponInput] = useState("");

  useEffect(() => {
    if (state.outletId) {
      fetchOutletById(state.outletId).then(setOutlet);
    }
  }, [state.outletId]);

  // Sync with CartContext appliedCoupon
  const appliedCoupon = state.appliedCoupon;
  const isFreeDelivery = appliedCoupon?.code === "FREESHIP" || (appliedCoupon as any)?.type === 'freeship';
  const couponDiscount = appliedCoupon
    ? appliedCoupon.type === 'percent'
      ? Math.round(state.items.reduce((s, i) => s + i.price * i.quantity, 0) * (appliedCoupon.value / 100))
      : appliedCoupon.value
    : 0;

  const summary = calcCartSummary(
    state.items,
    outlet,
    { couponDiscount, platformFee, isFreeDelivery }
  );
  
  // 🎯 ZOMATO LOGIC: Free Delivery Milestone (₹499 threshold)
  const FREE_DELIVERY_THRESHOLD = 499;
  const neededForFree = Math.max(0, FREE_DELIVERY_THRESHOLD - summary.subtotal);
  const freeProgress = Math.min(100, (summary.subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  // Projected Cashback (2% of net food value)
  const projectedBonus = Math.round((summary.subtotal - couponDiscount) * 0.02);

  const outletName = outlet?.name || "Restaurant";

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    try {
      const couponData = await validateCoupon(code);
      if (couponData) {
        const subtotal = state.items.reduce((s, i) => s + i.price * i.quantity, 0);
        if (couponData.minOrder && subtotal < couponData.minOrder) {
          alert(`Minimum order of ₹${couponData.minOrder} required for this coupon.`);
          return;
        }
        // Dispatch to CartContext so Checkout page sees it
        dispatch({ type: "APPLY_COUPON", payload: couponData });
        setCouponInput("");
      } else {
        alert("Invalid or expired coupon code.");
      }
    } catch (error) {
      console.error("Coupon validation error:", error);
      alert("Failed to validate coupon. Please try again.");
    }
  };

  if (!Array.isArray(state.items) || state.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="bg-muted w-32 h-32 rounded-full flex items-center justify-center mb-6">
          <Receipt className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-heading font-bold mb-2">
          Your cart is empty
        </h1>
        <p className="text-muted-foreground mb-8 max-w-xs">
          Good food is always cooking! Go ahead, order some yummy items from the
          menu.
        </p>
        <Link
          href="/outlets"
          data-testid="btn-browse-restaurants"
          className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
        >
          Browse Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-heading font-bold mb-8">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {/* Ordering from */}
          <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-sm">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
                Ordering From
              </p>
              <p className="font-bold text-foreground">{outletName}</p>
            </div>
            <Link
              href={`/outlet/${state.outletId}`}
              className="text-primary text-sm font-bold hover:underline"
            >
              Add more items
            </Link>
          </div>

          {/* 🎯 ZOMATO FEATURE: Free Delivery Milestone */}
          {!isFreeDelivery && summary.deliveryFee > 0 && (
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm overflow-hidden relative">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold flex items-center gap-2">
                  <Star className="h-4 w-4 text-secondary fill-secondary" />
                  {neededForFree > 0 
                    ? `Add ₹${neededForFree} more for FREE delivery` 
                    : "You've unlocked FREE delivery!"}
                </span>
                <span className="text-xs font-black text-secondary">₹{FREE_DELIVERY_THRESHOLD} GOAL</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${freeProgress}%` }}
                  className="h-full bg-secondary transition-all"
                />
              </div>
              {neededForFree > 0 && (
                <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                  Add a dessert or beverage to skip the ₹{summary.deliveryFee} delivery fee!
                </p>
              )}
            </div>
          )}

          {/* Items */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <AnimatePresence>
              {(Array.isArray(state.items) ? state.items : []).map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 border-b border-border last:border-b-0 flex gap-4"
                  data-testid={`cart-item-${item.id}`}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 rounded-xl object-cover"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-card-foreground">
                          {item.name}
                        </h3>
                        {item.customization?.size && (
                          <p className="text-xs text-muted-foreground">
                            Size: {item.customization.size.name}
                          </p>
                        )}
                        {Array.isArray(item.customization?.addons) && item.customization.addons.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Extras:{" "}
                            {item.customization.addons
                              .map((a: any) => a.name)
                              .join(", ")}
                          </p>
                        )}
                        {item.customization?.instructions && (
                          <p className="text-xs text-muted-foreground italic">
                            "{item.customization.instructions}"
                          </p>
                        )}
                      </div>
                      <span className="font-bold shrink-0 ml-2">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3 bg-muted px-2 py-1 rounded-lg">
                        <button
                          onClick={() =>
                            dispatch({
                              type: "UPDATE_QUANTITY",
                              payload: { id: item.id, quantity: item.quantity - 1 },
                            })
                          }
                          data-testid={`btn-decrease-${item.id}`}
                          className="p-1 hover:bg-background rounded transition-colors"
                          title="Decrease Quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="font-bold w-4 text-center text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            dispatch({
                              type: "UPDATE_QUANTITY",
                              payload: { id: item.id, quantity: item.quantity + 1 },
                            })
                          }
                          data-testid={`btn-increase-${item.id}`}
                          className="p-1 hover:bg-background rounded transition-colors"
                          title="Increase Quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          dispatch({
                            type: "REMOVE_ITEM",
                            payload: { id: item.id },
                          })
                        }
                        data-testid={`btn-remove-${item.id}`}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Coupon */}
          <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-secondary" />
              Apply Coupon
            </h3>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                <div>
                  <p className="text-green-700 font-bold text-sm">
                    {appliedCoupon.code} applied!
                  </p>
                  <p className="text-green-600 text-xs">
                    {isFreeDelivery ? "Free Delivery Applied" : `You saved ₹${couponDiscount}`}
                  </p>
                </div>
                <button
                  onClick={() => dispatch({ type: "REMOVE_COUPON" })}
                  className="text-xs text-destructive font-semibold"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Enter coupon code (try FIRST50)"
                  data-testid="input-coupon"
                  className="flex-1 bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={applyCoupon}
                  data-testid="btn-apply-coupon"
                  className="bg-primary text-primary-foreground px-4 py-3 rounded-xl font-bold text-sm"
                >
                  Apply
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Try: FIRST50 · FREESHIP
            </p>
          </div>

          {/* Delivery instructions */}
          <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
            <h3 className="font-bold mb-2">Delivery Instructions</h3>
            <textarea
              placeholder="Any specific instructions for the delivery partner? (e.g., Ring doorbell, leave at gate)"
              data-testid="textarea-delivery-instructions"
              className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
            />
          </div>

          {/* 🎯 ZOMATO FEATURE: Savings Celebration */}
          {(summary.savings > 0 || appliedCoupon) && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                <Tag className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-emerald-700 font-black leading-tight">YAY! YOU SAVED ₹{summary.savings + couponDiscount}</h4>
                <p className="text-emerald-600/70 text-xs font-medium">This order is cheaper than usual. Great choice!</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bill summary */}
        <div className="space-y-4">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm lg:sticky lg:top-24">
            <h3 className="font-heading font-bold text-xl mb-4">
              Bill Details
            </h3>

            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Item Total</span>
                <span className="font-medium">₹{summary.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Delivery Fee
                  {outlet && (
                    <span className="text-xs ml-1 text-primary/70">
                      ({outlet.distanceKm} km)
                    </span>
                  )}
                </span>
                <span className="font-medium">
                  {deliveryFeeLabel(summary.deliveryFee)}
                </span>
              </div>
              {couponApplied && couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount</span>
                  <span className="font-medium">- ₹{couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST (5%)</span>
                <span className="font-medium">₹{summary.taxes}</span>
              </div>
              {summary.platformFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Fee</span>
                  <span className="font-medium">₹{summary.platformFee}</span>
                </div>
              )}
              
              {projectedBonus > 0 && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 mt-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Star className="h-4 w-4 fill-emerald-500" />
                    <span className="text-[11px] font-bold">Earn ₹{projectedBonus} in credits!</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border border-dashed pt-4 flex justify-between items-center mb-6">
              <span className="font-bold text-lg">To Pay</span>
              <span className="font-bold text-lg text-primary">
                ₹{summary.total}
              </span>
            </div>

            <Link
              href="/checkout"
              data-testid="btn-checkout"
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-md"
            >
              Proceed to Checkout
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
