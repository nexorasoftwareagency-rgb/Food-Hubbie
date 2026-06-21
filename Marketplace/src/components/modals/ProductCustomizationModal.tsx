import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface ProductCustomizationModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductCustomizationModal({ item, isOpen, onClose }: ProductCustomizationModalProps) {
  const { dispatch } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(item.sizes?.[0] || null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [instructions, setInstructions] = useState("");

  if (!isOpen) return null;

  const basePrice = selectedSize ? selectedSize.price : item.price;
  const addonsPrice = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  const totalPrice = (basePrice + addonsPrice) * quantity;

  const handleAddonToggle = (addon: any) => {
    if (selectedAddons.find((a) => a.name === addon.name)) {
      setSelectedAddons(selectedAddons.filter((a) => a.name !== addon.name));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const handleAddToCart = () => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: `${item.id}-${selectedSize?.name || "base"}-${selectedAddons.map(a => a.name).join("-")}`,
        menuItemId: item.id,
        name: item.name,
        price: basePrice + addonsPrice,
        quantity,
        image: item.image,
        outletId: item.outletId,
        businessId: item.businessId,
        basePrice: basePrice,
        customization: {
          size: selectedSize,
          addons: selectedAddons,
          extraCheese: false,
          instructions,
        },
      },
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm p-4 sm:p-0">
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="bg-card w-full max-w-md rounded-3xl overflow-hidden flex flex-col max-h-[80vh] shadow-2xl border border-border mb-20 sm:mb-0"
        >
          <div className="relative">
            <img src={item.image} alt={item.name} className="w-full h-32 object-cover" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 bg-background/80 backdrop-blur text-foreground p-1.5 rounded-full hover:bg-background transition-colors z-10 shadow-lg"
              title="Close Modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                  item.isVeg ? "border-green-600" : "border-red-600"
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
              </div>
              <h2 className="text-lg font-heading font-bold text-card-foreground line-clamp-1">{item.name}</h2>
            </div>
            <p className="text-muted-foreground text-xs mb-4 line-clamp-2">{item.description}</p>

            {item.sizes && item.sizes.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-bold mb-2 text-card-foreground">Size</h3>
                <div className="grid grid-cols-2 gap-2">
                  {item.sizes.map((size: any) => (
                    <label key={size.name} className={`flex items-center justify-between p-2.5 border rounded-xl cursor-pointer transition-all ${selectedSize?.name === size.name ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="size"
                          checked={selectedSize?.name === size.name}
                          onChange={() => setSelectedSize(size)}
                          className="text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span className="font-medium text-xs">{size.name}</span>
                      </div>
                      <span className="text-xs font-bold">₹{size.price}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {item.addons && item.addons.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-bold mb-2 text-card-foreground">Add-ons</h3>
                <div className="space-y-1.5">
                  {item.addons.map((addon: any) => (
                    <label key={addon.name} className={`flex items-center justify-between p-2.5 border rounded-xl cursor-pointer transition-all ${selectedAddons.find((a) => a.name === addon.name) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!selectedAddons.find((a) => a.name === addon.name)}
                          onChange={() => handleAddonToggle(addon)}
                          className="text-primary focus:ring-primary h-3.5 w-3.5 rounded"
                        />
                        <span className="font-medium text-xs">{addon.name}</span>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">+₹{addon.price}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-2">
              <h3 className="text-sm font-bold mb-2 text-card-foreground">Special Instructions</h3>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="E.g. Make it spicy..."
                className="w-full bg-background border border-border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px] resize-none"
              />
            </div>
          </div>

          <div className="p-4 bg-background border-t border-border shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 bg-muted p-1.5 rounded-xl">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1 bg-background rounded shadow-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                  title="Decrease Quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-bold text-sm w-4 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1 bg-background rounded shadow-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                  title="Increase Quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 bg-primary text-primary-foreground py-3 px-4 rounded-xl font-bold flex items-center justify-between hover:bg-primary/90 transition-colors shadow-lg active:scale-[0.98]"
              >
                <span className="text-sm">Add Item</span>
                <span className="text-sm">₹{totalPrice}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
