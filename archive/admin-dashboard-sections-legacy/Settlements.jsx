import { Wallet, ArrowUp, ArrowDown } from "lucide-react";
import GlassCard from "../components/GlassCard";
import KPICard from "../components/KPICard";
import BtnPrimary from "../components/BtnPrimary";
import { COLORS } from "../utils/constants";
import { fmt } from "../utils/formatters";

const MOCK_TRANSACTIONS = [
  { id:"TXN-001", date:"May 23", type:"Order Sales", amount:8450, method:"UPI", status:"settled" },
  { id:"TXN-002", date:"May 23", type:"Commission", amount:-845, method:"Auto", status:"settled" },
  { id:"TXN-003", date:"May 22", type:"Order Sales", amount:11200, method:"UPI", status:"settled" },
  { id:"TXN-004", date:"May 22", type:"Rider Payout", amount:-1840, method:"NEFT", status:"pending" },
  { id:"TXN-005", date:"May 21", type:"Order Sales", amount:9600, method:"UPI", status:"settled" },
  { id:"TXN-006", date:"May 21", type:"Refund Issued", amount:-320, method:"UPI", status:"settled" },
];

const Settlements = () => {
  const total = MOCK_TRANSACTIONS.reduce((s,t) => s + t.amount, 0);
  const credits = MOCK_TRANSACTIONS.filter(t => t.amount > 0).reduce((s,t) => s + t.amount, 0);
  const debits = MOCK_TRANSACTIONS.filter(t => t.amount < 0).reduce((s,t) => s + Math.abs(t.amount), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <KPICard title="Net Balance" value={fmt(total)} icon={Wallet} color={total >= 0 ? COLORS.success : COLORS.error} />
        <KPICard title="Total Credits" value={fmt(credits)} icon={ArrowUp} color={COLORS.success} />
        <KPICard title="Total Debits" value={fmt(debits)} icon={ArrowDown} color={COLORS.error} />
      </div>
      <GlassCard>
        <div className="p-4 flex gap-3 border-b border-slate-100">
          <BtnPrimary><ArrowUp size={13} /> Export CSV</BtnPrimary>
          <button className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50">
            <ArrowDown size={13} className="inline mr-1.5" /> Export PDF
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 500 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["ID","Date","Type","Amount","Method","Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_TRANSACTIONS.map(t => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-orange-50/20">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{t.id}</td>
                  <td className="px-4 py-3 text-slate-500">{t.date}</td>
                  <td className="px-4 py-3 text-slate-700">{t.type}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: t.amount > 0 ? COLORS.success : COLORS.error }}>
                    {t.amount > 0 ? "+" : ""}{fmt(Math.abs(t.amount))}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{t.method}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-bold capitalize"
                      style={{ color: t.status==="settled" ? COLORS.success : COLORS.warning, backgroundColor: t.status==="settled" ? "#dcfce7" : "#fef3c7" }}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default Settlements;
