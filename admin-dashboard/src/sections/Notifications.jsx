import { useState } from "react";
import { Send } from "lucide-react";
import GlassCard from "../components/GlassCard";
import BtnPrimary from "../components/BtnPrimary";
import SectionHeader from "../components/SectionHeader";
import { ORANGE } from "../utils/constants";

const Notifications = ({ showToast }) => {
  const [form, setForm] = useState({ title:"", body:"", audience:"all" });
  const [sent, setSent] = useState([
    { id:1, title:"Flash Sale! 20% Off", body:"Hurry, offer valid until 10 PM tonight!", audience:"all", time:"2 hrs ago", sent:1240 },
    { id:2, title:"New Item: Mango Lassi", body:"Try our refreshing new summer special!", audience:"new", time:"Yesterday", sent:480 },
  ]);

  const sendNotif = () => {
    if (!form.title || !form.body) return;
    setSent(prev => [{ id: Date.now(), ...form, time:"Just now", sent:Math.floor(Math.random()*1500+200) }, ...prev]);
    setForm({ title:"", body:"", audience:"all" });
    showToast("Notification sent successfully!");
  };

  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
      <GlassCard className="p-5 h-fit">
        <SectionHeader title="Compose Notification" />
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Title</label>
            <input value={form.title} onChange={e => setForm(p => ({...p, title:e.target.value}))}
              placeholder="e.g. Flash Sale Today!"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-orange-300" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Message</label>
            <textarea value={form.body} onChange={e => setForm(p => ({...p, body:e.target.value}))}
              placeholder="Your notification message..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-orange-300 resize-none"
              rows={3} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Target Audience</label>
            <select value={form.audience} onChange={e => setForm(p => ({...p, audience:e.target.value}))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none">
              <option value="all">All Customers</option>
              <option value="new">New Customers</option>
              <option value="vip">VIP Customers</option>
              <option value="inactive">Inactive (7+ days)</option>
            </select>
          </div>
          <BtnPrimary onClick={sendNotif} className="w-full py-2.5 justify-center">
            <Send size={14} /> Send Notification
          </BtnPrimary>
        </div>
      </GlassCard>

      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Sent History</div>
        <div className="space-y-3">
          {sent.map(n => (
            <GlassCard key={n.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="font-bold text-slate-800 text-sm">{n.title}</div>
                <span className="text-xs text-slate-400">{n.time}</span>
              </div>
              <div className="text-xs text-slate-500 mb-2">{n.body}</div>
              <div className="flex items-center gap-3 text-xs">
                <span className="px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor:"#fff7ed", color:ORANGE }}>{n.audience}</span>
                <span className="text-slate-500">{n.sent.toLocaleString("en-IN")} recipients</span>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
