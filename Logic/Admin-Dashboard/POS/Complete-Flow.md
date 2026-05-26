# POS — Complete Flow

## Flow: POS Order — Complete Sale Cycle

See `D:\Foodhubbie\Logic\Admin-Dashboard\06-Complete-Flows.md` Flow 2.

### Step-by-Step

```
1. User navigates to POS (PAGES["pos"] = POSPage)
   │
2. useEffect fires:
   ├── onValue(Outlet("dishes")) → dishes (filtered: stock > 0)
   └── onValue(Outlet("categories")) → cats
   │
3. Page renders left dish grid + right cart sidebar
   │
4. User clicks dish → openSelection(dish):
   ├── Size grid (first size or "Standard")
   ├── Addons list
   ├── Qty selector
   └── "Add to Cart" → addToCart()
   │
5. User edits cart → openEditCartItem(key, item): pre-fills modal, on save removes old + adds new
   │
6. User clicks "Record Sale" → handleCheckout():
   ├── Validate cart, phone, outletId
   ├── Fetch fresh dishes, validate stock
   ├── Generate orderId from metadata/orderSequence
   ├── Compute pricing (subtotal, discVal, taxVal, total)
   ├── Build orderData with status "Confirmed"
   ├── Firebase writes: set order, update sequence, decrement stock
   ├── Print receipt via data:text/html with window.print()
   ├── clearCart() (resets everything except payMethod)
   └── Toast success
```
