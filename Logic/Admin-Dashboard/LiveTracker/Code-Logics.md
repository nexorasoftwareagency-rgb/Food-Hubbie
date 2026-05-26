## Code-Logics.md

LiveTrackerPage (App.jsx lines 1195-1242):

- **Props**: `{ showToast }`
- **State**: online (rider count)
- **Effect**:
  - Dynamic `import("leaflet")` — tries to load Leaflet library
  - If successful: initialize map (`L.map("livemap")`), add OpenStreetMap tile layer
  - `onValue(ref(db, "riders"))` — for each rider with location: add marker with rider name popup, track online count
  - If failed: show nothing (map area empty)
- **Renders**: heading showing "X Riders Online", full-height map container div (`<div id="livemap" style="height:500px">`)
