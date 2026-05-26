## Code-Logics.md

SettingsPage (App.jsx lines 1247-1348):

- **Props**: `{ showToast }`
- **State**: tab:"store"|"delivery"|"display", s (store settings object), d (delivery settings object with slabs array)
- **Effects**:
  - `onValue(Outlet("settings/Store"))` → s state
  - `onValue(Outlet("settings/Delivery"))` → d state
- **Store fields**: entityName, storeName, address, gstin, fssai, tagline, poweredBy, wifiName, wifiPass, instagram, facebook, reviewUrl, lat, lng, shopOpenTime, shopCloseTime
- **Delivery fields**: developerPhone, reportPhone, notifyPhone, backupCode, slabs:[{km, fee}]
- **Handlers**:
   - `handleSaveStore()` — validates coords via `validateCoords(lat,lng)`, validates GSTIN via `validateGSTIN(gstin)`, validates FSSAI via `validateFSSAI(fssai)`, writes `set(Outlet("settings/Store"), {...s, updatedAt: new Date().toISOString()})` (uses `set()` to replace entire node)
   - `handleSaveDelivery()` — writes `update(Outlet("settings/Delivery"), {...d, slabs: d.slabs||[]})`
   - `addSlab()` — pushes `{km:0, fee:0}` to d.slabs (numeric values)
   - `updateSlab(index, field, value)` — updates `d.slabs[index][field]` with `Number(value)` coercion
  - `removeSlab(index)` — removes d.slabs[index]
- **Renders**: tab bar (store/delivery/display), store tab: 2-column grid of text inputs + time inputs, delivery tab: phone inputs + backup code + dynamic slab rows (km input + fee input + delete button) + Add Slab + Save, display tab: placeholder text
