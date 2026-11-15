/**
 * Catálogo de fuentes del MVP (docs/04 §4.7 y docs/05). La etiqueta `kind`
 * distingue datos reales de series complementadas (RN-11) y nunca oculta limitaciones.
 */

export type SourceKind = "real" | "illustrative";

export interface SourceEntry {
  id: string;
  name: string;
  organization: string;
  url: string | null;
  reference_date: string;
  license: string;
  kind: SourceKind;
  transformations: string[];
  limitations: string[];
}

export const SOURCE_CATALOG: SourceEntry[] = [
  {
    id: "nasa_mod13q1",
    name: "MODIS MOD13Q1 (NDVI), colección 6.1",
    organization: "NASA",
    url: "https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD13Q1",
    reference_date: "2019/2022",
    license: "Datos abiertos NASA (verificar términos de uso)",
    kind: "real",
    transformations: [
      "Máscara de calidad QA",
      "Agregación zonal por distrito",
      "Media anual ponderada por píxeles válidos",
    ],
    limitations: [
      "Resolución espacial de 250 m",
      "Cobertura real 2019/2022 (23 compuestos por año)",
      "Cuatro años: las tendencias son indicativas",
    ],
  },
  {
    id: "nasa_mod11a2",
    name: "MODIS MOD11A2 (LST), colección 6.1",
    organization: "NASA",
    url: "https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD11A2",
    reference_date: "2019/2022",
    license: "Datos abiertos NASA (verificar términos de uso)",
    kind: "real",
    transformations: [
      "Máscara de calidad QA",
      "Conversión de kelvin a grados Celsius",
      "Agregación zonal y media anual",
    ],
    limitations: [
      "Resolución espacial de 1 km",
      "Es temperatura superficial, no del aire",
      "Puede ser gruesa para distritos pequeños",
    ],
  },
  {
    id: "nasa_appeears",
    name: "AppEEARS, estadísticas zonales MODIS por distrito",
    organization: "NASA LP DAAC / AppEEARS",
    url: "https://appeears.earthdatacloud.nasa.gov/",
    reference_date: "2019/2022",
    license: "Datos abiertos NASA (verificar términos de uso)",
    kind: "real",
    transformations: [
      "Estadísticas zonales por polígono distrital",
      "Filtro QA por bits 0-1 del código de calidad",
      "Media anual ponderada por conteo de píxeles",
      "Conversión de LST a grados Celsius",
    ],
    limitations: [
      "Entrega de 2019 a 2022; no cubre 2015-2018 ni 2023-2025",
      "Solo temperatura superficial diurna",
      "Estadísticas agregadas por polígono, no píxeles individuales",
    ],
  },
  {
    id: "ciudatos_districts",
    name: "Límites de los 15 distritos municipales de Cochabamba",
    organization: "Ciudatos Lab",
    url: "https://github.com/ciudatoslab/20-distritos-en-cochabamba",
    reference_date: "Sin fecha declarada",
    license: "Verificar términos del repositorio antes de publicar",
    kind: "real",
    transformations: [
      "Selección de los 15 distritos del municipio de Cochabamba",
      "Normalización a district_id 1-15",
      "Validación de topología y área",
    ],
    limitations: [
      "Cartografía comunitaria, no una entrega oficial del GAMC",
      "Licencia y fecha de levantamiento por confirmar",
    ],
  },
  {
    id: "gamc_districts",
    name: "Límites distritales y capas vectoriales municipales",
    organization: "GAMC",
    url: "https://recursosgamc.cochabamba.bo/api-doc",
    reference_date: "Por confirmar",
    license: "Uso municipal; verificar términos antes de publicar",
    kind: "real",
    transformations: ["Validación de topología", "Normalización de district_id", "Cruce con el dataset"],
    limitations: [
      "Entrega vectorial por confirmar",
      "No se calculan áreas ni conteos desde píxeles WMS",
      "Requiere clave solo en el backend",
    ],
  },
  {
    id: "gamc_wms",
    name: "Catálogo WMS municipal",
    organization: "GAMC",
    url: "https://serviciosgamc.cochabamba.bo/api/gs/wms",
    reference_date: "Documentado",
    license: "Uso municipal; verificar términos de uso",
    kind: "real",
    transformations: ["Proxy propio con lista blanca", "Caché de teselas y consultas"],
    limitations: [
      "WMS sirve para visualización, no para descargas masivas",
      "La clave nunca se expone en el frontend",
      "Solo GetMap, GetLegendGraphic y GetFeatureInfo",
    ],
  },
  {
    id: "gamc_equipment",
    name: "Equipamiento, áreas verdes y movilidad",
    organization: "GAMC",
    url: null,
    reference_date: "Año de referencia territorial del dataset",
    license: "Uso municipal; verificar términos antes de publicar",
    kind: "real",
    transformations: [
      "Conteos y superficies desde vectores",
      "Normalización por población",
      "Fijado al año de referencia (sin interpolación)",
    ],
    limitations: [
      "Sin serie histórica: no se extrapola a otros años",
      "Denominadores de población a verificar",
      "Las paradas propuestas no son oficiales",
    ],
  },
  {
    id: "mock",
    name: "mock_distritos.json",
    organization: "Equipo GeoQocha",
    url: null,
    reference_date: "2015/2025",
    license: "Serie complementada de desarrollo",
    kind: "illustrative",
    transformations: ["Generación sintética para desarrollo", "Cifras ficticias etiquetadas"],
    limitations: [
      "No representa mediciones oficiales",
      "No usar para conclusiones ni comunicación pública",
      "Se reemplaza por el dataset procesado del pipeline",
    ],
  },
];
