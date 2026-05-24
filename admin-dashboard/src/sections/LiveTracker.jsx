import { useState, useEffect } from "react";
import { MapPin, Bike, Phone, Navigation } from "lucide-react";
import { ref, onValue, off } from "firebase/database";
import { db } from "../firebase";
import GlassCard from "../components/GlassCard";
import Avatar from "../components/Avatar";
import { ORANGE } from "../utils/constants";

const LiveTracker = ({ showToast }) => {
  const [riders, setRiders] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const ridersRef = ref(db, "riders");
    const unsub = onValue(ridersRef, snap => {
      const val = snap.val();
      if (val) setRiders(Object.keys(val).map(k => ({ id: k, ...val[k] })));
      else setRiders([]);
    });
    return () => off(ridersRef, "value", unsub);
  }, []);

  const call = (phone) => {
    showToast("Calling " + phone);
  };

  const notify = (id) => {
    showToast("Notification sent to rider");
  };

  const activeRiders = riders.filter(r => r.status !== "offline");

  return (
    <div className="flex gap-4" style={{ minHeight: "calc(100vh - 120px)" }}>
      <div className="flex-1 space-y-3">
        <GlassCard className="p-4" style={{ height: "calc(100vh - 160px)", position:"relative", overflow:"hidden" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <div className="text-center p-8">
              <MapPin size={48} style={{ color: ORANGE }} className="mx-auto mb-3" />
              <div className="text-lg font-bold text-slate-700 mb-2">Live Map</div>
              <div className="text-sm text-slate-500 mb-4">Map view would render here with rider positions</div>
              <div className="flex flex-wrap justify-center gap-3">
                {activeRiders.map(r => (
                  <div key={r.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white shadow-sm"
                    style={{ borderLeft: "3px solid " + ORANGE }}>
                    <Bike size={14} style={{ color: ORANGE }} />
                    <span className="text-xs font-semibold text-slate-800">{r.name}</span>
                    <span className="text-[10px] text-slate-500">{r.eta || "-"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
      <GlassCard className="w-80 p-4 space-y-3" style={{ minWidth: 260 }}>
        <div className="font-bold text-slate-800 text-sm flex items-center gap-2" style={{ fontFamily:"'Outfit', sans-serif" }}>
          <Bike size={15} style={{ color: ORANGE }} /> Active Riders
        </div>
        {activeRiders.map(r => (
          <div key={r.id}
            className="p-3 rounded-xl border border-slate-100 cursor-pointer hover:border-orange-200 transition-all"
            style={selected?.id === r.id ? { borderColor: ORANGE, backgroundColor: ORANGE + "08" } : {}}
            onClick={() => setSelected(r)}>
            <div className="flex items-center gap-3 mb-2">
              <Avatar name={r.name} size={32} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800">{r.name}</div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span className={`w-1.5 h-1.5 rounded-full ${r.status === "online" ? "bg-green-500" : "bg-yellow-500"}`} />
                  {r.currentOrderId || "Free"}
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ backgroundColor: ORANGE + "15", color: ORANGE }}>
                {r.eta || "-"}
              </span>
            </div>
            {r.currentOrderId && <div className="text-xs text-slate-500 truncate">{r.address || "-"}</div>}
          </div>
        ))}
        {selected && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex gap-2">
              <button onClick={() => call(selected.phone)}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1"
                style={{ backgroundColor: ORANGE }}>
                <Phone size={12} /> Call
              </button>
              <button onClick={() => notify(selected.id)}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1"
                style={{ backgroundColor: "#3b82f6" }}>
                <Navigation size={12} /> Notify
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default LiveTracker;
