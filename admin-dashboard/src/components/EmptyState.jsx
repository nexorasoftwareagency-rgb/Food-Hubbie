const EmptyState = ({ icon: Icon, msg }) => (
  <div className="py-16 text-center text-slate-400">
    <Icon size={40} className="mx-auto mb-3 opacity-25" />
    <div className="text-sm font-medium">{msg}</div>
  </div>
);

export default EmptyState;
