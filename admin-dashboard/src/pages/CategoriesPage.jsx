import React, { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Save, Image } from "lucide-react";
import { db, get, ref, update, push, remove, onValue, logAudit, getCurrentAdminActor, Outlet, getBizId, getOutletId } from "../firebase";
import { GlassCard, BtnPrimary, BtnSecondary, Modal, Input } from "../components";
import { ORANGE } from "../constants";
import "../App.css";

function CategoriesPage({ showToast, requireAdminReauth }) {
  const [cats, setCats] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState(""); const [order, setOrder] = useState(0); const [img, setImg] = useState("");
  const [catAddonList, setCatAddonList] = useState([]);

  useEffect(() => {
    const r = Outlet("categories");
    if (!r) return;
    return onValue(r, snap => { const v=snap.val(); setCats(v?Object.keys(v).map(k=>({id:k,...v[k]})).sort((a,b)=>(a.order||0)-(b.order||0)):[]); });
  }, []);

  const openForm = (cat) => {
    if (cat) {
      setEditId(cat.id); setName(cat.name||""); setOrder(cat.order||0); setImg(cat.image||"");
      setCatAddonList(cat.addons ? Object.entries(cat.addons).map(([n,p])=>({name:n,price:Number(p)})) : [{name:"",price:0}]);
    } else {
      setEditId(null); setName(""); setOrder(0); setImg(""); setCatAddonList([]);
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return showToast("Enter category name","warning");
    const addons = catAddonList.filter(a=>a.name.trim()).reduce((a,{name:n,price:p})=>({...a,[n.trim()]:Number(p)}),{});
    const data = { name:name.trim(), image:img, order:Number(order), addons: Object.keys(addons).length > 0 ? addons : null };
    try {
      if (editId) { await update(Outlet(`categories/${editId}`), data); showToast("Category updated","success"); }
      else { await push(Outlet("categories"), data); showToast("Category added","success"); }
      setShowForm(false);
    } catch(e) { showToast("Failed: "+e.message,"error"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category and associated dishes?")) return;
    if (requireAdminReauth && !(await requireAdminReauth())) return;
    try {
      await remove(Outlet(`categories/${id}`));
      logAudit(getBizId(), getOutletId(), "delete_category", { categoryId: id }, getCurrentAdminActor());
      showToast("Deleted","success");
    }
    catch(e) { showToast("Delete failed","error"); }
  };

  const migrateAddons = async () => {
    if (!confirm("Move all dish-level addons to their parent categories?")) return;
    try {
      const [dishesSnap, catsSnap] = await Promise.all([get(Outlet("dishes")), get(Outlet("categories"))]);
      const dishes = dishesSnap.val() || {}; const catsData = catsSnap.val() || {};
      const catAddons = {};
      Object.values(dishes).forEach(d => {
        if (d.category && d.addons) {
          if (!catAddons[d.category]) catAddons[d.category] = {};
          Object.entries(d.addons).forEach(([n, p]) => { catAddons[d.category][n] = p; });
        }
      });
      const updates = {};
      Object.entries(catsData).forEach(([catId, c]) => {
        if (catAddons[c.name]) updates[`categories/${catId}/addons`] = catAddons[c.name];
      });
      if (Object.keys(updates).length > 0) {
        await update(ref(db, `businesses/${getBizId()}/outlets/${getOutletId()}`), updates);
        showToast("Addons migrated to categories!","success");
      } else showToast("No addons to migrate","info");
    } catch(e) { showToast("Migrate failed: "+e.message,"error"); }
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", margin:0 }}>Categories ({cats.length})</h3>
        <div style={{ display:"flex", gap:8 }}>
          <BtnSecondary onClick={migrateAddons} style={{ padding:"6px 12px", fontSize:11 }}>Migrate Addons</BtnSecondary>
          <BtnPrimary onClick={()=>openForm(null)}><Plus size={14} /> Add Category</BtnPrimary>
        </div>
      </div>
      <GlassCard>
        {cats.map(c => (
          <div key={c.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderBottom:"1px solid #f8fafc" }}>
            <img src={c.image||"https://placehold.co/40/orange/white?text=Cat"} style={{ width:40, height:40, borderRadius:8, objectFit:"cover" }} alt="" />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{c.name}</div>
              <div style={{ fontSize:11, color:"#94a3b8" }}>Serial: {c.order||0}{c.addons?` · ${Object.keys(c.addons).length} addons`:""}</div>
            </div>
            <Edit3 size={14} color="#3b82f6" style={{ cursor:"pointer" }} onClick={()=>openForm(c)} />
            <Trash2 size={14} color="#ef4444" style={{ cursor:"pointer" }} onClick={()=>handleDelete(c.id)} />
          </div>
        ))}
        {cats.length===0&&<div style={{ textAlign:"center", padding:40, color:"#94a3b8", fontSize:13 }}>No categories yet</div>}
      </GlassCard>
      <Modal open={showForm} onClose={()=>setShowForm(false)}>
        <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:16 }}>{editId?"Edit Category":"Add Category"}</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Input placeholder="Category name" value={name} onChange={e=>setName(e.target.value)} />
          <Input placeholder="Image URL" value={img} onChange={e=>setImg(e.target.value)} />
          <Input type="number" placeholder="Display order (0,1,2...)" value={order} onChange={e=>setOrder(e.target.value)} />
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:12, fontWeight:600, color:"#475569" }}>Category Addons</span>
              <button type="button" onClick={()=>setCatAddonList([...catAddonList,{name:"",price:0}])} style={{ fontSize:11, color:ORANGE, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>+ Add Addon</button>
            </div>
            {catAddonList.map((a,i)=>(
              <div key={i} style={{ display:"flex", gap:6, marginBottom:6, alignItems:"center" }}>
                <input placeholder="Addon name" value={a.name} onChange={e=>{const c=[...catAddonList];c[i]={...c[i],name:e.target.value};setCatAddonList(c);}} style={{ flex:1, padding:"6px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, outline:"none" }} />
                <input type="number" placeholder="Price" value={a.price} onChange={e=>{const c=[...catAddonList];c[i]={...c[i],price:Number(e.target.value)};setCatAddonList(c);}} style={{ width:80, padding:"6px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, outline:"none" }} />
                {catAddonList.length>1&&<div onClick={()=>setCatAddonList(catAddonList.filter((_,j)=>j!==i))} style={{ cursor:"pointer", color:"#ef4444", fontSize:16, lineHeight:1, padding:"0 2px" }}>✕</div>}
              </div>
            ))}
          </div>
          <BtnPrimary onClick={handleSave} style={{ width:"100%" }}>{editId?"Update":"Save"} Category</BtnPrimary>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MENU PAGE (CRUD with sizes, addons)
// ═══════════════════════════════════════════════════════════════════════════

export default CategoriesPage;