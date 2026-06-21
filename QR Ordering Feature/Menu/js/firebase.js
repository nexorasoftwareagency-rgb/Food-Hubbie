/**
 * Menu/js/firebase.js
 * Public, unauthenticated Firebase client for the customer-facing menu app.
 *
 * Uses FoodHubbie's Firebase project and multi-tenant database structure:
 *   businesses/{businessId}/outlets/{outletId}/{path}
 *
 * SECURITY: unauthenticated customers are restricted by RTDB rules to
 *   read-only for tables/dishes/categories, and create-only for orders
 *   and tableSessions.
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getDatabase, ref, get, onValue, set, push, update, runTransaction
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// ---------------------------------------------------------------
// Multi-tenant resolution — parsed from URL query params:
//   /menu/?b=BIZ_ID&o=OUTLET_ID&t=TABLE_TOKEN
// ---------------------------------------------------------------
const params = new URLSearchParams(window.location.search);
export const BIZ_ID = params.get('b');
export const OUTLET_ID = params.get('o');

export function outletRef(path) {
    return ref(db, `businesses/${BIZ_ID}/outlets/${OUTLET_ID}/${path}`);
}

export { get, onValue, set, push, update, runTransaction };
