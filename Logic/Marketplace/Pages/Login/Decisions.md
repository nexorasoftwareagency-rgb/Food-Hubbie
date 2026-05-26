# Login Page — Decisions

| Decision | Rationale |
|---|---|
| **Google-only sign-in** | Simplest auth flow; no phone OTP infrastructure needed |
| **Redirect (not popup)** | Works on mobile browsers where popups are blocked |
| **Auto-redirect if authenticated** | Logged-in users don't need to see login page |
| **Minimal UI** | Reduces friction; one-tap sign-in |
