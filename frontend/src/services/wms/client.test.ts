import { describe, expect, it } from "vitest";
import { buildWmsUrl } from "./client";

describe("cliente WMS", () => {
  it("construye la URL del proxy sin credenciales", () => {
    const url = buildWmsUrl({
      serviceId: "97a589fe-595e-45dd-91d4-38524877f1ed",
      operation: "GetMap",
      version: "1.1.1",
      format: "image/png",
      srs: "EPSG:3857",
      bbox: [-1, -2, 3, 4],
      width: 256,
      height: 256,
    });
    expect(url).toContain("/api/gamc/wms?");
    expect(url).toContain("REQUEST=GetMap");
    expect(url).not.toMatch(/GAMC_API_KEY|key=/i);
  });
});
