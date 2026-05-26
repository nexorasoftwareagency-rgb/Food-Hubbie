# Rider App — Location Tracking Overview

## GPS Implementation
Uses browser `navigator.geolocation.watchPosition()` for continuous location tracking.

## Configuration
| Setting | Value |
|---|---|
| Update interval | Every 10 seconds (via watchPosition) |
| High accuracy | `enableHighAccuracy: true` |
| Timeout | 10 seconds |
| Max age | 5 seconds (accept cached position within 5s) |

## Data Written
```javascript
// Every 10 seconds to:
riders/{uid}/location
{
  lat: 28.6128,        // GPS latitude
  lng: 77.2295,        // GPS longitude
  timestamp: 1712345678901,  // Epoch ms
  heading: 180,         // Compass direction (degrees)
  speed: 25.5           // Speed in km/h
}

// Also updates:
riders/{uid}/lastSeen = Date.now()  // Heartbeat
```

## Initialization
```
initLocationTracking(uid):
  1. Check navigator.geolocation availability
  2. If denied → show "Enable location" persistent banner
  3. If granted → watchPosition(success, error, options)
  4. Success callback:
     a. Write location to Firebase
     b. Update lastSeen
     c. Update cached riderLat/riderLng in memory
     d. Trigger proximity checks for active trip
  5. Error callback:
     a. Watch timeout → use last known
     b. Permission denied → show error
     c. Position unavailable → show "GPS weak" warning
```

## onDisconnect Handler
```javascript
// Set when rider goes online:
db.ref(`riders/${uid}/status`).onDisconnect().set("offline");
db.ref(`riders/${uid}/lastSeen`).onDisconnect().set(Date.now());

// Removed on explicit logout
```

## Proximity Checks (using location)
| Check | When | Radius |
|---|---|---|
| Accept order | Before accepting | ≤ 1km from outlet |
| Reached outlet | Slide action step 1 | ≤ 1km from outlet |
| Pickup order | Slide action step 2 | ≤ 300m from outlet |
| Reached drop | Slide action step 3 | ≤ configurable drop radius |

## Distance Calculation
```javascript
window.getDistance(lat1, lng1, lat2, lng2):
  → Haversine formula
  → Returns distance in km (1 decimal)
  → Used for proximity gates
```

## Edge Cases
| Scenario | Handling |
|---|---|
| GPS denied | Show banner, disable all proximity-gated actions |
| GPS timeout | Use last known position, retry |
| App backgrounded | watchPosition continues (battery impact) |
| On trip + GPS lost | Last known location, retry every 5s |
| Multiple tabs | Each tab writes own location (last write wins) |
