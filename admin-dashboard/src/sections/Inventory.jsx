import { useState, useCallback } from "react";
import { Package, AlertTriangle, XCircle } from "lucide-react";
import GlassCard from "../components/GlassCard";
import KPICard from "../components/KPICard";
import { ORANGE, COLORS, statusColors, stockStatus } from "../utils/constants";

const MOCK_INVENTORY = [
  { id:1, name:"Chicken (kg)", stock:12, threshold:5, unit:"kg" },
  { id:2, name:"Paneer (kg)", stock:3, threshold:4, unit:"kg" },
  { id:3, name:"Rice (kg)", stock:25, threshold:10, unit:"kg" },
  { id:4, name:"Tomatoes (kg)", stock:2, threshold:5, unit:"kg" },
  { id:5, name:"Onions (kg)", stock:18, threshold:8, unit:"kg" },
  { id:6, name:"Cream (L)", stock:4, threshold:3, unit:"L" },
  { id:7, name:"Butter (kg)", stock:1, threshold:2, unit:"kg" },
  { id:8, name:"Maida (kg)", stock:30, threshold:10, unit:"kg" },
];

const Inventory = () => {
  const [items, setItems] = useState(MOCK_INVENTORY.map(i => ({ ...i, status: stockStatus(i.stock, i.threshold) })));

  const updateStock = useCallback((id, delta) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const stock = Math.max(0, i.stock + delta);
      return { ...i, stock, status: stockStatus(stock, i.threshold) };
    }));
  }, []);

  const low = items.filter(i => i.status !== "ok").length;
  const critical = items.filter(i => i.status === "critical").length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        <KPICard title="Total Items" value={items.length} icon={Package} />
        <KPICard title="Low Stock" value={low} icon={AlertTriangle} color={COLORS.warning} />
        <KPICard title="Out of Stock" value={critical} icon={XCircle} color={COLORS.error} />
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 500 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["Item","Stock","Threshold","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const st = statusColors[item.status];
                const pct = Math.min(100, item.stock / (item.threshold * 2) * 100);
                return (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-orange-50/30">
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800 w-8">{item.stock}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 w-20 min-w-0">
                          <div className="h-1.5 rounded-full transition-all" style={{ width:`${pct}%`, backgroundColor: st.color }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{item.threshold} {item.unit}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-bold capitalize"
                        style={{ color: st.color, backgroundColor: st.bg }}>{item.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => updateStock(item.id, -1)} className="px-2 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-500">-1</button>
                        <button onClick={() => updateStock(item.id, 5)}  className="px-2 py-1 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: ORANGE }}>+5</button>
                        <button onClick={() => updateStock(item.id, 10)} className="px-2 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-600">+10</button>
                      </div>
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

export default Inventory;
