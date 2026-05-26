# not-found Page — Overview

## Purpose
Catch-all 404 page for undefined routes.

## Behavior
- Rendered for any route not matching the 11 defined paths
- Shows "Page not found" message with illustration
- "Go Home" button → navigates to `/`
- No Firebase interaction

## Design
- Centered layout with large icon/illustration
- Subtle animation (Framer Motion)
- Simple text: "Oops! This page doesn't exist"

## Points
- Does NOT check if the route is a valid outlet/order that happens to not exist — purely for undefined paths
- No analytics tracking for 404s
