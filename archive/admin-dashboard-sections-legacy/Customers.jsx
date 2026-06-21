import { useState, useMemo } from "react";
import { Eye } from "lucide-react";
import GlassCard from "../components/GlassCard";
import SearchInput from "../components/SearchInput";
import Avatar from "../components/Avatar";
import Modal from "../components/Modal";
import { ORANGE } from "../utils/constants";
import { fmt } from "../utils/formatters";

const MOCK_CUSTOMERS = [
  { id:"c1", name:"Rahul Sharma", phone:"+91 9876543210", orders:24, spent:8640, last:"2 hours ago", addr:"14 MG Road", city:"Ranchi" },
  { id:"c2", name:"Priya Singh", phone:"+91 9845671230", orders:18, spent:6120, last:"Yesterday", addr:"Kokar Colony", city:"Ranchi" },
  { id:"c3", name:"Amit Kumar", phone:"+91 9123456789", orders:31, spent:11280, last:"Today", addr:"Ashok Nagar", city:"Ranchi" },
  { id:"c4", name:"Sunita Verma", phone:"+91 9988776655", orders:9, spent:2430, last:"3 days ago", addr:"Harmu", city:"Ranchi" },
  { id:"c5", name:"Deepak Jha", phone:"+91 9012345678", orders:42, spent:15960, last:"1 hour ago", addr:"Lalpur", city:"Ranchi" },
  { id:"c6", name:"Neha Gupta", phone:"+91 9678901234", orders:14, spent:4780, last:"Today", addr:"Ratu Road", city:"Ranchi" },
];

const Customers = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() =>
    MOCK_CUSTOMERS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)),
    [search]);

  return (
    <div className="space-y-4">
      <SearchInput placeholder="Search customers..." value={search} onChange={setSearch} />
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 520 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["Customer","Phone","Orders","Spent","Last Order",""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-orange-50/30 cursor-pointer" onClick={() => setSelected(c)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={c.name} size={32} />
                      <span className="font-semibold text-slate-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{c.phone}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{c.orders}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: ORANGE }}>{fmt(c.spent)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{c.last}</td>
                  <td className="px-4 py-3"><Eye size={14} className="text-slate-400" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {selected && (
        <Modal title="Customer Profile" onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
              <Avatar name={selected.name} size={52} />
              <div>
                <div className="font-bold text-lg text-slate-800">{selected.name}</div>
                <div className="text-sm text-slate-500">{selected.phone}</div>
                <div className="text-sm text-slate-500">{selected.addr}, {selected.city}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[["Total Orders", selected.orders], ["Total Spent", fmt(selected.spent)], ["Last Order", selected.last]].map(([l,v]) => (
                <div key={l} className="p-3 bg-slate-50 rounded-xl text-center">
                  <div className="text-xs text-slate-500 mb-1">{l}</div>
                  <div className="font-bold text-slate-800">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Customers;
