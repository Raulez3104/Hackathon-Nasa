"""Tendencias, aceleracion y significancia por variable."""

from __future__ import annotations

from typing import Any

from config import TREND_CONFIG
from indicators.stats import ols, slope
from utils import round_number

TREND_VARIABLES = {
    "ndvi": "ndvi_mean",
    "lst": "lst_mean_celsius",
    "environmental_index": "environmental_index",
    "socioenvironmental_index": "socioenvironmental_index",
}


def _direction(variable: str, slope_value: float | None) -> str:
    if slope_value is None:
        return "undetermined"
    config = TREND_CONFIG[variable]
    if abs(slope_value) < config["stable_threshold"]:
        return "stable"
    improving = slope_value > 0
    if not config["positive_is_improving"]:
        improving = not improving
    return "improving" if improving else "worsening"


def _notes(variable: str, points: int, direction: str, significant: bool | None) -> list[str]:
    notes: list[str] = []
    if points < 3:
        notes.append("Pocos años válidos: la tendencia es indicativa y no concluyente.")
    if direction == "stable":
        notes.append("Pendiente pequeña comparada con la variabilidad anual.")
    if significant is False:
        notes.append("La pendiente no es estadísticamente significativa al 5 %.")
    if variable == "lst":
        notes.append("LST es temperatura superficial, no temperatura del aire.")
    return notes


def compute_trend(series: list[dict[str, Any]], variable: str) -> dict[str, Any]:
    field = TREND_VARIABLES[variable]
    config = TREND_CONFIG[variable]
    points = [(point["year"], point[field]) for point in series if point.get(field) is not None]
    years = [year for year, _ in points]
    values = [value for _, value in points]

    regression = ols([float(year) for year in years], values)
    slope_value = regression["slope"]
    p_value = regression["p_value"]
    is_significant = None
    if p_value is not None:
        is_significant = bool(p_value < 0.05)

    early = [(year, value) for year, value in points if year <= 2020]
    recent = [(year, value) for year, value in points if year >= 2020]
    early_slope = slope(early) if len(early) >= 2 else None
    recent_slope = slope(recent) if len(recent) >= 2 else None
    acceleration = None
    if early_slope is not None and recent_slope is not None:
        acceleration = recent_slope - early_slope

    accelerated = False
    if acceleration is not None:
        accelerated = abs(acceleration) >= config["acceleration_threshold"]

    direction = _direction(variable, slope_value)

    return {
        "variable": variable,
        "direction": direction,
        "slope_per_year": round_number(slope_value, 4),
        "unit": config["unit"],
        "years_used": years,
        "method": "OLS sobre medias anuales",
        "is_significant": is_significant,
        "acceleration": round_number(acceleration, 4),
        "accelerated": accelerated,
        "notes": _notes(variable, len(points), direction, is_significant),
    }


def compute_trends(series: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [compute_trend(series, variable) for variable in TREND_VARIABLES]
