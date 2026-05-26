## Points.md

- Leaflet not included in package.json — dynamic import will fail; map area stays empty
- No error handling for Leaflet load failure — silent failure
- Single map instance — no cleanup if page re-mounts
- No rider clustering optimization — all markers rendered individually
- No map center/zoom configuration — uses Leaflet defaults
- No outlet location marker — only rider markers shown
