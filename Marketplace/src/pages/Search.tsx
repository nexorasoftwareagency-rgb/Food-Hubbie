import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search as SearchIcon, ArrowLeft, Utensils, Store, Loader2 } from "lucide-react";
import { OutletCard } from "@/components/cards/OutletCard";
import { FoodCard } from "@/components/cards/FoodCard";
import { fetchOutlets } from "@/services/outletService";
import { fetchAllMenuItems, searchMenu } from "@/services/menuService";
import { fetchCuisines, type Cuisine } from "@/services/configService";
import type { Outlet, MenuItem } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf } from "lucide-react";

export default function Search() {
  const [location, setLocation] = useLocation();
  const queryParams = new URLSearchParams(window.location.search);
  const urlQuery = queryParams.get("q") || "";

  const [query, setQuery] = useState(urlQuery);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "outlets" | "dishes">("all");
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"rating" | "delivery" | "price">("rating");

  // Initial load
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [oData, mData, cData] = await Promise.all([
        fetchOutlets(),
        fetchAllMenuItems(),
        fetchCuisines(),
      ]);
      setOutlets(oData);
      setMenuItems(mData);
      setCuisines(cData);
      setLoading(false);
    }
    loadData();

    // Load recent searches
    const saved = localStorage.getItem("recentSearches");
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  // Sync state with URL changes
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const filteredOutlets = outlets
    .filter(o => {
      const matchesQuery = !query || o.name.toLowerCase().includes(query.toLowerCase()) || 
                          o.cuisine.toLowerCase().includes(query.toLowerCase());
      const matchesCuisine = !selectedCuisine || o.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase());
      return matchesQuery && matchesCuisine;
    })
    .sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "delivery") return (a.deliveryTimeMin || 30) - (b.deliveryTimeMin || 30);
      return 0;
    });

  const filteredDishes = searchMenu(menuItems, query).filter(d => {
    const matchesVeg = !isVegOnly || d.isVeg;
    const matchesCuisine = !selectedCuisine || d.category?.toLowerCase() === selectedCuisine.toLowerCase();
    return matchesVeg && matchesCuisine;
  });

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    const newRecents = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(newRecents);
    localStorage.setItem("recentSearches", JSON.stringify(newRecents));

    // Update URL via wouter router
    setLocation(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center gap-3">
          <button 
            onClick={() => window.history.back()}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          
          <form onSubmit={handleSearch} className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input 
              type="search"
              autoFocus
              placeholder="Search for restaurants or food..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-muted border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </form>
        </div>

        {/* Tabs */}
        <div className="container mx-auto px-4 flex gap-6 overflow-x-auto no-scrollbar">
          {(["all", "outlets", "dishes"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-bold capitalize relative whitespace-nowrap ${
                activeTab === tab ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" 
                />
              )}
            </button>
          ))}
        </div>

        {/* Filters & Cuisines */}
        <div className="container mx-auto px-4 pb-4 space-y-4">
          {/* Filter Chips */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setIsVegOnly(!isVegOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all whitespace-nowrap shadow-sm ${
                isVegOnly ? "bg-green-500 border-green-600 text-white shadow-green-500/20" : "bg-background border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <Leaf className={`h-3.5 w-3.5 ${isVegOnly ? "fill-white" : ""}`} />
              Veg Only
            </button>

            <button
              onClick={() => setSortBy(sortBy === "rating" ? "delivery" : "rating")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all whitespace-nowrap ${
                sortBy !== "rating" ? "bg-primary/10 border-primary text-primary" : "bg-background border-border text-muted-foreground"
              }`}
            >
              {sortBy === "rating" ? "Top Rated" : "Fast Delivery"}
            </button>

            <div className="h-4 w-px bg-border shrink-0" />

            {cuisines.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCuisine(selectedCuisine === c.name ? null : c.name)}
                className={`px-4 py-2 rounded-full border text-xs font-bold transition-all whitespace-nowrap ${
                  selectedCuisine === c.name ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-background border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 pt-6">
        {!query && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 opacity-70">Recent Searches</h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(s => (
                    <button 
                      key={s}
                      onClick={() => { setQuery(s); handleSearch(); }}
                      className="px-4 py-2 bg-muted/50 rounded-xl text-sm font-bold border border-border/50 hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <SearchIcon className="h-3 w-3 text-muted-foreground" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Cuisines */}
            <div>
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-6 opacity-70">Trending Cuisines</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-6">
                {cuisines.slice(0, 8).map((c) => (
                  <button 
                    key={c.id} 
                    onClick={() => { setQuery(c.name); handleSearch(); }}
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-all shadow-sm group-active:scale-95">
                      <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-xs font-black text-center group-hover:text-primary transition-colors">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Collections */}
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-3xl p-6 border border-primary/10">
              <h3 className="text-lg font-heading font-black mb-1">Cravings?</h3>
              <p className="text-xs text-muted-foreground mb-6 font-medium">Explore the best of your neighbourhood</p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { setQuery("Pizza"); handleSearch(); }}
                  className="aspect-[4/3] rounded-2xl bg-[url('https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400')] bg-cover relative overflow-hidden group shadow-lg"
                >
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-end p-4">
                    <span className="text-white font-black text-sm uppercase tracking-wider">Cheesy Pizza</span>
                  </div>
                </button>
                <button 
                   onClick={() => { setQuery("Burger"); handleSearch(); }}
                   className="aspect-[4/3] rounded-2xl bg-[url('https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400')] bg-cover relative overflow-hidden group shadow-lg"
                >
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all flex items-end p-4">
                    <span className="text-white font-black text-sm uppercase tracking-wider">Juicy Burgers</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-muted-foreground font-medium">Searching the kitchen...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Outlets Section */}
            {(activeTab === "all" || activeTab === "outlets") && filteredOutlets.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Store className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-heading font-bold">Restaurants</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredOutlets.map((outlet, idx) => (
                    <OutletCard key={outlet.id} outlet={outlet} delay={idx} />
                  ))}
                </div>
              </div>
            )}

            {/* Dishes Section */}
            {(activeTab === "all" || activeTab === "dishes") && filteredDishes.length > 0 && query && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Utensils className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-heading font-bold">Dishes</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDishes.map((item) => (
                    <FoodCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {query && filteredOutlets.length === 0 && filteredDishes.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="bg-muted p-6 rounded-full mb-6">
                  <SearchIcon className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">No results found for "{query}"</h3>
                <p className="text-muted-foreground max-w-xs mb-6">
                  We couldn't find any restaurants or dishes matching your search. Try something else!
                </p>
                <button
                  onClick={() => {
                    const params = new URLSearchParams(window.location.search);
                    params.delete('q');
                    setLocation(`/search?${params.toString()}`, { replace: true });
                  }}
                  className="text-primary font-bold text-sm hover:underline"
                >
                  Clear search
                </button>
              </motion.div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
