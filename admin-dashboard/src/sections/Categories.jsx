import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import GlassCard from "../components/GlassCard";
import BtnPrimary from "../components/BtnPrimary";
import SectionHeader from "../components/SectionHeader";
import ToggleSwitch from "../components/ToggleSwitch";
import { ORANGE } from "../utils/constants";

const MOCK_CATS = [
  { id:"cat1", name:"Starters", icon:"\u{1F957}", items:8, sort:1, active:true },
  { id:"cat2", name:"Main Course", icon:"\u{1F35B}", items:12, sort:2, active:true },
  { id:"cat3", name:"Rice & Biryani", icon:"\u{1F35A}", items:5, sort:3, active:true },
  { id:"cat4", name:"Breads", icon:"\u{1F953}", items:6, sort:4, active:true },
  { id:"cat5", name:"Desserts", icon:"\u{1F36E}", items:4, sort:5, active:true },
  { id:"cat6", name:"Drinks", icon:"\u{1F964}", items:7, sort:6, active:false },
];

const Categories = ({ showToast }) => {
  const [cats, setCats] = useState(MOCK_CATS);
  const [form, setForm] = useState({ name:"", icon:"\u{1F37D}\uFE0F", sort:0 });

  const addCat = () => {
    if (!form.name.trim()) return;
    setCats(prev => [...prev, { id:`cat${Date.now()}`, ...form, items:0, active:true }]);
    setForm({ name:"", icon:"\u{1F37D}\uFE0F", sort:0 });
    showToast("Category added!");
  };

  const toggleCat = (id) => {
    setCats(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
    showToast("Category updated");
  };

  const deleteCat = (id) => {
    setCats(prev => prev.filter(c => c.id !== id));
    showToast("Category deleted");
  };

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
      <GlassCard className="p-5 h-fit">
        <SectionHeader title="Add New Category" />
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Category Name</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Soups & Salads"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-orange-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Emoji / Icon</label>
            <input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
              placeholder="e.g. \u{1F35C}"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-orange-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Sort Order</label>
            <input type="number" value={form.sort} onChange={e => setForm(p => ({ ...p, sort: +e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-orange-300" />
          </div>
          <BtnPrimary onClick={addCat} className="w-full py-2.5 justify-center">
            <Plus size={14} /> Add Category
          </BtnPrimary>
        </div>
      </GlassCard>

      <div>
        <div className="grid gap-3">
          {cats.map(c => (
            <GlassCard key={c.id} className={`p-4 flex items-center gap-3 ${!c.active ? "opacity-60" : ""}`}>
              <span className="text-3xl">{c.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800">{c.name}</div>
                <div className="text-xs text-slate-500">{c.items} items · Sort #{c.sort}</div>
              </div>
              <ToggleSwitch checked={c.active} onChange={() => toggleCat(c.id)} />
              <button onClick={() => deleteCat(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-400 transition-all">
                <Trash2 size={14} />
              </button>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categories;
