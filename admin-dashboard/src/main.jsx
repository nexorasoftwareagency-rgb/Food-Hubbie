import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker (PWA). No-op in unsupported / private modes.
if ("serviceWorker" in navigator && typeof window !== "undefined") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Periodic update check (every 60 min while page is open)
        setInterval(() => reg.update().catch(() => null), 60 * 60 * 1000);
      })
      .catch((err) => {
        console.warn("[sw] registration failed:", err);
      });
  });
}
