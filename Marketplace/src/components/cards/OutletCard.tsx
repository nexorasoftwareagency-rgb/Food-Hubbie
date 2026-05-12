import { Link } from "wouter";
import { motion } from "framer-motion";
import { Star, Clock, MapPin, Tag } from "lucide-react";
import type { Outlet } from "@/types";
import {
  availabilityLabel,
  availabilityClasses,
  canOrder,
  deliveryTimeString,
} from "@/services/outletService";

interface OutletCardProps {
  outlet: Outlet;
  delay?: number;
}

export function OutletCard({ outlet, delay = 0 }: OutletCardProps) {
  const href = `/store/${outlet.slug}`;
  const closed = !canOrder(outlet.availability);

  return (
    <motion.div
      initial={{ y: 8, scale: 0.99 }}
      animate={{ y: 0, scale: 1 }}
      transition={{ delay: delay * 0.06, duration: 0.3, ease: "easeOut" }}
    >
      <Link
        href={href}
        data-testid={`outlet-card-${outlet.id}`}
        className="block relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="h-48 w-full relative">
          <img
            src={outlet.coverImage}
            alt={outlet.name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${closed ? "grayscale-[40%]" : ""}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Availability badge */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span
              className={`px-2 py-1 rounded text-[11px] font-bold uppercase border ${availabilityClasses(outlet.availability)}`}
            >
              {availabilityLabel(outlet.availability)}
            </span>
            {outlet.tags.slice(0, 1).map((tag) => (
              <span
                key={tag}
                className="bg-background/90 backdrop-blur-sm text-foreground px-2 py-1 rounded text-xs font-bold uppercase"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Rating */}
          <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 shadow-sm">
            <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
            <span className="text-xs font-bold">{outlet.rating}</span>
            <span className="text-[10px] text-muted-foreground ml-1">
              ({outlet.ratingCount}+)
            </span>
          </div>

          {/* Offer strip */}
          {outlet.offers.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2 bg-secondary/90 backdrop-blur text-secondary-foreground w-fit px-3 py-1.5 rounded-lg shadow-sm">
                <Tag className="h-3.5 w-3.5" />
                <span className="text-sm font-bold truncate">
                  {outlet.offers[0].label}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-card border-x border-b border-border rounded-b-2xl relative">
          {/* Logo floated up */}
          <div className="absolute -top-6 right-4 p-1 bg-card rounded-xl shadow-sm">
            <img
              src={outlet.logo}
              alt={outlet.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          </div>

          <h3 className="font-heading font-bold text-xl text-card-foreground mb-0.5 pr-16">
            {outlet.name}
          </h3>
          <p className="text-muted-foreground text-sm truncate mb-3">
            {outlet.cuisine}
          </p>

          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>{deliveryTimeString(outlet)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>{outlet.distanceKm} km</span>
            </div>
            <div className="flex items-center gap-1 ml-auto text-foreground font-semibold">
              <span>₹{outlet.minOrderAmount} min</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
