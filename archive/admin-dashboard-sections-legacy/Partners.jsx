import { useState } from "react";
import GlassCard from "../components/GlassCard";
import Avatar from "../components/Avatar";
import { COLORS } from "../utils/constants";

const MOCK_PARTNERS = [
  { id:"p1", name:"Ravi Supplies Co.", type:"Raw Materials", status:"pending", since:"May 20", contact:"9876001234" },
  { id:"p2", name:"Freshmart Veggies", type:"Vegetables", status:"approved", since:"Apr 12", contact:"9812345678" },
  { id:"p3", name:"SpiceBox India", type:"Spices", status:"pending", since:"May 22", contact:"9901234567" },
  { id:"p4", name:"Dairy Fresh Pvt Ltd", type:"Dairy", status:"rejected", since:"May 10", contact:"9845611234" },
];

const Partners = ({ showToast }) => {
  const [partners, setPartners] = useState(MOCK_PARTNERS);

  const update = (id, status) => {
    setPartners(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    showToast(`Partner ${status}`);
  };

  const statusStyle = {
    pending:  { color:"#f59e0b", bg:"#fef3c7" },
    approved: { color:"#22c55e", bg:"#dcfce7" },
    rejected: { color:"#ef4444", bg:"#fee2e2" },
  };

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 520 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["Partner","Type","Since","Contact","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partners.map(p => {
                const st = statusStyle[p.status];
                return (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-orange-50/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={p.name} size={32} />
                        <span className="font-semibold text-slate-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.type}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{p.since}</td>
                    <td className="px-4 py-3 text-slate-500">{p.contact}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-bold capitalize"
                        style={{ color: st.color, backgroundColor: st.bg }}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {p.status === "pending" && (
                        <div className="flex gap-2">
                          <button onClick={() => update(p.id,"approved")}
                            className="px-3 py-1 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: COLORS.success }}>Approve</button>
                          <button onClick={() => update(p.id,"rejected")}
                            className="px-3 py-1 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: COLORS.error }}>Reject</button>
                        </div>
                      )}
                      {p.status !== "pending" && <span className="text-xs text-slate-400">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default Partners;
