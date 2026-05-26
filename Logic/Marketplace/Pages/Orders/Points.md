# Orders Page — Points

- localStorage key: `foodhubbie_orders` (JSON array of orders)
- No pagination — all orders loaded at once
- Reorder button currently just links to outlet (no cart pre-fill)
- Guest users have empty order history
- Order status not updated in real-time (refreshed on page mount via OrderContext)
