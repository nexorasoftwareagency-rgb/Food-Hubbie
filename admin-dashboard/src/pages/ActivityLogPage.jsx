import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { db, ref, onValue, off, getBizId, getOutletId } from "../firebase";
import { GlassCard, SkeletonPage, Pagination } from "../components";
import { ORANGE } from "../constants";
import "../App.css";

function ActivityLogPage({ showToast }) {
  const [logs, setLogs] = useState([]);
  const [logFilter, setLogFilter] = useState("all");
  const [logLoading, setLogLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [logSearch, setLogSearch] = useState("");
  const LOG_PAGE_SIZE = 50;
  const [logPage, setLogPage] = useState(1);
  useEffect(() => {
    const r = getBizId() && getOutletId() ? ref(db, `businesses/${getBizId()}/outlets/${getOutletId()}/logs/audit`) : null;
    if (!r) { setLogLoading(false); return; }
    const unsub = onValue(r, snap => {
      const v = snap.val();
      setLogs(v ? Object.entries(v).map(([id, entry]) => ({ id, ...entry })).sort((a, b) => (b.ts || b.clientTs || 0) - (a.ts || a.clientTs || 0)) : []);
      setLogLoading(false);
    });
    return () => off(r, "value", unsub);
  }, []);
  const actionTypes = [...new Set(logs.map(l => l.action))];
  const searched = logSearch ? logs.filter(l => JSON.stringify(l.details || {}).toLowerCase().includes(logSearch.toLowerCase()) || (l.action || "").toLowerCase().includes(logSearch.toLowerCase())) : logs;
  const filteredLogs = logFilter === "all" ? searched : searched.filter(l => l.action === logFilter);
  const logTotalPages = Math.max(1, Math.ceil(filteredLogs.length / LOG_PAGE_SIZE));
  useEffect(() => { setLogPage(1); }, [logFilter, logSearch]);
  const paginatedLogs = filteredLogs.slice((logPage - 1) * LOG_PAGE_SIZE, logPage * LOG_PAGE_SIZE);
  if (logLoading) return <SkeletonPage table={8} />;
  return (
    <div>
      <div style={{ marginBottom:12, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        <div onClick={()=>setLogFilter("all")} style={{ padding:"5px 14px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600, color:logFilter==="all"?"white":"#64748b", background:logFilter==="all"?ORANGE:"#f1f5f9" }}>All ({filteredLogs.length})</div>
        {actionTypes.slice(0, 10).map(a => (
          <div key={a} onClick={()=>setLogFilter(a)} style={{ padding:"5px 14px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:600, color:logFilter===a?"white":"#64748b", background:logFilter===a?ORANGE:"#f1f5f9" }}>{a}</div>
        ))}
        <input placeholder="Search details..." value={logSearch} onChange={e => setLogSearch(e.target.value)} style={{ marginLeft:"auto", padding:"5px 10px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:12, outline:"none", maxWidth:200 }} />
      </div>
      <GlassCard>
        {filteredLogs.length === 0 ? <div style={{ padding:40, textAlign:"center", color:"#94a3b8", fontSize:13 }}>No audit logs found</div> : (
          <div style={{ overflowX:"auto" }}>
            <table className="sheet-table"><thead><tr>
              <th>#</th><th>Action</th><th>Actor</th><th>Details</th><th>Time</th>
            </tr></thead><tbody>
              {paginatedLogs.map((l, i) => (
                <tr key={l.id}>
                  <td className="sheet-row-number">{(logPage - 1) * LOG_PAGE_SIZE + i + 1}</td>
                  <td><span style={{ padding:"2px 8px", borderRadius:6, fontSize:11, fontWeight:600, background:"#fff7ed", color:ORANGE }}>{l.action}</span></td>
                  <td>{l.actor?.email || l.actor?.name || "—"}</td>
                  <td style={{ maxWidth:300, fontSize:12, color:"#64748b", cursor:"pointer" }} onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}>
                    {l.details ? (
                      expandedId === l.id
                        ? <pre style={{ fontSize:11, whiteSpace:"pre-wrap", wordBreak:"break-all", margin:0, background:"#f8fafc", padding:8, borderRadius:6, maxHeight:200, overflow:"auto" }}>{JSON.stringify(l.details, null, 2)}</pre>
                        : <span>{JSON.stringify(l.details).slice(0, 80)}… <span style={{ color:ORANGE, fontWeight:600 }}>▼</span></span>
                    ) : "—"}
                  </td>
                  <td style={{ whiteSpace:"nowrap", fontSize:12, color:"#64748b" }}>{l.clientTs ? new Date(l.clientTs).toLocaleString("en-IN") : "—"}</td>
                </tr>
              ))}
            </tbody></table>
          </div>
        )}
        <Pagination page={logPage} totalPages={logTotalPages} onPageChange={setLogPage} totalItems={filteredLogs.length} pageSize={LOG_PAGE_SIZE} />
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PAGE REGISTRY
// ═══════════════════════════════════════════════════════════════════════════
const PAGES = {
  dashboard: DashboardPage, orders: OrdersPage, liveops: LiveOpsPage, kitchen: KitchenPage, tables: TablesPage,
  pos: POSPage, menu: MenuPage, categories: CategoriesPage, discounts: DiscountsPage,
  inventory: InventoryPage, customers: CustomersPage, riders: RidersPage, partners: PartnersPage,
  riderAnalytics: RiderAnalyticsPage,
  analytics: AnalyticsPage, lostsales: LostSalesPage, settlements: SettlementsPage, payments: PaymentsPage,
  activitylog: ActivityLogPage,
  promotions: PromotionsPage, feedback: FeedbackPage, livetracker: LiveTrackerPage, settings: SettingsPage,
};
const VALID_PAGE_IDS = new Set(Object.keys(PAGES));

// ═══════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════

export default ActivityLogPage;