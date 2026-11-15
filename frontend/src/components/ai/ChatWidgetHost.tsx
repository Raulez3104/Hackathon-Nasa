import { useEffect, useState } from "react";
import type { DistrictData } from "../../../../shared/types/geoqocha";
import { loadDistricts } from "../../lib/data-source";
import { ChatWidget } from "./ChatWidget";

/**
 * Monta el copiloto una sola vez para todas las vistas. El distrito y el año
 * se sincronizan con la URL, la misma fuente de verdad del mapa y la analítica.
 */
export function ChatWidgetHost() {
  const [districts, setDistricts] = useState<DistrictData[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadDistricts()
      .then((dataset) => {
        if (!cancelled) setDistricts(dataset.districts);
      })
      .catch(() => {
        if (!cancelled) setDistricts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <ChatWidget districts={districts} />;
}
