# Shared Components — Firebase Security Rules

## `admins/{uid}`
- `.read: "auth.uid === $uid"` — each admin reads only their own record
- `.write: "auth.uid === $uid"` — each admin writes only their own record

## `businesses/{businessId}/outlets/{outletId}/**`
- `.read: "auth.uid !== null && root.child('admins/'+auth.uid+'/businessId').val() === $businessId && root.child('admins/'+auth.uid+'/outletId').val() === $outletId"`
- `.write: same rule` — admin must match both businessId and outletId

## `riders/{riderId}`
- `.read: "root.child('admins/'+auth.uid).exists()"` — readable by any authenticated admin
- `.write: "auth.uid === $riderId"` — writable only by the rider themselves

## Storage (`food-hubbie.firebasestorage.app`)
- Images uploaded by authenticated admins only
- Storage rules: `allow read: if true; allow write: if request.auth != null`

## No Server-Side Validation
- No rules enforcing order status transition ordering
- No rules preventing stock from going negative
- No rules validating field types or required fields
- All validation enforced client-side only
