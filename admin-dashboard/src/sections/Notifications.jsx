import { useState, useEffect } from "react";
import { Bell, Send, Volume2, VolumeX } from "lucide-react";
import { ref, onValue, off, push, set } from "firebase/database";
import { db } from "../firebase";
import GlassCard from "../components/GlassCard";
import BtnPrimary from "../components/BtnPrimary";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { ORANGE, COLORS } from "../utils/constants";

const Notifications = ({ showToast }) => {
  const [notifs, setNotifs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [sound, setSound] = useState(true);

  useEffect(() => {
    const broadcastsRef = ref(db, "system/broadcasts");
    const unsub = onValue(broadcastsRef, snap => {
      const val = snap.val();
      if (val) setNotifs(Object.keys(val).map(k => ({ id: k, ...val[k] })).sort((a, b) => ((b.sentAt||"") > (a.sentAt||"") ? 1 : -1)));
      else setNotifs([]);
    });
    return () => off(broadcastsRef, "value", unsub);
  }, []);

  const sendNotif = async (data) => {
    try {
      const ref_ = push(ref(db, "system/broadcasts"));
      await set(ref_, { ...data, sentAt: new Date().toISOString(), sentTo: 0, opened: 0 });
      setShowForm(false);
      showToast("Notification sent!");
    } catch { showToast("Failed to send"); }
  };

  const NotificationForm = ({ onSend, onClose }) => {
    const [title, setTitle] = useState("");
    const [msg, setMsg] = useState("");
    const [type, setType] = useState("promo");
    const send = () => {
      if (!title || !msg) return;
      onSend({ title, msg, type });
    };
    return (
      <div className="space-y-3">
        <input placeholder="Notification title" value={title} onChange={e => setTitle(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none" />
        <textarea placeholder="Message" value={msg} onChange={e => setMsg(e.target.value)} rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none resize-none" />
        <select value={type} onChange={e => setType(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none">
          <option value="promo">Promotional</option>
          <option value="alert">Alert</option>
          <option value="update">Update</option>
        </select>
        <button onClick={send} className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: ORANGE }}>Send Notification</button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BtnPrimary onClick={() => setShowForm(true)}><Send size={13} /> New Notification</BtnPrimary>
        <button onClick={() => setSound(p => !p)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600">
          {sound ? <Volume2 size={13} /> : <VolumeX size={13} />}
          Sound {sound ? "On" : "Off"}
        </button>
      </div>
      <div className="space-y-3">
        {notifs.map(n => (
          <GlassCard key={n.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: n.type === "alert" ? "#ef444420" : n.type === "promo" ? "#f36b2120" : "#3b82f620" }}>
                  <Bell size={14} style={{ color: n.type === "alert" ? COLORS.error : n.type === "promo" ? ORANGE : COLORS.info }} />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">{n.title}</div>
                  <div className="text-xs text-slate-500">{n.sentAt ? new Date(n.sentAt).toLocaleString() : "-"}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                style={{
                  backgroundColor: n.type === "alert" ? "#ef444420" : n.type === "promo" ? "#f36b2120" : "#3b82f620",
                  color: n.type === "alert" ? COLORS.error : n.type === "promo" ? ORANGE : COLORS.info
                }}>{n.type}</span>
            </div>
            <p className="text-sm text-slate-600 mb-3">{n.msg}</p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Sent to {(n.sentTo || 0).toLocaleString()} users · {((n.opened || 0) / (n.sentTo || 1) * 100).toFixed(0)}% opened</span>
            </div>
          </GlassCard>
        ))}
        {notifs.length === 0 && <EmptyState icon={Bell} msg="No notifications sent yet" />}
      </div>
      {showForm && (
        <Modal title="New Notification" onClose={() => setShowForm(false)}>
          <NotificationForm onSend={sendNotif} onClose={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  );
};

export default Notifications;
