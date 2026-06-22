import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Tag, Percent, BarChart3, TrendingDown, X, Menu, Plus, Edit3, Trash2, Save, CheckCircle, Clock, Download, Send, XCircle } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { db, get, update, push, set, remove, onValue, off, logAudit, getCurrentAdminActor, Outlet, getBizId, getOutletId } from "../firebase";
import { fmt, esc, downloadCSV, fmtDate, toLocalInput, toMs, discTypeStyle } from "../utils";
import { KPICard, Pill, ToggleSwitch, EmptyState, SectionHeader, GlassCard, BtnPrimary, BtnSecondary, Modal, SkeletonPage, Input, Select, Pagination } from "../components";
import { ORANGE, COLORS, DISC_TYPES, DISC_STATUS, DISC_CHANNELS } from "../constants";
import "../App.css";

const _discLabelStyle = { display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 };

function DiscountsPage({ showToast }) {
  const [discounts, setDiscounts] = useState({});
  const [usage, setUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [reportRange, setReportRange] = useState(7);
  const blankForm = { name:"", type:"percentage", value:"", maxCap:"", startsAt:"", endsAt:"", noEnd:true, minSubtotal:"", applicableTo:"all", couponCode:"", perCustomerLimit:"", globalLimit:"", priority:"", exclusiveGroup:"", stackable:false, enabled:true, categoryIds:"" };
  const [form, setForm] = useState(blankForm);
  const setField = useCallback((k, v) => setForm(f => ({ ...f, [k]: v })), []);

  useEffect(() => {
    const r = Outlet("discounts");
    if (!r) { setLoading(false); return; }
    const unsub = onValue(r, snap => { setDiscounts(snap.val() || {}); setLoading(false); });
    return () => { off(r, "value", unsub); };
  }, []);

  useEffect(() => {
    if (!reportsOpen) return;
    const r = Outlet("discountsUsage");
    if (!r) return;
    const unsub = onValue(r, snap => { const v = snap.val() || {}; setUsage(Object.entries(v).map(([id, u]) => ({ id, ...u }))); });
    return () => { off(r, "value", unsub); };
  }, [reportsOpen]);

  const discStatus = useCallback((d) => {
    const now = Date.now();
    if (d.enabled === false) return "disabled";
    if (d.startsAt && now < d.startsAt) return "scheduled";
    if (d.endsAt && d.endsAt > 0 && now > d.endsAt) return "expired";
    return "active";
  }, []);

  const all = useMemo(() => Object.entries(discounts).map(([id, d]) => ({ id, ...d })), [discounts]);
  const groups = useMemo(() => {
    const g = { active: [], scheduled: [], expired: [] };
    all.forEach(d => { const s = discStatus(d); (g[s] || g.expired).push(d); });
    return g;
  }, [all, discStatus]);
  const sorted = useCallback((arr) => [...arr].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)), []);
  const DISC_PAGE_SIZE = 20;
  const [discountPage, setDiscountPage] = useState(1);
  const currentDiscList = sorted(groups[tab] || []);
  const discTotalPages = Math.max(1, Math.ceil(currentDiscList.length / DISC_PAGE_SIZE));
  useEffect(() => { setDiscountPage(1); }, [tab]);
  const paginatedDiscs = currentDiscList.slice((discountPage - 1) * DISC_PAGE_SIZE, discountPage * DISC_PAGE_SIZE);

  const openEditor = useCallback((d) => {
    if (d) {
      setEditingId(d.id);
      setForm({
        name: d.name || "", type: d.type || "percentage", value: d.value ?? "",
        maxCap: d.maxCap ?? "", startsAt: d.startsAt ? toLocalInput(d.startsAt) : "",
        endsAt: d.endsAt ? toLocalInput(d.endsAt) : "", noEnd: !d.endsAt,
        minSubtotal: d.minSubtotal ?? "", applicableTo: d.applicableTo || "all",
        couponCode: d.couponCode || "", perCustomerLimit: d.perCustomerLimit ?? "",
        globalLimit: d.globalLimit ?? "", priority: d.priority ?? "",
        exclusiveGroup: d.exclusiveGroup || "", stackable: !!d.stackable,
        enabled: d.enabled !== false, categoryIds: (d.categoryIds || []).join(", "),
      });
    } else {
      setEditingId(null);
      setForm({ ...blankForm });
    }
    setEditorOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    const name = (form.name || "").trim();
    if (!name) return showToast("Discount name is required", "warning");
    const value = Number(form.value);
    if (form.type !== "bogo" && (!value || value <= 0)) return showToast("Enter a valid value", "warning");
    if (form.type === "percentage" && value > 100) return showToast("Percentage cannot exceed 100", "warning");
    if (form.type === "coupon" && !(form.couponCode || "").trim()) return showToast("Coupon code is required for coupon type", "warning");
    const startsAt = toMs(form.startsAt);
    const endsAt = form.noEnd ? 0 : toMs(form.endsAt);
    setSaving(true);
    try {
      const id = editingId || `disc_${Date.now().toString(36)}`;
      const categoryIds = (form.categoryIds || "").split(",").map(s => s.trim()).filter(Boolean);
      const doc = {
        name, type: form.type, value: form.type === "bogo" ? 1 : value,
        maxCap: Number(form.maxCap) || 0,
        startsAt: startsAt || 0, endsAt: endsAt || 0,
        minSubtotal: Number(form.minSubtotal) || 0,
        applicableTo: form.applicableTo || "all",
        couponCode: form.type === "coupon" ? (form.couponCode || "").trim().toUpperCase() : null,
        perCustomerLimit: Number(form.perCustomerLimit) || 0,
        globalLimit: Number(form.globalLimit) || 0,
        priority: Number(form.priority) || 0,
        exclusiveGroup: (form.exclusiveGroup || "").trim() || null,
        stackable: !!form.stackable, enabled: form.enabled,
        categoryIds: categoryIds.length > 0 ? categoryIds : null,
        updatedAt: Date.now(),
      };
      if (!editingId) { doc.createdAt = Date.now(); doc.stats = { usedCount: 0, totalDiscountGiven: 0 }; }
      await update(Outlet(`discounts/${id}`), doc);
      logAudit(getBizId(), getOutletId(), editingId ? "discount_update" : "discount_create", { discountId: id, name, type: form.type }, getCurrentAdminActor());
      showToast(editingId ? "Discount updated" : "Discount created", "success");
      setEditorOpen(false);
    } catch (e) { showToast("Save failed: " + (e?.message || "unknown"), "error"); }
    finally { setSaving(false); }
  }, [form, editingId, showToast]);

  const handleToggle = useCallback(async (id, enabled) => {
    try {
      await update(Outlet(`discounts/${id}`), { enabled, updatedAt: Date.now() });
      logAudit(getBizId(), getOutletId(), "discount_toggle", { discountId: id, enabled }, getCurrentAdminActor());
    } catch (e) { showToast("Toggle failed", "error"); }
  }, [showToast]);

  const handleDelete = useCallback(async (d) => {
    const used = d.stats?.usedCount || 0;
    if (!confirm(used > 0 ? `Delete "${d.name || d.id}"? It has ${used} usage(s) which will remain in logs.` : `Delete "${d.name || d.id}"?`)) return;
    try {
      await remove(Outlet(`discounts/${d.id}`));
      logAudit(getBizId(), getOutletId(), "discount_delete", { discountId: d.id, name: d.name }, getCurrentAdminActor());
      showToast("Discount deleted", "success");
    } catch (e) { showToast("Delete failed", "error"); }
  }, [showToast]);

  const filteredUsage = useMemo(() => {
    if (!reportRange) return usage;
    const start = Date.now() - reportRange * 86400000;
    return usage.filter(u => (u.appliedAt || 0) >= start);
  }, [usage, reportRange]);

  const reportBreakdown = useMemo(() => {
    const map = new Map();
    filteredUsage.forEach(u => {
      const k = u.discountId || "unknown";
      if (!map.has(k)) map.set(k, { id: k, name: u.discountLabel || discounts[k]?.name || "Unknown", count: 0, total: 0 });
      const e = map.get(k); e.count += 1; e.total += Number(u.amountGiven) || 0;
    });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [filteredUsage, discounts]);

  const exportReport = useCallback(() => {
    if (!reportBreakdown.length) return showToast("No data to export", "warning");
    downloadCSV(`discounts_report_${reportRange || "all"}d_${new Date().toISOString().slice(0,10)}.csv`, reportBreakdown.map(r => ({
      "Discount ID": r.id, Name: r.name, Redemptions: r.count,
      "Total Saved": Math.round(r.total), "Avg per Redemption": r.count > 0 ? Math.round(r.total / r.count) : 0,
    })));
    showToast("Report exported", "success");
  }, [reportBreakdown, reportRange, showToast]);

  const discUsagePct = useCallback((d) => {
    const used = d.stats?.usedCount || 0;
    if (!d.globalLimit || used === 0) return 0;
    return Math.min(100, Math.round(used / d.globalLimit * 100));
  }, []);

  if (loading) return <SkeletonPage kpi={4} cards={6} />;

  return (
    <div className="space-y-4">
      <div className="sheet-toolbar">
        <div className="flex gap-2">
          <BtnPrimary onClick={() => openEditor(null)} style={{ padding:"8px 14px", fontSize:13 }}><Plus size={14} /> New Discount</BtnPrimary>
          <BtnSecondary onClick={() => setReportsOpen(true)}><BarChart3 size={14} /> Reports</BtnSecondary>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px,1fr))", gap: 12 }}>
        <KPICard title="Total" value={all.length} icon={Tag} />
        <KPICard title="Active" value={groups.active.length} icon={CheckCircle} color={COLORS.success} />
        <KPICard title="Scheduled" value={groups.scheduled.length} icon={Clock} color={COLORS.info} />
        <KPICard title="Expired" value={groups.expired.length} icon={XCircle} color={COLORS.error} />
      </div>
      <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
        <Pill label={`Active (${groups.active.length})`} active={tab === "active"} onClick={() => setTab("active")} />
        <Pill label={`Scheduled (${groups.scheduled.length})`} active={tab === "scheduled"} onClick={() => setTab("scheduled")} />
        <Pill label={`Expired/Disabled (${groups.expired.length})`} active={tab === "expired"} onClick={() => setTab("expired")} />
      </div>
      <div className="space-y-3">
        {currentDiscList.length === 0 && <EmptyState icon={Tag} msg={`No ${tab} discounts.`} />}
        {paginatedDiscs.map(d => {
          const st = discStatus(d);
          const stInfo = DISC_STATUS[st] || DISC_STATUS.disabled;
          const tInfo = discTypeStyle(d.type);
          const used = d.stats?.usedCount || 0;
          const given = d.stats?.totalDiscountGiven || 0;
          return (
            <GlassCard key={d.id} className="p-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{d.name || d.id}</span>
                    <span className="status-pill" style={{ fontSize:10, fontWeight:700, background: tInfo.bg, color: tInfo.color, textTransform: "uppercase" }}>{d.type}</span>
                    <span className="status-pill" style={{ fontSize:10, background: stInfo.bg, color: stInfo.color }}>{"\u25CF"} {stInfo.label}</span>
                    {d.stackable && <span className="status-pill" style={{ fontSize:10, fontWeight:600, background:"#dbeafe", color:"#1d4ed8" }}>Stackable</span>}
                    {d.applicableTo && d.applicableTo !== "all" && <span className="status-pill" style={{ fontSize:10, fontWeight:600, background:"#f1f5f9", color:"#64748b" }}>{d.applicableTo === "dinein" ? "Dine-in" : "Delivery"}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
                    {d.type === "percentage" && <><strong>{Number(d.value)}%</strong> off{d.maxCap ? ` (cap ${fmt(d.maxCap)})` : ""}</>}
                    {d.type === "flat" && <><strong>{fmt(d.value)}</strong> off</>}
                    {d.type === "bogo" && <strong>Buy 1 Get 1 Free</strong>}
                    {d.type === "coupon" && <>Code: <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>{esc(d.couponCode)}</code>{d.value ? <> {"\u2014"} {Number(d.value)}% off</> : ""}</>}
                    {d.type === "category" && <><strong>{d.value ? `${Number(d.value)}%` : fmt(d.value)}</strong> on categories</>}
                    {d.type === "first_order" && <strong>New Customer Discount</strong>}
                    {d.minSubtotal ? <> {"\u00B7"} Min order: <strong>{fmt(d.minSubtotal)}</strong></> : ""}
                    {d.categoryIds?.length > 0 && <div style={{ marginTop: 2 }}>Categories: <strong>{d.categoryIds.join(", ")}</strong></div>}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>
                    {d.type === "bogo" ? "Always on for new customers" : <>{fmtDate(d.startsAt)} {"\u2192"} {d.endsAt ? fmtDate(d.endsAt) : "No end"}</>}
                  </div>
                  {used > 0 && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Used <strong>{used}&times;</strong> {"\u00B7"} saved <strong>{fmt(given)}</strong>{d.globalLimit ? ` / ${d.globalLimit} limit` : ""}{d.stats?.lastUsedAt ? ` {"\u00B7"} Last: ${fmtDate(d.stats.lastUsedAt)}` : ""}</div>}
                  {d.globalLimit && used > 0 && <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: "#f1f5f9", overflow: "hidden", maxWidth: 200 }}><div style={{ height: "100%", width: `${discUsagePct(d)}%`, background: ORANGE, borderRadius: 2 }} /></div>}
                </div>
                <div className="flex items-center gap-2">
                  <ToggleSwitch checked={d.enabled !== false} onChange={(v) => handleToggle(d.id, v)} />
                  <button type="button" onClick={() => openEditor(d)} className="shell-button" style={{ width:32, height:32, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid #e2e8f0", background:"white", color:"#64748b", cursor:"pointer", transition:"all 0.2s" }} title="Edit"
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#E84908"; e.currentTarget.style.color = "#E84908"; e.currentTarget.style.background = "#FFF0E8"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.background = "white"; }}>
                    <Edit3 size={15} />
                  </button>
                  <button type="button" onClick={() => handleDelete(d)} className="shell-button" style={{ width:32, height:32, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid #e2e8f0", background:"white", color:"#ef4444", cursor:"pointer", transition:"all 0.2s" }} title="Delete"
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.background = "#fef2f2"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "white"; }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </GlassCard>
          );
        })}
        <Pagination page={discountPage} totalPages={discTotalPages} onPageChange={setDiscountPage} totalItems={currentDiscList.length} pageSize={DISC_PAGE_SIZE} />
      </div>

      <Modal open={editorOpen} onClose={() => setEditorOpen(false)} wide>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0, fontFamily: "'Outfit', sans-serif" }}>{editingId ? "Edit Discount" : "New Discount"}</h3>
          <button type="button" onClick={() => setEditorOpen(false)} style={{ width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid rgba(232, 73, 8,0.12)", background:"white", color:"#64748b", cursor:"pointer", transition:"all 0.3s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.transform = "rotate(90deg)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.transform = "none"; }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={_discLabelStyle}>Discount Name *</label>
            <Input placeholder="e.g. Weekend Special" value={form.name} onChange={e => setField("name", e.target.value)} />
          </div>
          <div>
            <label style={_discLabelStyle}>Type *</label>
            <Select value={form.type} onChange={e => setField("type", e.target.value)}>
              {DISC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </div>
          <div>
            <label style={_discLabelStyle}>{form.type === "percentage" ? "Percentage (%)" : form.type === "flat" ? "Amount (\u20B9)" : "Value"}</label>
            <Input type="number" placeholder={form.type === "percentage" ? "e.g. 10" : "e.g. 50"} value={form.value} onChange={e => setField("value", e.target.value)} disabled={form.type === "bogo"} />
          </div>
          {form.type === "percentage" && <div>
            <label style={_discLabelStyle}>Max Discount Cap (\u20B9)</label>
            <Input type="number" placeholder="0 = no cap" value={form.maxCap} onChange={e => setField("maxCap", e.target.value)} />
          </div>}
          {form.type === "coupon" && <div style={{ gridColumn: "1 / -1" }}>
            <label style={_discLabelStyle}>Coupon Code *</label>
            <Input placeholder="e.g. WEEKEND20" value={form.couponCode} onChange={e => setField("couponCode", e.target.value.toUpperCase())} />
          </div>}
          <div>
            <label style={_discLabelStyle}>Start Date</label>
            <Input type="datetime-local" value={form.startsAt} onChange={e => setField("startsAt", e.target.value)} />
          </div>
          <div>
            <label style={_discLabelStyle}>End Date {form.noEnd && "(No end)"}</label>
            <div className="flex gap-2 items-center">
              <Input type="datetime-local" value={form.endsAt} onChange={e => setField("endsAt", e.target.value)} disabled={form.noEnd} style={{ flex: 1 }} />
              <label className="flex items-center gap-1" style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap", cursor: "pointer" }}>
                <input type="checkbox" checked={form.noEnd} onChange={e => setField("noEnd", e.target.checked)} style={{ accentColor: ORANGE }} /> No end
              </label>
            </div>
          </div>
          <div>
            <label style={_discLabelStyle}>Min Order Value (\u20B9)</label>
            <Input type="number" placeholder="0 = no minimum" value={form.minSubtotal} onChange={e => setField("minSubtotal", e.target.value)} />
          </div>
          <div>
            <label style={_discLabelStyle}>Applicable To</label>
            <Select value={form.applicableTo} onChange={e => setField("applicableTo", e.target.value)}>
              {DISC_CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
          </div>
          <div>
            <label style={_discLabelStyle}>Per Customer Limit</label>
            <Input type="number" placeholder="0 = unlimited" value={form.perCustomerLimit} onChange={e => setField("perCustomerLimit", e.target.value)} />
          </div>
          <div>
            <label style={_discLabelStyle}>Total Usage Limit</label>
            <Input type="number" placeholder="0 = unlimited" value={form.globalLimit} onChange={e => setField("globalLimit", e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={_discLabelStyle}>Category Restriction (comma-separated)</label>
            <Input placeholder="e.g. Pizza, Beverages (leave empty for all categories)" value={form.categoryIds} onChange={e => setField("categoryIds", e.target.value)} />
          </div>
          <div>
            <label style={_discLabelStyle}>Priority</label>
            <Input type="number" placeholder="Higher = preferred" value={form.priority} onChange={e => setField("priority", e.target.value)} />
          </div>
          <div>
            <label style={_discLabelStyle}>Exclusive Group</label>
            <Input placeholder="Group name" value={form.exclusiveGroup} onChange={e => setField("exclusiveGroup", e.target.value)} />
          </div>
          <div className="flex items-center gap-4" style={{ gridColumn: "1 / -1" }}>
            <label className="flex items-center gap-2" style={{ fontSize: 13, color: "#475569", cursor: "pointer" }}>
              <input type="checkbox" checked={form.stackable} onChange={e => setField("stackable", e.target.checked)} style={{ accentColor: ORANGE }} /> Stackable with other discounts
            </label>
            <div className="flex items-center gap-2">
              <ToggleSwitch checked={form.enabled} onChange={v => setField("enabled", v)} />
              <span style={{ fontSize: 13, color: "#475569" }}>Enabled</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <BtnSecondary onClick={() => setEditorOpen(false)} style={{ padding:"8px 18px", fontSize:13 }}>Cancel</BtnSecondary>
          <BtnPrimary onClick={handleSave} disabled={saving} style={{ padding:"8px 18px", fontSize:13 }}>{saving ? "Saving..." : editingId ? "Update" : "Create Discount"}</BtnPrimary>
        </div>
      </Modal>

      <Modal open={reportsOpen} onClose={() => setReportsOpen(false)} wide>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", margin: 0, fontFamily: "'Outfit', sans-serif" }}>Discount Reports</h3>
          <button type="button" onClick={() => setReportsOpen(false)} style={{ width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid rgba(232, 73, 8,0.12)", background:"white", color:"#64748b", cursor:"pointer", transition:"all 0.3s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.transform = "rotate(90deg)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.transform = "none"; }}>
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-2 items-center" style={{ marginBottom: 16 }}>
          {[7, 30, 90, 0].map(r => (
            <Pill key={r} label={r ? `Last ${r}d` : "All Time"} active={reportRange === r} onClick={() => setReportRange(r)} />
          ))}
          <div style={{ flex: 1 }} />
          <BtnSecondary onClick={exportReport} disabled={!reportBreakdown.length} style={{ padding:"6px 12px", fontSize:12 }}><Download size={14} /> Export CSV</BtnSecondary>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: 12, marginBottom: 16 }}>
          <KPICard title="Redemptions" value={filteredUsage.length.toLocaleString("en-IN")} icon={Tag} />
          <KPICard title="Total Saved" value={fmt(filteredUsage.reduce((s, u) => s + (Number(u.amountGiven) || 0), 0))} icon={TrendingDown} color={COLORS.success} />
          <KPICard title="Avg Savings" value={filteredUsage.length ? fmt(Math.round(filteredUsage.reduce((s, u) => s + (Number(u.amountGiven) || 0), 0) / filteredUsage.length)) : fmt(0)} icon={BarChart3} color={COLORS.info} />
          <KPICard title="Unique Discounts Used" value={new Set(filteredUsage.map(u => u.discountId)).size} icon={Percent} color="#8b5cf6" />
        </div>

        <GlassCard className="p-4" style={{ marginBottom: 16 }}>
          <SectionHeader title="Daily Redemption Trend" />
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={(() => {
                const dayMap = new Map();
                filteredUsage.forEach(u => {
                  const day = new Date(u.appliedAt || 0).toLocaleDateString("en-IN", { day:"2-digit", month:"short" });
                  dayMap.set(day, (dayMap.get(day) || 0) + 1);
                });
                return [...dayMap.entries()].map(([date, count]) => ({ date, count })).sort((a, b) => {
                  const da = a.date.split(" "), db = b.date.split(" ");
                  return new Date(`${da[1]} ${da[0]}, 2000`) - new Date(`${db[1]} ${db[0]}, 2000`);
                });
              })()}>
                <defs><linearGradient id="discGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#E84908" stopOpacity={0.3}/><stop offset="95%" stopColor="#E84908" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke="#E84908" fill="url(#discGrad)" strokeWidth={2} name="Redemptions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {reportBreakdown.length > 0 && <GlassCard className="p-4" style={{ marginBottom: 16 }}>
          <SectionHeader title="Top Discounts by Savings" />
          <div style={{ height: Math.min(reportBreakdown.length * 40 + 40, 280) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...reportBreakdown].sort((a, b) => b.total - a.total).slice(0, 10)} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v) => fmt(v)} />
                <Bar dataKey="total" fill="#E84908" radius={[0, 4, 4, 0]} name="Total Saved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>}

        <div style={{ overflowX: "auto" }}>
          <table className="w-full text-sm" style={{ minWidth: 460 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                {["Discount", "Redemptions", "Total Saved", "Avg Savings"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportBreakdown.length === 0 && <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No usage data for this range.</td></tr>}
              {reportBreakdown.map(r => {
                const d = discounts[r.id];
                const tInfo = discTypeStyle(d?.type);
                const pct = reportBreakdown.length > 0 ? Math.round(r.total / Math.max(...reportBreakdown.map(x => x.total)) * 100) : 0;
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 12px" }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}><span style={{ padding: "1px 6px", borderRadius: 99, fontSize: 9, fontWeight: 700, background: tInfo.bg, color: tInfo.color, textTransform: "uppercase", marginRight: 4 }}>{d?.type || "?"}</span>{d?.couponCode ? `Code: ${d.couponCode}` : ""}</div>
                    </td>
                    <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>
                      {r.count}
                      <div style={{ marginTop: 3, height: 3, borderRadius: 2, background: "#f1f5f9", overflow: "hidden", width: 60 }}><div style={{ height: "100%", width: `${Math.min(100, r.count / Math.max(...reportBreakdown.map(x => x.count), 1) * 100)}%`, background: ORANGE, borderRadius: 2 }} /></div>
                    </td>
                    <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 600, color: COLORS.success }}>{fmt(r.total)}<div style={{ marginTop: 3, height: 3, borderRadius: 2, background: "#f1f5f9", overflow: "hidden", width: 60 }}><div style={{ height: "100%", width: `${pct}%`, background: "#22c55e", borderRadius: 2 }} /></div></td>
                    <td style={{ padding: "8px 12px", fontSize: 13 }}>{r.count > 0 ? fmt(Math.round(r.total / r.count)) : "\u2014"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}

export default DiscountsPage;