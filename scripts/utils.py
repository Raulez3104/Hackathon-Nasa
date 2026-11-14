"""Utilidades compartidas del pipeline, sin dependencias externas."""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any, Iterable

from config import MIN_VALID_FRACTION, PARTIAL_VALID_FRACTION


def read_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def round_number(value: float | None, digits: int = 2) -> float | None:
    if value is None or not isinstance(value, (int, float)) or not math.isfinite(value):
        return None
    return round(float(value), digits)


def safe_divide(numerator: float | None, denominator: float | None) -> float | None:
    if numerator is None or denominator is None or denominator == 0:
        return None
    return numerator / denominator


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def mean(values: Iterable[float | None]) -> float | None:
    cleaned = [float(value) for value in values if value is not None]
    if not cleaned:
        return None
    return sum(cleaned) / len(cleaned)


def min_max(values: Iterable[float | None]) -> tuple[float | None, float | None]:
    cleaned = [float(value) for value in values if value is not None]
    if not cleaned:
        return None, None
    return min(cleaned), max(cleaned)


def normalize_min_max(value: float | None, minimum: float | None, maximum: float | None, invert: bool = False) -> float | None:
    """Escala 1..100 con referencia fija; no imputa valores ausentes."""
    if value is None or minimum is None or maximum is None:
        return None
    if maximum <= minimum:
        return 50.0
    ratio = clamp((value - minimum) / (maximum - minimum), 0.0, 1.0)
    if invert:
        ratio = 1.0 - ratio
    return round(1.0 + 99.0 * ratio, 1)


def geometry_centroid(geometry: dict[str, Any] | None) -> tuple[float | None, float | None]:
    if not geometry or geometry.get("type") != "Polygon":
        return None, None
    coordinates = geometry.get("coordinates") or []
    if not coordinates or not coordinates[0]:
        return None, None
    ring = coordinates[0]
    longitudes = [point[0] for point in ring if len(point) >= 2]
    latitudes = [point[1] for point in ring if len(point) >= 2]
    if not longitudes or not latitudes:
        return None, None
    return sum(latitudes) / len(latitudes), sum(longitudes) / len(longitudes)


def geometry_bbox(geometry: dict[str, Any] | None) -> list[float] | None:
    if not geometry or geometry.get("type") != "Polygon":
        return None
    coordinates = geometry.get("coordinates") or []
    if not coordinates or not coordinates[0]:
        return None
    ring = coordinates[0]
    longitudes = [point[0] for point in ring if len(point) >= 2]
    latitudes = [point[1] for point in ring if len(point) >= 2]
    if not longitudes or not latitudes:
        return None
    return [min(longitudes), min(latitudes), max(longitudes), max(latitudes)]


def risk_level_from_index(index: float | None) -> str:
    if index is None:
        return "insufficient_data"
    if index >= 70:
        return "low"
    if index >= 40:
        return "medium"
    return "high"


def data_quality_flag(
    environmental_available: bool,
    territorial_available: bool,
    ndvi_fraction: float | None,
    lst_fraction: float | None,
) -> str:
    if not environmental_available or not territorial_available:
        return "insufficient"
    fractions = [fraction for fraction in (ndvi_fraction, lst_fraction) if fraction is not None]
    if not fractions or min(fractions) < PARTIAL_VALID_FRACTION:
        return "insufficient"
    if min(fractions) < MIN_VALID_FRACTION:
        return "partial"
    return "ok"
