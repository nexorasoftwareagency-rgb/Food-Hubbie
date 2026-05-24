import { useState, useMemo, useCallback } from "react";
import { ShoppingBag, Download, Eye } from "lucide-react";
import { update } from "firebase/database";
import { useRealtimeData, Outlet } from "../hooks/useRealtimeData";
import GlassCard from "../components/GlassCard";
import SearchInput from "../components/SearchInput";
import StatusBadge from "../components/StatusBadge";
import Avatar from "../components/Avatar";
import Modal from "../components/Modal";
import BtnPrimary from "../components/BtnPrimary";
import EmptyState from "../components/EmptyState";
import { ORANGE, ORDER_STATUSES, STATUS_FLOW } from "../utils/constants";
import { fmt } from "../utils/formatters";

const Orders = ({ showToast }) => {
  const { data: orders = [] } = useRealtimeData("orders");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const filtered = useMemo(() =>
    orders.filter(o =>
      (statusFilter === "all" || o.status === statusFilter) &&
      ((o.customerName || o.customer || "").toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase()))
    ), [orders, search, statusFilter]);

  const updateStatus = useCallback(async (id, s) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const orderRef = Outlet(`orders/${id}`);
    try {
      await update(orderRef, {
        status: s,
        updatedAt: new Date().toISOString()
      });
      showToast(`Status updated to ${ORDER_STATUSES[s]?.label}`);
    } catch (err) {
      showToast("Failed to update status");
    }
  }, [orders, showToast]);

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
                      <Avatar name={o.customerName || o.customer || "Guest"} size={28} />
                      <span className="font-medium text-slate-800 whitespace-nowrap">{o.customerName || o.customer || "Guest"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">{fmt(o.total)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize" style={{ backgroundColor:"#f1f5f9", color:"#475569" }}>{o.type || "delivery"}</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}</td>
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
        <Modal title={"Order " + selectedOrder.id} onClose={() => setSelectedOrder(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <Avatar name={selectedOrder.customerName || selectedOrder.customer || "Guest"} size={40} />
              <div>
                <div className="font-bold text-slate-800">{selectedOrder.customerName || selectedOrder.customer || "Guest"}</div>
                <div className="text-xs text-slate-500">{selectedOrder.phone}</div>
                <div className="text-xs text-slate-500">{selectedOrder.address}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Items</div>
                <div className="font-bold text-slate-800">{selectedOrder.cart ? selectedOrder.cart.length : "0"} items</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Total</div>
                <div className="font-bold" style={{ color: ORANGE }}>{fmt(selectedOrder.total)}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Type</div>
                <div className="font-bold text-slate-800 capitalize">{selectedOrder.type || "delivery"}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 mb-1">Status</div>
                <StatusBadge status={selectedOrder.status} />
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-2">Update Status</div>
              <div className="flex flex-wrap gap-2">
                {STATUS_FLOW.map(s => (
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
