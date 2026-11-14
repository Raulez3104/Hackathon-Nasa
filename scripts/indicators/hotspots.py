"""Hotspots explicables por reglas, sin cajas negras."""

from __future__ import annotations

from typing import Any

from config import HOTSPOT_RULES, PRIORITY_THRESHOLDS
from utils import round_number

PRIORITY_RANK = {"low": 1, "medium": 2, "high": 3, "insufficient_data": 0}


def _rule(
    rule_id: str,
    variable: str,
    observed: float | None,
    triggered: bool,
    description: str | None = None,
    threshold: float | None = None,
) -> dict[str, Any]:
    config = HOTSPOT_RULES[rule_id]
    return {
        "rule_id": rule_id,
        "variable": variable,
        "description": description or config["description"],
        "observed_value": round_number(observed, 4),
        "threshold": threshold if threshold is not None else config["threshold"],
        "triggered": triggered,
    }


def build_hotspot(district: dict[str, Any], year: int) -> dict[str, Any]:
    point = next((item for item in district.get("series", []) if item.get("year") == year), {})
    trends = {trend.get("variable"): trend for trend in district.get("trends", [])}
    equipment = district.get("equipment") or {}

    ndvi_slope = trends.get("ndvi", {}).get("slope_per_year")
    lst_slope = trends.get("lst", {}).get("slope_per_year")
    environmental_index = point.get("environmental_index")
    ndvi = point.get("ndvi_mean")
    green_area = equipment.get("green_area_m2_per_capita")
    coverage = equipment.get("transport_coverage_fraction")

    rules = [
        _rule(
            "NDVI_NEGATIVE_TREND",
            "ndvi",
            ndvi_slope,
            ndvi_slope is not None and ndvi_slope < HOTSPOT_RULES["NDVI_NEGATIVE_TREND"]["threshold"],
        ),
        _rule(
            "LST_POSITIVE_TREND",
            "lst",
            lst_slope,
            lst_slope is not None and lst_slope > HOTSPOT_RULES["LST_POSITIVE_TREND"]["threshold"],
        ),
        _rule(
            "LOW_ENVIRONMENTAL_INDEX",
            "environmental_index",
            environmental_index,
            environmental_index is not None and environmental_index < HOTSPOT_RULES["LOW_ENVIRONMENTAL_INDEX"]["threshold"],
        ),
        _rule(
            "EQUIPMENT_DEFICIT",
            "equipment",
            green_area,
            green_area is not None and green_area < HOTSPOT_RULES["EQUIPMENT_DEFICIT"]["threshold"],
        ),
        _rule(
            "MOBILITY_DEFICIT",
            "coverage",
            coverage,
            coverage is not None and coverage < HOTSPOT_RULES["MOBILITY_DEFICIT"]["threshold"],
        ),
        _rule(
            "LOW_NDVI",
            "ndvi",
            ndvi,
            ndvi is not None and ndvi < HOTSPOT_RULES["LOW_NDVI"]["threshold"],
        ),
    ]

    evaluable = [rule for rule in rules if rule["observed_value"] is not None]
    if not evaluable:
        return {
            "district_id": district.get("district_id"),
            "district_name": district.get("name"),
            "year": year,
            "priority_level": "insufficient_data",
            "score": None,
            "rules": rules,
            "explanation": "Sin datos suficientes para evaluar reglas en este año.",
        }

    triggered = [rule for rule in rules if rule["triggered"]]
    score = sum(HOTSPOT_RULES[rule["rule_id"]]["weight"] for rule in triggered)
    if score >= PRIORITY_THRESHOLDS["high"]:
        priority = "high"
    elif score >= PRIORITY_THRESHOLDS["medium"]:
        priority = "medium"
    else:
        priority = "low"

    if triggered:
        explanation = "Reglas activadas: " + "; ".join(
            HOTSPOT_RULES[rule["rule_id"]]["description"].rstrip(".") for rule in triggered
        ) + ". Requiere estudio adicional."
    else:
        explanation = "No se activaron reglas de hotspot con los umbrales publicados."

    return {
        "district_id": district.get("district_id"),
        "district_name": district.get("name"),
        "year": year,
        "priority_level": priority,
        "score": float(score),
        "rules": rules,
        "explanation": explanation,
    }


def build_hotspots_by_year(districts: list[dict[str, Any]], years: list[int]) -> dict[str, list[dict[str, Any]]]:
    result: dict[str, list[dict[str, Any]]] = {}
    for year in years:
        hotspots = [build_hotspot(district, year) for district in districts]
        hotspots.sort(key=lambda item: (item["score"] is None, -(item["score"] or 0), item["district_id"]))
        result[str(year)] = hotspots
    return result


def filter_hotspots(
    hotspots: list[dict[str, Any]],
    min_priority: str = "medium",
) -> list[dict[str, Any]]:
    minimum = PRIORITY_RANK.get(min_priority, 0)
    return [
        hotspot
        for hotspot in hotspots
        if PRIORITY_RANK.get(hotspot.get("priority_level", "insufficient_data"), 0) >= minimum
    ]
