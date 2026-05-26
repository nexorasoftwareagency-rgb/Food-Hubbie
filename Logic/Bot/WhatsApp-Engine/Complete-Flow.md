# WhatsApp Engine (whatsapp-engine.js) — Complete Flow

## State Machine Diagram

```
                         ┌──────────────────────────┐
                         │         START             │
                         │ (OUTLET_ID === 'GLOBAL'?) │
                         └────────┬─────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │ GLOBAL mode │             │ Single outlet
                    ▼             │             ▼
          DISCOVERY_LOCATION       │         showMenu()
          (Share Location)         │           │
                    │              │           ▼
                    ▼              │        CATEGORY
          DISCOVERY_CATEGORY       │           │
          (Pick category)          │           ▼
                    │              │         DISH
                    ▼              │           │
          SELECT_OUTLET ───────────┘           ▼
          (Pick outlet)                    SIZE
                    │                        │
                    ▼                        ▼
              showMenu() ────────────>   QUANTITY
                    │                        │
                    ▼                        ▼
              CATEGORY ◄────────────    CART_VIEW
                    │                        │
                    ▼                        ▼
              DISH ◄─────────────────  REUSE_PROFILE?
                    │                  (if profile exists)
                    ▼                        │
              SIZE ◄───────────────    ┌────┴────┐
                    │                  │ YES     │ NO
                    ▼                  ▼         ▼
              QUANTITY           LOCATION   COLLECT_NAME
                    │              request       │
                    ▼                           ▼
              CART_VIEW ◄──────────    COLLECT_PHONE
                    │                      │
                    ▼                      ▼
              COLLECT_NAME ◄─────   COLLECT_ADDRESS
                    │                      │
                    ▼                      ▼
              COLLECT_PHONE ◄─────    LOCATION (share)
                    │                      │
                    ▼                      ▼
              COLLECT_ADDRESS ◄───  CONFIRM_PAY
                    │                 (Summary)
                    ▼                      │
              LOCATION (share)        ┌────┴────┐
                    │                 │ 1       │ 2
                    ▼                 ▼         ▼
            CONFIRM_PAY         ORDER       back to
            (Summary)        PLACED ✅     CATEGORY
                    │
              ┌─────┴──────┐
              │ 1          │ 2
              ▼            ▼
         ORDER         back to
       PLACED ✅     CATEGORY
```

## Global Discovery Flow (OUTLET_ID=GLOBAL)

```
User shares location
  → Scan all businesses/outlets within 10km
  → Aggregate categories across nearby outlets
  → Show "What would you like to order?" (categories)
  → User picks category
  → Show shops serving that category (sorted by distance)
  → User picks shop
  → Enter shop menu (same as single-outlet flow from here)
```

## Checkout & Order Placement

```
1. User confirms order (CONFIRM_PAY, option 1)
2. Create orderId: FH-{Date.now()}-{random 4 digits}
3. Build order object with all collected data
4. Write to Firebase: businesses/{bid}/outlets/{oid}/orders/{orderId}
5. Save/update user profile (customers/{phone})
6. Send success message with order summary
7. Log audit: BOT_ORDER_PLACED
8. Clear cart, reset step to CATEGORY
```
