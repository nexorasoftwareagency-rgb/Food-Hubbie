# Onboarding Tab — Code Logics

## Purpose
Partner approval queue with real-time request monitoring and manual infrastructure provisioning.

## Key Functions (main.js)
| Function | Trigger | Action |
|---|---|---|
| `initOnboardingManager()` | Tab load | Real-time listener on `onboarding_requests`, render table |
| `renderOnboardingRequests(requests)` | Data ready | Build request table with approve/reject buttons |
| `approvePartner(uid)` | Approve button | Atomic provisioning pipeline |
| `rejectPartner(uid)` | Reject button | Remove request + optional archive |
| `showOnboarding()` | Header button | Navigate to onboarding tab + scroll to form |
| Onboarding form submit | Form submit | Manual business/outlet/admin creation |

## Data Sources
| Path | Listener | Purpose |
|---|---|---|
| `onboarding_requests` | `on('value')` | Real-time request list |
| `onboarding_requests/{uid}` | Read/Write | Individual request processing |

## Render Flow
```
initOnboardingManager():
  1. db.ref('onboarding_requests').on('value', (snap) => {
       requests = snap.val() || {}
       pending = filter(requests, r => r.status === 'pending')
       #pendingCount = pending.length
       #onboardingTableBody.innerHTML = table rows
       lucide.createIcons()
     })
```

## approvePartner Pipeline
```
approvePartner(uid):
  1. Read onboarding_requests/{uid}
  2. Extract: name, email, phone, businessName, businessSlug,
     outletName, outletSlug, address, lat, lng
  3. Create Firebase Auth account via secondaryAuth.createUser({ email, password })
  4. Multi-path atomic update:
     ├─ businesses/{bid}.set({ name, commission, phone, address, createdAt })
     ├─ businesses/{bid}/outlets/{oid}.set({ name, slug, address, lat, lng, email, phone, password })
     ├─ system/admins/{newUid}.set({ email, role: 'business', name, phone, password })
     ├─ businesses/{bid}/outlets/{oid}/categories.set(defaultCategories)
     └─ slugs/outlets/{slug}.set({ bid, oid })
  5. Archive: onboarding_history/{uid}.set(request data)
  6. Cleanup: onboarding_requests/{uid}.remove()
  7. Audit log: atomicAdminAction(updates, 'PARTNER_APPROVED')
  8. Toast: "Partner provisioned successfully"
```

## Manual Provisioning Form
| Field | ID | Validation |
|---|---|---|
| Business Name | `#bizName` | Required |
| Business Slug | `#bizId` | Required, no spaces |
| Outlet Name | `#outletName` | Required |
| Outlet ID | `#outletId` | Required, no spaces |
| Outlet Slug | `#outletSlug` | Required, kebab-case |
| Address | `#outletAddress` | Required |
| Latitude | `#outletLat` | Required, number |
| Longitude | `#outletLng` | Required, number |
| Admin Email | `#adminEmail` | Required, email format |
| Admin Phone | `#adminPhone` | Required, 10 digits |
| Admin Password | `#adminPass` | Required, min 6 chars |

## Edge Cases
- **Duplicate slug** → Atomic write fails, rollback, error toast
- **Email already in use** → secondaryAuth.createUser throws → show error
- **No pending requests** → Empty table state "No pending partner requests"
- **Network failure mid-provisioning** → Some paths may partially write (no transactional rollback)
- **Form validation** → HTML5 `required` + JS validation before submit
