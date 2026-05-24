import { useState, useEffect } from "react";
import { Search, MapPin, SlidersHorizontal, ArrowUpDown, CircleCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchOutlets,
  filterOutlets,
  sortByDistance,
} from "@/services/outletService";
import type { Outlet } from "@/types";
import { OutletCard } from "@/components/cards/OutletCard";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { useLocationContext } from "@/context/LocationContext";

const filters = [
  "All",
  "Open Now",
  "Veg Only",
  "Top Rated",
  "Fastest Delivery",
  "Offers",
];

type SortOption = "distance" | "rating" | "delivery_time" | "min_order";

export default function Outlets() {
  const [loading, setLoading] = useState(true);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("distance");
  const [showSortSheet, setShowSortSheet] = useState(false);
  const { state: locationState, requestLocation } = useLocationContext();

  useEffect(() => {
    fetchOutlets().then((data) => {
      setOutlets(sortByDistance(data, locationState.coords));
      setLoading(false);
    });
  }, [locationState.coords]);

  const filtered = filterOutlets(outlets, searchQuery, activeFilter);
  const displayed = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "rating": return b.rating - a.rating;
      case "delivery_time": return a.deliveryTimeMin - b.deliveryTimeMin;
      case "min_order": return a.minOrderAmount - b.minOrderAmount;
      default: return a.distanceKm - b.distanceKm;
    }
  });

  const sortOptions: { value: SortOption; label: string; icon: string }[] = [
    { value: "distance", label: "Nearest first", icon: "📍" },
    { value: "rating", label: "Top rated", icon: "⭐" },
    { value: "delivery_time", label: "Fastest delivery", icon: "⚡" },
    { value: "min_order", label: "Lowest min. order", icon: "💰" },
  ];

  if (locationState.permissionStatus !== "granted") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-heading font-bold mb-3">
            {locationState.permissionStatus === "denied"
              ? "Location Access Blocked"
              : "Share Your Location"}
          </h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {locationState.permissionStatus === "denied"
              ? "Please enable location access in your browser settings, then refresh the page."
              : "We need your location to show restaurants near you and provide accurate delivery estimates."}
          </p>
          {locationState.permissionStatus === "prompt" && (
            <button
              onClick={requestLocation}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors"
            >
              Allow Location Access
            </button>
          )}
          {locationState.permissionStatus === "denied" && (
            <p className="text-sm text-muted-foreground">
              Open your browser settings → Site permissions → Location → select "Allow"
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="container mx-auto px-4 py-6">
      {/* Location banner */}
      <div className="bg-muted p-4 rounded-2xl flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-full text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
              Delivering To
            </p>
            <p className="text-sm font-bold text-foreground">
              {locationState.address || "Detecting your location..."}
            </p>
          </div>
        </div>
        {locationState.permissionStatus !== "granted" && (
          <button
            onClick={requestLocation}
            data-testid="btn-detect-location"
            className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
          >
            Detect
          </button>
        )}
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-4">
          Restaurants near you
        </h1>

        <div className="flex gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search restaurants, cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-outlet-search"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            />
          </div>
          <button
            onClick={() => setShowSortSheet(true)}
            data-testid="btn-outlet-filter"
            className="bg-card border border-border p-3 rounded-xl hover:bg-muted transition-colors flex items-center justify-center shrink-0 relative"
          >
            <SlidersHorizontal className="h-5 w-5" />
            {sortBy !== "distance" && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
            )}
          </button>
        </div>

        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              data-testid={`filter-${filter.toLowerCase().replace(/\s/g, "-")}`}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border ${
                activeFilter === filter
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <SkeletonLoader count={6} />
        </div>
      ) : displayed.length > 0 ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {displayed.length} restaurant{displayed.length !== 1 ? "s" : ""}{" "}
            found
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayed.map((outlet, i) => (
              <OutletCard key={outlet.id} outlet={outlet} delay={i} />
            ))}
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-heading font-bold text-foreground mb-2">
            No restaurants found
          </p>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Try a different search or filter. We couldn't find any matches for "{searchQuery || activeFilter}".
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

    {/* Sort Sheet Overlay */}
    <AnimatePresence>
      {showSortSheet && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowSortSheet(false)}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl max-h-[70vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-heading font-bold">Sort & Filter</h3>
                <button
                  onClick={() => setShowSortSheet(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Sort by
                </h4>
                <div className="space-y-2">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value); setShowSortSheet(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                        sortBy === opt.value
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "hover:bg-muted border border-transparent"
                      }`}
                    >
                      <span className="text-lg">{opt.icon}</span>
                      <div className="flex-1">
                        <span className="font-semibold">{opt.label}</span>
                      </div>
                      {sortBy === opt.value && (
                        <CircleCheck className="h-5 w-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
