# Broadcast Tab — Database Structure

## Broadcast
`system/broadcasts/{key}`
| Field | Type | Description |
|---|---|---|
| `title` | string | Notification title |
| `body` | string | Notification body |
| `audience` | string | Target segment |
| `category` | string | Category label |
| `image` | string/null | Optional image URL |
| `sentBy` | string | Admin UID |
| `sentAt` | number | Send timestamp |
| `stats/sent` | number | Delivery count |

## Computed Stats (client-side)
| Stat | Formula |
|---|---|
| Total Sent | Count of broadcast keys |
| This Week | Count where `sentAt` >= start of current week |
