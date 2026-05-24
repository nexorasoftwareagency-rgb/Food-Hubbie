import { useState, useEffect, useCallback } from "react";
import { Outlet, onValue, off, get as fbGet } from "../firebase";

export function useRealtimeData(path) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const ref = Outlet(path);
    const unsubscribe = onValue(ref,
      (snap) => {
        const val = snap.val();
        if (val) {
          const items = Object.keys(val).map(key => ({ id: key, ...val[key] }));
          items.sort((a, b) => (a.order || 0) - (b.order || 0));
          setData(items);
        } else {
          setData([]);
        }
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [path]);

  return { data, loading, error };
}

export function useRealtimeObject(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const ref = Outlet(path);
    const unsubscribe = onValue(ref,
      (snap) => {
        setData(snap.val());
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [path]);

  return { data, loading, error };
}

export async function firebaseGet(path) {
  const ref = Outlet(path);
  const snap = await fbGet(ref);
  return snap.val();
}

export { Outlet, onValue, off, fbGet };
