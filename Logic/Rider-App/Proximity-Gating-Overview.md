# Rider App — Proximity Gating Overview

## Purpose
Ensure riders physically arrive at required locations before performing delivery actions. Prevents fraud and incorrect status updates.

## Configuration Source
`businesses/{b}/outlets/{o}/settings/Delivery`
| Setting | Default | Used For |
|---|---|---|
| `acceptRadius` | 1000 (1km) | Accept order gate |
| `pickupRadius` | 300 (meters) | Pickup action gate |
| `dropRadius` | 300 (meters) | Reached drop gate |

## Gates

### Gate 1: Accept Order (1km)
```
Before: Rider taps "Accept" on available order
Check: getDistance(rider, outlet) ≤ acceptRadius
If pass: Proceed with acceptOrder transaction
If fail: "Too far from outlet. Move closer (need within 1km)"
```

### Gate 2: Reached Outlet (1km)
```
Before: Slide-to-action "REACH OUTLET" completes
Check: getDistance(rider, outlet) ≤ acceptRadius (same 1km)
If pass: Mark arrivedAtRestaurantAt
If fail: "Move closer to the outlet"
```

### Gate 3: Pickup (300m)
```
Before: Slide-to-action "PICK UP" completes
Check: getDistance(rider, outlet) ≤ pickupRadius
If pass: Update status to "Out for Delivery"
If fail: "You need to be within 300m of the outlet to pick up"
```

### Gate 4: Reached Drop (300m or configurable)
```
Before: Slide-to-action "REACH CUSTOMER" completes
Check: getDistance(rider, customerAddress) ≤ dropRadius
If pass: Open OTP panel
If fail: "Move closer to the delivery location"
```

## Implementation
```javascript
window.canProceedAction(actionType, targetLat, targetLng):
  const distance = getDistance(currentLat, currentLng, targetLat, targetLng);
  const radius = getProximityRadius(actionType); // Reads from outlet settings
  if (distance <= radius) return { allowed: true, distance };
  return { allowed: false, distance, required: radius };
```

## Distance Display
- Distance shown on order cards and active trip view
- Color-coded: green (walking), orange (short drive), red (too far)
- Updated in real-time as rider location changes

## Edge Cases
| Scenario | Handling |
|---|---|
| GPS off | All gates reject with "Enable GPS" prompt |
| Invalid outlet coords | Show "Location data unavailable" |
| Radius = 0 | Gate disabled (allow any distance) |
| Rider moves mid-slide | Re-check proximity on slide completion |
| Multiple outlets | Each order checks against its specific outlet |
