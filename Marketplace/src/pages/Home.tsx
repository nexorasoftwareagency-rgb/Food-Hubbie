import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  ChevronRight,
  Pizza,
  Beef,
  Coffee,
  Cake,
  Soup,
  Salad,
  Sandwich,
  UtensilsCrossed,
  Star,
  Quote,
  Store,
} from "lucide-react";
import { fetchOutlets, sortByDistance } from "@/services/outletService";
import { 
  getGlobalBestSellers, 
  getGlobalRecommended, 
  fetchAllMenuItems 
} from "@/services/menuService";
import { fetchGlobalReviews } from "@/services/reviewService";
import { useLocation } from "wouter";
import type { Outlet, MenuItem, Review } from "@/types";
import { OutletCard } from "@/components/cards/OutletCard";
import { FoodCard } from "@/components/cards/FoodCard";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { useLocationContext } from "@/context/LocationContext";
import { fetchCuisines, type Cuisine } from "@/services/configService";
import { heroBanner } from "@/data/mockData";



export default function Home() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [bestSellers, setBestSellers] = useState<MenuItem[]>([]);
  const [recommended, setRecommended] = useState<MenuItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const { state: locationState, requestLocation } = useLocationContext();

  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchOutlets();
        const sortedOutlets = sortByDistance(data, locationState.coords);
        setOutlets(sortedOutlets);
        
        // Fetch all items for the global menu
        const [best, reco, revs, allItems, cData] = await Promise.all([
          getGlobalBestSellers(4),
          getGlobalRecommended(4),
          fetchGlobalReviews(6),
          fetchAllMenuItems(),
          fetchCuisines()
        ]);
        
        setBestSellers(best);
        setRecommended(reco);
        setReviews(revs);
        setAllMenuItems(allItems);
        setCuisines(cData);
      } catch (error) {
        console.error("Home data load error:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [locationState.coords]);

  const openOutlets = outlets.filter(
    (o) => o.availability === "open" || o.availability === "busy"
  );
  const fastDelivery = [...outlets].sort((a, b) => a.deliveryTimeMin - b.deliveryTimeMin).slice(0, 4);
  const topRated = [...outlets].sort((a, b) => b.rating - a.rating).slice(0, 4);

  return (
    <div className="pb-8">
      {/* Mobile location banner */}
      <div className="md:hidden bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate flex-1">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium truncate">
            {locationState.address || "Detecting location..."}
          </span>
        </div>
        {locationState.permissionStatus !== "granted" && (
          <button
            onClick={requestLocation}
            data-testid="btn-allow-location"
            className="text-xs bg-primary-foreground/20 px-2.5 py-1 rounded-lg font-bold whitespace-nowrap ml-2"
          >
            {locationState.permissionStatus === "denied" ? "Enable" : "Allow"}
          </button>
        )}
      </div>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-6 pb-8">
        <div className="relative rounded-3xl overflow-hidden shadow-lg h-64 md:h-96">
          {loading ? (
            <SkeletonLoader type="banner" count={1} />
          ) : (
            <>
              <img
                src={heroBanner}
                alt="Delicious Food"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/10 flex flex-col justify-center p-6 md:p-14">
                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl md:text-6xl font-heading font-bold text-white mb-3 max-w-lg leading-tight"
                >
                  Cravings?{" "}
                  <span className="text-secondary">Delivered.</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-white/80 md:text-lg mb-8 max-w-md"
                >
                  The best restaurants in town — hot and fresh at your door.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative max-w-md"
                >
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.querySelector('input');
                      if (input?.value.trim()) {
                        setLocation(`/search?q=${encodeURIComponent(input.value.trim())}`);
                      }
                    }}
                    className="relative group"
                  >
                    <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="search"
                      placeholder="Search pizzas, burgers, drinks..."
                      className="w-full bg-background border-2 border-transparent rounded-2xl pl-12 pr-4 py-4 text-base shadow-xl focus:outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all"
                      data-testid="input-hero-search"
                    />
                    <button 
                      type="submit"
                      className="absolute right-2 top-2 bottom-2 bg-primary text-white px-6 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                    >
                      Search
                    </button>
                  </form>
                </motion.div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Food categories */}
      <section className="container mx-auto px-4 pb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-heading font-bold text-foreground">
            What's on your mind?
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {loading ? (
            Array(8).fill(0).map((_, i) => (
              <div key={i} className="flex-shrink-0 animate-pulse">
                <div className="w-20 h-20 bg-muted rounded-full mb-2" />
                <div className="w-16 h-3 bg-muted rounded mx-auto" />
              </div>
            ))
          ) : (
            cuisines.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setLocation(`/search?q=${encodeURIComponent(cat.name)}`)}
                className="flex flex-col items-center gap-2 cursor-pointer group flex-shrink-0"
              >
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-all shadow-sm">
                  <img 
                    src={cat.image} 
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                </div>
                <span className="text-xs md:text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors text-center">
                  {cat.name}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Trending Dishes - MOVED UP */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-heading font-bold text-foreground">
              Trending Now
            </h2>
            <p className="text-muted-foreground">Most loved dishes in your area</p>
          </div>
          <Link
            href="/search?q=trending"
            className="text-primary font-bold flex items-center text-sm hover:underline"
          >
            Explore all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SkeletonLoader type="list" count={4} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map((item, i) => (
              <FoodCard key={item.id} item={item} delay={i} />
            ))}
          </div>
        )}
      </section>

      {/* Quick Bites - New Section */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-heading font-bold text-foreground">
                Quick Bites
              </h2>
              <p className="text-muted-foreground">Fast food, faster delivery</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommended.slice(0, 4).map((item, i) => (
              <FoodCard key={item.id} item={item} delay={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Explore Outlets Promo */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-card border border-border rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-sm">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Prefer browsing by <span className="text-primary">Restaurant?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg">
              Explore our curated list of top-rated restaurants, local favorites, and premium cafes.
            </p>
            <Link 
              href="/outlets"
              className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:scale-105"
            >
              <Store className="h-5 w-5" />
              View All Restaurants
            </Link>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            {outlets.slice(0, 4).map((o, i) => (
              <motion.img 
                key={o.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                src={o.logo}
                alt={o.name}
                className="w-full h-32 md:h-40 object-cover rounded-2xl border border-border shadow-sm"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Universal Menu - All Items */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-heading font-bold text-foreground">
              Explore All Food
            </h2>
            <p className="text-muted-foreground">Everything delicious, all in one place</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SkeletonLoader type="list" count={8} />
          </div>
        ) : allMenuItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {allMenuItems.map((item, i) => (
              <FoodCard key={item.id} item={item} delay={i % 4} />
            ))}
          </div>
        ) : (
          <div className="bg-muted/30 rounded-3xl p-12 text-center border-2 border-dashed border-border">
            <div className="bg-muted h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No items found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              We couldn't find any menu items in your area. Try refreshing or changing your location.
            </p>
          </div>
        )}
      </section>

      {/* Customer Reviews */}
      <section className="bg-muted/40 py-10">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h2 className="text-2xl font-heading font-bold text-foreground">
              What People Say
            </h2>
            <p className="text-muted-foreground text-sm">
              Real reviews from real customers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-card rounded-2xl p-5 border border-border shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={review.userAvatar}
                      alt={review.userName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-bold text-sm text-card-foreground">
                        {review.userName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {review.outletName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-secondary/10 px-2 py-1 rounded-lg">
                    <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                    <span className="text-xs font-bold text-secondary">
                      {review.rating}
                    </span>
                  </div>
                </div>
                <Quote className="h-4 w-4 text-primary/30 mb-1" />
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {review.comment}
                </p>
                <p className="text-[11px] text-muted-foreground mt-3">
                  {new Date(review.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pro CTA banner */}
      <section className="container mx-auto px-4 py-12">
        <div className="bg-primary rounded-3xl p-6 md:p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-md text-center md:text-left">
            <span className="bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 inline-block">
              Pro Member
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-2">
              Get Free Delivery
            </h2>
            <p className="text-white/80">
              Subscribe to Foodhubbie Pro for unlimited free deliveries and
              exclusive discounts on every order.
            </p>
          </div>

          <button
            data-testid="btn-join-pro"
            className="relative z-10 bg-white text-primary font-bold px-8 py-4 rounded-xl hover:bg-muted transition-colors shadow-lg whitespace-nowrap"
          >
            Join Now @ ₹99/mo
          </button>
        </div>
      </section>
    </div>
  );
}
