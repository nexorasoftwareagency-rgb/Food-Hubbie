# Home View — Code Logics

## Purpose
Dashboard landing view after login. Shows rider greeting, today's performance stats, and active delivery card.

## Key Functions (app.js)
| Function | Trigger | Action |
|---|---|---|
| `showDashboard()` | View init | Fetches rider profile, today's stats |
| `window.requestActiveOrder()` | Auto | Looks for current assigned order |
| `renderStats()` | Data loaded | Populates delivered count, on-time %, earnings, rating |

## DOM Elements
| Element | Purpose |
|---|---|
| `#riderPhoto` | Profile image |
| `#riderName` | Rider name |
| `#riderGreeting` | "Good Morning/Afternoon/Evening" |
| `#todayDelivered` | Count of today's deliveries |
| `#onTimePercent` | On-time delivery percentage |
| `#todayEarnings` | Today's earnings amount |
| `#riderRating` | Average rating |
| `#activeDeliveryCard` | Card showing current trip (if any) |
| `#statsContainer` | Stats grid container |

## Data Flow
```
onAuthStateChanged → getRiderProfile(uid) →
  populate riderPhoto, riderName, riderGreeting
  → fetchTodayStats(uid) → renderStats()
  → fetchCurrentOrder(uid) → show/hide activeDeliveryCard
```

## Edge Cases
- **No orders today** → stats show 0, no active card
- **Rider in middle of delivery** → activeDeliveryCard shows current trip with tap to sec-active
- **Profile photo missing** → shows fallback avatar initials
- **Network error** → cached profile from localStorage
