import { useState, useEffect } from "react";
import { Bike, Star, MoreVertical } from "lucide-react";
import { ref, onValue, off, update } from "firebase/database";
import { db } from "../firebase";
import GlassCard from "../components/GlassCard";
import Avatar from "../components/Avatar";
import EmptyState from "../components/EmptyState";
import { ORANGE, COLORS } from "../utils/constants";
import { fmt } from "../utils/formatters";

const Riders = ({ showToast }) => {
  const [riders, setRiders] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const ridersRef = ref(db, "riders");
    const unsub = onValue(ridersRef, snap => {
      const val = snap.val();
      if (val) setRiders(Object.keys(val).map(k => ({ id: k, ...val[k] })));
      else setRiders([]);
    });
    return () => off(ridersRef, "value", unsub);
  }, []);

  const filtered = filter === "all" ? riders : riders.filter(r => r.status === filter);

  const toggleStatus = async (id) => {
    const r = riders.find(x => x.id === id);
    if (!r) return;
    const next = r.status === "online" ? "offline" : "online";
    try {
      await update(ref(db, `riders/${id}`), { status: next });
      showToast("Rider status updated");
    } catch { showToast("Failed to update"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {["all","online","busy","offline"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all"
            style={filter === s ? { backgroundColor: ORANGE, color:"#fff" } : { backgroundColor:"#f1f5f9", color:"#475569" }}>
            {s} {s !== "all" && `(${riders.filter(r => r.status === s).length})`}
          </button>
        ))}
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
        {filtered.map(r => (
          <GlassCard key={r.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar name={r.name} size={40} />
                <div>
                  <div className="font-bold text-slate-800">{r.name}</div>
                  <div className="text-xs text-slate-500">{r.phone}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold capitalize px-2 py-1 rounded-full"
                style={{ backgroundColor: r.status === "online" ? "#22c55e20" : r.status === "busy" ? "#f59e0b20" : "#f1f5f9", color: r.status === "online" ? COLORS.success : r.status === "busy" ? COLORS.warning : "#94a3b8" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: r.status === "online" ? COLORS.success : r.status === "busy" ? COLORS.warning : "#94a3b8" }} />
                {r.status}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-[10px] text-slate-500">Deliveries</div>
                <div className="font-bold text-slate-800 text-sm">{r.deliv || 0}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-[10px] text-slate-500">Earnings</div>
                <div className="font-bold text-sm" style={{ color: ORANGE }}>{fmt(r.earn || 0)}</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <div className="text-[10px] text-slate-500">Rating</div>
                <div className="font-bold text-slate-800 text-sm flex items-center justify-center gap-0.5">
                  <Star size={10} style={{ color: ORANGE }} fill={ORANGE} />{r.rating || 0}
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500 mb-3">
              {r.vehicle || "bike"} · {r.plate || "-"} · {r.zone || "-"}
            </div>
            <div className="flex gap-2">
              {r.status === "offline" ? (
                <button onClick={() => toggleStatus(r.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white"
                  style={{ backgroundColor: ORANGE }}>Mark Online</button>
              ) : (
                <button onClick={() => toggleStatus(r.id)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600">Mark Offline</button>
              )}
              <button className="p-2 rounded-lg bg-slate-100 text-slate-500"><MoreVertical size={14} /></button>
            </div>
          </GlassCard>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState icon={Bike} msg="No riders found" />}
    </div>
  );
};

export default Riders;
