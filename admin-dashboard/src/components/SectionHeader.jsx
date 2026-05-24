const SectionHeader = ({ title, action }) => (
  <div className="flex items-center justify-between mb-4">
    <h3 className="font-bold text-slate-800 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>{title}</h3>
    {action}
  </div>
);

export default SectionHeader;
