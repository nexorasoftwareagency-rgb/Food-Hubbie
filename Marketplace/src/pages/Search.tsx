import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Search as SearchIcon, ArrowLeft, Utensils, Store, Loader2 } from "lucide-react";
import { OutletCard } from "@/components/cards/OutletCard";
import { FoodCard } from "@/components/cards/FoodCard";
import { fetchOutlets } from "@/services/outletService";
import { fetchAllMenuItems, searchMenu } from "@/services/menuService";
import type { Outlet, MenuItem } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export default function Search() {
  const [location] = useLocation();
  const queryParams = new URLSearchParams(window.location.search);
  const urlQuery = queryParams.get("q") || "";

  const [query, setQuery] = useState(urlQuery);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "outlets" | "dishes">("all");

  // Initial load
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [oData, mData] = await Promise.all([
        fetchOutlets(),
        fetchAllMenuItems(),
      ]);
      setOutlets(oData);
      setMenuItems(mData);
      setLoading(false);
    }
    loadData();
  }, []);

  // Sync state with URL changes
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const filteredOutlets = outlets.filter(o => 
    o.name.toLowerCase().includes(query.toLowerCase()) || 
    o.cuisine.toLowerCase().includes(query.toLowerCase())
  );

  const filteredDishes = searchMenu(menuItems, query);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL without reload
    const newUrl = `${window.location.pathname}?q=${encodeURIComponent(query)}`;
    window.history.replaceState({}, '', newUrl);
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
      </div>

      <main className="container mx-auto px-4 pt-6">
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
            {(activeTab === "all" || activeTab === "dishes") && filteredDishes.length > 0 && (
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
            {filteredOutlets.length === 0 && filteredDishes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-muted p-6 rounded-full mb-6">
                  <SearchIcon className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">No results found for "{query}"</h3>
                <p className="text-muted-foreground max-w-xs">
                  We couldn't find any restaurants or dishes matching your search. Try something else!
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
