import { ArrowUp, ArrowDown } from "lucide-react";
import GlassCard from "./GlassCard";
import { ORANGE } from "../utils/constants";

const KPICard = ({ title, value, sub, icon: Icon, trend, color = ORANGE }) => (
  <GlassCard className="p-4 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-tight">{title}</span>
      <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon size={15} style={{ color }} />
      </span>
    </div>
    <div className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</div>
    {sub && <div className="text-xs text-slate-500 leading-tight">{sub}</div>}
    {trend !== undefined && (
      <div className="flex items-center gap-1 text-xs">
        {trend >= 0 ? <ArrowUp size={11} className="text-emerald-500" /> : <ArrowDown size={11} className="text-red-500" />}
        <span className={trend >= 0 ? "text-emerald-600" : "text-red-500"}>{Math.abs(trend)}% vs yesterday</span>
      </div>
    )}
  </GlassCard>
);

export default KPICard;
