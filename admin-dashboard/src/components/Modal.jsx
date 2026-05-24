import { X } from "lucide-react";
import GlassCard from "./GlassCard";

const Modal = ({ title, onClose, children, maxW = "max-w-lg" }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
    <GlassCard className={`w-full ${maxW} flex flex-col max-h-[90vh]`}>
      <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
        <h3 className="font-bold text-base text-slate-800" style={{ fontFamily: "'Outfit', sans-serif" }}>{title}</h3>
        <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-all"><X size={17} /></button>
      </div>
      <div className="overflow-y-auto flex-1 p-5">{children}</div>
    </GlassCard>
  </div>
);

export default Modal;
