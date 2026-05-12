import { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { useOrderContext } from "@/context/OrderContext";
import { useAuth } from "@/context/AuthContext";
import { CreditCard, Wallet, Banknote, ShieldCheck, MapPin, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { calcCartSummary } from "@/services/cartService";
import { deliveryFeeLabel } from "@/lib/deliveryFee";
import type { PaymentMethod, DeliveryAddress } from "@/types";
import { Link } from "wouter";
import { useLocationContext } from "@/context/LocationContext";
import { FcGoogle } from "react-icons/fc";
import { fetchOutletById } from "@/services/outletService";
import { useEffect } from "react";
import type { Outlet } from "@/types";

const paymentMethods: { id: PaymentMethod; name: string; icon: typeof ShieldCheck }[] = [
  { id: "upi", name: "UPI", icon: ShieldCheck },
  { id: "card", name: "Credit / Debit Card", icon: CreditCard },
  { id: "wallet", name: "Wallet", icon: Wallet },
  { id: "cod", name: "Cash on Delivery", icon: Banknote },
];

export default function Checkout() {
  const { state: cartState, dispatch: cartDispatch } = useCart();
  const { placeOrder } = useOrderContext();
  const { user, signInWithGoogle, authState } = useAuth();
  const { state: locationState } = useLocationContext();
  const [, setLocation] = useLocation();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [outlet, setOutlet] = useState<Outlet | null>(null);

  useEffect(() => {
    if (cartState.outletId) {
       fetchOutletById(cartState.outletId).then(setOutlet);
    }
  }, [cartState.outletId]);

  const [form, setForm] = useState<DeliveryAddress>({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    address:
      user?.savedAddresses.find((a) => a.isDefault)?.address ?? locationState.address ?? "",
    landmark: user?.savedAddresses.find((a) => a.isDefault)?.landmark ?? "",
    lat: locationState.coords?.lat ?? 0,
    lng: locationState.coords?.lng ?? 0,
  });

  const summary = calcCartSummary(cartState.items, outlet);

  const handlePlaceOrder = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const orderId = await placeOrder({
        outletId: cartState.outletId ?? "",
        items: cartState.items,
        subtotal: summary.subtotal,
        deliveryFee: summary.deliveryFee,
        taxes: summary.taxes,
        total: summary.total,
        paymentMethod,
        deliveryAddress: form,
      });
      
      cartDispatch({ type: "CLEAR_CART" });
      setLocation(`/tracking/${orderId}`);
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong while placing your order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartState.items.length === 0 && !isProcessing) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-muted-foreground mb-4">No items to checkout.</p>
        <Link href="/" className="text-primary font-bold">
          Go Home
        </Link>
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-heading font-bold mb-2">Secure Checkout</h2>
        <p className="text-muted-foreground mb-8 max-w-xs">Please sign in to your account to place your order securely.</p>
        <button
          onClick={() => signInWithGoogle()}
          className="w-full max-w-xs bg-background border border-border py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-sm hover:bg-muted/50 transition-all"
        >
          <FcGoogle className="h-6 w-6" />
          <span>Continue with Google</span>
        </button>
        <Link href="/cart" className="mt-6 text-sm text-muted-foreground hover:text-primary font-medium">
          Return to Cart
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Custom header for checkout */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/cart" className="p-2 rounded-full hover:bg-muted transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="font-heading font-bold text-xl">Checkout</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Delivery address */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Delivery Address
              </h2>

              {/* Saved addresses quick-pick */}
              {user?.savedAddresses && user.savedAddresses.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
                  {user.savedAddresses.map((addr) => (
                    <button
                      key={addr.id}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          address: addr.address,
                          landmark: addr.landmark ?? "",
                        }))
                      }
                      data-testid={`btn-address-${addr.id}`}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        form.address === addr.address
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      {addr.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {(
                  [
                    { key: "name", label: "Full Name", type: "text" },
                    { key: "phone", label: "Phone Number", type: "tel" },
                    { key: "address", label: "Complete Address", type: "textarea" },
                    { key: "landmark", label: "Landmark (optional)", type: "text" },
                  ] as const
                ).map(({ key, label, type }) =>
                  type === "textarea" ? (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        {label}
                      </label>
                      <textarea
                        value={form[key] ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        data-testid={`input-${key}`}
                        title={label}
                        placeholder={label}
                        className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
                      />
                    </div>
                  ) : (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">
                        {label}
                      </label>
                      <input
                        type={type}
                        value={form[key] ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        data-testid={`input-${key}`}
                        title={label}
                        placeholder={label}
                        className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
              <h2 className="font-bold text-lg mb-4">Payment Method</h2>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    data-testid={`payment-${method.id}`}
                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                      paymentMethod === method.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      className="text-primary focus:ring-primary"
                    />
                    <method.icon
                      className={`h-5 w-5 ${
                        paymentMethod === method.id
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span className="font-medium">{method.name}</span>
                  </label>
                ))}
              </div>

              <AnimatePresence>
                {paymentMethod === "upi" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 p-4 bg-muted rounded-xl overflow-hidden"
                  >
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Enter UPI ID
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="username@upi"
                      data-testid="input-upi-id"
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Order summary */}
          <div>
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm md:sticky md:top-24">
              <h2 className="font-bold text-lg mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4 border-b border-border pb-4">
                {cartState.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item Total</span>
                  <span className="font-medium">₹{summary.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-medium">
                    {deliveryFeeLabel(summary.deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST (5%)</span>
                  <span className="font-medium">₹{summary.taxes}</span>
                </div>
              </div>

              <div className="border-t border-border pt-4 mb-6 flex justify-between items-center">
                <span className="font-bold text-lg">Total Amount</span>
                <span className="font-bold text-2xl text-primary">
                  ₹{summary.total}
                </span>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                data-testid="btn-place-order"
                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold shadow-md hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-3"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  `Pay ₹${summary.total}`
                )}
              </motion.button>

              <p className="text-center text-xs text-muted-foreground mt-3">
                By placing this order you agree to our Terms of Service
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
