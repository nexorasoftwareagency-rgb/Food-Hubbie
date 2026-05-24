import { ORDER_STATUSES } from "../utils/constants";

const StatusBadge = ({ status }) => {
  const s = ORDER_STATUSES[status] || { label: status, color: "#64748b", bg: "#f1f5f9" };
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ color: s.color, backgroundColor: s.bg, border: `1px solid ${s.color}30` }}>
      {s.label}
    </span>
  );
};

export default StatusBadge;
