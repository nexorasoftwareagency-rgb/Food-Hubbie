# SuperAdmin — Firebase Config Overview

## SDK Imports (v9.6.1 Compat)
```html
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-database-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-storage-compat.js"></script>
```
Uses **compat SDK** (namespaced, not modular) — `firebase.database()`, `firebase.auth()`, etc.

## Config Object
Same config as all other Foodhubbie apps:
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyD60fL5Q-St64KyMavdfA9to4ZyCdR-qG8",
    authDomain: "food-hubbie.firebaseapp.com",
    projectId: "food-hubbie",
    databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com",
    storageBucket: "food-hubbie.firebasestorage.app",
    messagingSenderId: "952017160550",
    appId: "1:952017160550:web:80bbb75933f431ab54e0a7",
    measurementId: "G-SQK852HT4W"
};
```

## Dual Firebase Instances
```javascript
// Primary — admin session
firebase.initializeApp(firebaseConfig);

// Secondary — for creating partner/rider accounts
const secondaryApp = firebase.initializeApp(firebaseConfig, "SecondaryAuth");
const secondaryAuth = secondaryApp.auth();
// secondaryAuth.createUserWithEmailAndPassword() — does NOT affect admin session
```

## SDK Initialization Order
```javascript
// Global variables
let db, auth, storage;

// In script execution:
firebase.initializeApp(firebaseConfig);
db = firebase.database();
auth = firebase.auth();
storage = firebase.storage();
```

## Firebase Services Used
| Service | SDK | Purpose |
|---|---|---|
| Realtime Database | `firebase-database-compat` | All CRUD operations |
| Authentication | `firebase-auth-compat` | Admin login, password reset |
| Storage | `firebase-storage-compat` | Rider KYC image upload |

## App Check
- **Not configured** (Spark plan — no enforcement available)

## Key Differences from Other Apps
| Aspect | SuperAdmin | Rider App (modular) |
|---|---|---|
| SDK version | 9.6.1 compat | 10.7.1 modular |
| Import style | Namespaced (`firebase.database()`) | Named (`getDatabase()`) |
| Secondary instance | `initializeApp(config, "SecondaryAuth")` | N/A |
| Enable persistence | Not called | Commented out |
