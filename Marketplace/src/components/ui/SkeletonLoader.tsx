import { motion } from "framer-motion";

export function SkeletonLoader({ count = 3, type = "card" }: { count?: number; type?: "card" | "banner" | "list" }) {
  const skeletons = Array(count).fill(0);

  return (
    <>
      {skeletons.map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className={`shimmer bg-muted overflow-hidden ${
            type === "card" ? "h-64 rounded-2xl w-full" : 
            type === "banner" ? "h-48 rounded-2xl w-full" : 
            "h-24 rounded-xl w-full"
          }`}
        />
      ))}
    </>
  );
}
