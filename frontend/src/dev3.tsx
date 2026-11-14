import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AnalyticsWorkspace } from "./components/analytics/AnalyticsWorkspace";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AnalyticsWorkspace />
  </StrictMode>,
);
