# Dashboard Tab — Code Logics

## Purpose
Ecosystem overview with KPI cards, order heatmap, and business registry table. Real-time data stream.

## Key Functions (main.js)
| Function | Trigger | Action |
|---|---|---|
| `initStats()` | Tab load / Firebase value | Attach listener to businesses, render KPIs + heatmap + table |
| `renderSparkline(containerId, data)` | Dashboard render | SVG inline sparkline |
| `renderDashboardSparklines()` | Dashboard render | Decorative sparklines for Biz/Outlets/Orders |
| `renderOrderHeatmap(orders)` | Dashboard render | Day-of-week × hour-of-day heatmap table |
| `renderBusinessList(list)` | Data ready | Main dashboard business table |

## Data Sources
| Path | Listener | Frequency |
|---|---|---|
| `businesses` | `on('value')` | Real-time (continuous) |
| `users` | `once('value')` | On load (customer count) |

## KPI Cards (4)
| ID | Label | Data Source |
|---|---|---|
| `#countBusinesses` | Business Entities | Number of keys under businesses |
| `#countOutlets` | Operational Nodes | Sum of outlets across all businesses |
| `#countOrdersToday` | Platform Throughput | Orders with today's date |
| `#countCustomers` | Total Customers | Count of users |

## Order Heatmap
```
renderOrderHeatmap(orders):
  ├─ Build 7×24 grid (days × hours)
  ├─ Day rows: Mon–Sun
  ├─ Hour columns: 0–23 (or 6–23)
  ├─ Each cell: count of orders in that day/hour
  ├─ Color: opacity gradient (light → dark based on count)
  └─ Rendered as HTML table with inline background-color
```

## Business Registry Table
| Column | Data |
|---|---|
| Partner Identity | Business name |
| Admin Authority | Admin email (looked up from system/admins) |
| Scale (Nodes) | Number of outlets |
| Commission Model | Commission % |
| Network Status | Active/Inactive badge |
| Operations | View/Edit buttons |

## Rendering Flow
```
initStats():
  1. db.ref('businesses').on('value', (snap) => {
       allBusinessesList = snap.val()
       Update KPI cards
       buildOrderHeatmap(allBusinessesList)
       renderBusinessList(allBusinessesList)
       renderDashboardSparklines()
       lucide.createIcons()
     })
  2. db.ref('users').once('value', (snap) => {
       #countCustomers.textContent = count
     })
```

## Edge Cases
- **No businesses yet** → KPI cards show 0, heatmap empty, "No businesses" message
- **No orders today** → all KPIs 0, heatmap empty
- **Business with no outlets** → Show 0 nodes, empty state
- **Heatmap no data** → "No order data available" message
- **Firebase value listener high traffic** → Real-time updates on every change
