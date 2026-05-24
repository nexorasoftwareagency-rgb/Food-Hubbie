import { useState, useMemo } from "react";
import { Package, Plus, Edit3, Trash2 } from "lucide-react";
import { push, set, remove } from "firebase/database";
import { useRealtimeData, Outlet } from "../hooks/useRealtimeData";
import GlassCard from "../components/GlassCard";
import SearchInput from "../components/SearchInput";
import BtnPrimary from "../components/BtnPrimary";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { ORANGE, COLORS } from "../utils/constants";

const EMPTY_FORM = { item: "", category: "", stock: 0, unit: "kg", threshold: 0, price: 0 };

const Inventory = ({ showToast }) => {
  const { data: items = [] } = useRealtimeData("inventory");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const filtered = useMemo(() =>
    items.filter(i => i.item.toLowerCase().includes(search.toLowerCase())), [items, search]);

  const save = async () => {
    if (!form.item) { showToast("Item name required"); return; }
    try {
      if (modal === "new") {
        await push(Outlet("inventory"), form);
        showToast("Item added!");
      } else {
        await set(Outlet(`inventory/${modal.id}`), form);
        showToast("Item updated!");
      }
      setModal(null);
    } catch { showToast("Failed to save"); }
  };

  const deleteItem = async (id) => {
    try {
      await remove(Outlet(`inventory/${id}`));
      showToast("Item deleted");
    } catch { showToast("Failed to delete"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <SearchInput placeholder="Search inventory..." value={search} onChange={setSearch} className="flex-1 min-w-48" />
        <BtnPrimary onClick={() => { setForm({ ...EMPTY_FORM }); setModal("new"); }}>
          <Plus size={14} /> Add Item
        </BtnPrimary>
      </div>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 600 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["Item","Category","Stock","Threshold","Price",""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => {
                const low = i.stock < i.threshold;
                return (
                  <tr key={i.id} className="border-b border-slate-50 hover:bg-orange-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{i.item}</td>
                    <td className="px-4 py-3 text-slate-500">{i.category}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold" style={{ color: low ? COLORS.error : COLORS.success }}>
                        {i.stock} {i.unit}
                      </span>
                      {low && <span className="ml-1.5 text-[10px] font-semibold text-red-500">(LOW)</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{i.threshold} {i.unit}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">₹{i.price}/{i.unit}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setForm({ item: i.item, category: i.category, stock: i.stock, unit: i.unit, threshold: i.threshold, price: i.price }); setModal(i); }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 transition-all"><Edit3 size={13} /></button>
                        <button onClick={() => deleteItem(i.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-all"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState icon={Package} msg="No inventory items found" />}
        </div>
      </GlassCard>
      {modal && (
        <Modal title={modal === "new" ? "Add Inventory Item" : "Edit Inventory Item"} onClose={() => setModal(null)}>
          <div className="grid grid-cols-2 gap-3">
            {["item","category"].map(f => (
              <input key={f} placeholder={f.charAt(0).toUpperCase() + f.slice(1)} value={form[f]}
                onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))}
                className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-300" />
            ))}
            {["stock","threshold","price"].map(f => (
              <input key={f} type="number" placeholder={f.charAt(0).toUpperCase() + f.slice(1)} value={form[f]}
                onChange={e => setForm(p => ({ ...p, [f]: +e.target.value }))}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-orange-300" />
            ))}
            <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none">
              {["kg","g","ltr","ml","pieces","packs"].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: ORANGE }}>Save</button>
            <button onClick={() => setModal(null)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-600">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Inventory;
