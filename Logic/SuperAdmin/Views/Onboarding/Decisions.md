# Onboarding Tab — Decisions

## Design Decisions
1. **Real-time listener on requests** — New partner requests appear instantly without page refresh
2. **Secondary Firebase Auth** — Creating accounts via secondaryAuth prevents admin session logout
3. **Atomic provisioning pipeline** — Single `update()` call for all DB writes (not truly atomic but reduces partial-failure window)
4. **Default categories on creation** — New outlets get starter category set for immediate menu setup
5. **Slug registry** — `slugs/outlets/{slug}` prevents duplicate marketplace URLs
6. **Approval archival** — Request moved to `onboarding_history` rather than deleted, for audit trail
7. **Manual form as fallback** — Allows provisioning outside the request queue (e.g., phone/talked directly)
8. **Plaintext password storage** — Known concern; stored for admin to share with partner (future: password reset flow)
