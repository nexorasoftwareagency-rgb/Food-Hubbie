# Shared — Database Structure

## Firebase Realtime Database — Complete Node Reference

---

## Root Level

```
/
├── admins/                          # Admin user accounts
│   └── {uid}/
│       ├── email: "admin@example.com"
│       ├── businessId: "biz_001"
│       ├── outletId: "outlet_pizza"
│       ├── outletName: "Pizza Hub"
│       ├── outletAddress: "123 Main St, City"
│       ├── fcmToken: "..."          # Firebase Cloud Messaging token
│       └── role: "admin"
│
├── businesses/                       # All businesses (SaaS multi-tenant root)
│   └── {businessId}/
│       ├── name: "Foodhubbie Inc."
│       ├── outlets/
│       │   └── {outletId}/
│       │       ├── name: "Pizza Hub Downtown"
│       │       ├── address: "123 Main St"
│       │       ├── phone: "+919876543210"
│       │       ├── orders/          # All orders for this outlet
│       │       │   └── {orderId}/
│       │       │       ├── orderId: "20260525-0001"
│       │       │       ├── customerName: "John"
│       │       │       ├── phone: "9876543210"
│       │       │       ├── cart: [{ id, name, size, price, qty, addons }]
│       │       │       ├── subtotal: 500
│       │       │       ├── discount: 25
│       │       │       ├── tax: 23.75
│       │       │       ├── total: 498.75
│       │       │       ├── paymentMethod: "Cash" | "UPI" | "Card"
│       │       │       ├── status: "Placed" | "Confirmed" | "Preparing" | "Cooked" | "Ready" | "Out for Delivery" | "Reached Drop Location" | "Delivered" | "Cancelled"
│       │       │       ├── type: "Dine-in" | "Takeaway" | "Delivery"
│       │       │       ├── notes: "No onions"
│       │       │       ├── riderId: "rider_abc"      # Assigned rider
│       │       │       ├── riderName: "Ramesh"
│       │       │       ├── deliveryAddress: "456 Oak St"
│       │       │       ├── deliveryLat: 28.6139
│       │       │       ├── deliveryLng: 77.2090
│       │       │       ├── otp: "4829"                # Delivery OTP
│       │       │       ├── createdAt: "2026-05-25T10:30:00.000Z"
│       │       │       ├── updatedAt: 1716624200000
│       │       │       └── outletAddress: "123 Main St"  # Outlet address at time of order
│       │       │
│       │       ├── dishes/           # Menu items
│       │       │   └── {dishId}/
│       │       │       ├── name: "Butter Chicken"
│       │       │       ├── category: "North Indian"
│       │       │       ├── price: 280
│       │       │       ├── image: "https://..."
│       │       │       ├── order: 0                  # Display ordering
│       │       │       ├── stock: 50                 # Numeric stock quantity
│       │       │       ├── threshold: 5              # Low stock warning threshold
│       │       │       ├── sizes: { "Half": 180, "Full": 280 }
│       │       │       ├── addons: { "Extra Cheese": 30 }
│       │       │       └── veg: true | false
│       │       │
│       │       ├── categories/       # Menu categories
│       │       │   └── {catId}/
│       │       │       ├── name: "North Indian"
│       │       │       ├── order: 0
│       │       │       └── addons: { "Extra Gravy": 30 }
│       │       │
│       │       ├── metadata/         # Outlet-level counters
│       │       │   └── orderSequence: 42
│       │       │
│       │       ├── inventory/        # Raw ingredient tracking
│       │       │   └── {itemId}/
│       │       │       ├── name: "Chicken (kg)"
│       │       │       ├── stock: 12
│       │       │       ├── threshold: 5
│       │       │       └── unit: "kg"
│       │       │
│       │       ├── botUsers/         # WhatsApp user profiles
│       │       │   └── {phone}/
│       │       │       ├── name: "John"
│       │       │       ├── phone: "9876543210"
│       │       │       ├── address: "456 Oak St"
│       │       │       ├── lat: 28.6139
│       │       │       ├── lng: 77.2090
│       │       │       └── orders: [...]
│       │       │
│       │       └── settings/         # Outlet settings
│       │           ├── openTime: "11:00"
│       │           ├── closeTime: "23:00"
│       │           ├── deliveryRadius: 10
│       │           └── feeStructure: [{ upToKm: 3, fee: 30 }, ...]
│       │
│       └── metadata/                # Business-level metadata
│           └── ...
│
├── riders/                           # Rider profiles
│   └── {riderId}/
│       ├── name: "Ramesh"
│       ├── phone: "9876543210"
│       ├── jid: "919876543210@s.whatsapp.net"
│       ├── status: "online" | "busy" | "offline"
│       ├── fcmToken: "..."
│       ├── currentLat: 28.6139
│       ├── currentLng: 77.2090
│       └── assignedOrders: { "20260525-0001": true }
│
├── riderStats/                       # Rider performance stats
│   └── {riderId}/
│       ├── totalDeliveries: 150
│       ├── rating: 4.5
│       └── earnings: 25000
│
├── bot/                              # Bot configuration and data
│   └── {businessId}/
│       └── {outletId}/
│           ├── config/
│           ├── sessions/
│           └── commands/
│
├── superAdmin/                       # Super admin management
│   └── {uid}/
│       ├── email: "super@example.com"
│       └── permissions: { createBusiness: true, ... }
│
├── platformConfig/                   # Global platform settings
│   ├── appVersion: "1.0.0"
│   └── maintenanceMode: false
│
└── logs/                             # System logs
    └── {logId}/
        ├── timestamp: "..."
        ├── level: "info" | "error"
        ├── message: "..."
        └── data: { ... }
```

---

## Order Status Flow

```
Placed → Confirmed → Preparing → Cooked → Ready → Out for Delivery → Reached Drop Location → Delivered
                                                                    ↘ Cancelled (any time)
```

## Status Labels & Colors

| Status | Label | Color | Background |
|---|---|---|---|
| Placed | Placed | #f59e0b | #fef3c7 |
| Confirmed | Confirmed | #3b82f6 | #dbeafe |
| Preparing | Preparing | #8b5cf6 | #ede9fe |
| Cooked | Cooked | #06b6d4 | #cffafe |
| Ready | Ready | #0ea5e9 | #e0f2fe |
| Out for Delivery | Out for Delivery | #f36b21 | #ffedd5 |
| Reached Drop Location | Reached Drop | #f97316 | #fff7ed |
| Delivered | Delivered | #22c55e | #dcfce7 |
| Cancelled | Cancelled | #ef4444 | #fee2e2 |
