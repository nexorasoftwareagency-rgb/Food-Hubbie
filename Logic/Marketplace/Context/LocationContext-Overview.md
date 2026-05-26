# LocationContext — Overview

## Purpose
Manages browser geolocation and reverse geocoding via Nominatim (OpenStreetMap).

## State
| Field | Type | Description |
|---|---|---|
| `coords` | `{ lat, lng } \| null` | Current GPS coordinates |
| `address` | `string \| null` | Reverse-geocoded address |
| `permissionStatus` | `"prompt" \| "granted" \| "denied"` | Geolocation permission state |

## Key Function
`requestLocation()` — called by user action (not automatic):
1. Checks `"geolocation" in navigator`
2. Calls `getCurrentPosition()` with `enableHighAccuracy: true` (20s timeout, 60s maxAge)
3. On timeout → retries with `enableHighAccuracy: false` (20s timeout, 300s maxAge)
4. On success → stores coords, calls Nominatim reverse geocode API (10s timeout with AbortController)
5. On failure → sets `permissionStatus: "denied"`
6. Address parse: splits `display_name` by comma, takes first 3 parts; falls back to `"Area: lat, lng"`

## Design Decisions
- **Not auto-requested** — user must tap Allow/Detect button (respects privacy)
- **Dual accuracy strategy** — high accuracy first, timeout fallback to low (mobile-friendly)
- **Nominatim OSM** — free, no API key needed
- **AbortController** — prevents hanging requests on slow networks
- **No polling** — location fetched once; user must re-request for updates

## Points
- Nominatim has 1 req/second rate limit (not enforced client-side)
- Address string is not structured (no street/city/state breakdown)
- Permission denied silently — user sees "Detecting location..." indefinitely
- No `watchPosition` — location is a snapshot, not real-time
