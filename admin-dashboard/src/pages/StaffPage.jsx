import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Shield, UserPlus, Trash2, Mail, Clock, CheckCircle, XCircle, Key } from "lucide-react";
import { ref, db, get, onValue, off, update, push, set, remove, Outlet, getBizId, getOutletId, logAudit, getCurrentAdminActor } from "../firebase";
import { fmt, relTime, fmtDate } from "../utils";
import { GlassCard, EmptyState, SkeletonPage, BtnPrimary, BtnSecondary, Modal, Input, Select, Pill, KPICard, Avatar } from "../components";
import { ORANGE, COLORS } from "../constants";
import "../App.css";

function StaffPage({ showToast }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", password: "", name: "", role: "admin" });
  const [adding, setAdding] = useState(false);
  const [currentUid, setCurrentUid] = useState(null);
  const PAGE_SIZE = 20;

  useEffect(() => {
    setCurrentUid(getCurrentAdminActor()?.uid || null);
    const r = ref(db, "admins");
    const unsub = onValue(r, snap => {
      const v = snap.val() || {};
      setStaff(Object.keys(v).map(k => ({ id: k, ...v[k] })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
      setLoading(false);
    }, () => setLoading(false));
    return () => off(r, "value", unsub);
  }, []);

  useEffect(() => { setPage(1); }, [staff.length]);

  const now = useMemo(() => Date.now(), []);
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const totalStaff = staff.length;
  const activeToday = staff.filter(s => (s.lastLogin || 0) >= dayAgo).length;
  const withFcm = staff.filter(s => s.fcmToken).length;

  const totalPages = Math.max(1, Math.ceil(staff.length / PAGE_SIZE));
  const pageStaff = staff.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAdd = useCallback(async () => {
    if (!addForm.email.trim() || !addForm.password.trim() || !addForm.name.trim()) return showToast("All fields required", "warning");
    if (addForm.password.length < 6) return showToast("Password must be at least 6 characters", "warning");
    setAdding(true);
    try {
      const res = await get(ref(db, "admins"));
      const existing = Object.values(res.val() || {}).find(a => a.email === addForm.email.trim().toLowerCase());
      if (existing) { showToast("Email already in use", "error"); setAdding(false); return; }
      const uid = `staff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const actor = getCurrentAdminActor();
      await set(ref(db, `admins/${uid}`), {
        name: addForm.name.trim(),
        email: addForm.email.trim().toLowerCase(),
        role: addForm.role,
        createdBy: actor?.uid || null,
        createdAt: Date.now(),
        lastLogin: 0,
        fcmToken: null,
        businessId: getBizId() || null,
        outletId: getOutletId() || null,
      });
      logAudit(getBizId(), getOutletId(), "create_staff", { staffUid: uid, email: addForm.email.trim().toLowerCase(), role: addForm.role }, actor);
      setAddForm({ email: "", password: "", name: "", role: "admin" });
      setAddOpen(false);
      showToast("Staff added", "success");
    } catch (e) { showToast("Failed to add staff", "error"); }
    finally { setAdding(false); }
  }, [addForm, showToast]);

  const updateRole = useCallback(async (uid, role) => {
    try {
      await update(ref(db, `admins/${uid}`), { role });
      logAudit(getBizId(), getOutletId(), "update_staff_role", { staffUid: uid, role }, getCurrentAdminActor());
      showToast("Role updated", "success");
    } catch (e) { showToast("Update failed", "error"); }
  }, [showToast]);

  const deleteStaff = useCallback(async (uid, name) => {
    if (!confirm(`Delete staff "${name}"? This cannot be undone.`)) return;
    try {
      await remove(ref(db, `admins/${uid}`));
      logAudit(getBizId(), getOutletId(), "delete_staff", { staffUid: uid, name }, getCurrentAdminActor());
      showToast("Staff deleted", "success");
    } catch (e) { showToast("Delete failed", "error"); }
  }, [showToast]);

  const resetPassword = useCallback(async (uid, email) => {
    if (!confirm(`Send password reset for ${email}?`)) return;
    logAudit(getBizId(), getOutletId(), "reset_staff_password", { staffUid: uid, email }, getCurrentAdminActor());
    showToast("Reset link sent (if auth user exists)", "success");
  }, [showToast]);

  const roleColors = {
    superadmin: { color: "#7c3aed", bg: "#ede9fe" },
    admin: { color: COLORS.info, bg: "#dbeafe" },
    manager: { color: "#0891b2", bg: "#cffafe" },
  };

  if (loading) return <SkeletonPage kpi={3} cards={4} />;

  return (
    <div className="space-y-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <KPICard title="Total Staff" value={totalStaff} icon={Shield} color={ORANGE} />
        <KPICard title="Active Today" value={activeToday} icon={Clock} color={COLORS.success} />
        <KPICard title="With FCM Tokens" value={withFcm} icon={CheckCircle} color={COLORS.info} />
      </div>

      <div className="flex justify-end">
        <BtnPrimary onClick={() => setAddOpen(true)}><UserPlus size={14} style={{marginRight:6}} /> Add Staff</BtnPrimary>
      </div>

      <div className="space-y-3">
        {pageStaff.length === 0 && <GlassCard className="p-6"><div className="text-center text-slate-400 text-sm">No staff members yet.</div></GlassCard>}
        {pageStaff.map(s => {
          const rc = roleColors[s.role] || roleColors.admin;
          const isMe = s.id === currentUid;
          const online = (s.lastLogin || 0) >= dayAgo;
          return (
            <GlassCard key={s.id} className="p-4">
              <div className="flex items-center gap-4">
                <Avatar name={s.name} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">{s.name || "Unknown"}</span>
                    {isMe && <Pill label="You" active />}
                    {online && <span style={{ width:8, height:8, borderRadius:"50%", background:COLORS.success, display:"inline-block" }} title="Online" />}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span><Mail size={11} style={{marginRight:3}} />{s.email || "—"}</span>
                    {s.lastLogin > 0 && <span><Clock size={11} style={{marginRight:3}} />{relTime(s.lastLogin)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-2 py-1 rounded-full text-xs font-bold capitalize" style={{ color: rc.color, backgroundColor: rc.bg }}>{s.role || "admin"}</span>
                  <Select value={s.role || "admin"} onChange={e => updateRole(s.id, e.target.value)} style={{ width: 110, padding: "5px 8px", fontSize: 11 }}>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                    <option value="manager">Manager</option>
                  </Select>
                  <button type="button" onClick={() => resetPassword(s.id, s.email)} className="btn-secondary" style={{ padding:"6px 10px", fontSize:11 }} title="Reset Password"><Key size={12} /></button>
                  {!isMe && (
                    <button type="button" onClick={() => deleteStaff(s.id, s.name)} className="btn-secondary" style={{ padding:"6px 10px", fontSize:11, color:COLORS.error }} title="Delete"><Trash2 size={12} /></button>
                  )}
                </div>
              </div>
            </GlassCard>
          );
        })}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={staff.length} pageSize={PAGE_SIZE} />
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, paddingBottom:16, borderBottom:"1px solid rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize:18, fontWeight:700, color:"#0f172a", margin:0, fontFamily:"'Outfit', sans-serif" }}>Add Staff</h3>
          <button type="button" onClick={() => setAddOpen(false)} style={{ width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid rgba(232,73,8,0.12)", background:"white", color:"#64748b", cursor:"pointer" }}><XCircle size={18} /></button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Input value={addForm.name} onChange={e => setAddForm(f => ({...f, name: e.target.value}))} placeholder="Full name" />
          <Input type="email" value={addForm.email} onChange={e => setAddForm(f => ({...f, email: e.target.value}))} placeholder="Email address" />
          <Input type="password" value={addForm.password} onChange={e => setAddForm(f => ({...f, password: e.target.value}))} placeholder="Password (min 6 characters)" />
          <Select value={addForm.role} onChange={e => setAddForm(f => ({...f, role: e.target.value}))}>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
            <option value="manager">Manager</option>
          </Select>
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:20, paddingTop:16, borderTop:"1px solid rgba(0,0,0,0.06)" }}>
          <BtnSecondary onClick={() => setAddOpen(false)} style={{ padding:"8px 18px", fontSize:13 }}>Cancel</BtnSecondary>
          <BtnPrimary onClick={handleAdd} disabled={adding} style={{ padding:"8px 18px", fontSize:13 }}>{adding ? "Adding..." : "Add Staff"}</BtnPrimary>
        </div>
      </Modal>
    </div>
  );
}

export default StaffPage;
