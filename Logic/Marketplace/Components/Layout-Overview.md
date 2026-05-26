# Layout Components — Overview

## AppLayout
- Wraps all page content with TopNav, BottomNav, and FloatingCart
- Checks `isCheckoutOrTracking` to hide nav bars during checkout/tracking flows
- Implements pull-to-refresh via framer-motion gesture handlers
- Responsive: BottomNav visible on mobile, hidden on desktop

## TopNav
- Left: Back button (conditional), menu icon, or brand logo
- Center: Page title or search bar (context-dependent)
- Right: Cart icon with badge count, profile avatar
- Search bar expands on focus, collapses on blur

## BottomNav
- 4 fixed tabs: Home, Search, Orders, Profile
- Active tab highlighted with primary color
- Cart badge overlay on Home tab
- Uses wouter `useLocation()` for active detection

## Points
- BottomNav hidden on `/checkout` and `/tracking/*` for distraction-free flow
- TopNav back button uses wouter's `useLocation()` (not browser history)
- FloatingCart visible when cart has items and not on checkout/tracking pages
- Pull-to-refresh triggers full page reload of current route data
