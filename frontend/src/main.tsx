import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "leaflet/dist/leaflet.css";
import "./styles.css";
import "./components/map/map.css";
import { App } from "./App";
import { ChatWidgetHost } from "./components/ai/ChatWidgetHost";
import { GreenAreasPage } from "./components/awareness/GreenAreasPage";
import { LandingPage } from "./LandingPage";

const pathname = window.location.pathname.replace(/\/+$/, "") || "/";

function CurrentPage() {
  if (pathname === "/areas-verdes" || pathname === "/defensa-verde") return <GreenAreasPage />;
  if (pathname === "/") return <LandingPage />;
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CurrentPage />
    <ChatWidgetHost />
  </StrictMode>,
);
