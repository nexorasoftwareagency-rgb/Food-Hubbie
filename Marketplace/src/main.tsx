import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyTheme } from "./theme";

// Apply the default theme on boot.
// In SaaS mode: fetch the business config first, then call applyTheme(businessTheme).
applyTheme();

createRoot(document.getElementById("root")!).render(<App />);
