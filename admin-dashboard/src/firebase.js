import { initializeApp } from "firebase/app";
import {
  getDatabase, ref, get, child, onValue, off, update, push, set, remove, serverTimestamp, query, orderByChild, equalTo
} from "firebase/database";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut
} from "firebase/auth";
import {
  getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject
} from "firebase/storage";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);

let _currentBusinessId = null;
let _currentOutletId = null;

export function setOutletContext(businessId, outletId) {
  _currentBusinessId = businessId;
  _currentOutletId = outletId;
}

export function Outlet(path) {
  const fullPath = `businesses/${_currentBusinessId}/outlets/${_currentOutletId}/${path}`;
  return ref(db, fullPath);
}

export function getOutletRef(path) {
  return Outlet(path);
}

export async function uploadImage(file, storagePath) {
  const ref_ = storageRef(storage, storagePath);
  const snap = await uploadBytesResumable(ref_, file);
  return getDownloadURL(snap.ref);
}

export async function deleteImage(url) {
  try {
    const ref_ = storageRef(storage, url);
    await deleteObject(ref_);
  } catch (e) {
    console.warn("Image delete skipped:", e.message);
  }
}

export {
  db, auth, storage,
  ref, get, child, onValue, off, update, push, set, remove, serverTimestamp,
  query, orderByChild, equalTo,
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
  storageRef, getDownloadURL
};
