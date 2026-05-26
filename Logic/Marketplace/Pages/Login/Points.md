# Login Page — Points

- Sign-in redirects away from the app — user returns via `getRedirectResult`
- No phone auth means no SMS delivery for order updates (WhatsApp only)
- Profile auto-created with minimal fields; user fills remaining in Profile page
- No email verification flow
- No multi-tenant auth (all users share one Firebase project)
