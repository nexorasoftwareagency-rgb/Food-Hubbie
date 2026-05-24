import { useState, useMemo, useCallback } from "react";
import { Plus, Edit3, Trash2, GripVertical } from "lucide-react";
import GlassCard from "../components/GlassCard";
import BtnPrimary from "../components/BtnPrimary";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { useRealtimeData } from "../hooks/useRealtimeData";
import { Outlet, push, update, remove, get as fbGet } from "../firebase";
import { ORANGE } from "../utils/constants";

const MOCK = [
  { id:1, name:"North Indian", icon:"🍛", active:true,  order:1 },
  { id:2, name:"Chinese",      icon:"🥟", active:true,  order:2 },
  { id:3, name:"Biryani",      icon:"🍚", active:true,  order:3 },
];

const Categories = ({ showToast }) => {
  const { data: fbCats, loading } = useRealtimeData("categories");
  const categories = fbCats || MOCK;
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name:"", icon:"🍽️", active:true });
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(() => [...categories].sort((a, b) => (a.order || 0) - (b.order || 0)), [categories]);

  const save = useCallback(async () => {
    if (!form.name) { showToast("Category name required"); return; }
    setSaving(true);
    try {
      const data = { name: form.name, order: sorted.length + 1, active: form.active, updatedAt: Date.now() };
      if (modal === "new") {
        await push(Outlet("categories"), data);
        showToast("Category added to Firebase!");
      } else {
        await update(Outlet("categories/" + modal.id), { name: form.name, active: form.active });
        showToast("Category updated!");
      }
      setModal(null);
    } catch (e) {
      showToast("Error: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  }, [form, modal, sorted, showToast]);

  const del = useCallback(async (id) => {
    try {
      const dishesSnap = await fbGet(Outlet("dishes"));
      const dishes = dishesSnap.val() || {};
      const cat = categories.find(c => c.id === id);
      const updates = {};
      updates["categories/" + id] = null;
      Object.keys(dishes).forEach(dishId => {
        if (dishes[dishId].category === cat?.name) {
          updates["dishes/" + dishId] = null;
        }
      });
      await update(Outlet(""), updates);
      showToast("Category and related dishes deleted");
    } catch (e) {
      showToast("Delete failed: " + e.message, "error");
    }
  }, [categories, showToast]);

  const toggleActive = useCallback(async (id) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    try {
      await update(Outlet("categories/" + id), { active: !cat.active });
      showToast("Category " + (!cat.active ? "enabled" : "disabled"));
    } catch (e) {
      showToast("Update failed: " + e.message, "error");
    }
  }, [categories, showToast]);

  const reorder = useCallback(async (id, direction) => {
    const idx = sorted.findIndex(c => c.id === id);
    if ((direction === "up" && idx === 0) || (direction === "down" && idx === sorted.length - 1)) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    try {
      await Promise.all([
        update(Outlet("categories/" + sorted[idx].id), { order: sorted[swapIdx].order }),
        update(Outlet("categories/" + sorted[swapIdx].id), { order: sorted[idx].order }),
      ]);
    } catch (e) {
      showToast("Reorder failed: " + e.message, "error");
    }
  }, [sorted, showToast]);

  return (
    <div className="space-y-4">
      {loading && <div className="text-xs text-slate-400 text-center">Loading from Firebase...</div>}
      <BtnPrimary onClick={() => { setForm({ name:"", icon:"🍽️", active:true }); setModal("new"); }}>
        <Plus size={14} /> Add Category
      </BtnPrimary>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
        {sorted.map(c => (
          <GlassCard key={c.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.icon || "📁"}</span>
                <div>
                  <div className="font-bold text-slate-800">{c.name}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={c.active !== false ? { backgroundColor:"#22c55e20", color:"#22c55e" } : { backgroundColor:"#f1f5f9", color:"#94a3b8" }}>
                {c.active !== false ? "Active" : "Hidden"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <button onClick={() => reorder(c.id, "up")} className="p-1 rounded hover:bg-slate-100 text-slate-400"><GripVertical size={13} /></button>
              </div>
              <div className="flex gap-1">
                <button onClick={() => toggleActive(c.id)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Edit3 size={13} /></button>
                <button onClick={() => { setForm({ name:c.name, icon:c.icon || "📁", active:c.active !== false }); setModal(c); }}
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400"><Edit3 size={13} /></button>
                <button onClick={() => del(c.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={13} /></button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
      {sorted.length === 0 && <EmptyState msg="No categories created yet" />}
      {modal && (
        <Modal title={modal === "new" ? "Add Category" : "Edit Category"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <input placeholder="Category name" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none" />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} />
              Active (visible on menu)
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: ORANGE }}>{saving ? "Saving..." : "Save"}</button>
            <button onClick={() => setModal(null)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-600">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Categories;
