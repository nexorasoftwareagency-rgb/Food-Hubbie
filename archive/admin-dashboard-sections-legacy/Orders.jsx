import { useState, useMemo, useCallback } from "react";
import { Download, Eye } from "lucide-react";
import GlassCard from "../components/GlassCard";
import StatusBadge from "../components/StatusBadge";
import Avatar from "../components/Avatar";
import BtnPrimary from "../components/BtnPrimary";
import SearchInput from "../components/SearchInput";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { ShoppingBag } from "lucide-react";
import { ORANGE, ORDER_STATUSES } from "../utils/constants";
import { fmt } from "../utils/formatters";

const MOCK_ORDERS = [
  { id:"ORD-1001", customer:"Rahul Sharma", items:3, total:485, status:"pending", type:"delivery", time:"2 min ago", phone:"+91 9876543210", address:"14 MG Road, Ranchi" },
  { id:"ORD-1002", customer:"Priya Singh", items:2, total:320, status:"preparing", type:"dinein", time:"8 min ago", phone:"+91 9845671230", address:"Table 4" },
  { id:"ORD-1003", customer:"Amit Kumar", items:5, total:890, status:"out_for_delivery", type:"delivery", time:"15 min ago", phone:"+91 9123456789", address:"22 Ashok Nagar" },
  { id:"ORD-1004", customer:"Sunita Verma", items:1, total:150, status:"delivered", type:"takeaway", time:"22 min ago", phone:"+91 9988776655", address:"Takeaway" },
  { id:"ORD-1005", customer:"Deepak Jha", items:4, total:640, status:"confirmed", type:"delivery", time:"5 min ago", phone:"+91 9012345678", address:"7 Kokar Colony" },
  { id:"ORD-1006", customer:"Anjali Mishra", items:2, total:275, status:"cancelled", type:"delivery", time:"30 min ago", phone:"+91 9567890123", address:"Harmu Housing Colony" },
  { id:"ORD-1007", customer:"Vikram Pandey", items:6, total:1120, status:"ready", type:"delivery", time:"12 min ago", phone:"+91 9345678901", address:"Lalpur Chowk" },
  { id:"ORD-1008", customer:"Neha Gupta", items:2, total:390, status:"pending", type:"dinein", time:"1 min ago", phone:"+91 9678901234", address:"Table 7" },
];

const Orders = ({ showToast }) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filtered = useMemo(() =>
    orders.filter(o =>
      (statusFilter === "all" || o.status === statusFilter) &&
      (o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase()))
    ), [orders, search, statusFilter]);

  const updateStatus = useCallback((id, s) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: s } : o));
    setSelectedOrder(prev => prev?.id === id ? { ...prev, status: s } : prev);
    showToast(`Status updated to ${ORDER_STATUSES[s]?.label}`);
  }, [showToast]);

  const statusFlow = ["pending","confirmed","preparing","ready","out_for_delivery","delivered"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <SearchInput placeholder="Search orders or customers..." value={search} onChange={setSearch} className="flex-1 min-w-48" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none">
          <option value="all">All Status</option>
          {Object.entries(ORDER_STATUSES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <BtnPrimary><Download size={13} /> Export</BtnPrimary>
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 640 }}>
            <thead>
              <tr className="border-b border-slate-100">
                {["Order","Customer","Total","Type","Status","Time",""].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-b border-slate-50 hover:bg-orange-50/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold" style={{ color: ORANGE }}>{o.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={o.customer} size={28} />
                      <span className="font-medium text-slate-800 whitespace-nowrap">{o.customer}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">{fmt(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize" style={{ backgroundColor:"#f1f5f9", color:"#475569" }}>{o.type}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{o.time}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedOrder(o)}
                      className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-400 transition-all"><Eye size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState icon={ShoppingBag} msg="No orders found" />}
        </div>
      </GlassCard>

      {selectedOrder && (
        <Modal title={`Order ${selectedOrder.id}`} onClose={() => setSelectedOrder(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <Avatar name={selectedOrder.customer} size={40} />
              <div>
                <div className="font-bold text-slate-800">{selectedOrder.customer}</div>
                <div className="text-xs text-slate-500">{selectedOrder.phone}</div>
                <div className="text-xs text-slate-500">{selectedOrder.address}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Items</div>
                <div className="font-bold text-slate-800">{selectedOrder.items} items</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Total</div>
                <div className="font-bold" style={{ color: ORANGE }}>{fmt(selectedOrder.total)}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Type</div>
                <div className="font-bold text-slate-800 capitalize">{selectedOrder.type}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Status</div>
                <StatusBadge status={selectedOrder.status} />
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-2">Update Status</div>
              <div className="flex flex-wrap gap-2">
                {statusFlow.map(s => (
                  <button key={s} onClick={() => updateStatus(selectedOrder.id, s)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={selectedOrder.status === s
                      ? { backgroundColor: ORANGE, color:"#fff" }
                      : { backgroundColor:"#f1f5f9", color:"#475569" }}>
                    {ORDER_STATUSES[s].label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => updateStatus(selectedOrder.id, "cancelled")}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-all">
              Cancel Order
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Orders;
