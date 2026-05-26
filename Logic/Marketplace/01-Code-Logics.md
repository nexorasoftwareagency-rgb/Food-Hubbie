# Marketplace — Code Logics

## Overview
Customer-facing PWA (Zomato-style food ordering). React 19 + TypeScript + Vite 6 + wouter router.

## Entry Point (main.tsx)
- `applyTheme()` called before render (default Forest Green/Amber/Cream palette)
- `createRoot(document.getElementById("root")!).render(<App />)`

## App.tsx — Component Tree
```
<QueryClientProvider>                    ← TanStack React Query
  <ErrorBoundary>                        ← Class-based error boundary
    <AuthProvider>                        ← Firebase Auth state + Google sign-in
      <LocationProvider>                  ← Geolocation API + Nominatim reverse geocode
        <OrderProvider>                   ← Order lifecycle + localStorage cache
          <CartProvider>                  ← useReducer cart + outlet-conflict dialog
            <TooltipProvider>             ← shadcn/ui tooltip
              <WouterRouter base={...}>   ← wouter with BASE_URL
                <Router />                ← Switch with 11+ routes
              </WouterRouter>
              <Toaster />                 ← shadcn/ui toast
              <Sonner />                  ← sonner toast notifications
              <NotificationHandler />     ← Firebase broadcast listener
            </TooltipProvider>
          </CartProvider>
        </OrderProvider>
      </LocationProvider>
    </AuthProvider>
  </ErrorBoundary>
</QueryClientProvider>
```

## Router (wouter)
| Route | Page | Notes |
|---|---|---|
| `/` | Home | Featured outlets, cuisine grid |
| `/search` | Search | Debounced search |
| `/outlets` | Outlets | Nearby outlets list |
| `/store/:slug` | OutletDetails | SaaS slug-based (primary) |
| `/outlet/:id` | OutletDetails | Legacy id-based |
| `/cart` | Cart | Cart view + promo |
| `/checkout` | Checkout | Address + payment + place order |
| `/tracking/:orderId` | Tracking | Real-time status |
| `/profile` | Profile | User + wallet + addresses |
| `/orders` | Orders | Order history |
| `/login` | Login | Google sign-in |
| `*` | NotFound (404) | Catch-all |

## Theme Engine (theme.ts)
- Runtime CSS custom properties via `applyTheme(config)`
- Default palette: primary (Forest Green 160-91%-20%), secondary (Amber 38-92%-50%)
- SaaS-ready: future `fetch(/api/business/:id/theme)` support
- Fonts: Plus Jakarta Sans (body), Syne (headings)

## Firebase (lib/firebase.ts)
- **Config**: Hardcoded in source (convenience over security)
- **Auth**: GoogleAuthProvider with `signInWithPopup` + `signInWithRedirect`
- **Database**: Firebase Realtime Database (no Firestore)
- **Analytics**: Conditional `getAnalytics` (server-side guard)

## Path Structure
- `@/*` → `./src/*` (Vite + tsconfig alias)
- `@config/*` → `../config/*`

## Key Libraries
- **Router**: wouter (2KB, no hash)
- **State**: React Context + useReducer (no Redux/Zustand)
- **Server state**: @tanstack/react-query (TanStack Query)
- **Forms**: react-hook-form + zod + @hookform/resolvers
- **UI**: shadcn/ui styled Radix primitives (~65 components)
- **Icons**: lucide-react + react-icons
- **Animations**: framer-motion
- **Toasts**: sonner + shadcn/ui Toaster
- **Carousel**: embla-carousel-react
- **Date**: date-fns + react-day-picker
- **Charts**: recharts
