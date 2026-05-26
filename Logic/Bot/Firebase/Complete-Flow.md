# Bot Firebase (firebase.js) — Complete Flow

## Initialization Flow

```
1. Module loaded
2. FIREBASE_DATABASE_URL ← config/firebase-config.js (or env var)
3. BUSINESS_ID ← process.env (or default "business_roshani")
4. OUTLET_ID ← process.env (or default "outlet_default")
5. Try to load service-account.json
   ├─ Found → admin.initializeApp({ credential: cert(serviceAccount), databaseURL })
   └─ Not found → admin.initializeApp({ databaseURL }) [warns]
6. Catch any error → admin.initializeApp({ databaseURL }) [fallback]
7. db = admin.database()
8. ops = createFirebaseOps(db)  ← shared helpers factory
9. Export convenience wrappers bound to BUSINESS_ID/OUTLET_ID
```

## Data Access Flow (e.g., getData)

```
1. Module calls: getData('dishes')
2. Wrapper calls: ops.getData('dishes', BUSINESS_ID, OUTLET_ID)
3. ops.getData resolves path:
   → "businesses/business_roshani/outlets/outlet_pizza/dishes"
4. Calls db.ref(path).once('value')
5. Returns snapshot.val() or null
```

## Global Data Access Flow

```
1. Module calls: getGlobalData('businesses')
2. Direct call: db.ref('businesses').once('value')
3. Returns ALL businesses/outlets (no tenant scoping)
```
