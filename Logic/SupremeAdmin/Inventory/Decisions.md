# Inventory — Decisions

1. **One-time read (not listener)**: Unlike most other tabs, Inventory does a once() read rather than on() listener. Data is static until page refresh. This is appropriate for inventory management (less real-time than orders).

2. **Transaction-based stock update**: Uses Firebase transaction for atomic stock adjustments. Prevents race conditions when multiple admins adjust stock simultaneously.

3. **Gated to 0 minimum**: Stock transaction guards against negative stock. If current stock is 0 and delta is -1, the transaction cancels.

4. **No stock threshold alerts**: No visual indicator when stock is low. Admin must scan the table.

5. **Flat menu structure**: All dishes under /menu/{dishId} with no sub-categories. Categories are a string field, not a sub-path.

6. **No batch operations**: Each dish stock adjustment or availability toggle is a separate write. No multi-select or bulk update.

7. **No add/delete dish**: Admin can only adjust stock and toggle availability. Creating or removing dishes is not supported.
