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
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="relative">
            <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-background/80 backdrop-blur text-foreground p-2 rounded-full hover:bg-background transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex-1 pb-32">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                  item.isVeg ? "border-green-600" : "border-red-600"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-green-600" : "bg-red-600"}`} />
              </div>
              <h2 className="text-xl font-heading font-bold text-card-foreground">{item.name}</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-6">{item.description}</p>

            {item.sizes && item.sizes.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold mb-3 text-card-foreground">Size</h3>
                <div className="space-y-2">
                  {item.sizes.map((size: any) => (
                    <label key={size.name} className="flex items-center justify-between p-3 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="size"
                          checked={selectedSize?.name === size.name}
                          onChange={() => setSelectedSize(size)}
                          className="text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="font-medium text-sm">{size.name}</span>
                      </div>
                      <span className="text-sm font-medium">₹{size.price}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {item.addons && item.addons.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold mb-3 text-card-foreground">Add-ons</h3>
                <div className="space-y-2">
                  {item.addons.map((addon: any) => (
                    <label key={addon.name} className="flex items-center justify-between p-3 border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!selectedAddons.find((a) => a.name === addon.name)}
                          onChange={() => handleAddonToggle(addon)}
                          className="text-primary focus:ring-primary h-4 w-4 rounded"
                        />
                        <span className="font-medium text-sm">{addon.name}</span>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">+₹{addon.price}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="font-bold mb-3 text-card-foreground">Special Instructions</h3>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="E.g. Make it spicy, no onions..."
                className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
              />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 bg-muted p-2 rounded-xl">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1 bg-background rounded hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <span className="font-bold w-4 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1 bg-background rounded hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 bg-primary text-primary-foreground py-3.5 px-4 rounded-xl font-bold flex items-center justify-between hover:bg-primary/90 transition-colors shadow-md"
              >
                <span>Add Item</span>
                <span>₹{totalPrice}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
