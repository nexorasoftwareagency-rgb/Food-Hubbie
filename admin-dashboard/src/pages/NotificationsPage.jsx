import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Megaphone, Send, Bell, Clock, Users, Eye, CheckCircle, XCircle } from "lucide-react";
import { Outlet, onValue, off, update, push, get, ref, db } from "../firebase";
import { fmt, relTime, fmtDate } from "../utils";
import { GlassCard, EmptyState, SkeletonPage, BtnPrimary, BtnSecondary, Modal, Input, Select, Pill, KPICard, Pagination } from "../components";
import { ORANGE, COLORS } from "../constants";
import "../App.css";

function NotificationsPage({ showToast }) {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendTitle, setSendTitle] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sendAudience, setSendAudience] = useState("all");
  const [sending, setSending] = useState(false);
  const PAGE_SIZE = 20;

  useEffect(() => {
    const r = Outlet("broadcasts");
    if (!r) { setLoading(false); return; }
    const unsub = onValue(r, snap => {
      const v = snap.val() || {};
      setBroadcasts(Object.keys(v).map(k => ({ id: k, ...v[k] })).sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0)));
      setLoading(false);
    }, () => setLoading(false));
    return () => off(r, "value", unsub);
  }, []);

  useEffect(() => { setPage(1); }, [broadcasts.length]);

  const weekAgo = useMemo(() => Date.now() - 7 * 24 * 60 * 60 * 1000, []);
  const totalSent = broadcasts.length;
  const thisWeek = broadcasts.filter(b => (b.sentAt || 0) >= weekAgo).length;
  const withStats = broadcasts.filter(b => b.stats && b.stats.delivered > 0);
  const avgOpenRate = withStats.length > 0
    ? Math.round(withStats.reduce((s, b) => s + ((b.stats.opened || 0) / b.stats.delivered) * 100, 0) / withStats.length)
    : 0;

  const totalPages = Math.max(1, Math.ceil(broadcasts.length / PAGE_SIZE));
  const pageBroadcasts = broadcasts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSend = useCallback(async () => {
    if (!sendTitle.trim() || !sendBody.trim()) return showToast("Title and body are required", "warning");
    setSending(true);
    try {
      await push(Outlet("broadcasts"), {
        title: sendTitle.trim(),
        body: sendBody.trim(),
        audience: sendAudience,
        sentAt: Date.now(),
      });
      showToast("Broadcast sent", "success");
      setSendOpen(false);
      setSendTitle("");
      setSendBody("");
      setSendAudience("all");
    } catch (e) { showToast("Failed to send", "error"); }
    finally { setSending(false); }
  }, [sendTitle, sendBody, sendAudience, showToast]);

  if (loading) return <SkeletonPage kpi={3} cards={4} />;

  return (
    <div className="space-y-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        <KPICard title="Total Sent" value={totalSent} icon={Send} color={COLORS.info} />
        <KPICard title="This Week" value={thisWeek} icon={Clock} color={ORANGE} />
        <KPICard title="Avg Open Rate" value={avgOpenRate ? `${avgOpenRate}%` : "\u2014"} icon={Eye} color={COLORS.success} />
      </div>

      <div className="flex justify-end">
        <BtnPrimary onClick={() => setSendOpen(true)}><Megaphone size={14} style={{marginRight:6}} /> Send Broadcast</BtnPrimary>
      </div>

      <div className="space-y-3">
        {pageBroadcasts.length === 0 && <GlassCard className="p-6"><div className="text-center text-slate-400 text-sm">No broadcasts sent yet.</div></GlassCard>}
        {pageBroadcasts.map(b => (
          <GlassCard key={b.id} className="p-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-slate-800">{b.title || "Untitled"}</span>
                <Pill label={b.audience || "all"} active />
                {b.sentAt && <span className="text-xs text-slate-400">{relTime(b.sentAt)}</span>}
              </div>
              <p className="text-sm text-slate-600 line-clamp-2">{b.body}</p>
              {b.stats && (
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span><CheckCircle size={11} style={{marginRight:3, color:COLORS.success}} />{b.stats.delivered || 0} delivered</span>
                  <span><Eye size={11} style={{marginRight:3, color:COLORS.info}} />{b.stats.opened || 0} opened</span>
                </div>
              )}
            </div>
          </GlassCard>
        ))}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} totalItems={broadcasts.length} pageSize={PAGE_SIZE} />
      </div>

      <Modal open={sendOpen} onClose={() => setSendOpen(false)}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, paddingBottom:16, borderBottom:"1px solid rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize:18, fontWeight:700, color:"#0f172a", margin:0, fontFamily:"'Outfit', sans-serif" }}>Send Broadcast</h3>
          <button type="button" onClick={() => setSendOpen(false)} style={{ width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid rgba(232,73,8,0.12)", background:"white", color:"#64748b", cursor:"pointer" }}><XCircle size={18} /></button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <Input value={sendTitle} onChange={e => setSendTitle(e.target.value)} placeholder="Notification title" />
          <textarea value={sendBody} onChange={e => setSendBody(e.target.value)} placeholder="Notification body..." rows={3} style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:13, outline:"none", resize:"vertical", fontFamily:"inherit" }} />
          <Select value={sendAudience} onChange={e => setSendAudience(e.target.value)}>
            <option value="all">All</option>
            <option value="admins">Admins</option>
            <option value="customers">Customers</option>
          </Select>
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:20, paddingTop:16, borderTop:"1px solid rgba(0,0,0,0.06)" }}>
          <BtnSecondary onClick={() => setSendOpen(false)} style={{ padding:"8px 18px", fontSize:13 }}>Cancel</BtnSecondary>
          <BtnPrimary onClick={handleSend} disabled={sending} style={{ padding:"8px 18px", fontSize:13 }}>{sending ? "Sending..." : "Send"}</BtnPrimary>
        </div>
      </Modal>
    </div>
  );
}

export default NotificationsPage;
