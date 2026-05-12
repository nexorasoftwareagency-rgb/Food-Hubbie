import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { ChevronRight } from "lucide-react";

export function FloatingCart() {
  const { state, itemCount, total } = useCart();

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-[80px] md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 z-40"
        >
          <Link 
            href="/cart"
            className="flex items-center justify-between bg-primary text-primary-foreground p-4 rounded-xl shadow-lg hover-elevate-2 transition-all cursor-pointer"
          >
            <div>
              <div className="font-bold text-sm">
                {itemCount} {itemCount === 1 ? "Item" : "Items"}
              </div>
              <div className="text-primary-foreground/80 text-xs mt-0.5">
                Extra charges may apply
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-bold">₹{total}</span>
              <div className="bg-primary-foreground/20 rounded-full p-1">
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
