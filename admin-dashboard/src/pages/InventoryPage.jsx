import React, { useState, useEffect, useCallback, useRef } from "react";
import { Package, Menu, Plus, Edit3, Trash2, Save, Upload, AlertTriangle, Download, XCircle } from "lucide-react";
import { ref, update, push, set, remove, onValue, off, logAudit, getCurrentAdminActor, Outlet, getBizId, getOutletId } from "../firebase";
import { downloadCSV } from "../utils";
import { KPICard, GlassCard, Modal, SkeletonPage } from "../components";
import { ORANGE, COLORS, statusColors, stockStatus } from "../constants";
import "../App.css";

function InventoryPage({ showToast, requireAdminReauth }) {
  const [invItems, setInvItems] = useState([]);
  const [dishItems, setDishItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddInv, setShowAddInv] = useState(false);
  const [addInvForm, setAddInvForm] = useState({ name: "", category: "", stock: 0, threshold: 5, unit: "units" });
  const [addInvBusy, setAddInvBusy] = useState(false);
  const [editInvId, setEditInvId] = useState(null);
  const [editInvForm, setEditInvForm] = useState({ name: "", category: "", stock: 0, threshold: 5, unit: "units" });
  const [editInvBusy, setEditInvBusy] = useState(false);
  const [csvImportBusy, setCsvImportBusy] = useState(false);
  const csvInputRef = useRef(null);

  useEffect(() => {
    const r = Outlet("inventory");
    const d = Outlet("dishes");
    if (!d) { setLoading(false); return; }
    const u1 = r ? onValue(r, snap => { const v = snap.val() || {}; setInvItems(Object.keys(v).map(k => ({ id: k, source: "inventory", name: v[k].name || "Unnamed", stock: Number(v[k].stock)||0, threshold: Number(v[k].threshold)||5, unit: v[k].unit || "units", dishId: v[k].dishId || null }))); }) : () => {};
    const u2 = onValue(d, snap => {
      const v = snap.val() || {};
      setDishItems(Object.keys(v).map(k => ({ id: k, source: "dish", name: v[k].name || "Unnamed", stock: v[k].stock, stockType: typeof v[k].stock, category: v[k].category || "" })));
      setLoading(false);
    });
    return () => { if (r) off(r,"value",u1); off(d,"value",u2); };
  }, []);

  const items = invItems.length > 0 ? invItems : dishItems;
  const usingDishes = invItems.length === 0;

  const updateStock = useCallback(async (id, delta, source) => {
    if (source === "dish") {
      const cur = dishItems.find(i => i.id === id);
      if (!cur) return;
      if (cur.stockType === "boolean") {
        const newStock = !cur.stock;
        try {
          await update(Outlet(`dishes/${id}`), { stock: newStock });
          logAudit(getBizId(), getOutletId(), "inventory_stock_toggle", {
            itemId: id, itemName: cur.name, itemType: "dish", unit: "boolean",
            previous: cur.stock, next: newStock
          }, getCurrentAdminActor());
          showToast(`${cur.name} marked ${newStock ? "In Stock" : "Out of Stock"}`,"success");
        }
        catch(e) { showToast("Update failed","error"); }
      } else {
        const previousStock = Number(cur.stock)||0;
        const newStock = Math.max(0, previousStock + delta);
        try {
          await update(Outlet(`dishes/${id}`), { stock: newStock });
          logAudit(getBizId(), getOutletId(), "inventory_stock_adjust", {
            itemId: id, itemName: cur.name, itemType: "dish", unit: "count",
            previous: previousStock, next: newStock, delta
          }, getCurrentAdminActor());
          showToast(`Stock updated: ${newStock}`,"success");
        }
        catch(e) { showToast("Update failed","error"); }
      }
    } else {
      const cur = invItems.find(i => i.id === id);
      if (!cur) return;
      const previousStock = Number(cur.stock||0);
      const newStock = Math.max(0, previousStock + delta);
      try {
        await update(Outlet(`inventory/${id}`), { stock: newStock });
        logAudit(getBizId(), getOutletId(), "inventory_stock_adjust", {
          itemId: id, itemName: cur.name, itemType: "raw_material", unit: cur.unit || "units",
          previous: previousStock, next: newStock, delta
        }, getCurrentAdminActor());
        showToast(`Stock updated: ${newStock}`,"success");
      }
      catch(e) { showToast("Update failed","error"); }
    }
  }, [dishItems, invItems, showToast]);

  const itemIsAvailable = (item) => {
    if (item.source === "dish") {
      if (item.stockType === "boolean") return item.stock === true;
      return (Number(item.stock)||0) > 0;
    }
    return stockStatus(Number(item.stock)||0, Number(item.threshold)||0) === "ok";
  };
  const low = items.filter(i => !itemIsAvailable(i) && (i.source === "dish" ? (i.stockType === "boolean" ? i.stock === false : (Number(i.stock)||0) > 0) : (Number(i.stock)||0) > 0)).length;
  const critical = items.filter(i => i.source === "dish" ? (i.stockType === "boolean" ? i.stock === false : (Number(i.stock)||0) === 0) : (Number(i.stock)||0) === 0).length;
  const exportInventory = useCallback(() => {
    downloadCSV(`inventory-${new Date().toISOString().slice(0,10)}.csv`, items.map((item, index) => ({
      row: index + 1,
      item: item.name,
      stock: item.source === "dish" && item.stockType === "boolean" ? (item.stock ? "available" : "unavailable") : (item.stock || 0),
      threshold: item.threshold || "",
      unit: item.unit || "",
      status: itemIsAvailable(item) ? "ok" : "out",
    })));
    showToast("Inventory exported", "success");
  }, [items, showToast]);

  const handleAddInventory = useCallback(async (e) => {
    e?.preventDefault?.();
    const name = (addInvForm.name || "").trim();
    if (!name) return showToast("Item name is required", "warning");
    const stock = Math.max(0, Number(addInvForm.stock) || 0);
    const threshold = Math.max(0, Number(addInvForm.threshold) || 0);
    const unit = (addInvForm.unit || "units").trim() || "units";
    const category = (addInvForm.category || "").trim();
    setAddInvBusy(true);
    try {
      const newRef = push(Outlet("inventory"));
      await set(newRef, {
        name, category, stock, threshold, unit,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      logAudit(getBizId(), getOutletId(), "inventory_create", {
        itemId: newRef.key, name, category, stock, threshold, unit
      }, getCurrentAdminActor());
      showToast(`${name} added to inventory`, "success");
      setShowAddInv(false);
      setAddInvForm({ name: "", category: "", stock: 0, threshold: 5, unit: "units" });
    } catch (err) {
      showToast("Failed to add item: " + (err?.message || "unknown error"), "error");
    } finally {
      setAddInvBusy(false);
    }
  }, [addInvForm, showToast]);

  const openEditInventory = useCallback((item) => {
    setEditInvId(item.id);
    setEditInvForm({
      name: item.name || "",
      category: item.category || "",
      stock: Number(item.stock) || 0,
      threshold: Number(item.threshold) || 0,
      unit: item.unit || "units"
    });
  }, []);

  const handleEditInventory = useCallback(async (e) => {
    e?.preventDefault?.();
    if (!editInvId) return;
    const name = (editInvForm.name || "").trim();
    if (!name) return showToast("Item name is required", "warning");
    setEditInvBusy(true);
    try {
      const previous = invItems.find(i => i.id === editInvId);
      await update(Outlet(`inventory/${editInvId}`), {
        name,
        category: (editInvForm.category || "").trim(),
        stock: Math.max(0, Number(editInvForm.stock) || 0),
        threshold: Math.max(0, Number(editInvForm.threshold) || 0),
        unit: (editInvForm.unit || "units").trim() || "units",
        updatedAt: new Date().toISOString()
      });
      logAudit(getBizId(), getOutletId(), "inventory_update", {
        itemId: editInvId, name,
        previous: previous ? { stock: previous.stock, threshold: previous.threshold, unit: previous.unit } : null,
        next: { stock: Number(editInvForm.stock) || 0, threshold: Number(editInvForm.threshold) || 0, unit: editInvForm.unit }
      }, getCurrentAdminActor());
      showToast(`${name} updated`, "success");
      setEditInvId(null);
    } catch (err) {
      showToast("Failed to update item: " + (err?.message || "unknown error"), "error");
    } finally {
      setEditInvBusy(false);
    }
  }, [editInvForm, editInvId, invItems, showToast]);

  const handleDeleteInventory = useCallback(async (item) => {
    if (!item || !item.id) return;
    if (!confirm(`Delete "${item.name}" from inventory?`)) return;
    if (requireAdminReauth && !(await requireAdminReauth())) return;
    try {
      await remove(Outlet(`inventory/${item.id}`));
      logAudit(getBizId(), getOutletId(), "inventory_delete", {
        itemId: item.id, name: item.name, stock: item.stock, threshold: item.threshold, unit: item.unit
      }, getCurrentAdminActor());
      showToast(`${item.name} deleted`, "success");
    } catch (err) {
      showToast("Failed to delete: " + (err?.message || "unknown error"), "error");
    }
  }, [showToast, requireAdminReauth]);

  const handleCsvImport = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvImportBusy(true);
    try {
      const text = await file.text();
      const lines = text.trim().split("\n");
      if (lines.length < 2) { showToast("CSV must have a header row and at least one data row","warning"); setCsvImportBusy(false); return; }
      const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
      const nameIdx = headers.findIndex(h => h === "name" || h === "item");
      const stockIdx = headers.findIndex(h => h === "stock" || h === "quantity" || h === "qty");
      const catIdx = headers.findIndex(h => h === "category");
      const threshIdx = headers.findIndex(h => h === "threshold" || h === "min" || h === "alert");
      const unitIdx = headers.findIndex(h => h === "unit");
      if (nameIdx === -1) { showToast("CSV must have a 'name' or 'item' column","warning"); setCsvImportBusy(false); return; }
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim());
        const name = cols[nameIdx];
        if (!name) continue;
        rows.push({
          name,
          category: catIdx >= 0 ? cols[catIdx] || "" : "",
          stock: Math.max(0, Number(cols[stockIdx >= 0 ? stockIdx : nameIdx]) || 0),
          threshold: Math.max(0, Number(cols[threshIdx >= 0 ? threshIdx : nameIdx]) || 5),
          unit: unitIdx >= 0 ? cols[unitIdx] || "units" : "units"
        });
      }
      if (rows.length === 0) { showToast("No valid rows found","warning"); setCsvImportBusy(false); return; }
      const promises = rows.map(r => push(Outlet("inventory"), { ...r, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
      await Promise.all(promises);
      logAudit(getBizId(), getOutletId(), "inventory_csv_import", { count: rows.length, sample: rows.slice(0,3) }, getCurrentAdminActor());
      showToast(`Imported ${rows.length} item(s) from CSV`,`success`);
    } catch (err) { showToast("CSV import failed: "+(err?.message||"unknown error"),"error"); }
    finally { setCsvImportBusy(false); if (csvInputRef.current) csvInputRef.current.value = ""; }
  }, [showToast]);

  if (loading) return <SkeletonPage kpi={3} table={5} />;

  return (
    <div className="space-y-4">
      <div className="sheet-toolbar">
        <div style={{ fontSize:12, color:"#94a3b8" }}>
          {usingDishes
            ? `No raw-materials inventory found — showing dish availability (${dishItems.filter(d => d.stockType === "boolean").length} of ${dishItems.length} use boolean stock)`
            : `Showing raw materials from ${invItems.length} inventory record(s)`}
        </div>
        <input ref={csvInputRef} type="file" accept=".csv" style={{ display:"none" }} onChange={handleCsvImport} />
        <button type="button" className="sheet-button" onClick={() => csvInputRef.current?.click()} disabled={csvImportBusy}><Upload size={14} /> {csvImportBusy?"Importing...":"Import CSV"}</button>
        <button type="button" className="sheet-button" onClick={exportInventory}><Download size={14} /> Export CSV</button>
        <button type="button" className="sheet-button" onClick={() => setShowAddInv(true)} style={{ background:ORANGE, color:"white" }}><Plus size={14} /> New Item</button>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        <KPICard title="Total Items" value={items.length} icon={Package} />
        <KPICard title="Unavailable" value={critical} icon={XCircle} color={COLORS.error} />
        <KPICard title={usingDishes ? "Out of Stock (dishes)" : "Low Stock"} value={low} icon={AlertTriangle} color={COLORS.warning} />
      </div>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 500 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["Item","Category","Stock","Linked Dish","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={6} style={{ textAlign:"center", padding:32, color:"#94a3b8" }}>No inventory items. Add dishes in the Menu page or seed raw materials under inventory.</td></tr>}
              {items.map(item => {
                const available = itemIsAvailable(item);
                const isBool = item.source === "dish" && item.stockType === "boolean";
                const isDish = item.source === "dish";
                const numericStock = isBool ? (item.stock ? 1 : 0) : (Number(item.stock)||0);
                const threshold = Number(item.threshold)||0;
                const st = isBool
                  ? (item.stock === false ? statusColors.critical : statusColors.ok)
                  : statusColors[stockStatus(numericStock, threshold)];
                const pct = isBool ? (item.stock === false ? 5 : 100) : Math.min(100, numericStock / (threshold * 2 || 1) * 100);
                const linkedDish = item.dishId ? dishItems.find(d => d.id === item.dishId) : null;
                return (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-orange-50/30">
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{isDish ? (item.category || "—") : (item.unit || "—")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800 w-12">
                          {isBool ? (item.stock === false ? "❌" : "✅") : numericStock}
                        </span>
                        <div className="flex-1 bg-slate-100 rounded-full h-1.5 w-20 min-w-0">
                          <div className="h-1.5 rounded-full transition-all" style={{ width:`${pct}%`, backgroundColor: st.color }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: linkedDish ? "#0f172a" : "#94a3b8" }}>
                      {linkedDish ? linkedDish.name : (item.dishId ? "Unknown dish" : "—")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-bold capitalize"
                        style={{ color: st.color, backgroundColor: st.bg }}>
                        {isBool ? (item.stock === false ? "out of stock" : "in stock") : stockStatus(numericStock, threshold)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {isBool ? (
                          <button onClick={() => updateStock(item.id, 0, item.source)}
                            className="px-3 py-1 rounded-lg text-xs font-bold text-white"
                            style={{ backgroundColor: item.stock === false ? COLORS.success : COLORS.error }}>
                            {item.stock === false ? "Mark Available" : "Mark Unavailable"}
                          </button>
                        ) : (
                          <>
                            <button onClick={() => updateStock(item.id, -1, item.source)} className="px-2 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-500">-1</button>
                            <button onClick={() => updateStock(item.id, 5, item.source)}  className="px-2 py-1 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: ORANGE }}>+5</button>
                            <button onClick={() => updateStock(item.id, 10, item.source)} className="px-2 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-600">+10</button>
                            {!isDish && (
                              <>
                                <button onClick={() => openEditInventory(item)} className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600" title="Edit item"><Edit3 size={11} /></button>
                                <button onClick={() => handleDeleteInventory(item)} className="px-2 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-500" title="Delete item"><Trash2 size={11} /></button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <Modal open={showAddInv} onClose={() => setShowAddInv(false)} wide={false}>
        <form onSubmit={handleAddInventory}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"#fff7ed", display:"flex", alignItems:"center", justifyContent:"center" }}><Package size={18} color={ORANGE}/></div>
            <div style={{ fontSize:17, fontWeight:700, color:"#0f172a" }}>Add Inventory Item</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ gridColumn:"1 / -1" }}>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Name *</label>
              <input value={addInvForm.name} onChange={e => setAddInvForm(f => ({...f, name: e.target.value}))} required autoFocus placeholder="e.g. Cheese, Flour, Tomato Sauce"
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, color:"#0f172a" }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Category</label>
              <input value={addInvForm.category} onChange={e => setAddInvForm(f => ({...f, category: e.target.value}))} placeholder="e.g. Dairy, Vegetables"
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, color:"#0f172a" }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Unit</label>
              <input value={addInvForm.unit} onChange={e => setAddInvForm(f => ({...f, unit: e.target.value}))} placeholder="kg, liters, units…"
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, color:"#0f172a" }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Current Stock</label>
              <input type="number" min="0" value={addInvForm.stock} onChange={e => setAddInvForm(f => ({...f, stock: e.target.value}))}
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, color:"#0f172a" }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Low-Stock Threshold</label>
              <input type="number" min="0" value={addInvForm.threshold} onChange={e => setAddInvForm(f => ({...f, threshold: e.target.value}))}
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, color:"#0f172a" }} />
            </div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:18, justifyContent:"flex-end" }}>
            <button type="button" onClick={() => setShowAddInv(false)} disabled={addInvBusy} style={{ padding:"9px 16px", borderRadius:8, border:"1.5px solid #e2e8f0", background:"white", color:"#475569", fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
            <button type="submit" disabled={addInvBusy} style={{ padding:"9px 16px", borderRadius:8, border:0, background:ORANGE, color:"white", fontSize:13, fontWeight:600, cursor:"pointer", opacity: addInvBusy ? 0.6 : 1 }}>{addInvBusy ? "Saving…" : "Add Item"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={editInvId !== null} onClose={() => setEditInvId(null)} wide={false}>
        <form onSubmit={handleEditInventory}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"#fff7ed", display:"flex", alignItems:"center", justifyContent:"center" }}><Edit3 size={18} color={ORANGE}/></div>
            <div style={{ fontSize:17, fontWeight:700, color:"#0f172a" }}>Edit Inventory Item</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ gridColumn:"1 / -1" }}>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Name *</label>
              <input value={editInvForm.name} onChange={e => setEditInvForm(f => ({...f, name: e.target.value}))} required autoFocus
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, color:"#0f172a" }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Category</label>
              <input value={editInvForm.category} onChange={e => setEditInvForm(f => ({...f, category: e.target.value}))}
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, color:"#0f172a" }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Unit</label>
              <input value={editInvForm.unit} onChange={e => setEditInvForm(f => ({...f, unit: e.target.value}))}
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, color:"#0f172a" }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Current Stock</label>
              <input type="number" min="0" value={editInvForm.stock} onChange={e => setEditInvForm(f => ({...f, stock: e.target.value}))}
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, color:"#0f172a" }} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:"#475569", display:"block", marginBottom:4 }}>Low-Stock Threshold</label>
              <input type="number" min="0" value={editInvForm.threshold} onChange={e => setEditInvForm(f => ({...f, threshold: e.target.value}))}
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, color:"#0f172a" }} />
            </div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:18, justifyContent:"flex-end" }}>
            <button type="button" onClick={() => setEditInvId(null)} disabled={editInvBusy} style={{ padding:"9px 16px", borderRadius:8, border:"1.5px solid #e2e8f0", background:"white", color:"#475569", fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancel</button>
            <button type="submit" disabled={editInvBusy} style={{ padding:"9px 16px", borderRadius:8, border:0, background:ORANGE, color:"white", fontSize:13, fontWeight:600, cursor:"pointer", opacity: editInvBusy ? 0.6 : 1 }}>{editInvBusy ? "Saving…" : "Save Changes"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RIDERS PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default InventoryPage;