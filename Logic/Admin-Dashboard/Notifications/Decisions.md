# Decisions: NotificationsPage

## Why mock data
Fake notification sending UI — no actual Firebase Cloud Messaging integration.

## Design choices
- **History stored in local state only** — resets on page refresh
- **Audience dropdown for targeting** — feature placeholder for real FCM implementation
- **Recipient count randomized** — `Math.floor(Math.random() * 490 + 10)` gives fake metric
