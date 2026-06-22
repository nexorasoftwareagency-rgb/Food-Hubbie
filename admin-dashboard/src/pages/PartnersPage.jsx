import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Save, Download } from "lucide-react";
import { db, ref, update, push, remove, serverTimestamp, onValue, off, logAudit, getCurrentAdminActor, getBizId, getOutletId } from "../firebase";
import { downloadCSV } from "../utils";
import { GlassCard, BtnPrimary, BtnSecondary, Modal, Avatar, SkeletonPage, Input, Select } from "../components";
import { COLORS, PARTNERS_REF } from "../constants";
import "../App.css";

function PartnersPage({ showToast }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Raw Materials", contact: "" });

  useEffect(() => {
    const unsub = onValue(PARTNERS_REF, snap => {
      const v = snap.val() || {};
      setPartners(Object.keys(v).map(k => ({ id: k, ...v[k] })));
      setLoading(false);
    }, () => setLoading(false));
    return () => off(PARTNERS_REF, "value", unsub);
  }, []);

  const updatePartnerStatus = async (id, status) => {
    try {
      await update(ref(db, `system/partners/${id}`), { status });
      logAudit(getBizId(), getOutletId(), "update_partner_status", { partnerId: id, status }, getCurrentAdminActor());
      showToast(`Partner ${status}`,"success");
    }
    catch(e) { showToast("Update failed","error"); }
  };
  const removePartner = async (id) => {
    if (!confirm("Delete this partner?")) return;
    try {
      await remove(ref(db, `system/partners/${id}`));
      logAudit(getBizId(), getOutletId(), "delete_partner", { partnerId: id }, getCurrentAdminActor());
      showToast("Deleted","success");
    }
    catch(e) { showToast("Delete failed","error"); }
  };
  const save = async () => {
    if (!form.name.trim() || !form.contact.trim()) return showToast("Name and contact required","warning");
    try {
      const newRef = await push(ref(db, "system/partners"), { name: form.name.trim(), type: form.type, contact: form.contact.trim(), since: new Date().toISOString().slice(0,10), status: "pending", createdAt: serverTimestamp() });
      logAudit(getBizId(), getOutletId(), "create_partner", { partnerId: newRef?.key || null, name: form.name.trim() }, getCurrentAdminActor());
      setForm({ name:"", type:"Raw Materials", contact:"" }); setShowForm(false); showToast("Partner added","success");
    }
    catch(e) { showToast("Save failed","error"); }
  };

  const statusStyle = {
    pending:  { color:"#f59e0b", bg:"#fef3c7" },
    approved: { color:"#22c55e", bg:"#dcfce7" },
    rejected: { color:"#ef4444", bg:"#fee2e2" },
  };
  const exportPartners = useCallback(() => {
    downloadCSV(`partners-${new Date().toISOString().slice(0,10)}.csv`, partners.map((p, index) => ({
      row: index + 1, name: p.name, type: p.type, since: p.since, contact: p.contact, status: p.status,
    })));
    showToast("Partners exported", "success");
  }, [partners, showToast]);

  if (loading) return <SkeletonPage table={6} />;

  return (
    <div className="space-y-4">
      <div className="sheet-toolbar">
        <div style={{ fontSize:12, color:"#94a3b8" }}>Path: <code>system/partners</code></div>
        <div className="flex gap-2">
          <BtnSecondary onClick={() => setShowForm(true)}><Plus size={13} /> Add</BtnSecondary>
          <button type="button" className="sheet-button" onClick={exportPartners}><Download size={14} /> Export CSV</button>
        </div>
      </div>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 520 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["Partner","Type","Since","Contact","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 && <tr><td colSpan={6} style={{ textAlign:"center", padding:32, color:"#94a3b8" }}>No partners yet — click "Add" to create one.</td></tr>}
              {partners.map(p => {
                const st = statusStyle[p.status] || statusStyle.pending;
                return (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-orange-50/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={p.name} size={32} />
                        <span className="font-semibold text-slate-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.type}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{p.since || "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{p.contact}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-bold capitalize"
                        style={{ color: st.color, backgroundColor: st.bg }}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 items-center">
                        {p.status === "pending" && (
                          <>
                            <button onClick={() => updatePartnerStatus(p.id,"approved")} className="px-3 py-1 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: COLORS.success }}>Approve</button>
                            <button onClick={() => updatePartnerStatus(p.id,"rejected")} className="px-3 py-1 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: COLORS.error }}>Reject</button>
                          </>
                        )}
                        <button onClick={() => removePartner(p.id)} className="p-1 rounded-lg text-slate-400 hover:text-red-500" title="Delete"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
      <Modal open={showForm} onClose={() => setShowForm(false)}>
        <h3 style={{ fontSize:16, fontWeight:700, color:"#0f172a", marginBottom:16 }}>Add Partner</h3>
        <div className="flex flex-col gap-3">
          <Input placeholder="Partner name" value={form.name} onChange={e => setForm({...form, name:e.target.value})} />
          <Select value={form.type} onChange={e => setForm({...form, type:e.target.value})}>
            <option>Raw Materials</option><option>Vegetables</option><option>Spices</option><option>Dairy</option><option>Beverages</option><option>Packaging</option><option>Other</option>
          </Select>
          <Input placeholder="Contact phone" value={form.contact} onChange={e => setForm({...form, contact:e.target.value})} />
          <BtnPrimary onClick={save} style={{ width:"100%" }}>Save Partner</BtnPrimary>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default PartnersPage;