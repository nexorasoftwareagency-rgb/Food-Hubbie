import React, { useState, useEffect, useCallback } from "react";
import { X, Wallet, Plus, CheckCircle, ArrowUp, ArrowDown, Download } from "lucide-react";
import { update, set, onValue, off, logAudit, getCurrentAdminActor, Outlet, getBizId, getOutletId } from "../firebase";
import { fmt, downloadCSV } from "../utils";
import { KPICard, GlassCard, BtnPrimary, BtnSecondary, Modal, SkeletonPage, Input, Select } from "../components";
import { COLORS } from "../constants";
import "../App.css";

const _discLabelStyle = { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 };

function SettlementsPage({ showToast }) {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initOpen, setInitOpen] = useState(false);
  const [initForm, setInitForm] = useState({ amount:"", type:"settlement", method:"Bank Transfer", notes:"" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const r = Outlet("settlements");
    if (!r) { setLoading(false); return; }
    const unsub = onValue(r, snap => {
      const v = snap.val() || {};
      setTxns(Object.keys(v).map(k => ({ id: k, ...v[k] })).sort((a,b) => (b.settledAt||b.createdAt||0) - (a.settledAt||a.createdAt||0)));
      setLoading(false);
    }, () => setLoading(false));
    return () => off(r, "value", unsub);
  }, []);

  const total = txns.reduce((s,t) => s + (Number(t.amount) || 0), 0);
  const credits = txns.filter(t => Number(t.amount) > 0).reduce((s,t) => s + Number(t.amount), 0);
  const debits = txns.filter(t => Number(t.amount) < 0).reduce((s,t) => s + Math.abs(Number(t.amount)), 0);

  const exportCSV = useCallback(() => {
    downloadCSV(`settlements-${new Date().toISOString().slice(0,10)}.csv`, txns.map((t,i) => ({
      row: i + 1, id: t.id, date: t.date || (t.settledAt ? new Date(t.settledAt).toLocaleDateString() : ""), type: t.type || "settlement", amount: t.amount, method: t.method || "", status: t.status || "settled",
    })));
  }, [txns]);

  const handleInitiate = useCallback(async () => {
    const amount = Number(initForm.amount);
    if (!amount || amount <= 0) return showToast("Enter a valid amount", "warning");
    setSaving(true);
    try {
      const id = `stl_${Date.now().toString(36)}`;
      await set(Outlet(`settlements/${id}`), {
        amount: initForm.type === "debit" ? -amount : amount,
        type: initForm.type === "debit" ? "debit" : "credit",
        method: initForm.method || "Bank Transfer",
        notes: initForm.notes?.trim() || "",
        status: "pending",
        createdBy: getCurrentAdminActor()?.uid || "admin",
        createdAt: Date.now(),
        settledAt: Date.now(),
        date: new Date().toLocaleDateString("en-IN"),
      });
      logAudit(getBizId(), getOutletId(), "settlement_initiated", { settlementId: id, amount, type: initForm.type }, getCurrentAdminActor());
      showToast("Settlement initiated", "success");
      setInitOpen(false);
      setInitForm({ amount:"", type:"settlement", method:"Bank Transfer", notes:"" });
    } catch(e) { showToast("Failed: " + (e?.message || "unknown"), "error"); }
    finally { setSaving(false); }
  }, [initForm, showToast]);

  const updateStatus = useCallback(async (id, status) => {
    try {
      await update(Outlet(`settlements/${id}`), { status, updatedAt: Date.now() });
      logAudit(getBizId(), getOutletId(), "settlement_status_update", { settlementId: id, status }, getCurrentAdminActor());
      showToast(`Status: ${status}`, "success");
    } catch(e) { showToast("Update failed", "error"); }
  }, [showToast]);

  if (loading) return <SkeletonPage kpi={3} table={6} />;

  return (
    <div className="space-y-4">
      <div className="sheet-toolbar">
        <div style={{ fontSize:12, color:"#94a3b8" }}>Path: <code>businesses/.../settlements</code></div>
        <div className="flex gap-2">
          <BtnPrimary onClick={() => setInitOpen(true)} style={{ padding:"8px 14px", fontSize:13 }}><Plus size={14} /> Initiate Settlement</BtnPrimary>
          <button type="button" className="sheet-button" onClick={exportCSV}><Download size={14} /> Export CSV</button>
        </div>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <KPICard title="Net Balance" value={fmt(total)} icon={Wallet} color={total >= 0 ? COLORS.success : COLORS.error} />
        <KPICard title="Total Credits" value={fmt(credits)} icon={ArrowUp} color={COLORS.success} />
        <KPICard title="Total Debits" value={fmt(debits)} icon={ArrowDown} color={COLORS.error} />
      </div>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 600 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["ID","Date","Type","Amount","Method","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txns.length === 0 && <tr><td colSpan={7} style={{ textAlign:"center", padding:32, color:"#94a3b8" }}>No settlements recorded yet<br/><span style={{ fontSize:11 }}>Path: <code>businesses/.../settlements</code></span></td></tr>}
              {txns.map(t => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-orange-50/20">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{t.id.slice(-8)}</td>
                  <td className="px-4 py-3 text-slate-500">{t.date || (t.settledAt ? new Date(t.settledAt).toLocaleDateString("en-IN") : "—")}</td>
                  <td className="px-4 py-3 text-slate-700">{t.type || "Settlement"}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: Number(t.amount) > 0 ? COLORS.success : COLORS.error }}>
                    {Number(t.amount) > 0 ? "+" : ""}{fmt(Math.abs(Number(t.amount) || 0))}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{t.method || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-bold capitalize"
                      style={{ color: t.status==="reconciled" ? COLORS.success : t.status==="pending" ? COLORS.warning : "#16a34a", backgroundColor: t.status==="reconciled" ? "#dcfce7" : t.status==="pending" ? "#fef3c7" : "#dcfce7" }}>
                      {t.status || "settled"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(!t.status || t.status === "pending" || t.status === "settled") && (
                      <button onClick={() => updateStatus(t.id, "reconciled")} style={{ padding:"3px 8px", borderRadius:6, border:"1px solid #dcfce7", background:"#f0fdf4", color:"#16a34a", fontSize:10, fontWeight:600, cursor:"pointer" }}><CheckCircle size={11} style={{marginRight:3}} />Reconcile</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <Modal open={initOpen} onClose={() => setInitOpen(false)}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0, fontFamily: "'Outfit', sans-serif" }}>Initiate Settlement</h3>
          <button type="button" onClick={() => setInitOpen(false)} style={{ width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid rgba(232, 73, 8,0.12)", background:"white", color:"#64748b", cursor:"pointer" }}><X size={18} /></button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={_discLabelStyle}>Type</label>
            <Select value={initForm.type} onChange={e => setInitForm(f => ({...f, type: e.target.value}))}>
              <option value="settlement">Credit (incoming)</option>
              <option value="debit">Debit (outgoing)</option>
            </Select>
          </div>
          <div>
            <label style={_discLabelStyle}>Amount (₹) *</label>
            <Input type="number" placeholder="e.g. 5000" value={initForm.amount} onChange={e => setInitForm(f => ({...f, amount: e.target.value}))} />
          </div>
          <div>
            <label style={_discLabelStyle}>Method</label>
            <Select value={initForm.method} onChange={e => setInitForm(f => ({...f, method: e.target.value}))}>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </Select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={_discLabelStyle}>Notes</label>
            <Input placeholder="Optional notes" value={initForm.notes} onChange={e => setInitForm(f => ({...f, notes: e.target.value}))} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <BtnSecondary onClick={() => setInitOpen(false)} style={{ padding:"8px 18px", fontSize:13 }}>Cancel</BtnSecondary>
          <BtnPrimary onClick={handleInitiate} disabled={saving} style={{ padding:"8px 18px", fontSize:13 }}>{saving ? "Initiating..." : "Initiate Settlement"}</BtnPrimary>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FEEDBACK PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default SettlementsPage;