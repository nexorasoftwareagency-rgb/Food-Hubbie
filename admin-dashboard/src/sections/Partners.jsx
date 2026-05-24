import { useState, useEffect } from "react";
import { Store, Plus, MoreVertical } from "lucide-react";
import { ref, onValue, off, push, set } from "firebase/database";
import { db } from "../firebase";
import GlassCard from "../components/GlassCard";
import SearchInput from "../components/SearchInput";
import Avatar from "../components/Avatar";
import BtnPrimary from "../components/BtnPrimary";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import { ORANGE, COLORS } from "../utils/constants";
import { fmt } from "../utils/formatters";

const Partners = ({ showToast }) => {
  const [partners, setPartners] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);

  useEffect(() => {
    const ref_ = ref(db, "onboarding_requests");
    const unsub = onValue(ref_, snap => {
      const val = snap.val();
      if (val) setPartners(Object.keys(val).map(k => ({ id: k, ...val[k] })));
      else setPartners([]);
    });
    return () => off(ref_, "value", unsub);
  }, []);

  const filtered = partners.filter(p => (p.bizName || p.name || "").toLowerCase().includes(search.toLowerCase()));

  const addPartner = async () => {
    try {
      const newRef = push(ref(db, "onboarding_requests"));
      await set(newRef, {
        bizName: "New Partner",
        email: "",
        phone: "",
        status: "pending",
        createdAt: new Date().toISOString()
      });
      setModal(null);
      showToast("Invitation sent");
    } catch { showToast("Failed to create"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <SearchInput placeholder="Search partners..." value={search} onChange={setSearch} className="flex-1 min-w-48" />
        <BtnPrimary onClick={() => setModal("new")}><Plus size={14} /> Add Partner</BtnPrimary>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {filtered.map(p => (
          <GlassCard key={p.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar name={p.bizName || p.name || "Partner"} size={40} />
                <div>
                  <div className="font-bold text-slate-800">{p.bizName || p.name || "Partner"}</div>
                  <div className="text-xs text-slate-500">{p.email || p.phone || "-"}</div>
                </div>
              </div>
              <span className="px-2 py-1 rounded-full text-[10px] font-semibold capitalize"
                style={{ backgroundColor: p.status === "active" ? "#22c55e20" : p.status === "pending" ? "#f59e0b20" : "#f1f5f9", color: p.status === "active" ? COLORS.success : p.status === "pending" ? COLORS.warning : "#94a3b8" }}>
                {p.status || "pending"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
              <span>Commission: {p.commission || p.rate || 0}%</span>
              <span>{p.orders || 0} orders</span>
              <span className="font-bold" style={{ color: ORANGE }}>{fmt(p.revenue || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}</span>
              <button className="p-1.5 rounded-lg bg-slate-100 text-slate-500"><MoreVertical size={13} /></button>
            </div>
          </GlassCard>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState icon={Store} msg="No partners found" />}
      {modal && (
        <Modal title="Add Partner" onClose={() => setModal(null)}>
          <div className="p-4 text-center">
            <p className="text-slate-600 text-sm mb-4">Send an invitation link to a new restaurant partner.</p>
            <button onClick={addPartner}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: ORANGE }}>Send Invitation</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Partners;
