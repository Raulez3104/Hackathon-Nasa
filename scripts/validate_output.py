"""Valida que los productos del pipeline cumplan el contrato de GeoQocha."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import (  # noqa: E402
    CONTRACT_VERSION,
    DEFAULT_DISTRICTS_GEOJSON,
    EXPECTED_DISTRICTS,
    FRONTEND_OUTPUT,
    PROCESSED_DIR,
    years_in_period,
)
from utils import read_json  # noqa: E402

DATA_STATUSES = {"real", "illustrative", "insufficient"}
QUALITY_FLAGS = {"ok", "partial", "insufficient"}
RISK_LEVELS = {"low", "medium", "high", "insufficient_data"}
TREND_VARIABLES = {"ndvi", "lst", "environmental_index", "socioenvironmental_index"}


def _is_number(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def validate_geojson(path: Path) -> list[str]:
    errors: list[str] = []
    if not path.exists():
        return [f"No existe el GeoJSON de distritos: {path}"]
    payload = read_json(path)
    features = payload.get("features") if isinstance(payload, dict) else None
    if not isinstance(features, list) or len(features) != EXPECTED_DISTRICTS:
        errors.append(f"El GeoJSON debe contener {EXPECTED_DISTRICTS} features")
        return errors
    seen: set[int] = set()
    for feature in features:
        properties = feature.get("properties") or {}
        district_id = properties.get("district_id")
        if not isinstance(district_id, int) or not 1 <= district_id <= EXPECTED_DISTRICTS:
            errors.append(f"district_id inválido en GeoJSON: {district_id}")
            continue
        if district_id in seen:
            errors.append(f"district_id duplicado en GeoJSON: {district_id}")
        seen.add(district_id)
        geometry = feature.get("geometry") or {}
        if geometry.get("type") not in {"Polygon", "MultiPolygon"}:
            errors.append(f"Geometría inválida en distrito {district_id}")
    return errors


def validate_dataset(dataset: dict[str, Any], expected_years: list[int] | None = None) -> list[str]:
    errors: list[str] = []
    years = expected_years or years_in_period()

    if dataset.get("contract_version") != CONTRACT_VERSION:
        errors.append("contract_version inválida")
    if dataset.get("data_status") not in DATA_STATUSES:
        errors.append("data_status inválido")
    districts = dataset.get("districts")
    if not isinstance(districts, list) or len(districts) != EXPECTED_DISTRICTS:
        errors.append(f"distritos_data debe contener {EXPECTED_DISTRICTS} distritos")
        return errors

    seen: set[int] = set()
    for district in districts:
        district_id = district.get("district_id")
        if not isinstance(district_id, int) or not 1 <= district_id <= EXPECTED_DISTRICTS:
            errors.append(f"district_id inválido: {district_id}")
            continue
        if district_id in seen:
            errors.append(f"district_id duplicado: {district_id}")
        seen.add(district_id)

        if not isinstance(district.get("name"), str) or not district["name"].strip():
            errors.append(f"nombre inválido en distrito {district_id}")
        if district.get("data_status") not in DATA_STATUSES:
            errors.append(f"data_status inválido en distrito {district_id}")
        if district.get("risk_level") not in RISK_LEVELS:
            errors.append(f"risk_level inválido en distrito {district_id}")

        series = district.get("series")
        if not isinstance(series, list) or len(series) != len(years):
            errors.append(f"serie incompleta en distrito {district_id}")
        else:
            series_years = [point.get("year") for point in series]
            if series_years != years:
                errors.append(f"años inesperados en distrito {district_id}: {series_years}")
            for point in series:
                if point.get("data_quality_flag") not in QUALITY_FLAGS:
                    errors.append(f"calidad inválida en distrito {district_id} año {point.get('year')}")
                ndvi = point.get("ndvi_mean")
                if ndvi is not None and (not _is_number(ndvi) or not -1 <= ndvi <= 1):
                    errors.append(f"ndvi fuera de rango en distrito {district_id} año {point.get('year')}")
                lst = point.get("lst_mean_celsius")
                if lst is not None and (not _is_number(lst) or not -60 <= lst <= 80):
                    errors.append(f"LST fuera de rango en distrito {district_id} año {point.get('year')}")
                for key in ("environmental_index", "socioenvironmental_index", "index_without_territorial"):
                    value = point.get(key)
                    if value is not None and (not _is_number(value) or not 0 <= value <= 100):
                        errors.append(f"{key} fuera de rango en distrito {district_id} año {point.get('year')}")

        trends = district.get("trends")
        if not isinstance(trends, list):
            errors.append(f"trends inválido en distrito {district_id}")
        else:
            present = {trend.get("variable") for trend in trends}
            missing = TREND_VARIABLES - present
            if missing:
                errors.append(f"faltan tendencias en distrito {district_id}: {sorted(missing)}")

        equipment = district.get("equipment")
        if not isinstance(equipment, dict):
            errors.append(f"equipment inválido en distrito {district_id}")
        else:
            if equipment.get("district_id") != district_id:
                errors.append(f"equipment.district_id inconsistente en distrito {district_id}")
            if not isinstance(equipment.get("deficit_flags"), list):
                errors.append(f"deficit_flags inválido en distrito {district_id}")

        if not isinstance(district.get("transport_stops"), list):
            errors.append(f"transport_stops inválido en distrito {district_id}")
        if not isinstance(district.get("source_refs"), list):
            errors.append(f"source_refs inválido en distrito {district_id}")

    return errors


def validate_auxiliary() -> list[str]:
    errors: list[str] = []
    required = [
        "district_year.json",
        "trends.json",
        "equipment_metrics.json",
        "hotspots.json",
        "correlations.json",
        "heatmap_lst.json",
        "index.json",
        "gaps.json",
    ]
    for name in required:
        if not (PROCESSED_DIR / name).exists():
            errors.append(f"Falta el producto data/processed/{name}")
    if not (PROCESSED_DIR.parent / "metadata" / "sources.json").exists():
        errors.append("Falta data/metadata/sources.json")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Valida los productos del pipeline GeoQocha")
    parser.add_argument(
        "--file",
        type=Path,
        default=PROCESSED_DIR / "distritos_data.json",
        help="Ruta de distritos_data.json",
    )
    parser.add_argument("--geojson", type=Path, default=DEFAULT_DISTRICTS_GEOJSON)
    parser.add_argument("--frontend", type=Path, default=FRONTEND_OUTPUT)
    parser.add_argument("--skip-aux", action="store_true", help="No valida los productos auxiliares")
    args = parser.parse_args()

    errors: list[str] = []
    if not args.file.exists():
        errors.append(f"No existe {args.file}")
    else:
        errors.extend(validate_dataset(read_json(args.file)))
    errors.extend(validate_geojson(args.geojson))
    if args.frontend.exists():
        errors.extend(validate_dataset(read_json(args.frontend)))
    if not args.skip_aux:
        errors.extend(validate_auxiliary())

    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1

    print("OK: contrato de datos válido (15 distritos, 11 años y productos auxiliares).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
