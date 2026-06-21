import { useState } from "react";
import { Activity, Truck, XCircle, Wallet, Eye } from "lucide-react";
import GlassCard from "../components/GlassCard";
import KPICard from "../components/KPICard";
import Avatar from "../components/Avatar";
import StarRating from "../components/StarRating";
import Modal from "../components/Modal";
import { ORANGE, COLORS } from "../utils/constants";
import { fmt } from "../utils/formatters";

const MOCK_RIDERS = [
  { id:"r1", name:"Rajesh Kumar", phone:"+91 9876543210", vehicle:"bike", status:"online", earn:1840, deliv:12, rating:4.7, order:"ORD-1003" },
  { id:"r2", name:"Suresh Yadav", phone:"+91 9845671230", vehicle:"scooty", status:"busy", earn:2100, deliv:15, rating:4.5, order:"ORD-1007" },
  { id:"r3", name:"Mohan Singh", phone:"+91 9765432109", vehicle:"bike", status:"offline", earn:980, deliv:7, rating:4.2, order:null },
  { id:"r4", name:"Ramesh Thakur", phone:"+91 9654321098", vehicle:"cycle", status:"online", earn:1560, deliv:11, rating:4.8, order:null },
];

const Riders = () => {
  const [riders, setRiders] = useState(MOCK_RIDERS);
  const [selected, setSelected] = useState(null);

  const online = riders.filter(r => r.status === "online").length;
  const busy = riders.filter(r => r.status === "busy").length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        <KPICard title="Online" value={online} icon={Activity} color={COLORS.success} />
        <KPICard title="On Delivery" value={busy} icon={Truck} color={COLORS.warning} />
        <KPICard title="Offline" value={riders.filter(r => r.status === "offline").length} icon={XCircle} color={COLORS.muted} />
        <KPICard title="Total Earnings" value={fmt(riders.reduce((s,r) => s+r.earn, 0))} icon={Wallet} color={COLORS.info} />
      </div>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 580 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["Rider","Vehicle","Status","Deliveries","Earnings","Rating","Order",""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {riders.map(r => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-orange-50/30 cursor-pointer" onClick={() => setSelected(r)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={r.name} size={32} />
                      <div><div className="font-semibold text-slate-800">{r.name}</div><div className="text-xs text-slate-500">{r.phone}</div></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 capitalize">{r.vehicle}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold capitalize whitespace-nowrap"
                      style={{ color: r.status==="online" ? COLORS.success : r.status==="busy" ? COLORS.warning : "#94a3b8" }}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.status==="online" ? COLORS.success : r.status==="busy" ? COLORS.warning : "#94a3b8" }} />
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.deliv}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: ORANGE }}>{fmt(r.earn)}</td>
                  <td className="px-4 py-3"><StarRating rating={r.rating} /></td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: r.order ? ORANGE : "#94a3b8" }}>{r.order || "\u2014"}</td>
                  <td className="px-4 py-3"><Eye size={14} className="text-slate-400" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {selected && (
        <Modal title="Rider Profile" onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <Avatar name={selected.name} size={52} />
              <div>
                <div className="font-bold text-lg text-slate-800">{selected.name}</div>
                <div className="text-sm text-slate-500">{selected.phone}</div>
                <div className="capitalize text-sm" style={{ color: selected.status==="online" ? COLORS.success : selected.status==="busy" ? COLORS.warning : "#94a3b8" }}>● {selected.status}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[["Deliveries Today", selected.deliv], ["Earnings Today", fmt(selected.earn)], ["Rating", selected.rating + " ★"], ["Vehicle", selected.vehicle]].map(([l,v]) => (
                <div key={l} className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-500 mb-1">{l}</div>
                  <div className="font-bold text-slate-800 capitalize">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Riders;
