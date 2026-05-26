# Riders — Decisions

1. **Firebase Auth REST API for rider creation**: Uses the public identitytoolkit API with exposed API key instead of Firebase Admin SDK. This means the API key is exposed client-side and anyone could theoretically call this endpoint. However, it avoids server-side infrastructure.

2. **No Auth account deletion on rider delete**: Deleting a rider removes their RTDB record but not their Firebase Auth account. The rider can still log in. This is a security gap.

3. **Real-time listener**: Riders table updates automatically when data changes. Alternative: manual refresh button.

4. **Password field only on add**: Password is required when creating a rider but not shown on edit for security. Makes sense — password reset is separate flow.

5. **PII stored in RTDB**: Personal info (Aadhar, father's name, age) stored in Realtime Database without encryption. Security/privacy concern.

6. **Client-side search**: All rider data loaded in memory, filtered client-side. Not ideal for large rider bases.

7. **Email as login credential**: Riders use email/password for auth (created via identitytoolkit). Assumes riders have email access.
