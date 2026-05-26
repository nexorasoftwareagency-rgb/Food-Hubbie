# Code-Logics: NotificationsPage

**Location**: App.jsx lines 2454-2521

## Props
- `{ showToast }`

## State
- `form` — `{ title: "", body: "", audience: "all" }`
- `sent` — array of sent notification history objects

## Handlers
- `sendNotif()` — pushes fake notification to `sent` history with: id, title, body, audience, timestamp, random recipient count (`Math.floor(Math.random() * 490 + 10)`), then clears form title/body

## Renders
- **Compose form**: title input, body textarea, audience select dropdown (All Customers, Riders, Partners, Staff), Send button
- **Sent history cards**: title, body, audience badge, recipient count, sent time
