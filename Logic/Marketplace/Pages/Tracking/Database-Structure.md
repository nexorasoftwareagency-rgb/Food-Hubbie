# Tracking Page — Database Structure

## Order Status Pipeline
```ts
STATUS_PIPELINE = [
  "Placed", "Confirmed", "Preparing", "Cooked", "Ready",
  "Out for Delivery", "Reached Drop Location", "Delivered"
]
// Cancelled is also handled separately
```

## Status Icons
| Status | Icon | Message |
|---|---|---|
| Placed | CheckCircle2 | "Your order has been received." |
| Confirmed | Clock | "The restaurant confirmed your order." |
| Preparing | ChefHat | "The chef is working their magic." |
| Cooked | Flame | "Your food is freshly cooked!" |
| Ready | PackageCheck | "Your order is packed and ready for pickup." |
| Out for Delivery | Bike | "Your rider is on the way!" |
| Reached Drop Location | MapPinCheck | "Rider has arrived at your location!" |
| Delivered | Home | "Enjoy your meal!" |
| Cancelled | CheckCircle2 | (no message) |
