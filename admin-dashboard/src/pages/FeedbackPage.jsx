import React, { useState, useEffect, useCallback, useMemo } from "react";
import { X, CheckCircle, EyeOff, Send } from "lucide-react";
import { update, onValue, off, Outlet } from "../firebase";
import { relTime } from "../utils";
import { StarRating, Pill, GlassCard, Avatar, SkeletonPage, Pagination } from "../components";
import { ORANGE } from "../constants";
import "../App.css";

function FeedbackPage({ showToast }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const REVIEW_PAGE_SIZE = 20;
  const [reviewPage, setReviewPage] = useState(1);
  const [replyFor, setReplyFor] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [modTab, setModTab] = useState("all");

  useEffect(() => {
    const r = Outlet("reviews");
    if (!r) { setLoading(false); return; }
    const unsub = onValue(r, snap => {
      const v = snap.val() || {};
      setReviews(Object.keys(v).map(k => ({ id: k, ...v[k] })).sort((a,b) => (b.createdAt||0) - (a.createdAt||0)));
      setLoading(false);
    }, () => setLoading(false));
    return () => off(r, "value", unsub);
  }, []);

  const modFiltered = useMemo(() => {
    if (modTab === "all") return reviews;
    if (modTab === "pending") return reviews.filter(r => !r.status || r.status === "pending");
    return reviews.filter(r => r.status === modTab);
  }, [reviews, modTab]);

  useEffect(() => { setReviewPage(1); }, [modFiltered.length]);
  const totalPages = Math.max(1, Math.ceil(modFiltered.length / REVIEW_PAGE_SIZE));
  const paginatedReviews = modFiltered.slice((reviewPage - 1) * REVIEW_PAGE_SIZE, reviewPage * REVIEW_PAGE_SIZE);

  const modAction = useCallback(async (id, status) => {
    try {
      await update(Outlet(`reviews/${id}`), { status, moderatedAt: Date.now() });
      showToast(status === "approved" ? "Review approved" : status === "hidden" ? "Review hidden" : "Status updated", "success");
    } catch(e) { showToast("Action failed", "error"); }
  }, [showToast]);

  if (loading) return <SkeletonPage cards={6} />;

  const counts = [5,4,3,2,1].map(n => reviews.filter(r => Math.round(Number(r.rating)||0) === n).length);
  const total = reviews.length;
  const avg = total > 0 ? (reviews.reduce((s, r) => s + (Number(r.rating)||0), 0) / total) : 0;
  const pcts = counts.map(c => total ? Math.round((c / total) * 100) : 0);
  const pendingCount = reviews.filter(r => !r.status || r.status === "pending").length;

  return (
    <div className="space-y-4">
      <div style={{ fontSize:11, color:"#94a3b8" }}>Path: <code>businesses/.../reviews</code></div>
      <GlassCard className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-black text-slate-800" style={{ fontFamily:"'Outfit', sans-serif" }}>{avg ? avg.toFixed(1) : "—"}</div>
            {avg > 0 ? <StarRating rating={avg} /> : <div className="text-xs text-slate-400 mt-1">No ratings yet</div>}
            <div className="text-xs text-slate-500 mt-1">{total} review{total !== 1 ? "s" : ""}</div>
          </div>
          <div className="flex-1 space-y-2 w-full">
            {[5,4,3,2,1].map((n,i) => (
              <div key={n} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-4">{n}★</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width:`${pcts[i]}%`, backgroundColor:"#f59e0b" }} />
                </div>
                <span className="text-xs text-slate-400 w-8">{pcts[i]}%</span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
      <div className="flex gap-2 flex-wrap">
        <Pill label={`All (${reviews.length})`} active={modTab === "all"} onClick={() => setModTab("all")} />
        <Pill label={`Pending (${pendingCount})`} active={modTab === "pending"} onClick={() => setModTab("pending")} />
        <Pill label={`Approved (${reviews.filter(r => r.status === "approved").length})`} active={modTab === "approved"} onClick={() => setModTab("approved")} />
        <Pill label={`Hidden (${reviews.filter(r => r.status === "hidden").length})`} active={modTab === "hidden"} onClick={() => setModTab("hidden")} />
      </div>
      <div className="space-y-3">
        {modFiltered.length === 0 && <GlassCard className="p-6"><div className="text-center text-slate-400 text-sm">No reviews in this category.</div></GlassCard>}
        {paginatedReviews.map(f => {
          const st = f.status || "pending";
          return (
          <GlassCard key={f.id} className="p-4" style={{ opacity: st === "hidden" ? 0.6 : 1 }}>
            <div className="flex items-start gap-3">
              <Avatar name={f.customerName || f.name || "Guest"} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                  <span className="font-semibold text-slate-800">{f.customerName || f.name || "Guest"}</span>
                  <div className="flex items-center gap-2">
                    {st === "pending" && <span className="status-pill" style={{ fontSize:9, fontWeight:700, background:"#fef3c7", color:"#d97706", textTransform:"uppercase" }}>Pending</span>}
                    {st === "approved" && <span className="status-pill" style={{ fontSize:9, fontWeight:700, background:"#dcfce7", color:"#16a34a", textTransform:"uppercase" }}>Approved</span>}
                    {st === "hidden" && <span className="status-pill" style={{ fontSize:9, fontWeight:700, background:"#fee2e2", color:"#dc2626", textTransform:"uppercase" }}>Hidden</span>}
                    <span className="text-xs text-slate-400">{f.createdAt ? relTime(f.createdAt) : ""}</span>
                  </div>
                </div>
                <StarRating rating={Number(f.rating)||0} />
                {f.comment && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{f.comment}</p>}
                {f.dishName && <span className="text-xs mt-2 inline-block px-2 py-0.5 rounded-full" style={{ backgroundColor:"#fff7ed", color:ORANGE }}>re: {f.dishName}</span>}
                {f.reply && <div className="mt-3 pl-3 border-l-2 border-orange-300"><p className="text-xs text-orange-700 font-medium">Your reply:</p><p className="text-sm text-slate-600">{f.reply}</p></div>}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {!f.reply && replyFor !== f.id && (
                    <button onClick={() => { setReplyFor(f.id); setReplyText(""); }} style={{ padding:"3px 10px", borderRadius:6, border:"1px solid #e2e8f0", background:"white", color:ORANGE, fontSize:10, fontWeight:600, cursor:"pointer" }}>Reply</button>
                  )}
                  {st !== "approved" && (
                    <button onClick={() => modAction(f.id, "approved")} style={{ padding:"3px 10px", borderRadius:6, border:"1px solid #dcfce7", background:"#f0fdf4", color:"#16a34a", fontSize:10, fontWeight:600, cursor:"pointer" }}><CheckCircle size={12} style={{marginRight:3}} />Approve</button>
                  )}
                  {st !== "hidden" && (
                    <button onClick={() => modAction(f.id, "hidden")} style={{ padding:"3px 10px", borderRadius:6, border:"1px solid #fee2e2", background:"#fef2f2", color:"#dc2626", fontSize:10, fontWeight:600, cursor:"pointer" }}><EyeOff size={12} style={{marginRight:3}} />Hide</button>
                  )}
                </div>
                {replyFor === f.id && (
                  <div className="mt-3 flex gap-2">
                    <input value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply..." style={{ flex:1, padding:"6px 10px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, outline:"none" }} autoFocus />
                    <button onClick={async () => { if (!replyText.trim()) return; try { await update(Outlet(`reviews/${f.id}`), { reply: replyText.trim(), repliedAt: Date.now() }); setReplyFor(null); showToast("Reply posted","success"); } catch(e) { showToast("Failed","error"); } }} style={{ padding:"6px 12px", borderRadius:6, border:"none", background:ORANGE, color:"white", fontSize:11, fontWeight:600, cursor:"pointer" }}>Send</button>
                    <button onClick={() => setReplyFor(null)} style={{ padding:"6px 8px", borderRadius:6, border:"1px solid #e2e8f0", background:"white", color:"#64748b", fontSize:11, cursor:"pointer" }}>X</button>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
          );
        })}
        <Pagination page={reviewPage} totalPages={totalPages} onPageChange={setReviewPage} totalItems={modFiltered.length} pageSize={REVIEW_PAGE_SIZE} />
      </div>
    </div>
  );
}

export default FeedbackPage;