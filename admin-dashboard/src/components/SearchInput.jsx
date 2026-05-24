import { Search } from "lucide-react";

const SearchInput = ({ placeholder, value, onChange, className = "" }) => (
  <div className={`relative ${className}`}>
    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white/80 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-100 w-full transition-all" />
  </div>
);

export default SearchInput;
