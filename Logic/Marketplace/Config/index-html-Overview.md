# Marketplace Config — index.html Overview

## File
`Marketplace/index.html`

## Structure
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#1A3D2B" />
  <meta name="mobile-web-app-capable" content="yes" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <title>Foodhubbie — Food Delivery</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

## Key Elements
| Element | Purpose |
|---|---|
| `theme-color` | #1A3D2B (Forest Green) for browser chrome |
| `mobile-web-app-capable` | Full-screen mode on iOS |
| Google Fonts preconnect | Performance optimization |
| `Plus Jakarta Sans` + `Syne` | Body + heading fonts |

## Points
- No PWA manifest link (described as PWA in package.json but manifest not yet configured)
- No service worker registration
- Fonts loaded from Google Fonts CDN (requires internet)
- No inline scripts or preload hints
