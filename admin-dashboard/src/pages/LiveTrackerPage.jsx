import React, { useState, useEffect, useRef } from "react";
import { Store } from "lucide-react";
import { db, ref, push, remove, onValue, off } from "../firebase";
import "../App.css";

function LiveTrackerPage() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markers = useRef({});
  const [online, setOnline] = useState(0);

  useEffect(() => {
    let L, cleanup;
    (async () => {
      try {
        L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");
      } catch(e) { console.warn("Leaflet not available, using simple view"); return; }
      if (!mapRef.current) return;
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
      const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution:"&copy; OpenStreetMap" }).addTo(map);
      mapInstance.current = map;
      const r = ref(db,"riders");
      const unsub = onValue(r, snap => {
        let oc = 0; const bounds = [];
        snap.forEach(child => {
          const rider = child.val();
          if (rider.status==="Online"&&rider.location) {
            oc++; const pos = [rider.location.lat, rider.location.lng]; bounds.push(pos);
            const popup = `<div><b>${rider.name||"Rider"}</b><br/>${rider.phone||""}<br/>${rider.status}</div>`;
            if (markers.current[child.key]) { markers.current[child.key].setLatLng(pos); markers.current[child.key].getPopup()?.setContent(popup); }
            else {
              const m = L.marker(pos).addTo(map).bindPopup(popup);
              markers.current[child.key] = m;
            }
          } else if (markers.current[child.key]) { map.removeLayer(markers.current[child.key]); delete markers.current[child.key]; }
        });
        setOnline(oc);
        if (bounds.length>0) map.fitBounds(L.latLngBounds(bounds), { padding:[50,50], maxZoom:15 });
      });
      cleanup = () => { off(r,"value",unsub); if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current=null; } };
    })();
    return () => { if (cleanup) cleanup(); };
  }, []);

  return (
    <div>
      <div style={{ fontSize:14, fontWeight:700, color:"#0f172a", marginBottom:12 }}>Live Rider Tracker — {online} Riders Online</div>
      <div ref={mapRef} style={{ width:"100%", height:"calc(100vh - 180px)", borderRadius:16, overflow:"hidden" }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE (Store, Delivery, Bot, Display tabs)
// ═══════════════════════════════════════════════════════════════════════════

export default LiveTrackerPage;