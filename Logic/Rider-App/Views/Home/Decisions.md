# Home View — Decisions

## Design Decisions
1. **Greeting based on time of day** — Enhances UX, simple `getHours()` switch
2. **Stats fetched on every view show** — Ensures fresh data, acceptable latency for dashboard
3. **Active delivery card on dashboard** — Gives rider immediate access to current trip without navigating sidebar
4. **Skeleton loading** — Placeholder shimmer while Firebase query completes
5. **Initials fallback for photo** — No broken images; extracts first letter of name
6. **Offline fallback** — Shows last cached stats from localStorage if Firebase unavailable
7. **Stats grid** — 4-card layout (Delivered, On-Time, Earnings, Rating) for quick glance
