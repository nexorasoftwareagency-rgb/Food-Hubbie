import { useState, useMemo, useCallback } from "react";
import { Plus, Edit3, Trash2 } from "lucide-react";
import GlassCard from "../components/GlassCard";
import SearchInput from "../components/SearchInput";
import BtnPrimary from "../components/BtnPrimary";
import Modal from "../components/Modal";
import StarRating from "../components/StarRating";
import EmptyState from "../components/EmptyState";
import { useRealtimeData } from "../hooks/useRealtimeData";
import { Outlet, push, remove, update, uploadImage, deleteImage, get as fbGet } from "../firebase";
import { ORANGE } from "../utils/constants";
import { fmt } from "../utils/formatters";

const MOCK = [
  { id:"d1", name:"Butter Chicken",  category:"North Indian", price:280,  rating:4.8, best:true,  image:"", veg:false },
  { id:"d3", name:"Dal Makhani",     category:"North Indian", price:180,  rating:4.7, best:true,  image:"", veg:true },
  { id:"d4", name:"Chicken Biryani", category:"Biryani",      price:320,  rating:4.9, best:true,  image:"", veg:false },
];

const Menu = ({ showToast }) => {
  const { data: fbItems, loading } = useRealtimeData("dishes");
  const items = fbItems || MOCK;
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name:"", category:"", price:0, image:"", veg:true, best:false, sizes:[], addons:[] });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() =>
    items.filter(i => i.name?.toLowerCase().includes(search.toLowerCase())), [items, search]);

  const save = useCallback(async () => {
    if (!form.name || !form.category) { showToast("Name and category required"); return; }
    setSaving(true);
    try {
      const data = {
        name: form.name, category: form.category, price: form.price || 0,
        image: form.image, veg: form.veg, best: form.best, stock: true,
        order: items.length + 1, updatedAt: Date.now()
      };
      if (modal === "new") {
        await push(Outlet("dishes"), data);
        showToast("Menu item added to Firebase!");
      } else {
        await update(Outlet("dishes/" + modal.id), data);
        showToast("Menu item updated!");
      }
      setModal(null);
    } catch (e) {
      showToast("Error: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  }, [form, modal, items, showToast]);

  const del = useCallback(async (id) => {
    try {
      const snap = await fbGet(Outlet("dishes/" + id));
      const d = snap.val();
      if (d?.image) {
        try { await deleteImage(d.image); } catch {}
      }
      await remove(Outlet("dishes/" + id));
      showToast("Item deleted from Firebase");
    } catch (e) {
      showToast("Delete failed: " + e.message, "error");
    }
  }, [showToast]);

  const handleImageUpload = useCallback(async (file) => {
    try {
      const url = await uploadImage(file, "dishes/" + Date.now() + "_" + file.name);
      setForm(p => ({ ...p, image: url }));
      showToast("Image uploaded");
    } catch (e) {
      showToast("Upload failed: " + e.message, "error");
    }
  }, [showToast]);

  return (
    <div className="space-y-4">
      {loading && <div className="text-xs text-slate-400 text-center">Loading from Firebase...</div>}
      <div className="flex flex-wrap gap-3 items-center">
        <SearchInput placeholder="Search menu..." value={search} onChange={setSearch} className="flex-1 min-w-48" />
        <BtnPrimary onClick={() => { setForm({ name:"", category:"", price:0, image:"", veg:true, best:false, sizes:[], addons:[] }); setModal("new"); }}>
          <Plus size={14} /> Add Item
        </BtnPrimary>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {filtered.map(item => (
          <GlassCard key={item.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.veg ? "#22c55e" : "#ef4444" }} />
                <span className="font-bold text-slate-800 text-sm">{item.name}</span>
              </div>
              {item.best && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
                style={{ backgroundColor: ORANGE }}>BEST</span>}
            </div>
            <div className="text-xs text-slate-500 mb-1">{item.category}</div>
            <StarRating rating={item.rating || 4.5} />
            <div className="flex items-center justify-between mt-3">
              <span className="font-bold" style={{ color: ORANGE }}>{fmt(item.price)}</span>
              <div className="flex gap-1">
                <button onClick={() => { setForm(item); setModal(item); }}
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400"><Edit3 size={13} /></button>
                <button onClick={() => del(item.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={13} /></button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState msg="No menu items found" />}
      {modal && (
        <Modal title={modal === "new" ? "Add Menu Item" : "Edit Menu Item"} onClose={() => setModal(null)}>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Name" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="col-span-2 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none" />
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none">
              {["North Indian","Biryani","Breads","Tandoor","Appetizers","Beverages","Chinese","Desserts","South Indian"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input type="number" placeholder="Base Price" value={form.price}
              onChange={e => setForm(p => ({ ...p, price: +e.target.value }))}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none" />
            <div className="col-span-2 flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={form.veg} onChange={e => setForm(p => ({ ...p, veg: e.target.checked }))} /> Veg
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={form.best} onChange={e => setForm(p => ({ ...p, best: e.target.checked }))} /> Best Seller
              </label>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="file" accept="image/*" id="menuImageUpload" className="hidden"
                onChange={e => { if (e.target.files[0]) handleImageUpload(e.target.files[0]); }} />
              <button onClick={() => document.getElementById("menuImageUpload").click()}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600">Upload Image</button>
              {form.image && <img src={form.image} alt="" className="w-10 h-10 rounded-lg object-cover" />}
            </div>
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

export default Menu;
