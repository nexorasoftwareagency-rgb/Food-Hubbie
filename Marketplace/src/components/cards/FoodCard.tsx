import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ProductCustomizationModal } from "../modals/ProductCustomizationModal";

interface FoodCardProps {
  item: any;
  delay?: number;
  showOutlet?: boolean;
}

export function FoodCard({ item, delay = 0, showOutlet = true }: FoodCardProps) {
  const { state, dispatch } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cartItem = state.items.find((i) => i.id === item.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = () => {
    if (item.customizable) {
      setIsModalOpen(true);
    } else {
      dispatch({
        type: "ADD_ITEM",
        payload: {
          id: item.id,
          menuItemId: item.id,
          name: item.name,
          basePrice: item.price,
          price: item.price,
          quantity: 1,
          image: item.image,
          outletId: item.outletId,
          customization: {
            addons: [],
            extraCheese: false,
            instructions: "",
          },
        },
      });
    }
  };

  const handleIncrement = () => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id: item.id, quantity: quantity + 1 } });
  };

  const handleDecrement = () => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id: item.id, quantity: quantity - 1 } });
  };

  return (
    <>
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ delay: delay * 0.05, duration: 0.4 }}
        className="flex gap-4 p-4 bg-card rounded-2xl border border-border/50 shadow-soft hover:shadow-premium transition-all duration-300 group"
      >
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${
                  item.isVeg ? "border-green-600" : "border-red-600"
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    item.isVeg ? "bg-green-600" : "bg-red-600"
                  }`}
                />
              </div>
              {item.isBestSeller && (
                <span className="text-[10px] font-black text-secondary-foreground bg-secondary px-2 py-0.5 rounded-full uppercase tracking-tighter flex items-center gap-0.5">
                  <Star className="h-2 w-2 fill-current" />
                  Bestseller
                </span>
              )}
            </div>
            <h3 className="font-heading font-bold text-lg leading-tight text-card-foreground group-hover:text-primary transition-colors">
              {item.name}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 font-bold">
              <span className="text-foreground text-base">₹{item.price}</span>
              {item.rating && (
                <span className="flex items-center text-[11px] bg-secondary/10 text-secondary-foreground px-1.5 py-0.5 rounded-md">
                  <Star className="h-2.5 w-2.5 fill-secondary text-secondary mr-1" />
                  {item.rating}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-xs mt-2.5 line-clamp-2 leading-relaxed font-medium">
              {item.description}
            </p>
            
            {showOutlet && item.outletName && (
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <Store className="h-2.5 w-2.5 text-primary" />
                </div>
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tight truncate">
                  {item.outletName}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="relative w-32 h-32 flex-shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover rounded-2xl shadow-sm group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 z-10">
            {quantity === 0 ? (
              <button
                onClick={handleAdd}
                className="w-full bg-background border border-primary/20 text-primary font-black py-2 rounded-xl shadow-lg hover:shadow-primary/20 hover:bg-primary hover:text-white transition-all uppercase text-xs tracking-widest active:scale-95"
              >
                ADD
                {item.customizable && <span className="absolute top-0 right-1 text-[8px] opacity-70">+</span>}
              </button>
            ) : (
              <div className="flex items-center justify-between w-full bg-primary text-primary-foreground font-black py-2 px-2.5 rounded-xl shadow-lg text-sm transition-all animate-in zoom-in-95 duration-200">
                <button onClick={handleDecrement} className="p-0.5 hover:bg-white/20 rounded-md transition-colors">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="tabular-nums">{quantity}</span>
                <button onClick={handleIncrement} className="p-0.5 hover:bg-white/20 rounded-md transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}
            {item.customizable && quantity === 0 && (
              <p className="text-[9px] text-center text-muted-foreground mt-4 font-bold uppercase tracking-tighter opacity-70">
                Customisable
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {item.customizable && (
        <ProductCustomizationModal
          item={item}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
