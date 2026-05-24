import { useState, useMemo } from "react";
import { DollarSign, Download, CheckCircle, XCircle } from "lucide-react";
import { update } from "firebase/database";
import { useRealtimeData, Outlet } from "../hooks/useRealtimeData";
import GlassCard from "../components/GlassCard";
import KPICard from "../components/KPICard";
import SearchInput from "../components/SearchInput";
import BtnPrimary from "../components/BtnPrimary";
import Modal from "../components/Modal";
import { ORANGE, COLORS } from "../utils/constants";
import { fmt } from "../utils/formatters";

const Settlements = ({ showToast }) => {
  const { data: settlements = [] } = useRealtimeData("settlements");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() =>
    settlements.filter(s =>
      (filter === "all" || s.status === filter) &&
      ((s.rider || s.riderName || "").toLowerCase().includes(search.toLowerCase()) || (s.id || "").toLowerCase().includes(search.toLowerCase()))
    ), [settlements, search, filter]);

  const totalPending = useMemo(() => settlements.filter(s => s.status === "pending").reduce((a, b) => a + (b.amount || 0), 0), [settlements]);

  const settle = async (id) => {
    try {
      await update(Outlet(`settlements/${id}`), { status: "completed", settledAt: new Date().toISOString() });
      showToast("Settlement completed!");
    } catch { showToast("Failed to settle"); }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <KPICard title="Total Pendings" value={fmt(totalPending)} icon={DollarSign} color={COLORS.warning} />
        <KPICard title="Completed" value={settlements.filter(s => s.status === "completed").length.toString()} icon={CheckCircle} color={COLORS.success} />
        <KPICard title="Failed" value={settlements.filter(s => s.status === "failed").length.toString()} icon={XCircle} color={COLORS.error} />
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <SearchInput placeholder="Search by rider or settlement ID..." value={search} onChange={setSearch} className="flex-1 min-w-48" />
        <div className="flex gap-2">
          {["all","pending","completed","failed"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all"
              style={filter === s ? { backgroundColor: ORANGE, color:"#fff" } : { backgroundColor:"#f1f5f9", color:"#475569" }}>
              {s}
            </button>
          ))}
        </div>
        <BtnPrimary><Download size={13} /> Export</BtnPrimary>
      </div>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 600 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["ID","Rider","Date","Orders","Amount","Method","Status",""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-orange-50/30 transition-colors cursor-pointer"
                  onClick={() => setSelected(s)}>
                  <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: ORANGE }}>{s.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{s.rider || s.riderName || "-"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.date || (s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "-")}</td>
                  <td className="px-4 py-3 text-slate-500">{s.orders || 0}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{fmt(s.amount || 0)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.method || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                      style={{
                        backgroundColor: s.status === "completed" ? "#22c55e20" : s.status === "failed" ? "#ef444420" : "#f59e0b20",
                        color: s.status === "completed" ? COLORS.success : s.status === "failed" ? COLORS.error : COLORS.warning
                      }}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {s.status === "pending" && (
                      <button onClick={(e) => { e.stopPropagation(); settle(s.id); }}
                        className="px-2 py-1 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: ORANGE }}>Settle</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
      {selected && (
        <Modal title={"Settlement " + selected.id} onClose={() => setSelected(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500">Rider</div>
                <div className="font-bold text-slate-800">{selected.rider || selected.riderName || "-"}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500">Amount</div>
                <div className="font-bold" style={{ color: ORANGE }}>{fmt(selected.amount || 0)}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500">Date</div>
                <div className="font-bold text-slate-800">{selected.date || (selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : "-")}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500">Orders</div>
                <div className="font-bold text-slate-800">{selected.orders || 0}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500">Payment Method</div>
                <div className="font-bold text-slate-800">{selected.method || "-"}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500">Transaction ID</div>
                <div className="font-mono text-xs font-bold text-slate-800">{selected.tid || selected.transactionId || "-"}</div>
              </div>
            </div>
            {selected.status === "pending" && (
              <button onClick={() => settle(selected.id)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: ORANGE }}>Mark as Completed</button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Settlements;
