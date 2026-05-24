import { ORANGE } from "../utils/constants";

const ToggleSwitch = ({ checked, onChange }) => (
  <div className="w-10 h-5 rounded-full relative cursor-pointer transition-all flex-shrink-0"
    style={{ backgroundColor: checked ? ORANGE : "#cbd5e1" }}
    onClick={() => onChange(!checked)}>
    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
      style={{ left: checked ? "calc(100% - 18px)" : 2 }} />
  </div>
);

export default ToggleSwitch;
