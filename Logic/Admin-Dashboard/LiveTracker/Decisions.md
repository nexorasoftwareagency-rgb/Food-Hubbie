## Decisions.md

- Dynamic import for Leaflet — avoids bundle size penalty if map not needed
- No Leaflet fallback UI — if import fails, map area is just empty
- Riders tracked via Firebase real-time listener — markers update automatically
- OpenStreetMap tiles used (free, no API key required)
