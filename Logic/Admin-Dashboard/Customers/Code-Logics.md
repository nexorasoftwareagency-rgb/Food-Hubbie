## Code-Logics.md

CustomersPage (App.jsx lines 1115-1190):

- **Props**: `{ showToast }`
- **State**: customers:[], orders:[], search
- **Effects**:
  - `onValue(Outlet("customers"))` → customer profiles
  - `onValue(Outlet("orders"))` → all orders
- **Computed**:
  - For each customer (keyed by phone): filter orders where `order.phone === phone`, `orderCount = filtered.length`, `ltv = sum(filtered.map(o=>o.total))`
  - `sorted = customers.map(...).sort((a,b)=>b.ltv - a.ltv)`
  - Fields merged: name, phone, joined (registeredAt formatted), orderCount, ltv, hasWhatsApp link
- **Renders**: search input, Export CSV button, customer table (name + joined date, phone with WhatsApp link, orders count, LTV formatted)
- WhatsApp link: `https://wa.me/91{phone}` — Indian country code prefix
- Joined date: `new Date(c.registeredAt).toLocaleDateString()`
