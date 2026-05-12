import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { CartProvider } from "@/context/CartContext";
import { LocationProvider } from "@/context/LocationContext";
import { OrderProvider } from "@/context/OrderContext";
import { AuthProvider } from "@/context/AuthContext";

import { AppLayout } from "@/components/layout/AppLayout";

import Home from "@/pages/Home";
import Outlets from "@/pages/Outlets";
import OutletDetails from "@/pages/OutletDetails";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Tracking from "@/pages/Tracking";
import Profile from "@/pages/Profile";
import Orders from "@/pages/Orders";
import Login from "@/pages/Login";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/outlets" component={Outlets} />
        {/* SaaS-compatible slug-based route */}
        <Route path="/store/:slug" component={OutletDetails} />
        {/* Legacy id-based route — kept for backwards compat */}
        <Route path="/outlet/:id" component={OutletDetails} />
        <Route path="/cart" component={Cart} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/tracking/:orderId" component={Tracking} />
        <Route path="/profile" component={Profile} />
        <Route path="/orders" component={Orders} />
        <Route path="/login" component={Login} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LocationProvider>
          <OrderProvider>
            <CartProvider>
              <TooltipProvider>
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <Router />
                </WouterRouter>
                <Toaster />
              </TooltipProvider>
            </CartProvider>
          </OrderProvider>
        </LocationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
