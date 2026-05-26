# SuperAdmin — Onboarding Flow

## Overview
Complete partner provisioning pipeline — from request submission through atomic infrastructure creation.

## Request Sources
1. **External partner request** → `onboarding_requests/{uid}` (submitted via partner-facing form)
2. **Manual admin provisioning** → Direct form in SuperAdmin Onboarding tab

## Request Lifecycle

```
1. PARTNER SUBMITS
   ├─ Data: name, email, phone, businessName, businessSlug,
   │        outletName, outletSlug, address, lat, lng
   ├─ Status: "pending"
   └─ Stored: onboarding_requests/{uid}

2. ADMIN REVIEWS
   ├─ Real-time listener shows request in table
   ├─ Columns: Entity/Owner, Email, KYC, Submitted Date, Actions
   └─ Admin can approve or reject

3. APPROVE → ATOMIC PROVISIONING
   ├─ Read request data
   ├─ Generate random password
   ├─ secondaryAuth.createUserWithEmailAndPassword(email, password)
   ├─ Multi-path DB write:
   │   ├─ businesses/{bid}.set({ name, commission: 10, ... })
   │   ├─ businesses/{bid}/outlets/{oid}.set({ name, address, lat, lng, ... })
   │   ├─ businesses/{bid}/outlets/{oid}/categories.set(defaultCategories)
   │   ├─ system/admins/{newUid}.set({ email, role: 'business', ... })
   │   └─ slugs/outlets/{slug}.set({ bid, oid })
   ├─ Archive: onboarding_history/{uid}.set(request)
   ├─ Cleanup: onboarding_requests/{uid}.remove()
   ├─ Audit: atomicAdminAction('PARTNER_APPROVED')
   └─ Toast: "Partner provisioned successfully"

4. REJECT
   ├─ Remove: onboarding_requests/{uid}.remove()
   └─ (Optionally archive with rejected status)
```

## Manual Provisioning
Admin fills form directly with: business name, slug, outlet name/ID/slug, address, lat/lng, admin email/phone/password. Same atomic pipeline as step 3.

## Created Resources Per Onboarding
| Resource | Count | Path |
|---|---|---|
| Firebase Auth Account | 1 | (separate from admin session) |
| Business | 1 | `businesses/{bid}` |
| Outlet | 1 | `businesses/{bid}/outlets/{oid}` |
| Admin Account | 1 | `system/admins/{uid}` |
| Default Categories | 1 | `businesses/{bid}/outlets/{oid}/categories` |
| Slug | 1 | `slugs/outlets/{slug}` |

## Rate Limiting
- `ECOSYSTEM_INITIALIZE` action rate-limited: max 1 per 60 seconds
- Prevents rapid-fire provisioning

## Edge Cases
- **Email already registered**: secondaryAuth.createUser() throws — show error toast
- **Slug collision**: slug path overwrites silently (no uniqueness enforcement)
- **Auth creation succeeds, DB write fails**: Orphaned Auth account (no cleanup)
- **DB write succeeds, archive fails**: Original request removed but not archived (data loss)
- **Commission default**: Always 10% — must be manually updated after creation
