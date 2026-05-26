# Bot Status Monitor (status-monitor.js) — Database Structure

## Orders (read)
Full schema in `Logic/Admin-Dashboard/04-Database-Structure.md` — fields used by bot:
| Field | Used For |
|---|---|
| `orderId` | Identification |
| `status` | Status transition detection |
| `riderId` / `assignedRider` | Rider assignment notification |
| `riderName` / `riderPhone` | "Out for Delivery" message |
| `customerName` | Admin notification |
| `phone` / `whatsappNumber` | Customer WhatsApp JID |
| `otp` / `deliveryOTP` | Delivery verification |
| `cart` / `items` | Invoice in messages |
| `total` | Total display |
| `lat` / `lng` | Maps link |
| `address` | Delivery address |
| `paymentMethod` | Payment display |

## Rider Notifications (write)
Path: `riders/{riderId}/notifications/{notifId}`
| Field | Type | Example |
|---|---|---|
| `id` | string | `"NOTIF1748191200000"` |
| `title` | string | `"New Order Assigned"` |
| `body` | string | `"Order #ABC123..."` |
| `type` | string | `"order"` |
| `icon` | string | `"package"` |
| `timestamp` | number (epoch ms) | `1748191200000` |
| `read` | boolean | `false` |
