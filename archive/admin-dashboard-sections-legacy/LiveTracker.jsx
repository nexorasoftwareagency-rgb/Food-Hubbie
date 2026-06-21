import { Navigation, Truck, Clock, MapPin } from "lucide-react";
import GlassCard from "../components/GlassCard";
import KPICard from "../components/KPICard";
import SectionHeader from "../components/SectionHeader";
import Avatar from "../components/Avatar";
import { ORANGE, COLORS } from "../utils/constants";

const MOCK_RIDERS = [
  { id:"r1", name:"Rajesh Kumar", vehicle:"bike", status:"online", deliv:12, order:"ORD-1003" },
  { id:"r2", name:"Suresh Yadav", vehicle:"scooty", status:"busy", deliv:15, order:"ORD-1007" },
  { id:"r3", name:"Mohan Singh", vehicle:"bike", status:"offline", deliv:7, order:null },
  { id:"r4", name:"Ramesh Thakur", vehicle:"cycle", status:"online", deliv:11, order:null },
];

const LiveTracker = () => (
  <div className="space-y-4">
    <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
      <KPICard title="Online Riders" value="2" icon={Navigation} color={COLORS.success} />
      <KPICard title="Active Deliveries" value="2" icon={Truck} color={COLORS.warning} />
      <KPICard title="Avg Delivery Time" value="28 min" icon={Clock} color={COLORS.info} />
    </div>
    <GlassCard className="p-4">
      <SectionHeader title="Live Map" />
      <div className="rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center"
        style={{ height: 320, background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)" }}>
        <div className="text-center">
          <MapPin size={36} className="mx-auto mb-3" style={{ color: ORANGE }} />
          <div className="font-bold text-slate-600">Live Map — Ranchi, Jharkhand</div>
          <div className="text-sm text-slate-400 mt-1">Connect Firebase for real-time rider tracking</div>
          <div className="flex items-center gap-4 mt-4 justify-center">
            {MOCK_RIDERS.filter(r => r.status !== "offline").map(r => (
              <div key={r.id} className="text-center">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold mx-auto mb-1">
                  {r.name.split(" ").map(w=>w[0]).join("")}
                </div>
                <div className="text-xs text-slate-600 font-medium">{r.name.split(" ")[0]}</div>
                <div className="text-xs" style={{ color: r.status==="online" ? COLORS.success : COLORS.warning }}>{r.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
    <div className="space-y-2">
      {MOCK_RIDERS.map(r => (
        <GlassCard key={r.id} className="p-4 flex items-center gap-3">
          <Avatar name={r.name} size={36} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-800">{r.name}</div>
            <div className="text-xs text-slate-500">{r.vehicle} · {r.order ? `On ${r.order}` : "Available"}</div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold capitalize" style={{ color: r.status==="online" ? COLORS.success : r.status==="busy" ? COLORS.warning : "#94a3b8" }}>
              ● {r.status}
            </div>
            <div className="text-xs text-slate-400">{r.deliv} today</div>
          </div>
        </GlassCard>
      ))}
    </div>
  </div>
);

export default LiveTracker;
