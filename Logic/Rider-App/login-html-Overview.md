# Rider App — login.html Overview

## File
- **login.html** — 172 lines
- Legacy standalone login page, separate from the SPA's inline `#auth-section` in `index.html`

## Purpose
Provides an alternative authentication entry point. While `index.html` has its own inline `#auth-section` (hidden by default, shown when user is logged out), `login.html` serves as a standalone page that can be linked directly.

## CSS
In addition to `style.css`, login.html has 132 lines of inline `<style>`:
- `.login-page` — Full-viewport gradient background (`linear-gradient(135deg, #FF5200, #FF2E00)`)
- `.login-card` — White card, `border-radius: 32px`, orange shadow glow
- `.login-logo-box` — Orange-tinted icon container with `border-radius: 24px`
- `.login-card h2` — Large 2rem bold title
- `.input-group` — Label above input with uppercase styling
- `.input-wrapper` — Icon + input layout, icon positioned absolute left
- `.input-wrapper input` — 50px left padding for icon, focus state with primary border + glow ring
- `.error-msg` — Red background error display
- `.hidden` — Utility class

## CSP (Content-Security-Policy)
Extensive CSP header (line 7-8) allowing:
- Scripts: `'self'`, `'unsafe-inline'`, `blob:`, Firebase (`*.firebaseio.com`, `*.firebasedatabase.app`), CDNs (`unpkg.com`, `cdn.jsdelivr.net`, `gstatic.com`, `cdnjs.cloudflare.com`), Google APIs, reCAPTCHA
- Styles: `'self'`, `'unsafe-inline'`, Google Fonts, CDNs
- Fonts: Google Fonts, Cloudflare
- Images: `'self'`, `data:`, `blob:`, all `https://*` and `http://*`, tiles, placeholders, Google User Content
- Media: `'self'`, `blob:`, Mixkit assets
- Frames: reCAPTCHA
- Connect: Firebase realtime DB, Google APIs, Analytics, OpenStreetMap tiles, various CDNs

## HTML Structure
```html
<body class="login-page">
  <div class="login-card">
    <div class="login-logo-box">
      <i data-lucide="zap"></i>
    </div>
    <h2>ROSHANI RIDER</h2>
    <p>Secured Access Portal</p>

    <div class="input-group">
      <label>Mobile Number / Email</label>
      <div class="input-wrapper">
        <i data-lucide="phone"></i>
        <input type="text" id="email" ...>
      </div>
    </div>

    <div class="input-group">
      <label>Access Password</label>
      <div class="input-wrapper">
        <i data-lucide="lock"></i>
        <input type="password" id="password" ...>
      </div>
    </div>

    <button class="btn-primary full-width mt-10" id="loginBtn">
      AUTHENTICATE & START
    </button>
    <p id="loginError" class="error-msg hidden"></p>
    <p class="text-muted text-xtra-small mt-20">
      Contact Admin if you forgot your credentials
    </p>
  </div>
  <script type="module" src="app.js?v=4.6.0"></script>
</body>
```

## Key Differences from SPA Inline Auth
| Aspect | login.html | index.html `#auth-section` |
|---|---|---|
| Styling | Inline CSS + style.css | style.css only |
| Layout | Full-page gradient | Modal/section within SPA |
| URL | `/login.html` | `/#auth-section` |
| Script version | `app.js?v=4.6.0` | `app.js?v=4.7.1` |
| Icon library | Lucide via CDN | Lucide via CDN (same) |
| Font | Outfit via Google Fonts | Outfit via Google Fonts (same) |

## Dependencies
- `style.css` — Shared stylesheet
- `manifest.json` — PWA manifest (for install prompt on this page)
- `https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900` — Outfit font
- `https://cdn.jsdelivr.net/npm/lucide@0.344.0/dist/umd/lucide.min.js` — Lucide icons
- `app.js?v=4.6.0` — Auth logic (uses same Firebase auth SDK)

## Usage Context
- **Likely legacy** — The newer SPA has `#auth-section` built into `index.html`
- Might be used for direct linking from admin dashboard rider creation emails
- Could be phased out in favor of SPA's inline auth
- Script version `4.6.0` vs SPA's `4.7.1` suggests it's not updated with the latest changes
