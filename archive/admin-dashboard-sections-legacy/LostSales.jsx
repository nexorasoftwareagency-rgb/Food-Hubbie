import { TrendingDown, XCircle, AlertTriangle } from "lucide-react";
import GlassCard from "../components/GlassCard";
import KPICard from "../components/KPICard";
import Avatar from "../components/Avatar";
import { COLORS } from "../utils/constants";
import { fmt } from "../utils/formatters";

const MOCK_LOST = [
  { id:"ORD-0985", customer:"Arun Tiwari", reason:"Customer cancelled", time:"Yesterday", total:480 },
  { id:"ORD-0971", customer:"Suman Devi", reason:"Item unavailable", time:"2 days ago", total:320 },
  { id:"ORD-0954", customer:"Manish Roy", reason:"No rider available", time:"3 days ago", total:890 },
  { id:"ORD-0940", customer:"Kavita Sinha", reason:"Customer cancelled", time:"4 days ago", total:225 },
  { id:"ORD-0921", customer:"Pankaj Gupta", reason:"Store closed", time:"5 days ago", total:650 },
];

const LostSales = () => {
  const totalLoss = MOCK_LOST.reduce((s, l) => s + l.total, 0);
  return (
    <div className="space-y-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <KPICard title="Total Loss" value={fmt(totalLoss)} icon={TrendingDown} color={COLORS.error} />
        <KPICard title="Cancelled Orders" value={MOCK_LOST.length} icon={XCircle} color={COLORS.warning} />
        <KPICard title="Avg Loss/Order" value={fmt(Math.round(totalLoss / MOCK_LOST.length))} icon={AlertTriangle} />
      </div>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 480 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["Order ID","Customer","Reason","Time","Loss"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_LOST.map(l => (
                <tr key={l.id} className="border-b border-slate-50 hover:bg-red-50/20">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-red-400">{l.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={l.customer} size={28} />
                      <span className="font-medium text-slate-800">{l.customer}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{l.reason}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{l.time}</td>
                  <td className="px-4 py-3 font-bold text-red-500">-{fmt(l.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default LostSales;
