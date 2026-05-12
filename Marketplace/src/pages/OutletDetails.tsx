import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Star, Clock, MapPin, Info, ArrowLeft, Search, Zap } from "lucide-react";
import { motion } from "framer-motion";
import {
  fetchOutletById,
  fetchOutletBySlug,
  availabilityLabel,
  availabilityClasses,
  canOrder,
  deliveryTimeString,
} from "@/services/outletService";
import {
  fetchMenuByOutlet,
  getCategories,
  filterByCategory,
  searchMenu,
} from "@/services/menuService";
import { calcDeliveryFee, deliveryFeeLabel } from "@/lib/deliveryFee";
import type { Outlet, MenuItem } from "@/types";
import { FoodCard } from "@/components/cards/FoodCard";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";

export default function OutletDetails() {
  const params = useParams<{ id?: string; slug?: string }>();
  // Support both /outlet/:id and /store/:slug
  const identifier = params.slug || params.id || "";

  const [loading, setLoading] = useState(true);
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("Recommended");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    const isSlug = !identifier.startsWith("outlet_");
    const fetchFn = isSlug
      ? fetchOutletBySlug(identifier)
      : fetchOutletById(identifier);

    fetchFn.then((o) => {
      setOutlet(o);
      if (o) {
        fetchMenuByOutlet(o.id).then((items) => {
          setMenuItems(items);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, [identifier]);

  const categories = [
    "Recommended",
    "Best Sellers",
    ...getCategories(menuItems),
  ];

  let displayItems = searchQuery
    ? searchMenu(menuItems, searchQuery)
    : filterByCategory(menuItems, activeCategory);

  if (!loading && !outlet) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Restaurant not found
      </div>
    );
  }

  const deliveryFee = outlet
    ? calcDeliveryFee(outlet.distanceKm, outlet.deliveryFeeStructure)
    : 0;

  return (
    <div className="pb-24">
      {/* Header image */}
      <div className="relative h-64 md:h-80 w-full">
        {loading ? (
          <div className="w-full h-full bg-muted animate-pulse" />
        ) : outlet ? (
          <>
            <img
              src={outlet.coverImage}
              alt={outlet.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            <Link
              href="/outlets"
              className="absolute top-4 left-4 bg-background/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-background/40 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>

            <div className="absolute bottom-6 left-4 right-4 md:container md:mx-auto">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-5xl font-heading font-bold text-white leading-tight">
                  {outlet.name}
                </h1>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase border shrink-0 ${availabilityClasses(outlet.availability)}`}
                >
                  {availabilityLabel(outlet.availability)}
                </span>
              </div>
              <p className="text-white/80 font-medium md:text-lg mb-4">
                {outlet.cuisine}
              </p>

              <div className="flex flex-wrap items-center gap-3 md:gap-5 text-white/90 text-sm">
                <div className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-2.5 py-1 rounded-lg font-bold">
                  <Star className="h-4 w-4 fill-current" />
                  <span>
                    {outlet.rating} ({outlet.ratingCount}+)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{deliveryTimeString(outlet)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{outlet.distanceKm} km away</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-secondary" />
                  <span>Delivery: {deliveryFeeLabel(deliveryFee)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Info className="h-4 w-4" />
                  <span>Min. order ₹{outlet.minOrderAmount}</span>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="container mx-auto px-4 mt-6">
        {/* Offers row */}
        {!loading && outlet && outlet.offers.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {outlet.offers.map((offer) => (
              <div
                key={offer.id}
                className="flex-shrink-0 bg-secondary/10 border border-secondary/30 text-secondary rounded-xl px-4 py-2 text-sm font-bold"
              >
                {offer.label}
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="search"
            placeholder={outlet ? `Search in ${outlet.name}...` : "Search menu..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-menu-search"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm shadow-sm"
          />
        </div>

        {/* Category tabs */}
        {!searchQuery && !loading && (
          <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm -mx-4 px-4 py-3 border-b border-border mb-6">
            <div className="flex overflow-x-auto gap-2 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  data-testid={`tab-category-${cat.toLowerCase().replace(/\s/g, "-")}`}
                  className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Unavailable banner */}
        {!loading && outlet && !canOrder(outlet.availability) && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl p-4 mb-6 text-sm font-medium">
            This restaurant is currently{" "}
            <strong>{availabilityLabel(outlet.availability)}</strong>. You can
            browse the menu but orders cannot be placed right now.
          </div>
        )}

        {/* Menu items */}
        <div className="mb-6">
          <h2 className="text-xl font-heading font-bold mb-4">
            {searchQuery ? "Search Results" : activeCategory}
          </h2>

          {loading ? (
            <div className="space-y-4">
              <SkeletonLoader type="list" count={4} />
            </div>
          ) : displayItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayItems.map((item, i) => (
                <FoodCard key={item.id} item={item} delay={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No items found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
