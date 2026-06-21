import { X, CheckCircle, AlertTriangle } from "lucide-react";

const Toast = ({ msg, type = "success", onClose }) => (
  <div className="fixed bottom-20 right-4 lg:bottom-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium animate-bounce"
    style={{ background: type === "success" ? "#22c55e" : type === "error" ? "#ef4444" : "#E84908", minWidth: 240, maxWidth: "90vw" }}>
    {type === "success" ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
    <span className="flex-1">{msg}</span>
    <button onClick={onClose} className="ml-auto opacity-80 hover:opacity-100"><X size={13} /></button>
  </div>
);

export default Toast;
