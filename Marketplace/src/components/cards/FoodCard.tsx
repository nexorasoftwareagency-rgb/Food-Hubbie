import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ProductCustomizationModal } from "../modals/ProductCustomizationModal";

interface FoodCardProps {
  item: any;
  delay?: number;
}

export function FoodCard({ item, delay = 0 }: FoodCardProps) {
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
        initial={{ y: 6, scale: 0.99 }}
        whileInView={{ y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ delay: delay * 0.1, duration: 0.4 }}
        className="flex gap-4 p-4 bg-card rounded-2xl border border-border shadow-sm hover-elevate"
      >
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`w-3 h-3 rounded-sm border flex items-center justify-center ${
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
                <span className="text-[10px] font-bold text-secondary-foreground bg-secondary px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                  Bestseller
                </span>
              )}
            </div>
            <h3 className="font-heading font-bold text-lg leading-tight text-card-foreground">
              {item.name}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-sm font-medium">
              <span className="text-foreground">₹{item.price}</span>
              {item.rating && (
                <span className="flex items-center text-xs text-muted-foreground ml-2">
                  <Star className="h-3 w-3 fill-secondary text-secondary mr-0.5" />
                  {item.rating}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-xs mt-2 line-clamp-2">
              {item.description}
            </p>
          </div>
        </div>

        <div className="relative w-28 h-28 flex-shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover rounded-xl shadow-sm"
          />
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24">
            {quantity === 0 ? (
              <button
                onClick={handleAdd}
                className="w-full bg-background border border-border text-primary font-bold py-1.5 rounded-lg shadow-sm hover:bg-muted transition-colors uppercase text-sm tracking-wider"
              >
                Add
                {item.customizable && <span className="absolute top-0 right-1 text-[10px]">+</span>}
              </button>
            ) : (
              <div className="flex items-center justify-between w-full bg-primary text-primary-foreground font-bold py-1.5 px-2 rounded-lg shadow-sm text-sm">
                <button onClick={handleDecrement} className="p-0.5 hover:bg-primary-foreground/20 rounded">
                  <Minus className="h-4 w-4" />
                </button>
                <span>{quantity}</span>
                <button onClick={handleIncrement} className="p-0.5 hover:bg-primary-foreground/20 rounded">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
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
