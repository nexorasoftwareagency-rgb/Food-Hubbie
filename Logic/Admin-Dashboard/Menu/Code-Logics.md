## Code-Logics.md

MenuPage (App.jsx lines 677-808):

- **Props**: `{ showToast }`
- **State**: dishes:[], cats:[], showForm (modal), editId, f (form fields object with: name, category, price, image, order, stock, threshold, addons), sizeList:[{name, price}], search
- **Effects**:
  - `onValue(Outlet("dishes"))` → dishes
  - `onValue(Outlet("categories"))` → cats
  - Auto-migration: detects `typeof stock === "boolean"` → `update(Outlet("dishes/{id}"), { stock:0, threshold:5 })` — runs on every dishes data change
- **Handlers**:
  - `openForm(d)` — if d exists: populate form with dish data, build sizeList from sizes object; else: reset to defaults {name:"", category:"", price:"", image:"", order:"", stock:"", threshold:5, addons:""}
  - `handleSave()` — validate name+price, build sizes object from sizeList, parse addons JSON (or null), if editId: `update()`, else: `push(Outlet("dishes"), formData)`
  - `handleDelete(id)` — `remove(Outlet("dishes/{id}"))`
- **Renders**: search + "Add Dish" button, dish grid (image, stock badge green/red/orange based on threshold, category tag, name, sizes with prices, edit/delete icons), modal form (name, category select, base price, image URL, display order, stock, threshold, dynamic sizes with Add/Remove, addons JSON textarea)
- Stock badge shows: stock===0 → "Out of Stock" (red), stock<=threshold → "Low Stock" (orange), else → nothing for full stock
- `isLow = d.stock <= (d.threshold || 5)` — threshold defaults to 5
