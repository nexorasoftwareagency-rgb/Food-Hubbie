import { useState } from "react";
import GlassCard from "../components/GlassCard";
import BtnPrimary from "../components/BtnPrimary";
import ToggleSwitch from "../components/ToggleSwitch";

const Settings = ({ showToast }) => {
  const [s, setS] = useState({
    commission:10, riderBase:30, riderKm:5, minOrder:100,
    delivMin:25, delivMax:45, adminPhone:"+91 9876543210",
    wifi:"FoodHubbie_Guest", wifiPass:"welcome123",
    instagram:"@foodhubbie", facebook:"fb.com/foodhubbie", reviewUrl:"g.page/foodhubbie/review",
    showName:true, showAddr:true, showGST:false, showFSSAI:true, showPowered:true,
    autoAccept:false, soundAlert:true, emailReport:true,
  });
  const set = (k, v) => setS(p => ({ ...p, [k]: v }));

  const Section = ({ title, children }) => (
    <GlassCard className="p-5">
      <h3 className="font-bold text-slate-800 mb-4" style={{ fontFamily:"'Outfit', sans-serif" }}>{title}</h3>
      {children}
    </GlassCard>
  );

  const Field = ({ label, field, type="text" }) => (
    <div>
      <label className="text-xs font-semibold text-slate-500 mb-1 block">{label}</label>
      <input type={type} value={s[field]} onChange={e => set(field, type==="number" ? +e.target.value : e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-orange-300" />
    </div>
  );

  const Toggle = ({ label, field }) => (
    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-orange-50/30 cursor-pointer" onClick={() => set(field, !s[field])}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <ToggleSwitch checked={s[field]} onChange={v => set(field, v)} />
    </div>
  );

  return (
    <div className="space-y-5 max-w-3xl">
      <Section title="Commission & Fees">
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <Field label="Commission %" field="commission" type="number" />
          <Field label="Base Rider Fee" field="riderBase" type="number" />
          <Field label="Per KM Incentive" field="riderKm" type="number" />
        </div>
      </Section>

      <Section title="Order Settings">
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <Field label="Min Order Amount" field="minOrder" type="number" />
          <Field label="Min Delivery Time (min)" field="delivMin" type="number" />
          <Field label="Max Delivery Time (min)" field="delivMax" type="number" />
          <Field label="Admin WhatsApp" field="adminPhone" />
        </div>
      </Section>

      <Section title="WiFi Info">
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <Field label="WiFi Network Name" field="wifi" />
          <Field label="WiFi Password" field="wifiPass" />
        </div>
      </Section>

      <Section title="Social Links">
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <Field label="Instagram" field="instagram" />
          <Field label="Facebook" field="facebook" />
          <Field label="Google Review URL" field="reviewUrl" />
        </div>
      </Section>

      <Section title="Receipt Settings">
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {[["Show Store Name","showName"],["Show Address","showAddr"],["Show GSTIN","showGST"],["Show FSSAI","showFSSAI"],["Show Powered By","showPowered"]].map(([l,f]) => (
            <Toggle key={f} label={l} field={f} />
          ))}
        </div>
      </Section>

      <Section title="Automation">
        <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {[["Auto-Accept Orders","autoAccept"],["Sound Alerts","soundAlert"],["Daily Email Reports","emailReport"]].map(([l,f]) => (
            <Toggle key={f} label={l} field={f} />
          ))}
        </div>
      </Section>

      <BtnPrimary onClick={() => showToast("Settings saved successfully!")} className="py-3 px-8">Save All Changes</BtnPrimary>
    </div>
  );
};

export default Settings;
