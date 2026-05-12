import { useState, useEffect } from "react";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
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

export default function Outlets() {
  const [loading, setLoading] = useState(true);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { state: locationState, requestLocation } = useLocationContext();

  useEffect(() => {
    fetchOutlets().then((data) => {
      setOutlets(sortByDistance(data, locationState.coords));
      setLoading(false);
    });
  }, [locationState.coords]);

  const displayed = filterOutlets(outlets, searchQuery, activeFilter);

  return (
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
            data-testid="btn-outlet-filter"
            className="bg-card border border-border p-3 rounded-xl hover:bg-muted transition-colors flex items-center justify-center shrink-0"
          >
            <SlidersHorizontal className="h-5 w-5" />
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
          <p className="text-lg font-heading font-bold text-foreground mb-2">
            No restaurants found
          </p>
          <p className="text-muted-foreground text-sm">
            Try a different search or filter.
          </p>
        </motion.div>
      )}
    </div>
  );
}
