# Dashboard Tab — Database Structure

## KPI Data Sources
`businesses/{bid}`
- `name` — Business name
- `isActive` — Status
- `outlets/{oid}` — Nested outlets
- `outlets/{oid}/orders/{orderId}` — Orders

`users/{uid}`
- Counted for #countCustomers

## Computed Values
| KPI | Formula |
|---|---|
| Business Entities | `Object.keys(businesses).length` |
| Operational Nodes | Sum of `Object.keys(biz.outlets||{}).length` per business |
| Platform Throughput | Orders where `order.timestamp` >= today 00:00 IST |
| Total Customers | `Object.keys(users).length` |

## Heatmap Structure
```
{
  "Mon": { 6: 0, 7: 0, ..., 23: 0 },
  "Tue": { 6: 0, 7: 0, ..., 23: 0 },
  ...
}
```
Day-of-week × hour-of-day order count matrix. Built client-side from orders data.
