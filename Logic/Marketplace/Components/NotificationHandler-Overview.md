# Marketplace — NotificationHandler Overview

## File
`src/components/notifications/NotificationHandler.tsx` (40 lines)

## Purpose
Real-time broadcast listener from Firebase. Renders nothing — only triggers sonner toasts.

## Implementation
```tsx
export function NotificationHandler() {
  const { user } = useAuth();

  useEffect(() => {
    listenForBroadcasts((broadcast) => {
      let shouldShow = false;

      if (broadcast.audience === "all") {
        shouldShow = true;
      } else if (broadcast.audience === "new_users") {
        const isNew = user && (Date.now() - Date.parse(user.createdAt)) < 24 * 60 * 60 * 1000;
        if (isNew) shouldShow = true;
      } else if (broadcast.audience === "inactive_users") {
        shouldShow = true;  // Simplified — no order history check
      }

      if (shouldShow) {
        toast(broadcast.title, {
          description: broadcast.body,
          duration: 10000,
          action: broadcast.imageUrl ? {
            label: "View Offer",
            onClick: () => console.log("Image clicked:", broadcast.imageUrl)
          } : undefined
        });
      }
    });
  }, [user]);

  return null;
}
```

## Broadcast Schema
| Field | Type | Description |
|---|---|---|
| `audience` | `"all" \| "new_users" \| "inactive_users"` | Target segment |
| `title` | string | Toast title |
| `body` | string | Toast description |
| `imageUrl?` | string | Optional offer image |

## Points
- Listens on `system/broadcasts` via Firebase `onValue`
- Audience filtering is client-side (all broadcasts visible in Firebase)
- `inactive_users` always shows (no actual order recency check)
- "View Offer" action only logs to console — no navigation implemented
- Toast duration: 10 seconds
- Renders `null` — invisible component
