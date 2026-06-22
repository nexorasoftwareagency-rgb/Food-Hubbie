import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, Plus, Edit3, Trash2, Save } from "lucide-react";
import { get, ref, update, push, set, remove, onValue, off, uploadImage, deleteImage, logAudit, getCurrentAdminActor, Outlet, getBizId, getOutletId } from "../firebase";
import { GlassCard, BtnPrimary, Modal, SkeletonGrid, Input, Select } from "../components";
import { ORANGE } from "../constants";
import "../App.css";

function MenuPage({ showToast, requireAdminReauth }) {
  const [dishes, setDishes] = useState([]);
  const [cats, setCats] = useState([]);
  const [menuLoaded, setMenuLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [f, setF] = useState({ name:"", category:"", price:0, image:"", order:0, stock:0, threshold:5 });
  const [sizeList, setSizeList] = useState([]);
  const [addonList, setAddonList] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [search, setSearch] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState("price_flat");
  const [bulkValue, setBulkValue] = useState("");
  const imgRef = useRef(null);

  useEffect(() => {
    let loadCount = 0;
    const r = Outlet("dishes");
    const r2 = Outlet("categories");
    if (!r||!r2) return;
    const u1 = onValue(r, snap => { 
      const v=snap.val(); 
      const dishesData = v?Object.keys(v).map(k=>({id:k,...v[k]})).sort((a,b)=>(a.order||0)-(b.order||0)):[];
      dishesData.forEach(d => {
        if (typeof d.stock === "boolean") {
          update(Outlet(`dishes/${d.id}`), { stock: 0, threshold: 5 });
          d.stock = 0;
          d.threshold = 5;
        } else if (typeof d.stock !== "number") {
          d.stock = Number(d.stock) || 0;
        }
        d.threshold = Number(d.threshold) || 5;
      });
      setDishes(dishesData);
      loadCount++; if (loadCount >= 2) setMenuLoaded(true);
    });
    const u2 = onValue(r2, snap => { const v=snap.val(); setCats(v?Object.keys(v).map(k=>({id:k,...v[k]})):[]); loadCount++; if (loadCount >= 2) setMenuLoaded(true); });
    return () => { off(r,"value",u1); off(r2,"value",u2); };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return dishes;
    const s = search.toLowerCase();
    return dishes.filter(d => d.name.toLowerCase().includes(s)||(d.category||"").toLowerCase().includes(s));
  }, [dishes, search]);

  const openForm = (d) => {
    setImageFile(null);
    setImagePreview(null);
    if (d) { setEditId(d.id); setF({ name:d.name||"", category:d.category||"", price:d.price||0, image:d.image||"", order:d.order||0, stock:typeof d.stock==="number"?d.stock:0, threshold:Number(d.threshold)||5 }); setSizeList(d.sizes?Object.entries(d.sizes).map(([n,p])=>({name:n,price:Number(p)})):[{name:"Regular",price:d.price||0}]); setAddonList(d.addons?Object.entries(d.addons).map(([n,p])=>({name:n,price:Number(p)})):[]); setImagePreview(d.image||null); }
    else { setEditId(null); setF({ name:"", category:cats[0]?.name||"", price:0, image:"", order:0, stock:0, threshold:5 }); setSizeList([{name:"Regular",price:0}]); setAddonList([]); setImagePreview(null); }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!f.name.trim()||!f.category) return showToast("Fill name & category","warning");
    let sizes = null, addons = null;
    if (sizeList.some(s=>s.name.trim())) sizes = sizeList.filter(s=>s.name.trim()).reduce((a,{name:n,price:p})=>({...a,[n.trim()]:Number(p)}),{});
    if (addonList.some(s=>s.name.trim())) addons = addonList.filter(s=>s.name.trim()).reduce((a,{name:n,price:p})=>({...a,[n.trim()]:Number(p)}),{});
    let image = f.image;
    try {
      if (imageFile) {
        image = await uploadImage(imageFile, `dishes/${Date.now()}_${imageFile.name}`);
        if (editId && f.image) deleteImage(f.image).catch(()=>{});
      }
      const data = { name:f.name.trim(), category:f.category, price:Number(f.price), image, order:Number(f.order), stock:Number(f.stock), threshold:Number(f.threshold), sizes, addons };
      if (editId) { await update(Outlet(`dishes/${editId}`), data); showToast("Dish updated","success"); }
      else { await push(Outlet("dishes"), data); showToast("Dish added","success"); }
      setShowForm(false);
    } catch(e) { showToast("Failed: "+e.message,"error"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this dish?")) return;
    if (requireAdminReauth && !(await requireAdminReauth())) return;
    try {
      await remove(Outlet(`dishes/${id}`));
      logAudit(getBizId(), getOutletId(), "delete_dish", { dishId: id }, getCurrentAdminActor());
      showToast("Deleted","success");
    } catch(e) { showToast("Delete failed","error"); }
  };


  if (!menuLoaded) return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, gap:12 }}>
        <div style={{ flex:1, position:"relative", maxWidth:300 }}>
          <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
          <input placeholder="Search dishes..." value={search} onChange={e=>setSearch(e.target.value)} style={{ padding:"8px 10px 8px 32px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:13, width:"100%", background:"#f8fafc", outline:"none" }} />
        </div>
        <BtnPrimary onClick={()=>openForm(null)}><Plus size={14} /> Add Dish</BtnPrimary>
      </div>
      <SkeletonGrid cards={6} />
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, gap:12 }}>
        <div style={{ flex:1, position:"relative", maxWidth:300 }}>
          <Search size={14} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
          <input placeholder="Search dishes..." value={search} onChange={e=>setSearch(e.target.value)} style={{ padding:"8px 10px 8px 32px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:13, width:"100%", background:"#f8fafc", outline:"none" }} />
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button type="button" onClick={() => { setBulkMode(!bulkMode); if (bulkMode) setBulkSelected(new Set()); }} style={{ padding:"8px 14px", borderRadius:8, border:bulkMode?"2px solid #3b82f6":"1.5px solid #e2e8f0", background:bulkMode?"#eff6ff":"white", color:bulkMode?"#3b82f6":"#475569", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            {bulkMode ? `Done (${bulkSelected.size})` : "Bulk Edit"}
          </button>
          <BtnPrimary onClick={()=>openForm(null)}><Plus size={14} /> Add Dish</BtnPrimary>
        </div>
      </div>
      {bulkMode && bulkSelected.size > 0 && (
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:12, padding:"8px 12px", borderRadius:10, background:"#eff6ff", border:"1px solid #bfdbfe", fontSize:12 }}>
          <span style={{ fontWeight:600, color:"#3b82f6" }}>{bulkSelected.size} selected</span>
          <button onClick={() => setBulkSelected(new Set(filtered.map(d => d.id)))} style={{ padding:"3px 8px", borderRadius:4, border:"none", background:"#3b82f6", color:"white", fontSize:10, fontWeight:600, cursor:"pointer" }}>Select All</button>
          <button onClick={() => setBulkSelected(new Set())} style={{ padding:"3px 8px", borderRadius:4, border:"1px solid #e2e8f0", background:"white", color:"#64748b", fontSize:10, fontWeight:600, cursor:"pointer" }}>Clear</button>
          <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} style={{ padding:"4px 6px", borderRadius:4, border:"1px solid #e2e8f0", fontSize:11 }}>
            <option value="price_flat">Set Price (flat)</option>
            <option value="price_pct">Adjust Price (%)</option>
            <option value="stock">Set Stock</option>
            <option value="category">Set Category</option>
          </select>
          <input type="text" value={bulkValue} onChange={e => setBulkValue(e.target.value)} placeholder={bulkAction === "category" ? "Category name" : bulkAction === "price_pct" ? "+/- %" : "Value"} style={{ width:100, padding:"4px 6px", borderRadius:4, border:"1px solid #e2e8f0", fontSize:11 }} />
          <button onClick={() => { if (bulkValue === "") return showToast("Enter a value","warning"); setShowBulkModal(true); }} style={{ padding:"4px 12px", borderRadius:4, border:"none", background:"#22c55e", color:"white", fontSize:11, fontWeight:600, cursor:"pointer" }}>Apply</button>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px,1fr))", gap:16 }}>
        {filtered.map(d => (
          <GlassCard key={d.id} style={{ overflow:"hidden", position:"relative" }}>
            {bulkMode && (
              <div style={{ position:"absolute", top:8, left:8, zIndex:10 }}>
                <input type="checkbox" checked={bulkSelected.has(d.id)} onChange={e => { const s = new Set(bulkSelected); e.target.checked ? s.add(d.id) : s.delete(d.id); setBulkSelected(s); }} style={{ width:18, height:18, cursor:"pointer", accentColor:"#3b82f6" }} />
              </div>
            )}
            <div style={{ position:"relative" }}>
              <img src={d.image||"https://placehold.co/240/orange/white?text=Dish"} alt="" style={{ width:"100%", height:150, objectFit:"cover" }} />
              <div style={{ position:"absolute", top:8, right:8, padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:600, background:d.stock===0?"rgba(239,68,68,0.9)":d.stock<=(d.threshold||5)?"rgba(251,146,60,0.9)":"rgba(34,197,94,0.9)", color:"white" }}>
                {d.stock===0?"OUT OF STOCK":d.stock<=(d.threshold||5)?`⚠ Low (${d.stock})`:`✓ ${d.stock}`}
              </div>
              <div style={{ position:"absolute", bottom:8, left:8, padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:600, background:"rgba(0,0,0,0.6)", color:"white" }}>{d.category||"General"}</div>
            </div>
            <div style={{ padding:"12px 14px 14px" }}>
              <div style={{ fontSize:15, fontWeight:700, color:"#0f172a", marginBottom:6 }}>{d.name}</div>
              {d.sizes ? Object.entries(d.sizes).map(([sz,pr])=>(
                <div key={sz} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"2px 0" }}>
                  <span style={{ color:"#64748b" }}>{sz}</span><span style={{ fontWeight:600, color:"#0f172a" }}>₹{pr}</span>
                </div>
              )) : <div style={{ fontSize:14, fontWeight:700, color:ORANGE, marginBottom:6 }}>₹{d.price||0}</div>}
              <div style={{ display:"flex", gap:6, marginTop:8, paddingTop:8, borderTop:"1px solid #f1f5f9" }}>
                <Edit3 size={13} color="#3b82f6" style={{ cursor:"pointer" }} onClick={()=>openForm(d)} />
                <Trash2 size={13} color="#ef4444" style={{ cursor:"pointer" }} onClick={()=>handleDelete(d.id)} />
                <span style={{ flex:1 }} />
                <button type="button" onClick={async (e) => { e.stopPropagation(); try { await push(Outlet("inventory"), { name: d.name, dishId: d.id, stock: 0, threshold: 5, unit: "units", updatedAt: new Date().toISOString() }); showToast("Now tracking stock for " + d.name, "success"); } catch(e) { showToast("Failed: " + (e?.message || e), "error"); } }} style={{ padding:"3px 8px", borderRadius:6, border:"1px solid #e2e8f0", background:"white", color:ORANGE, fontSize:10, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
                  + Track Stock
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
        {filtered.length===0&&<div style={{ gridColumn:"1/-1", textAlign:"center", padding:40, color:"#94a3b8" }}>No dishes found</div>}
      </div>
      <Modal open={showForm} onClose={()=>setShowForm(false)} wide>
        <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:16 }}>{editId?"Edit Dish":"Add Dish"}</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <Input placeholder="Dish name" value={f.name} onChange={e=>setF({...f,name:e.target.value})} />
          <Select value={f.category} onChange={e=>setF({...f,category:e.target.value})}>
            <option value="">Category</option>
            {cats.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
          </Select>
          <Input type="number" placeholder="Base price" value={f.price} onChange={e=>setF({...f,price:e.target.value})} />
          <div onClick={()=>imgRef.current?.click()} style={{ border:"1.5px dashed #e2e8f0", borderRadius:10, padding:8, cursor:"pointer", textAlign:"center", minHeight:80, display:"flex", alignItems:"center", justifyContent:"center", background:"#fafafa" }}>
            {imagePreview ? <img src={imagePreview} alt="preview" style={{ maxHeight:80, borderRadius:6 }} /> : <span style={{ fontSize:12, color:"#94a3b8" }}>Click to upload image</span>}
            <input ref={imgRef} type="file" accept="image/*" hidden onChange={e=>{const file=e.target.files[0];if(file){setImageFile(file);setImagePreview(URL.createObjectURL(file));}}} />
          </div>
           <Input type="number" placeholder="Display order" value={f.order} onChange={e=>setF({...f,order:e.target.value})} />
           <Input type="number" placeholder="Stock quantity" value={f.stock} onChange={e=>setF({...f,stock:e.target.value})} min="0" />
           <Input type="number" placeholder="Low stock threshold" value={f.threshold} onChange={e=>setF({...f,threshold:e.target.value})} min="1" />
          <div style={{ gridColumn:"1/-1" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:12, fontWeight:600, color:"#475569" }}>Sizes</span>
              <button type="button" onClick={()=>setSizeList([...sizeList,{name:"",price:0}])} style={{ fontSize:11, color:ORANGE, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>+ Add Size</button>
            </div>
            {sizeList.map((s,i)=>(
              <div key={i} style={{ display:"flex", gap:6, marginBottom:6, alignItems:"center" }}>
                <input placeholder="Size name" value={s.name} onChange={e=>{const c=[...sizeList];c[i]={...c[i],name:e.target.value};setSizeList(c);}} style={{ flex:1, padding:"6px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, outline:"none" }} />
                <input type="number" placeholder="Price" value={s.price} onChange={e=>{const c=[...sizeList];c[i]={...c[i],price:Number(e.target.value)};setSizeList(c);}} style={{ width:80, padding:"6px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, outline:"none" }} />
                {sizeList.length>1&&<div onClick={()=>setSizeList(sizeList.filter((_,j)=>j!==i))} style={{ cursor:"pointer", color:"#ef4444", fontSize:16, lineHeight:1, padding:"0 2px" }}>✕</div>}
              </div>
            ))}
          </div>
          <div style={{ gridColumn:"1/-1" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
              <span style={{ fontSize:12, fontWeight:600, color:"#475569" }}>Addons</span>
              <button type="button" onClick={()=>setAddonList([...addonList,{name:"",price:0}])} style={{ fontSize:11, color:ORANGE, background:"none", border:"none", cursor:"pointer", fontWeight:600 }}>+ Add Addon</button>
            </div>
            {addonList.map((a,i)=>(
              <div key={i} style={{ display:"flex", gap:6, marginBottom:6, alignItems:"center" }}>
                <input placeholder="Addon name" value={a.name} onChange={e=>{const c=[...addonList];c[i]={...c[i],name:e.target.value};setAddonList(c);}} style={{ flex:1, padding:"6px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, outline:"none" }} />
                <input type="number" placeholder="Price" value={a.price} onChange={e=>{const c=[...addonList];c[i]={...c[i],price:Number(e.target.value)};setAddonList(c);}} style={{ width:80, padding:"6px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, outline:"none" }} />
                {addonList.length>1&&<div onClick={()=>setAddonList(addonList.filter((_,j)=>j!==i))} style={{ cursor:"pointer", color:"#ef4444", fontSize:16, lineHeight:1, padding:"0 2px" }}>✕</div>}
              </div>
            ))}
          </div>
        </div>
        <BtnPrimary onClick={handleSave} style={{ width:"100%", marginTop:16 }}>{editId?"Update":"Save"} Dish</BtnPrimary>
      </Modal>

      <Modal open={showBulkModal} onClose={()=>setShowBulkModal(false)}>
        <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:12 }}>Confirm Bulk Update</h3>
        <div style={{ fontSize:13, color:"#475569", marginBottom:16 }}>
          Apply <strong>{bulkAction === "price_flat" ? "new price" : bulkAction === "price_pct" ? "price adjustment" : bulkAction}</strong> = <strong>{bulkValue}</strong> to <strong>{bulkSelected.size}</strong> dish{bulkSelected.size > 1 ? "es" : ""}?
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button onClick={() => setShowBulkModal(false)} style={{ padding:"8px 16px", borderRadius:8, border:"1.5px solid #e2e8f0", background:"white", color:"#64748b", fontSize:12, fontWeight:600, cursor:"pointer" }}>Cancel</button>
          <button onClick={async () => {
            setShowBulkModal(false);
            const ids = [...bulkSelected];
            let success = 0, fail = 0;
            for (const id of ids) {
              try {
                const dish = dishes.find(d => d.id === id);
                if (!dish) continue;
                const updates = {};
                if (bulkAction === "price_flat") {
                  updates.price = Number(bulkValue);
                  updates.sizes = null;
                } else if (bulkAction === "price_pct") {
                  const pct = Number(bulkValue);
                  if (dish.sizes) {
                    const newSizes = {};
                    Object.entries(dish.sizes).forEach(([sz, pr]) => { newSizes[sz] = Math.max(0, Math.round(Number(pr) * (1 + pct / 100))); });
                    updates.sizes = newSizes;
                  } else {
                    updates.price = Math.max(0, Math.round(Number(dish.price) * (1 + pct / 100)));
                  }
                } else if (bulkAction === "stock") {
                  updates.stock = Math.max(0, Number(bulkValue));
                } else if (bulkAction === "category") {
                  updates.category = bulkValue.trim();
                }
                if (Object.keys(updates).length) {
                  await update(Outlet(`dishes/${id}`), updates);
                  success++;
                }
              } catch (e) { fail++; }
            }
            showToast(`Updated ${success} dish${success !== 1 ? "es" : ""}${fail ? `, ${fail} failed` : ""}`, fail ? "warning" : "success");
            setBulkSelected(new Set());
          }} style={{ padding:"8px 16px", borderRadius:8, border:"none", background:"#22c55e", color:"white", fontSize:12, fontWeight:600, cursor:"pointer" }}>Apply to All</button>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DISCOUNT EVALUATOR (shared by POS checkout + reactive preview)
// ═══════════════════════════════════════════════════════════════════════════

const DISC_CACHE_TTL = 30000;
let _discCache = { data: null, fetchedAt: 0 };

async function fetchDiscounts() {
  const now = Date.now();
  if (_discCache.data && now - _discCache.fetchedAt < DISC_CACHE_TTL) return _discCache.data;
  const snap = await get(Outlet("discounts"));
  _discCache.data = snap.val() || {};
  _discCache.fetchedAt = now;
  return _discCache.data;
}

function cartHasCategory(cart, categoryIds) {
  if (!Array.isArray(cart) || !Array.isArray(categoryIds) || !categoryIds.length) return false;
  return cart.some(([, item]) => categoryIds.includes(item.category));
}

function discountAmount(d, subtotal) {
  let amt = d.type === "percentage" ? subtotal * Number(d.value) / 100 : Number(d.value) || 0;
  if (d.maxCap && amt > Number(d.maxCap)) amt = Number(d.maxCap);
  return Math.round(amt);
}

const DISC_PRIORITY = { first_order: 4, coupon: 3, category: 2, percentage: 1, flat: 1, bogo: 0 };

function evaluateDiscounts(discounts, ctx) {
  const { subtotal, cart, customer, couponCode, orderType, now = Date.now() } = ctx;
  if (!subtotal || subtotal <= 0 || !discounts) return null;

  const list = Object.entries(discounts)
    .filter(([, d]) => d && d.type && d.value != null)
    .map(([id, d]) => ({ id, ...d }));

  const candidates = list.filter(d =>
    d.enabled !== false
    && now >= (d.startsAt || 0)
    && (!d.endsAt || now <= d.endsAt)
    && (!d.minSubtotal || subtotal >= Number(d.minSubtotal))
    && (!d.globalLimit || (d.stats?.usedCount || 0) < d.globalLimit)
    && (!d.applicableTo || d.applicableTo === "all" || d.applicableTo === orderType?.toLowerCase())
  );

  const applicable = candidates.filter(d => {
    if (d.type === "percentage" || d.type === "flat") return true;
    if (d.type === "first_order") return !customer?.firstOrderDiscountUsed;
    if (d.type === "category") return cartHasCategory(cart, d.categoryIds);
    if (d.type === "coupon") return !!couponCode && String(couponCode).toLowerCase() === String(d.couponCode || "").toLowerCase();
    return false;
  });

  if (!applicable.length) return null;

  const byGroup = new Map();
  for (const d of applicable) {
    const g = d.exclusiveGroup || "__none__";
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g).push(d);
  }

  const pickBest = (group) => group.slice().sort((a, b) => {
    const pa = DISC_PRIORITY[a.type] || 0, pb = DISC_PRIORITY[b.type] || 0;
    if (pa !== pb) return pb - pa;
    return discountAmount(b, subtotal) - discountAmount(a, subtotal);
  })[0];

  const bestPerGroup = [...byGroup.values()].map(g => pickBest(g));
  const exclusive = bestPerGroup.filter(d => !d.stackable);
  const stackable = bestPerGroup.filter(d => d.stackable);
  const chosen = exclusive.length > 0 ? [pickBest(exclusive, subtotal), ...stackable] : bestPerGroup;

  let total = 0;
  for (const d of chosen) total += discountAmount(d, subtotal);
  total = Math.min(total, subtotal);
  if (total <= 0) return null;

  const primary = chosen[0];
  return {
    discount: primary,
    allApplied: chosen,
    amount: total,
    label: primary.name || (primary.type === "first_order" ? "New Customer Discount" : "Discount"),
    source: primary.type === "coupon" ? `coupon:${primary.couponCode}` : primary.type === "first_order" ? "firstOrder" : `auto:${primary.type}`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// POS PAGE (Walk-in cart, checkout)
// ═══════════════════════════════════════════════════════════════════════════

export default MenuPage;