import { useState, useMemo } from "react";
import { ThumbsUp, ThumbsDown, MessageCircle } from "lucide-react";
import { push } from "firebase/database";
import { useRealtimeData, Outlet } from "../hooks/useRealtimeData";
import GlassCard from "../components/GlassCard";
import StarRating from "../components/StarRating";
import Avatar from "../components/Avatar";
import Pill from "../components/Pill";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { ORANGE } from "../utils/constants";

const Feedback = ({ showToast }) => {
  const { data: reviews = [] } = useRealtimeData("feedbacks");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState(null);

  const avgRating = useMemo(() =>
    reviews.length ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0, [reviews]);

  const filtered = useMemo(() => {
    let arr = [...reviews];
    if (filter === "positive") arr = arr.filter(r => r.rating >= 4);
    else if (filter === "negative") arr = arr.filter(r => r.rating <= 2);
    else if (filter === "neutral") arr = arr.filter(r => r.rating === 3);
    if (sort === "newest") arr.sort((a, b) => ((b.createdAt||"") > (a.createdAt||"") ? 1 : -1));
    else if (sort === "highest") arr.sort((a, b) => (b.rating||0) - (a.rating||0));
    else if (sort === "lowest") arr.sort((a, b) => (a.rating||0) - (b.rating||0));
    return arr;
  }, [reviews, filter, sort]);

  const reply = async (id) => {
    try {
      await push(Outlet(`feedbacks/${id}/replies`), {
        text: "Thank you for your feedback!",
        createdAt: new Date().toISOString()
      });
      setSelected(null);
      showToast("Reply sent!");
    } catch { showToast("Failed to send reply"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-2">
        <div className="text-center">
          <div className="text-3xl font-bold" style={{ color: ORANGE }}>{avgRating.toFixed(1)}</div>
          <StarRating rating={Math.round(avgRating)} />
          <div className="text-xs text-slate-500">{reviews.length} reviews</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {["all","positive","neutral","negative"].map(f => (
          <Pill key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} active={filter === f} onClick={() => setFilter(f)} />
        ))}
      </div>
      <div className="flex gap-3 items-center">
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none">
          <option value="newest">Newest First</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
      </div>
      <div className="space-y-3">
        {filtered.map(r => (
          <GlassCard key={r.id} className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => setSelected(r)}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <Avatar name={r.name || r.customerName || "Anonymous"} size={36} />
                <div>
                  <div className="font-bold text-slate-800 text-sm">{r.name || r.customerName || "Anonymous"}</div>
                  <StarRating rating={r.rating || 0} />
                </div>
              </div>
              <span className="text-xs text-slate-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "-"}</span>
            </div>
            <p className="text-sm text-slate-600 mb-3">{r.review || r.comment || ""}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><ThumbsUp size={12} /> {r.likes || 0}</span>
                <span className="flex items-center gap-1"><ThumbsDown size={12} /> {r.dislikes || 0}</span>
                {r.replied && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-green-600 bg-green-100">Replied</span>}
              </div>
              <div className="flex gap-1">
                {(r.tags || []).map(t => (
                  <span key={t} className="px-1.5 py-0.5 rounded text-[10px] font-medium capitalize"
                    style={{ backgroundColor: ORANGE + "15", color: ORANGE }}>{t}</span>
                ))}
              </div>
            </div>
          </GlassCard>
        ))}
        {filtered.length === 0 && <EmptyState icon={MessageCircle} msg="No reviews found" />}
      </div>
      {selected && (
        <Modal title="Review Detail" onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={selected.name || "Anonymous"} size={44} />
              <div>
                <div className="font-bold text-slate-800">{selected.name || "Anonymous"}</div>
                <StarRating rating={selected.rating || 0} />
                <div className="text-xs text-slate-500">{selected.createdAt ? new Date(selected.createdAt).toLocaleDateString() : "-"}</div>
              </div>
            </div>
            <p className="text-sm text-slate-600">{selected.review || selected.comment || ""}</p>
            <div className="flex gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1"><ThumbsUp size={14} /> {selected.likes || 0}</span>
              <span className="flex items-center gap-1"><ThumbsDown size={14} /> {selected.dislikes || 0}</span>
            </div>
            {selected.replied ? (
              <div className="p-3 bg-green-50 rounded-xl text-sm text-green-700">You have already replied to this review.</div>
            ) : (
              <button onClick={() => reply(selected.id)}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: ORANGE }}>Send Reply</button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Feedback;
