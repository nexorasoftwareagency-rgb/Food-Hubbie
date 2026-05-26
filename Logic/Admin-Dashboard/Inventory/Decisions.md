# Decisions: InventoryPage

## Why mock data
No real inventory tracking system is connected. Firebase integration is planned for future. Mock data allows UI development and demo without backend dependency.

## Design choices
- **Stock bar relative to threshold** — shows how close to running out (threshold = 100%), not absolute max stock
- **-1 / +5 / +10 buttons** — common kitchen inventory adjustment amounts, no custom input needed
- **Fixed item list** — no add/delete item functionality; items are defined in `MOCK_INVENTORY` constant only
