import React, { useState } from "react";
import { Star, X, Minus, Plus, ChevronLeft, ChevronRight, Clock, XCircle, CheckCircle, Lock } from "lucide-react";
import { ORANGE, COLORS, ORD_ST, ORDER_STATUSES, PAGE_GUIDES, PAGE_TITLES } from "./constants";
import { fmt } from "./utils";

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────

export const KPICard = ({ title, value, sub, icon: Icon, color = ORANGE }) => (
  <div className="glass-card p-4 flex flex-col gap-2" style={{ background:"white", borderRadius:16, border:"1px solid rgba(0,0,0,0.04)", boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
      <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
        <Icon size={15} style={{ color }} />
      </span>
    </div>
    <div className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</div>
    {sub && <div className="text-xs text-slate-500">{sub}</div>}
  </div>
);

export const StarRating = ({ rating }) => (
  <span style={{ display:"inline-flex", gap:2, alignItems:"center" }}>
    {[1,2,3,4,5].map(i => <Star key={i} size={12} fill={i<=rating?"#f59e0b":"#e2e8f0"} color={i<=rating?"#f59e0b":"#e2e8f0"} />)}
  </span>
);

export const Pill = ({ label, active, onClick }) => (
  <div onClick={onClick} className={`pill${active ? " pill-active" : " pill-inactive"}`}>{label}</div>
);

export const ToggleSwitch = ({ checked, onChange }) => (
  <div onClick={()=>onChange(!checked)} style={{ width:36, height:20, borderRadius:10, background:checked?ORANGE:"#cbd5e1", position:"relative", cursor:"pointer", flexShrink:0 }}>
    <div style={{ width:16, height:16, borderRadius:"50%", background:"white", position:"absolute", top:2, boxShadow:"0 1px 3px rgba(0,0,0,0.15)", transition:"left 0.15s", left:checked?"18px":"2px" }} />
  </div>
);

export const EmptyState = ({ icon: Icon, msg }) => (
  <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>
    <Icon size={36} style={{ margin:"0 auto 8px", opacity:0.3 }} />
    <div style={{ fontSize:13, fontWeight:500 }}>{msg}</div>
  </div>
);

export const SectionHeader = ({ title, action }) => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
    <h3 style={{ fontSize:14, fontWeight:700, color:"#0f172a", margin:0, fontFamily:"'Outfit', sans-serif" }}>{title}</h3>
    {action}
  </div>
);

export const StatusBadge = ({ status }) => {
  const s = ORD_ST[status] || ORDER_STATUSES[status] || { label: status || "Unknown", color: "#64748b", bg: "#f1f5f9" };
  return <span className="status-pill" style={{ color:s.color, backgroundColor:s.bg, border:`1px solid ${s.color}30` }}>● {s.label}</span>;
};

export const GlassCard = ({ children, className="", style }) => (
  <div className={`glass-card${className ? " " + className : ""}`} style={style}>{children}</div>
);

export const BtnPrimary = ({ children, className="", style, onClick, disabled, type = "button" }) => (
  <button type={type} onClick={onClick} disabled={disabled} className={`btn-primary${className ? " " + className : ""}`} style={{ fontSize:14, padding:"10px 18px", cursor:disabled?"not-allowed":"pointer", ...style }}>{children}</button>
);

export const BtnSecondary = ({ children, style, onClick }) => (
  <button onClick={onClick} className="btn-secondary" style={{ padding:"8px 14px", fontSize:13, cursor:"pointer", ...style }}>{children}</button>
);

export const Modal = ({ children, open, onClose, wide }) => open ? (
  <div style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)" }}>
    <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.4)" }} />
    <div style={{ position:"relative", maxWidth:wide?700:500, width:"100%", maxHeight:"90vh", overflow:"auto", background:"rgba(255,255,255,0.98)", borderRadius:20, padding:24, boxShadow:"0 24px 80px rgba(0,0,0,0.2)", animation:"modalSlideIn 0.3s cubic-bezier(0.4,0,0.2,1)" }}>{children}</div>
  </div>
) : null;

export const Toast = ({ msg, type, onClose }) => (
  <div onClick={onClose} style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", zIndex:99999, display:"flex", alignItems:"center", gap:10, padding:"12px 20px", borderRadius:12, background:type==="error"?"#ef4444":type==="info"?"#3b82f6":"#16a34a", color:"white", fontSize:13, fontWeight:500, boxShadow:"0 12px 40px rgba(0,0,0,0.2)", cursor:"pointer", maxWidth:"90vw", animation:"modalSlideIn 0.25s cubic-bezier(0.4,0,0.2,1)" }}>
    {type === "error" ? <XCircle size={16} /> : <CheckCircle size={16} />}{msg}
  </div>
);

export const Avatar = ({ name, size=32 }) => {
  const initials = (name||"A").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
  return <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${ORANGE},#D94400)`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:size*0.38, fontWeight:700, flexShrink:0 }}>{initials}</div>;
};

export const Skeleton = ({ width="100%", height=16, borderRadius=8, style }) => (
  <div className="skeleton" style={{ width, height, borderRadius, ...style }} />
);

export const SkeletonCircle = ({ size=36 }) => <div className="skeleton" style={{ width:size, height:size, borderRadius:"50%" }} />;

export const SkeletonKPI = () => <div className="skeleton skeleton-kpi" />;

export const SkeletonCard = () => <div className="skeleton skeleton-card" />;

export const SkeletonText = ({ width="60%", height=14 }) => <div className="skeleton" style={{ width, height, marginBottom:8 }} />;

export const SkeletonTable = ({ rows=5, cols=5 }) => (
  <div>
    <div className="skeleton-table-header">
      {Array.from({length: cols}).map((_, i) => <Skeleton key={`h${i}`} width={`${80/cols}%`} height={12} />)}
    </div>
    {Array.from({length: rows}).map((_, i) => (
      <div key={`r${i}`} className="skeleton-table-row">
        {Array.from({length: cols}).map((_, j) => <Skeleton key={`c${j}`} width={`${80/cols}%`} height={14} />)}
      </div>
    ))}
  </div>
);

export const SkeletonGrid = ({ cards=6 }) => (
  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:12 }}>
    {Array.from({length: cards}).map((_, i) => <SkeletonCard key={i} />)}
  </div>
);

export const SkeletonPage = ({ kpi=0, table=0, cards=0 }) => (
  <div className="space-y-4">
    {kpi > 0 && <div className="grid gap-3" style={{ gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))" }}>
      {Array.from({length: kpi}).map((_, i) => <SkeletonKPI key={i} />)}
    </div>}
    {table > 0 && <SkeletonTable rows={5} cols={table} />}
    {cards > 0 && <SkeletonGrid cards={cards} />}
  </div>
);

export const Loading = () => (
  <div className="text-center py-12" style={{ color:"#94a3b8" }}>
    <div style={{ width:32, height:32, border:"3px solid #f1f5f9", borderTopColor:ORANGE, borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 8px" }} />
    <div style={{ fontSize:13 }}>Loading...</div>
  </div>
);

export const Input = (p) => <input {...p} style={{ padding:"10px 14px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:13, color:"#1e293b", background:"#fff", outline:"none", width:"100%", transition:"border-color 0.2s, box-shadow 0.2s", ...p.style }} />;

export const Select = ({ children, ...p }) => <select {...p} style={{ padding:"10px 14px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:13, color:"#1e293b", background:"#fff", outline:"none", width:"100%", transition:"border-color 0.2s, box-shadow 0.2s", ...p.style }}>{children}</select>;

export const StatCard = ({ label, value, icon: Icon, color, bg, sub }) => (
  <GlassCard className="p-4 flex flex-col gap-2" style={{ flex: 1, minWidth: 160 }}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg || `${color || ORANGE}18` }}>
        <Icon size={15} style={{ color: color || ORANGE }} />
      </span>
    </div>
    <div className="text-2xl font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: color || ORANGE }}>{value ?? "\u2014"}</div>
    {sub && <div className="text-xs text-slate-500">{sub}</div>}
  </GlassCard>
);

export const SectionLabel = ({ children }) => <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, color:"#94a3b8", marginBottom:8 }}>{children}</div>;

export const Pagination = ({ page, totalPages, onPageChange, totalItems, pageSize }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="glass-card" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, padding:"10px 16px", marginTop:12 }}>
      <button type="button" className="btn-secondary" onClick={() => onPageChange(page - 1)} disabled={page <= 1}
        style={{ padding:"6px 14px", fontSize:12, opacity:page <= 1 ? 0.4 : 1, cursor:page <= 1 ? "not-allowed" : "pointer" }}>
        ← Prev
      </button>
      <span style={{ fontSize:12, color:"#64748b", fontWeight:500 }}>
        Page <strong style={{ color:"#0f172a" }}>{page}</strong> of <strong style={{ color:"#0f172a" }}>{totalPages}</strong>
        {totalItems != null && <span style={{ color:"#94a3b8" }}> ({totalItems} item{totalItems !== 1 ? "s" : ""})</span>}
      </span>
      <button type="button" className="btn-secondary" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
        style={{ padding:"6px 14px", fontSize:12, opacity:page >= totalPages ? 0.4 : 1, cursor:page >= totalPages ? "not-allowed" : "pointer" }}>
        Next →
      </button>
    </div>
  );
};

export function ReauthModal({ open, onConfirm, onCancel, busy, error }) {
  const [pwd, setPwd] = useState("");
  if (!open) return null;
  const submit = (e) => {
    e?.preventDefault();
    if (!pwd) return;
    onConfirm(pwd);
  };
  return (
    <div role="dialog" aria-modal="true" aria-label="Confirm password" style={{ position:"fixed", inset:0, zIndex:120, background:"rgba(15,23,42,0.55)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <form onSubmit={submit} className="glass-premium" style={{ width:"100%", maxWidth:380, padding:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"#fef3c7", display:"flex", alignItems:"center", justifyContent:"center" }}><Lock size={16} color="#b45309" /></div>
          <div style={{ fontSize:16, fontWeight:700, color:"#0f172a", fontFamily:"'Outfit', sans-serif" }}>Session locked</div>
        </div>
        <div style={{ fontSize:13, color:"#64748b", marginBottom:16, lineHeight:1.5 }}>
          You've been inactive. Re-enter your password to continue.
        </div>
        {error && <div role="alert" style={{ padding:"8px 12px", borderRadius:8, marginBottom:12, background:"#fef2f2", color:"#b91c1c", fontSize:12, fontWeight:500 }}>{error}</div>}
        <input
          aria-label="Password"
          autoFocus
          autoComplete="current-password"
          type="password"
          placeholder="Password"
          value={pwd}
          onChange={e => setPwd(e.target.value)}
          style={{ width:"100%", padding:"11px 14px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:14, color:"#1e293b", background:"#fff", marginBottom:12, outline:"none" }}
        />
        <div style={{ display:"flex", gap:8 }}>
          <button type="button" onClick={onCancel} disabled={busy} className="btn-secondary" style={{ flex:1, padding:"10px 0", fontSize:13, cursor:"pointer" }}>Sign out</button>
          <button type="submit" disabled={busy || !pwd} className="btn-primary" style={{ flex:1, padding:"10px 0", fontSize:13, cursor:busy?"not-allowed":"pointer", opacity:(busy || !pwd) ? 0.6 : 1 }}>{busy ? "Verifying..." : "Unlock"}</button>
        </div>
      </form>
    </div>
  );
}

export function PageGuideModal({ open, page, onClose }) {
  if (!open) return null;
  const guide = PAGE_GUIDES[page];
  if (!guide) return null;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(4px)" }}>
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.4)" }} />
      <div style={{ position:"relative", maxWidth:520, width:"100%", maxHeight:"90vh", overflow:"auto", background:"rgba(255,255,255,0.98)", borderRadius:20, padding:24, boxShadow:"0 24px 80px rgba(0,0,0,0.2)", animation:"modalSlideIn 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <h2 style={{ fontSize:18, fontWeight:700, color:"#0f172a", fontFamily:"'Outfit', sans-serif" }}>{(PAGE_TITLES[page]||page)} Guide</h2>
          <button type="button" onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"#94a3b8", fontSize:20, lineHeight:1, padding:4 }}>×</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {guide.map((step, i) => (
            <div key={i} style={{ display:"flex", gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"#fff7ed", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:ORANGE, fontSize:14, fontWeight:700 }}>{i + 1}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:"#0f172a", marginBottom:4 }}>{step.title}</div>
                <div style={{ fontSize:13, color:"#64748b", lineHeight:1.5 }}>{step.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
