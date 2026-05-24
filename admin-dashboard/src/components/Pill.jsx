import { ORANGE } from "../utils/constants";

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
    style={active ? { backgroundColor: ORANGE, color: "#fff" } : { backgroundColor: "#f1f5f9", color: "#64748b" }}>
    {label}
  </button>
);

export default Pill;
