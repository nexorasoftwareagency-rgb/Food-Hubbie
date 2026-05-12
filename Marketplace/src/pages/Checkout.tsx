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
            <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
              <div className="bg-primary/5 px-6 py-4 border-b border-border/50">
                <h2 className="font-bold text-lg flex items-center gap-2 text-primary">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </h2>
              </div>

              <div className="p-6">
                {/* Saved addresses quick-pick */}
                {user?.savedAddresses && user.savedAddresses.length > 0 && (
                  <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
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
                        className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          form.address === addr.address
                            ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                            : "border-border bg-muted/50 hover:bg-muted"
                        }`}
                      >
                        {addr.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  {(
                    [
                      { key: "name", label: "Full Name", type: "text", placeholder: "John Doe" },
                      { key: "phone", label: "Phone Number", type: "tel", placeholder: "9876543210" },
                      { key: "address", label: "Complete Address", type: "textarea", placeholder: "House No, Street, Locality..." },
                      { key: "landmark", label: "Landmark (optional)", type: "text", placeholder: "Near..." },
                    ] as const
                  ).map(({ key, label, type, placeholder }) => (
                    <div key={key}>
                      <label className="block text-[10px] font-black text-muted-foreground mb-1.5 uppercase tracking-widest opacity-70">
                        {label}
                      </label>
                      {type === "textarea" ? (
                        <textarea
                          value={form[key] ?? ""}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          placeholder={placeholder}
                          className="w-full bg-muted/30 border border-border/50 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] transition-all"
                        />
                      ) : (
                        <input
                          type={type}
                          value={form[key] ?? ""}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          placeholder={placeholder}
                          className="w-full bg-muted/30 border border-border/50 rounded-xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
              <div className="bg-primary/5 px-6 py-4 border-b border-border/50">
                <h2 className="font-bold text-lg text-primary flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Payment Method
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                        paymentMethod === method.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/50 hover:bg-muted/50"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        paymentMethod === method.id ? "border-primary" : "border-muted-foreground/30"
                      }`}>
                        {paymentMethod === method.id && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                      </div>
                      <method.icon
                        className={`h-5 w-5 ${
                          paymentMethod === method.id
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span className="font-bold text-sm">{method.name}</span>
                    </label>
                  ))}
                </div>

                <AnimatePresence>
                  {paymentMethod === "upi" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl"
                    >
                      <label className="block text-[10px] font-black text-primary/70 mb-1.5 uppercase tracking-widest">
                        Enter UPI ID
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="username@upi"
                        className="w-full bg-background border border-primary/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
