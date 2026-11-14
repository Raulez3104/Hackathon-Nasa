export type GamcLayerGroup = "limites" | "equipamiento" | "poblacion";

export interface GamcLayerDefinition {
  id: string;
  name: string;
  description: string;
  group: GamcLayerGroup;
  minZoom: number;
  defaultOpacity: number;
  supportsFeatureInfo: boolean;
}

export const GAMC_LAYER_GROUPS: Record<GamcLayerGroup, string> = {
  limites: "Límites administrativos",
  equipamiento: "Equipamiento y áreas verdes",
  poblacion: "Población y servicios",
};

// Catálogo confirmado del proyecto del GAMC (2026-11-13). Los UUID son públicos;
// la clave de acceso nunca sale del backend.
export const GAMC_LAYERS: readonly GamcLayerDefinition[] = [
  {
    id: "97a589fe-595e-45dd-91d4-38524877f1ed",
    name: "Áreas de Equipamiento",
    description: "Espacios municipales y equipamiento urbano.",
    group: "equipamiento",
    minZoom: 11,
    defaultOpacity: 0.85,
    supportsFeatureInfo: true,
  },
  {
    id: "7eb13092-bf0e-493b-aae6-03c43eedda2c",
    name: "Límite Distritos",
    description: "Delimitación de los distritos municipales.",
    group: "limites",
    minZoom: 10,
    defaultOpacity: 0.9,
    supportsFeatureInfo: true,
  },
  {
    id: "fd77d463-9729-4c66-b686-23dccbb4ab8f",
    name: "Límite Urbano",
    description: "Contexto del área urbana municipal.",
    group: "limites",
    minZoom: 10,
    defaultOpacity: 0.9,
    supportsFeatureInfo: true,
  },
  {
    id: "e40fa280-f649-4614-9526-1b3dcce596b3",
    name: "Centros de Salud",
    description: "Servicios sanitarios disponibles.",
    group: "poblacion",
    minZoom: 12,
    defaultOpacity: 0.95,
    supportsFeatureInfo: true,
  },
  {
    id: "47360ddc-e35f-4ece-a995-59e90eb79cc6",
    name: "Áreas Verdes",
    description: "Parques y superficies de vegetación urbana.",
    group: "equipamiento",
    minZoom: 11,
    defaultOpacity: 0.8,
    supportsFeatureInfo: true,
  },
  {
    id: "194a02a0-a73a-48c1-a260-82847c5c905d",
    name: "Población por Manzanas",
    description: "Distribución demográfica por manzana.",
    group: "poblacion",
    minZoom: 12,
    defaultOpacity: 0.65,
    supportsFeatureInfo: true,
  },
  {
    id: "7655ba3d-5d9e-44ff-bf65-26f81f83d7ec",
    name: "Unidades Educativas",
    description: "Centros educativos del municipio.",
    group: "poblacion",
    minZoom: 12,
    defaultOpacity: 0.95,
    supportsFeatureInfo: true,
  },
];

const GAMC_LAYERS_BY_ID = new Map(GAMC_LAYERS.map((layer) => [layer.id, layer]));

export function findGamcLayer(layerId: string): GamcLayerDefinition | undefined {
  return GAMC_LAYERS_BY_ID.get(layerId);
}

export function buildGamcVisibility(
  initial: readonly string[] = ["97a589fe-595e-45dd-91d4-38524877f1ed"],
): Record<string, boolean> {
  const visible = new Set(initial);
  return Object.fromEntries(GAMC_LAYERS.map((layer) => [layer.id, visible.has(layer.id)]));
}
