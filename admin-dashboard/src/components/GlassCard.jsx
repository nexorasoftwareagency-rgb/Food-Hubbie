const GlassCard = ({ children, className = "", style = {} }) => (
  <div className={`rounded-2xl border ${className}`}
    style={{
      background: "rgba(255,255,255,0.9)",
      backdropFilter: "blur(12px)",
      borderColor: "rgba(232, 73, 8,0.12)",
      boxShadow: "0 2px 20px rgba(232, 73, 8,0.06)",
      ...style
    }}>
    {children}
  </div>
);

export default GlassCard;
