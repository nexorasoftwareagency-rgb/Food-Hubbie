## Code-Logics.md

DashboardPage (App.jsx lines 268-395):

- **Props**: `{ showToast }` (outletInfo not used)
- **State**: orders:[], riderCount:0, tab:"today"|"week"
- **Effects**:
  - `onValue(Outlet("orders"))` → orders array
  - `onValue(ref(db,"riders"))` → counts riders with status "Online" or "On Delivery"
- **Computed**:
  - `today = new Date().toISOString().split("T")[0]`
  - `todayOrd = orders.filter(o=>o.createdAt && o.createdAt starts with today)`
  - `todayRev = sum of todayOrd where status==="Delivered" total`
  - `pending = count of orders with status Placed/Confirmed/Preparing`
  - `liveOrd = orders in LIVE_ST`
  - `topItems = top 5 {name, qty} from cart items across all orders`
  - `topCusts = top 5 customers by total spend` (aggregated by phone)
  - `priority = liveOrd sorted by urgency weight {Placed:6, Confirmed:5, ..., "Out for Delivery":1}, slice 6`
- **Renders**: 4 StatCards (Today's Revenue with fmt, Pending count, In Progress count, Active Riders count), Revenue Trend chart (AreaChart with toggle Today/Week using WEEK_DATA/PREV_WEEK_DATA), Priority Orders card (live orders list), Top Items list (names + qty), Top Customers list (name + spend), Recent Orders table (last 8 sorted by createdAt)
