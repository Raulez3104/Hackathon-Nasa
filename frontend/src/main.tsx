import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "leaflet/dist/leaflet.css";
import "./styles.css";
import "./components/map/map.css";
import { App } from "./App";
import { LandingPage } from "./LandingPage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {window.location.pathname === "/" ? <LandingPage /> : <App />}
  </StrictMode>,
);
