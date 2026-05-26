# Marketplace — deliveryFee Utility Overview

## File
`src/lib/deliveryFee.ts` (46 lines)

## Functions

### `calcDeliveryFee(distanceKm, config): number`
Calculates delivery fee based on distance and fee configuration.

**Two modes:**
| Mode | Calculation | Example |
|---|---|---|
| `per_100m` | `ceil(distance × 10) × per100mRate` | 3.5km at ₹2/100m = 35 × 2 = ₹70 |
| `slabs` | First matching bracket | 3km with slabs [{2km: ₹20}, {5km: ₹40}] = ₹40 |

### `deliveryFeeLabel(fee): string`
Returns `"FREE"` if fee is 0, otherwise `"₹{fee}"`.

## Default Config (fallback)
```ts
{
  mode: "slabs",
  slabs: [
    { upToKm: 2, fee: 20 },
    { upToKm: 5, fee: 40 },
    { upToKm: 8, fee: 60 },
    { upToKm: 12, fee: 80 },
  ]
}
```

## Usage
Used by `OutletDetails` (display), `Cart` (summary), `Checkout` (final calc), and `cartService.calcCartSummary`.

## Points
- Slabs sorted by distance ascending before checking
- Falls back to highest slab fee if distance exceeds all slabs
- No minimum fee or free delivery threshold — handled in Cart page (₹499 logic)
- `per_100m` mode rounds UP to nearest 100m (ceil)
