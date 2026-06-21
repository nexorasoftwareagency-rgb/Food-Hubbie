import { useState } from "react";
import { TrendingUp, ShoppingBag, Star, BarChart3 } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import GlassCard from "../components/GlassCard";
import KPICard from "../components/KPICard";
import Pill from "../components/Pill";
import SectionHeader from "../components/SectionHeader";
import Avatar from "../components/Avatar";
import { ORANGE, COLORS, PIE_COLORS } from "../utils/constants";
import { fmt } from "../utils/formatters";

const WEEK_DATA = [
  { d:"Mon", rev:38000, ord:62 }, { d:"Tue", rev:42000, ord:68 },
  { d:"Wed", rev:35000, ord:55 }, { d:"Thu", rev:51000, ord:84 },
  { d:"Fri", rev:68000, ord:110 }, { d:"Sat", rev:82000, ord:134 },
  { d:"Sun", rev:74000, ord:121 },
];

const CAT_DATA = [
  { name:"Main Course", value:38 }, { name:"Starters", value:22 },
  { name:"Rice", value:18 }, { name:"Desserts", value:12 }, { name:"Breads", value:10 },
];

const MOCK_RIDERS = [
  { id:"r1", name:"Rajesh Kumar", deliv:12 },
  { id:"r2", name:"Suresh Yadav", deliv:15 },
  { id:"r3", name:"Mohan Singh", deliv:7 },
  { id:"r4", name:"Ramesh Thakur", deliv:11 },
];

const Analytics = () => {
  const [tab, setTab] = useState("revenue");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["revenue","categories","riders"].map(t => (
          <Pill key={t} label={t.charAt(0).toUpperCase()+t.slice(1)} active={tab===t} onClick={() => setTab(t)} />
        ))}
      </div>

      {tab === "revenue" && (
        <div className="space-y-4">
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
            <KPICard title="Weekly Revenue" value="3,91,000" icon={TrendingUp} trend={8.2} />
            <KPICard title="Weekly Orders" value="634" icon={ShoppingBag} trend={5.1} />
            <KPICard title="Best Day" value="Sat" icon={Star} color={COLORS.warning} />
            <KPICard title="Avg Per Day" value="55,857" icon={BarChart3} />
          </div>
          <GlassCard className="p-4">
            <SectionHeader title="Revenue This Week" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={WEEK_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="d" tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:"#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} width={45} />
                <Tooltip formatter={(v,n) => [n==="rev" ? fmt(v) : v, n==="rev" ? "Revenue":"Orders"]} />
                <Bar dataKey="rev" fill={ORANGE} radius={[6,6,0,0]} />
                <Bar dataKey="ord" fill={COLORS.info} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      )}

      {tab === "categories" && (
        <GlassCard className="p-4">
          <SectionHeader title="Sales by Category" />
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={CAT_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {CAT_DATA.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`, "Share"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 min-w-48">
              {CAT_DATA.map((c, i) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-sm text-slate-700 flex-1">{c.name}</span>
                  <span className="text-sm font-bold text-slate-800">{c.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      {tab === "riders" && (
        <GlassCard className="p-4">
          <SectionHeader title="Rider Performance" />
          <div className="space-y-4">
            {MOCK_RIDERS.map(r => (
              <div key={r.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Avatar name={r.name} size={28} />
                    <span className="text-sm font-semibold text-slate-800">{r.name}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: ORANGE }}>{r.deliv} deliveries</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width:`${(r.deliv/15)*100}%`, backgroundColor: ORANGE }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default Analytics;
