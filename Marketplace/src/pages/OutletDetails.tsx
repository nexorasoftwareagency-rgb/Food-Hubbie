import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "wouter";
import { Star, Clock, MapPin, Info, ArrowLeft, Search, Zap, Soup, Flame, Carrot, Medal, Utensils } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchOutletById,
  fetchOutletBySlug,
  availabilityLabel,
  availabilityClasses,
  canOrder,
  deliveryTimeString,
  calculateDistance,
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
import { useLocationContext } from "@/context/LocationContext";

export default function OutletDetails() {
  const params = useParams<{ id?: string; slug?: string }>();
  // Support both /outlet/:id and /store/:slug
  const identifier = params.slug || params.id || "";

  const [loading, setLoading] = useState(true);
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const { state: locationState } = useLocationContext();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [dietFilters, setDietFilters] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLoading(true);
    const isSlug = !identifier.startsWith("outlet_");
    const fetchFn = isSlug
      ? fetchOutletBySlug(identifier)
      : fetchOutletById(identifier);

    fetchFn.then((o) => {
      setOutlet(o);
      if (o) {
        fetchMenuByOutlet(o.id, o.businessId).then((items) => {
          setMenuItems(items);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, [identifier]);

  const categories = [
    "All",
    "Recommended",
    "Best Sellers",
    ...getCategories(menuItems),
  ];

  let displayItems = searchQuery
    ? searchMenu(menuItems, searchQuery)
    : filterByCategory(menuItems, activeCategory);

  // Apply dietary filters
  if (!searchQuery && Object.keys(dietFilters).length > 0) {
    displayItems = displayItems.filter(item => {
      if (dietFilters.veg && !item.isVeg) return false;
      if (dietFilters.nonveg && item.isVeg) return false;
      if (dietFilters.spicy && !item.isSpicy) return false;
      if (dietFilters.bestseller && !item.isBestSeller) return false;
      return true;
    });
  }

  const totalItems = menuItems.length;
  const totalCategories = useMemo(() => getCategories(menuItems).length, [menuItems]);
  const vegCount = menuItems.filter(i => i.isVeg).length;
  const bestsellerCount = menuItems.filter(i => i.isBestSeller).length;

  if (!loading && !outlet) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Utensils className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-heading font-bold mb-2">Restaurant not found</h2>
          <p className="text-muted-foreground text-sm mb-8">
            This restaurant may have been removed or the link is incorrect.
          </p>
          <Link
            href="/outlets"
            className="inline-flex bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
          >
            Browse Restaurants
          </Link>
        </div>
      </div>
    );
  }

  const realDistanceKm = outlet && locationState.coords
    ? parseFloat(calculateDistance(
        locationState.coords.lat, locationState.coords.lng,
        outlet.location.lat, outlet.location.lng
      ).toFixed(1))
    : outlet?.distanceKm || 0;

  const deliveryFee = outlet
    ? calcDeliveryFee(realDistanceKm, outlet.deliveryFeeConfig)
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
                  <span>{realDistanceKm} km away</span>
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

        {/* Dietary filter pills */}
        {!searchQuery && !loading && (
          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
            {[
              { key: "veg", label: "Veg", icon: Carrot },
              { key: "nonveg", label: "Non-Veg", icon: Soup },
              { key: "spicy", label: "Spicy", icon: Flame },
              { key: "bestseller", label: "Bestseller", icon: Medal },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setDietFilters(prev => {
                  const next = { ...prev };
                  if (next[key]) delete next[key];
                  else next[key] = true;
                  return next;
                })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  dietFilters[key]
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* KPI strip */}
        {!loading && outlet && !searchQuery && (
          <div className="flex gap-4 mb-4 text-xs font-medium text-muted-foreground overflow-x-auto scrollbar-hide">
            <span className="flex items-center gap-1 bg-muted/50 px-2.5 py-1 rounded-lg whitespace-nowrap">
              <Utensils className="h-3 w-3" /> {totalItems} items
            </span>
            <span className="flex items-center gap-1 bg-muted/50 px-2.5 py-1 rounded-lg whitespace-nowrap">
              <Carrot className="h-3 w-3 text-green-600" /> {vegCount} veg
            </span>
            <span className="flex items-center gap-1 bg-muted/50 px-2.5 py-1 rounded-lg whitespace-nowrap">
              <Medal className="h-3 w-3 text-secondary" /> {bestsellerCount} bestsellers
            </span>
            <span className="flex items-center gap-1 bg-muted/50 px-2.5 py-1 rounded-lg whitespace-nowrap">
              <Info className="h-3 w-3" /> {totalCategories} categories
            </span>
          </div>
        )}

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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-heading font-bold mb-2">
                {searchQuery ? "No matching items" : "Menu is empty"}
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                {searchQuery
                  ? `We couldn't find "${searchQuery}" in this restaurant's menu. Try a different search.`
                  : "This restaurant hasn't added any items in this category yet."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 text-primary font-bold text-sm hover:underline"
                >
                  Clear search
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
