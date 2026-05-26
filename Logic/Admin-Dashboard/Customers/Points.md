## Points.md

- Customers without phone number are invisible — cannot appear in list
- LTV computed from ALL orders (including cancelled) — may inflate customer value
- Phone format must match between customers and orders for correct aggregation
- No customer creation from POS — POS only writes name/phone to order, not to customers node
- `hasWhatsApp` is computed client-side from phone presence — no actual WhatsApp integration
- Export CSV includes computed fields (orderCount, LTV) — not raw Firebase data
