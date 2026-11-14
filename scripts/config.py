"""Configuracion central del pipeline de datos de GeoQocha (DEV2)."""

from pathlib import Path

CONTRACT_VERSION = "0.1.0"
METHODOLOGY_VERSION = "0.1.0"

PERIOD_START = 2015
PERIOD_END = 2025
EXPECTED_DISTRICTS = 15

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data"
GEOJSON_DIR = DATA_DIR / "geojson"
PROCESSED_DIR = DATA_DIR / "processed"
METADATA_DIR = DATA_DIR / "metadata"
RAW_DIR = DATA_DIR / "raw"

DEFAULT_DISTRICTS_GEOJSON = GEOJSON_DIR / "districts.geojson"
DEFAULT_NASA_CSV = RAW_DIR / "nasa" / "zonal_annual.csv"
DEFAULT_NASA_OBSERVATIONS = RAW_DIR / "nasa" / "modis_observations.json"
DEFAULT_MUNICIPAL_JSON = RAW_DIR / "municipal" / "equipment.json"
MOCK_PATH = REPO_ROOT / "frontend" / "public" / "data" / "mock_distritos.json"
FRONTEND_OUTPUT = REPO_ROOT / "frontend" / "public" / "data" / "distritos_data.json"

# Ventana estacional fija para NDVI: dia del ano (misma en todos los anos).
NDVI_SEASONAL_WINDOW = (1, 365)
LST_SEASONAL_WINDOW = (1, 365)

# Calidad de datos satelitales.
MIN_VALID_FRACTION = 0.5
PARTIAL_VALID_FRACTION = 0.25
MIN_VALID_OBSERVATIONS = 1

# Pesos del ICVSA (docs/02 RN-02/RN-03).
WEIGHTS = {
    "vegetation": 0.35,
    "surface_temperature": 0.35,
    "urban_equipment": 0.20,
    "mobility": 0.10,
}

# Umbrales de tendencia por variable.
TREND_CONFIG = {
    "ndvi": {
        "unit": "NDVI/año",
        "stable_threshold": 0.001,
        "acceleration_threshold": 0.001,
        "positive_is_improving": True,
    },
    "lst": {
        "unit": "°C/año",
        "stable_threshold": 0.05,
        "acceleration_threshold": 0.05,
        "positive_is_improving": False,
    },
    "environmental_index": {
        "unit": "índice/año",
        "stable_threshold": 0.20,
        "acceleration_threshold": 0.20,
        "positive_is_improving": True,
    },
    "socioenvironmental_index": {
        "unit": "índice/año",
        "stable_threshold": 0.20,
        "acceleration_threshold": 0.20,
        "positive_is_improving": True,
    },
}

# Umbrales de hotspots (reglas explicables).
HOTSPOT_RULES = {
    "NDVI_NEGATIVE_TREND": {
        "weight": 20,
        "threshold": -0.002,
        "description": "Tendencia de NDVI negativa por debajo del umbral.",
    },
    "LST_POSITIVE_TREND": {
        "weight": 20,
        "threshold": 0.10,
        "description": "Tendencia de LST positiva por encima del umbral.",
    },
    "LOW_ENVIRONMENTAL_INDEX": {
        "weight": 15,
        "threshold": 40.0,
        "description": "Índice ambiental por debajo del umbral de atención.",
    },
    "EQUIPMENT_DEFICIT": {
        "weight": 20,
        "threshold": 4.0,
        "description": "Área verde por habitante por debajo del umbral.",
    },
    "MOBILITY_DEFICIT": {
        "weight": 15,
        "threshold": 0.40,
        "description": "Cobertura de transporte por debajo del umbral.",
    },
    "LOW_NDVI": {
        "weight": 10,
        "threshold": 0.20,
        "description": "NDVI del año por debajo del umbral de vegetación escasa.",
    },
}

PRIORITY_THRESHOLDS = {"high": 60, "medium": 30}

# Umbrales de equipamiento para marcar deficit.
EQUIPMENT_THRESHOLDS = {
    "green_area_m2_per_capita": 4.0,
    "schools_per_1000": 1.0,
    "health_centers_per_1000": 0.20,
    "transport_coverage_fraction": 0.40,
    "equipment_access_index": 40.0,
    "mobility_access_index": 40.0,
}

HEATMAP_RESOLUTION_M = 1000
HEATMAP_LST_CLASSES = {"low": 29.0, "medium": 33.0}
HEATMAP_ICVSA_CLASSES = {"low": 70.0, "medium": 40.0}
HEATMAP_SEVERITY_CLASSES = {"low": 30.0, "medium": 60.0}

CORRELATION_MIN_N = 8


def years_in_period(start: int = PERIOD_START, end: int = PERIOD_END) -> list[int]:
    return list(range(start, end + 1))


def ensure_directories() -> None:
    for directory in (GEOJSON_DIR, PROCESSED_DIR, METADATA_DIR):
        directory.mkdir(parents=True, exist_ok=True)
