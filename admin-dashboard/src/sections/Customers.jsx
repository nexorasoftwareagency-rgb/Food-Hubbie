import { useState, useMemo, useEffect } from "react";
import { Users, Star, MessageCircle } from "lucide-react";
import { ref, onValue, off } from "firebase/database";
import { db } from "../firebase";
import GlassCard from "../components/GlassCard";
import SearchInput from "../components/SearchInput";
import Avatar from "../components/Avatar";
import StarRating from "../components/StarRating";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { ORANGE } from "../utils/constants";
import { fmt } from "../utils/formatters";

const Customers = ({ showToast }) => {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const ref_ = ref(db, "customers");
    const unsub = onValue(ref_, snap => {
      const val = snap.val();
      if (val) setCustomers(Object.keys(val).map(k => ({ id: k, ...val[k] })));
      else setCustomers([]);
    });
    return () => off(ref_, "value", unsub);
  }, []);

  const filtered = useMemo(() =>
    customers.filter(c => (c.name || "").toLowerCase().includes(search.toLowerCase()) || (c.phone || "").includes(search)), [customers, search]);

  return (
    <div className="space-y-4">
      <SearchInput placeholder="Search customers by name or phone..." value={search} onChange={setSearch} className="max-w-md" />
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {filtered.map(c => (
          <GlassCard key={c.id} className="p-4 cursor-pointer hover:shadow-lg transition-all" onClick={() => setSelected(c)}>
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={c.name} size={42} />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800">{c.name}</div>
                <div className="text-xs text-slate-500">{c.phone}</div>
              </div>
              <StarRating rating={c.rating || 0} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">{c.orders || 0} orders</span>
              <span className="font-bold" style={{ color: ORANGE }}>{fmt(c.spent || 0)}</span>
              <div className="flex gap-1">
                {(c.tags || []).map(t => (
                  <span key={t} className="px-1.5 py-0.5 rounded text-[10px] font-medium capitalize"
                    style={{ backgroundColor: ORANGE + "15", color: ORANGE }}>{t}</span>
                ))}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
      {filtered.length === 0 && <EmptyState icon={Users} msg="No customers found" />}
      {selected && (
        <Modal title="Customer Profile" onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={selected.name} size={56} />
              <div>
                <div className="font-bold text-slate-800 text-lg">{selected.name}</div>
                <div className="text-sm text-slate-500">{selected.phone}</div>
                <div className="flex items-center gap-1 text-sm">
                  <Star size={14} style={{ color: ORANGE }} fill={ORANGE} />
                  <span className="font-bold text-slate-800">{selected.rating || 0}</span>
                  <span className="text-slate-400 ml-2">Since {selected.since || "-"}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500">Total Orders</div>
                <div className="font-bold text-slate-800 text-lg">{selected.orders || 0}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500">Total Spent</div>
                <div className="font-bold text-lg" style={{ color: ORANGE }}>{fmt(selected.spent || 0)}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500">Favorite Dish</div>
                <div className="font-bold text-slate-800">{selected.fav || "-"}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500">Last Active</div>
                <div className="font-bold text-slate-800">{selected.last || "-"}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1"
                style={{ backgroundColor: ORANGE }}>
                <MessageCircle size={13} /> Message
              </button>
              <button className="flex-1 py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1"
                style={{ backgroundColor: "#22c55e" }}>
                <Star size={13} /> Add to VIP
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Customers;
