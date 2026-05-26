# Profile View — Important Points

1. **Status toggle**: Updates `riders/{uid}/status` to "online"/"offline"; affects whether rider receives pings
2. **Photo max size**: 5MB limit enforced client-side before upload
3. **Aadhar masking**: `**** **** ${aadhar.slice(-4)}` for display; full number stored
4. **Account fields**: Bank account and IFSC stored but not validated (no transactions in app)
5. **Email display**: Shows `{phone}@rider.com`; generated during rider creation
6. **Suspension check**: If `isActive === false`, show alert and disable all actions
7. **Profile completeness**: Number of filled fields / total optional fields × 100
8. **Upload progress**: Shows percentage during upload via `uploadBytesResumable` `on('state_changed')`
9. **Photo cache**: Profile photo uses URL + `?t=${timestamp}` cache-busting after re-upload
10. **Logout**: `window.signOut()` — calls `auth.signOut()`, clears cached data, redirects to login
