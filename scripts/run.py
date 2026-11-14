#!/usr/bin/env python
"""Orquestador del pipeline de datos de GeoQocha (DEV2).

Uso:
    python scripts/run.py
    python scripts/run.py --from 2015 --to 2025
    python scripts/run.py --nasa-csv data/raw/nasa/zonal_annual.csv \
        --municipal data/raw/municipal/equipment.json

Sin insumos reales usa el mock compartido y marca todo como ilustrativo.
"""

from __future__ import annotations

import argparse
import copy
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import (  # noqa: E402
    CONTRACT_VERSION,
    CORRELATION_MIN_N,
    DEFAULT_DISTRICTS_GEOJSON,
    DEFAULT_MUNICIPAL_JSON,
    DEFAULT_NASA_CSV,
    DEFAULT_NASA_OBSERVATIONS,
    EXPECTED_DISTRICTS,
    FRONTEND_OUTPUT,
    HEATMAP_RESOLUTION_M,
    METHODOLOGY_VERSION,
    MOCK_PATH,
    NDVI_SEASONAL_WINDOW,
    PROCESSED_DIR,
    WEIGHTS,
    ensure_directories,
    years_in_period,
)
from indicators.correlations import build_correlations  # noqa: E402
from indicators.equipment import equipment_from_mock, equipment_from_municipal  # noqa: E402
from indicators.gaps import build_gaps  # noqa: E402
from indicators.heatmap import build_heatmap, build_risk_levels, render_raster  # noqa: E402
from indicators.hotspots import build_hotspots_by_year  # noqa: E402
from indicators.index import compute_indexes, series_for_district  # noqa: E402
from indicators.trends import compute_trends  # noqa: E402
from nasa.ingest import load_observations, load_zonal_csv, nasa_rows_from_mock  # noqa: E402
from utils import read_json, risk_level_from_index, round_number, write_json  # noqa: E402
from validate_output import validate_dataset  # noqa: E402

HOTSPOT_DISCLAIMER = (
    "Clasificación indicativa basada en reglas explícitas. No es una evaluación oficial del GAMC "
    "ni una priorización de inversión."
)
CORRELATION_DISCLAIMER = (
    "Análisis exploratorio. No establecer causalidad ni priorizar inversión con este resultado."
)
CONTRACT_FIELDS = (
    "district_id",
    "territorial_reference_year",
    "population",
    "green_area_m2_per_capita",
    "schools_per_1000",
    "health_centers_per_1000",
    "transport_coverage_fraction",
    "equipment_access_index",
    "mobility_access_index",
    "deficit_flags",
)


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_geojson_districts(path: Path) -> list[dict[str, Any]]:
    payload = read_json(path)
    features = payload.get("features") if isinstance(payload, dict) else None
    if not isinstance(features, list):
        raise ValueError(f"{path} no es un FeatureCollection válido")

    districts: list[dict[str, Any]] = []
    for feature in features:
        properties = feature.get("properties") or {}
        district_id = properties.get("district_id")
        if not isinstance(district_id, int):
            continue
        districts.append(
            {
                "district_id": district_id,
                "name": properties.get("name") or f"Distrito {district_id}",
                "geometry": feature.get("geometry"),
                "area_km2": properties.get("area_km2"),
            }
        )
    districts.sort(key=lambda item: item["district_id"])
    if len(districts) != EXPECTED_DISTRICTS:
        raise ValueError(f"El GeoJSON debe tener {EXPECTED_DISTRICTS} distritos; encontrados: {len(districts)}")
    return districts


def districts_from_mock(mock_payload: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "district_id": district["district_id"],
            "name": district.get("name") or f"Distrito {district['district_id']}",
            "geometry": district.get("geometry"),
            "area_km2": district.get("area_km2"),
        }
        for district in mock_payload.get("districts", [])
    ]


def empty_equipment(district_ids: list[int], reference_year: int | None) -> dict[int, dict[str, Any]]:
    return {
        district_id: {
            "district_id": district_id,
            "territorial_reference_year": reference_year,
            "population": None,
            "green_area_m2_per_capita": None,
            "schools_per_1000": None,
            "health_centers_per_1000": None,
            "transport_coverage_fraction": None,
            "equipment_access_index": None,
            "mobility_access_index": None,
            "deficit_flags": [],
        }
        for district_id in district_ids
    }


def contract_equipment(equipment: dict[str, Any]) -> dict[str, Any]:
    return {field: equipment.get(field) for field in CONTRACT_FIELDS}


def build_sources(demo: bool, env_real: bool, equipment_real: bool) -> list[dict[str, Any]]:
    sources: list[dict[str, Any]] = []
    if env_real:
        sources.extend(
            [
                {
                    "id": "nasa_mod13q1",
                    "name": "MODIS MOD13Q1 (NDVI), colección 6.1",
                    "organization": "NASA",
                    "url": "https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD13Q1",
                    "reference_date": "2015/2025",
                    "license": "NASA open data (verificar términos)",
                    "transformations": ["Máscara QA", "Escala 0.0001", "Ventana estacional fija", "Media anual"],
                    "limitations": ["Resolución 250 m", "Variabilidad estacional"],
                },
                {
                    "id": "nasa_mod11a2",
                    "name": "MODIS MOD11A2 (LST), colección 6.1",
                    "organization": "NASA",
                    "url": "https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD11A2",
                    "reference_date": "2015/2025",
                    "license": "NASA open data (verificar términos)",
                    "transformations": ["Máscara QC", "Conversión a °C", "Ventana estacional fija", "Media anual"],
                    "limitations": ["Resolución 1 km", "LST es temperatura superficial, no del aire"],
                },
            ]
        )
    if equipment_real:
        sources.extend(
            [
                {
                    "id": "gamc_equipment",
                    "name": "GAMC, equipamiento municipal",
                    "organization": "Gobierno Autónomo Municipal de Cochabamba",
                    "url": "https://recursosgamc.cochabamba.bo/api-doc",
                    "reference_date": None,
                    "license": "Verificar condiciones de uso del GAMC",
                    "transformations": ["Agregación por distrito", "Normalización min-max"],
                    "limitations": ["Depende de la entrega vectorial municipal"],
                },
                {
                    "id": "gamc_population",
                    "name": "GAMC, población por distrito",
                    "organization": "Gobierno Autónomo Municipal de Cochabamba",
                    "url": "https://recursosgamc.cochabamba.bo/api-doc",
                    "reference_date": None,
                    "license": "Verificar condiciones de uso del GAMC",
                    "transformations": ["Agregación por distrito"],
                    "limitations": ["Año censal o administrativo por confirmar"],
                },
                {
                    "id": "gamc_transport",
                    "name": "GAMC, cobertura de transporte",
                    "organization": "Gobierno Autónomo Municipal de Cochabamba",
                    "url": "https://recursosgamc.cochabamba.bo/api-doc",
                    "reference_date": None,
                    "license": "Verificar condiciones de uso del GAMC",
                    "transformations": ["Cobertura fraccional por distrito"],
                    "limitations": ["Requiere GeoJSON de líneas validado"],
                },
            ]
        )
    if demo:
        sources.append(
            {
                "id": "mock",
                "name": "Mock de desarrollo GeoQocha",
                "organization": "Equipo GeoQocha",
                "url": "https://github.com/Raulez3104/Hackathon-Nasa",
                "reference_date": "2026-11-13",
                "license": "CC BY 4.0 para datos ilustrativos",
                "transformations": ["Datos sintéticos generados para desarrollo"],
                "limitations": ["No representa mediciones reales ni datos oficiales"],
            }
        )
    sources.append(
        {
            "id": "geoqocha_methodology",
            "name": "Metodología ICVSA GeoQocha",
            "organization": "Equipo GeoQocha",
            "url": "https://github.com/Raulez3104/Hackathon-Nasa",
            "reference_date": f"v{METHODOLOGY_VERSION}",
            "license": "CC BY 4.0",
            "transformations": ["Normalización min-max", "Ponderación ICVSA", "Reglas de hotspot"],
            "limitations": ["Indicador sintético de apoyo; no mide bienestar de forma definitiva"],
        }
    )
    return sources


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Pipeline de datos GeoQocha")
    parser.add_argument("--from", dest="from_year", type=int, default=2015)
    parser.add_argument("--to", dest="to_year", type=int, default=2025)
    parser.add_argument("--geojson", type=Path, default=DEFAULT_DISTRICTS_GEOJSON)
    parser.add_argument("--nasa-csv", type=Path, default=None)
    parser.add_argument("--nasa-observations", type=Path, default=None)
    parser.add_argument("--municipal", type=Path, default=None)
    parser.add_argument("--demo", action="store_true", help="Fuerza datos ilustrativos del mock")
    parser.add_argument("--no-frontend-copy", action="store_true")
    parser.add_argument("--frontend-output", type=Path, default=FRONTEND_OUTPUT)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    years = years_in_period(args.from_year, args.to_year)
    if len(years) < 2:
        raise SystemExit("El periodo debe incluir al menos dos años")

    ensure_directories()
    if not MOCK_PATH.exists():
        raise SystemExit(f"No existe el mock compartido: {MOCK_PATH}")
    mock_payload = read_json(MOCK_PATH)
    mock_districts = mock_payload.get("districts", [])
    mock_by_id = {district["district_id"]: district for district in mock_districts}

    if args.geojson.exists():
        districts = load_geojson_districts(args.geojson)
    else:
        print(f"AVISO: no existe {args.geojson}; se usan geometrías del mock ilustrativo.", file=sys.stderr)
        districts = districts_from_mock(mock_payload)
    district_ids = [district["district_id"] for district in districts]

    nasa_csv = args.nasa_csv if args.nasa_csv is not None else (DEFAULT_NASA_CSV if DEFAULT_NASA_CSV.exists() else None)
    observations_path = (
        args.nasa_observations
        if args.nasa_observations is not None
        else (DEFAULT_NASA_OBSERVATIONS if DEFAULT_NASA_OBSERVATIONS.exists() else None)
    )
    municipal_path = (
        args.municipal
        if args.municipal is not None
        else (DEFAULT_MUNICIPAL_JSON if DEFAULT_MUNICIPAL_JSON.exists() else None)
    )
    if args.demo:
        observations_path = None
        nasa_csv = None
        municipal_path = None

    for explicit, path in (
        (args.nasa_csv is not None, args.nasa_csv),
        (args.nasa_observations is not None, args.nasa_observations),
        (args.municipal is not None, args.municipal),
    ):
        if explicit and path is not None and not path.exists():
            raise SystemExit(f"No existe el insumo indicado: {path}")

    env_real = observations_path is not None or nasa_csv is not None
    equipment_real = municipal_path is not None
    demo = not env_real and not equipment_real

    if demo:
        environmental_rows = nasa_rows_from_mock(mock_districts)
    elif observations_path is not None:
        environmental_rows = load_observations(observations_path, years, NDVI_SEASONAL_WINDOW)
    elif nasa_csv is not None:
        environmental_rows = load_zonal_csv(nasa_csv)
    else:
        environmental_rows = {}

    reference_year: int | None = None
    if equipment_real and municipal_path is not None:
        equipment_by_id, reference_year = equipment_from_municipal(read_json(municipal_path), district_ids)
    elif demo:
        equipment_by_id, reference_year = equipment_from_mock(mock_districts, district_ids)
        reference_year = reference_year or 2024
    else:
        equipment_by_id = empty_equipment(district_ids, reference_year)

    records, normalization = compute_indexes(
        environmental_rows,
        equipment_by_id,
        district_ids,
        years,
        quality_override=demo,
    )

    if demo:
        for district_id in district_ids:
            for year in years:
                mock_point = next(
                    (
                        point
                        for point in mock_by_id.get(district_id, {}).get("series", [])
                        if point.get("year") == year
                    ),
                    {},
                )
                if mock_point.get("data_quality_flag"):
                    records[(district_id, year)]["data_quality_flag"] = mock_point["data_quality_flag"]

    environment_sources = ["nasa_mod13q1", "nasa_mod11a2"] if env_real else []
    equipment_sources = ["gamc_equipment", "gamc_population", "gamc_transport"] if equipment_real else []
    geometry_sources = ["gamc_districts"] if not demo else []
    base_sources = ["mock"] if demo else []
    row_sources = list(dict.fromkeys(base_sources + environment_sources + equipment_sources + geometry_sources))

    district_outputs: list[dict[str, Any]] = []
    for district in districts:
        district_id = district["district_id"]
        series = series_for_district(records, district_id, years)
        trends = compute_trends(series)
        equipment = equipment_by_id.get(district_id, {})
        mock_district = mock_by_id.get(district_id, {})

        populated_years = [
            point["year"]
            for point in series
            if any(
                point.get(field) is not None
                for field in (
                    "ndvi_mean",
                    "lst_mean_celsius",
                    "environmental_index",
                    "socioenvironmental_index",
                )
            )
        ]
        latest_year = max(populated_years) if populated_years else None
        latest_point = next((point for point in series if point["year"] == latest_year), {})
        latest_index = latest_point.get("socioenvironmental_index")

        stops = copy.deepcopy(mock_district.get("transport_stops", [])) if demo else []
        population = equipment.get("population")
        population_year = equipment.get("population_year")
        if population is None and demo:
            population = mock_district.get("population")
            population_year = mock_district.get("population_year")

        district_outputs.append(
            {
                "district_id": district_id,
                "name": district["name"],
                "geometry": district.get("geometry") or mock_district.get("geometry"),
                "area_km2": district.get("area_km2", mock_district.get("area_km2")),
                "population": population,
                "population_year": population_year,
                "territorial_reference_year": equipment.get("territorial_reference_year", reference_year),
                "latest_year": latest_year,
                "latest_socioenvironmental_index": latest_index,
                "risk_level": risk_level_from_index(latest_index),
                "series": series,
                "trends": trends,
                "equipment": contract_equipment(equipment),
                "transport_stops": stops,
                "data_status": "illustrative" if demo else "real",
                "source_refs": row_sources,
            }
        )

    dataset_status = "illustrative" if demo else "real"
    generated_at = utc_now()
    dataset = {
        "contract_version": CONTRACT_VERSION,
        "data_status": dataset_status,
        "generated_at": generated_at,
        "districts": district_outputs,
    }

    errors = validate_dataset(dataset, years)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    district_year_records = []
    for district_id in district_ids:
        for year in years:
            record = dict(records[(district_id, year)])
            record["source_refs"] = row_sources
            district_year_records.append(record)

    hotspots_by_year = build_hotspots_by_year(district_outputs, years)
    correlations = build_correlations(district_outputs)
    heatmap = build_heatmap(district_outputs, years, "lst")
    bbox_values = []
    raster_urls = {}
    for year in years:
        path = PROCESSED_DIR / f"heatmap_lst_{year}.png"
        bbox = render_raster(district_outputs, year, "lst", path)
        if bbox:
            bbox_values.append(bbox)
            raster_urls[str(year)] = f"/api/heatmap/{year}/lst.png"
    heatmap["generated_at"] = generated_at
    heatmap["raster_urls"] = raster_urls
    heatmap["bbox"] = (
        [
            min(item[0] for item in bbox_values),
            min(item[1] for item in bbox_values),
            max(item[2] for item in bbox_values),
            max(item[3] for item in bbox_values),
        ]
        if bbox_values
        else None
    )
    heatmap["attribution"] = "NASA MODIS MOD11A2 / GAMC / Mock GeoQocha"

    index_payload = {
        "methodology_version": METHODOLOGY_VERSION,
        "generated_at": generated_at,
        "weights": WEIGHTS,
        "normalization": normalization,
        "temporal_policy": {
            "environmental": "annual",
            "territorial": "fixed_at_reference_year",
            "territorial_reference_year": reference_year,
            "interpolation_allowed": False,
        },
        "sensitivity": {
            "field": "index_without_territorial",
            "description": "ICVSA calculado solo con NDVI y LST.",
        },
        "districts": [
            {
                "district_id": district_id,
                "series": [
                    {
                        "year": records[(district_id, year)]["year"],
                        "environmental_index": records[(district_id, year)]["environmental_index"],
                        "socioenvironmental_index": records[(district_id, year)]["socioenvironmental_index"],
                        "index_without_territorial": records[(district_id, year)]["index_without_territorial"],
                        "territorial_reference_year": records[(district_id, year)]["territorial_reference_year"],
                    }
                    for year in years
                ],
            }
            for district_id in district_ids
        ],
    }

    sources = build_sources(demo, env_real, equipment_real)

    write_json(PROCESSED_DIR / "distritos_data.json", dataset)
    write_json(
        PROCESSED_DIR / "district_year.json",
        {
            "contract_version": CONTRACT_VERSION,
            "methodology_version": METHODOLOGY_VERSION,
            "generated_at": generated_at,
            "years": years,
            "records": district_year_records,
        },
    )
    write_json(
        PROCESSED_DIR / "trends.json",
        {
            "methodology_version": METHODOLOGY_VERSION,
            "generated_at": generated_at,
            "districts": [
                {"district_id": district["district_id"], "trends": district["trends"]}
                for district in district_outputs
            ],
        },
    )
    write_json(
        PROCESSED_DIR / "equipment_metrics.json",
        {
            "methodology_version": METHODOLOGY_VERSION,
            "generated_at": generated_at,
            "territorial_reference_year": reference_year,
            "districts": [contract_equipment(equipment_by_id[district_id]) for district_id in district_ids],
        },
    )
    write_json(
        PROCESSED_DIR / "hotspots.json",
        {
            "methodology_version": METHODOLOGY_VERSION,
            "generated_at": generated_at,
            "disclaimer": HOTSPOT_DISCLAIMER,
            "min_note": f"Correlaciones requieren n >= {CORRELATION_MIN_N}.",
            "latest_year": years[-1],
            "years": hotspots_by_year,
        },
    )
    write_json(
        PROCESSED_DIR / "correlations.json",
        {
            "methodology_version": METHODOLOGY_VERSION,
            "generated_at": generated_at,
            "disclaimer": CORRELATION_DISCLAIMER,
            "min_n": CORRELATION_MIN_N,
            "results": correlations,
        },
    )
    write_json(PROCESSED_DIR / "heatmap_lst.json", heatmap)
    write_json(PROCESSED_DIR / "index.json", index_payload)
    write_json(PROCESSED_DIR / "gaps.json", {
        "methodology_version": METHODOLOGY_VERSION,
        "generated_at": generated_at,
        **build_gaps(records, district_ids, years),
    })
    write_json(
        PROCESSED_DIR.parent / "metadata" / "sources.json",
        {
            "contract_version": CONTRACT_VERSION,
            "generated_at": generated_at,
            "sources": sources,
        },
    )

    if not args.no_frontend_copy:
        write_json(args.frontend_output, dataset)

    print(
        f"OK: {len(district_outputs)} distritos × {len(years)} años | "
        f"data_status={dataset_status} | fuentes={','.join(row_sources) or 'ninguna'}"
    )
    print(f"Salida principal: {PROCESSED_DIR / 'distritos_data.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
