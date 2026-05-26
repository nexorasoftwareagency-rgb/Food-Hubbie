## Code-Logics.md

CategoriesPage (App.jsx lines 619-672):

- **Props**: `{ showToast }`
- **State**: cats:[], showForm (boolean), name:"", order:"", img:""
- **Effect**: `onValue(Outlet("categories"))` → cats array with id spread
- **Handlers**:
  - `handleSave()` — `push(Outlet("categories"), { name, image:img, order:Number(order), addons:null })`
  - `handleDelete(id)` — `remove(Outlet("categories/{id}"))`
- **Renders**: category list (image thumbnail, name, serial number, addon count indicator, delete button), modal form (name input, image URL input, display order input, Save button)
- No edit functionality — only Add and Delete
