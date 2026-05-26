# Onboarding — Decisions

1. **Real-time listener on onboarding_requests**: Choosing to listen in real-time means the table updates as new requests come in. Alternative would be one-time read with refresh button.

2. **Auto-generated business/outlet/admin IDs**: Uses timestamp-based IDs ("biz_" + Date.now()) rather than Firebase push keys. This makes IDs predictable but could theoretically collide.

3. **Admin email as identifier**: AdminEmail is used as the unique identifier for system/admins. No UID is passed from Firebase Auth — assumes admin already exists in Auth.

4. **Single outlet per business**: New businesses start with exactly one outlet ("outlet_main"). Multiple outlets require manual addition later.

5. **No email notification on approve/reject**: Neither the creator nor the admin gets any notification. The request simply disappears from the table.

6. **Required fields**: Only businessName and adminEmail are validated. Other fields (lat, lng, phone) are optional.

7. **Provision New modal allows creating arbitrary businesses**: Any admin can create any business without going through the normal onboarding flow. No audit trail for this action.
