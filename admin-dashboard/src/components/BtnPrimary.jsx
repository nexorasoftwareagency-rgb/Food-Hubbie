import { ORANGE } from "../utils/constants";

const BtnPrimary = ({ children, onClick, className = "", disabled }) => (
  <button onClick={onClick} disabled={disabled}
    className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 ${className}`}
    style={{ backgroundColor: ORANGE }}>
    {children}
  </button>
);

export default BtnPrimary;
