# Rider App — Firebase Config Overview

## SDK Imports (CDN v10.7.1)
```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase, ref, onValue, get, set, update, runTransaction, query, orderByChild, equalTo, off, serverTimestamp, remove, limitToLast, push, onDisconnect } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";
```

## Circular Dependency Workaround
The import of `onDisconnect` alongside other RTDB functions is noted as a deliberate pattern. Although `onDisconnect` is a method on the `Database` reference (not a standalone import), the SDK handles this gracefully when imported this way.

## Config Object
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyD60fL5Q-St64KyMavdfA9to4ZyCdR-qG8",
    authDomain: "food-hubbie.firebaseapp.com",
    databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com",
    projectId: "food-hubbie",
    storageBucket: "food-hubbie.firebasestorage.app",
    messagingSenderId: "952017160550",
    appId: "1:952017160550:web:80bbb75933f431ab54e0a7",
    measurementId: "G-SQK852HT4W"
};
```

## SDK Initialization
```javascript
let app, auth, db, dbStorage, messaging;
try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getDatabase(app);
    // ... rest of initialization
} catch (e) { /* handled in app.js */ }
```

## Offline Persistence
```javascript
// Offline persistence is handled automatically by the browser/SDK for RTDB metadata
// The modular SDK does NOT export enablePersistence for RTDB on Web
// So we rely on the queue-based approach for critical writes
```
The app compensates with its own localStorage offline queue (see Offline-Queue-Overview.md).

## App Check
```javascript
// App Check intentionally omitted — Spark plan, no enforcement needed
```

## Notable Design Decisions
| Decision | Rationale |
|---|---|
| CDN imports (not npm) | No build step for vanilla SPA |
| No `enablePersistence` for RTDB | Not exported in modular SDK v10; Spark plan anyway |
| Try-catch on init | Prevents app crash if Firebase SDK fails to load |
| `onDisconnect` imported from `firebase-database` | Although not a standalone export in modular SDK, the named import is accepted and used as `onDisconnect(db.ref(...))` |
| Same config across all apps | Shared Firebase project `food-hubbie` |
| `storageBucket` uses `.firebasestorage.app` | New Firebase Storage domain pattern (vs legacy `.appspot.com`) |
| No custom claims | Role check done via RTDB read (`riders/{uid}/role`) instead of auth tokens |
