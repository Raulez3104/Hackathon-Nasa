"""Integracion territorial: equipamiento, demografia y movilidad con t_ref fijo."""

from __future__ import annotations

from typing import Any

from config import EQUIPMENT_THRESHOLDS
from utils import min_max, round_number, safe_divide


def _component_scores(values: list[float | None]) -> list[float | None]:
    minimum, maximum = min_max(values)
    if minimum is None or maximum is None or maximum <= minimum:
        return [50.0 if value is not None else None for value in values]
    return [
        None if value is None else round((value - minimum) / (maximum - minimum) * 100.0, 1)
        for value in values
    ]


def _deficit_flags(metrics: dict[str, Any]) -> list[str]:
    flags: list[str] = []
    if metrics.get("green_area_m2_per_capita") is not None and metrics["green_area_m2_per_capita"] < EQUIPMENT_THRESHOLDS["green_area_m2_per_capita"]:
        flags.append("GREEN_AREA_LOW")
    if metrics.get("schools_per_1000") is not None and metrics["schools_per_1000"] < EQUIPMENT_THRESHOLDS["schools_per_1000"]:
        flags.append("SCHOOLS_LOW")
    if metrics.get("health_centers_per_1000") is not None and metrics["health_centers_per_1000"] < EQUIPMENT_THRESHOLDS["health_centers_per_1000"]:
        flags.append("HEALTH_CENTERS_LOW")
    if metrics.get("transport_coverage_fraction") is not None and metrics["transport_coverage_fraction"] < EQUIPMENT_THRESHOLDS["transport_coverage_fraction"]:
        flags.append("TRANSPORT_COVERAGE_LOW")
    if metrics.get("equipment_access_index") is not None and metrics["equipment_access_index"] < EQUIPMENT_THRESHOLDS["equipment_access_index"]:
        flags.append("EQUIPMENT_ACCESS_LOW")
    if metrics.get("mobility_access_index") is not None and metrics["mobility_access_index"] < EQUIPMENT_THRESHOLDS["mobility_access_index"]:
        flags.append("MOBILITY_ACCESS_LOW")
    return flags


def equipment_from_municipal(payload: dict[str, Any], district_ids: list[int]) -> tuple[dict[int, dict[str, Any]], int | None]:
    reference_year = payload.get("territorial_reference_year")
    rows = payload.get("districts", [])
    by_id: dict[int, dict[str, Any]] = {}

    for row in rows:
        district_id = row.get("district_id")
        if district_id not in district_ids:
            continue
        population = row.get("population")
        green_area_m2 = row.get("green_area_m2")
        schools = row.get("schools_count")
        health = row.get("health_centers_count")
        coverage = row.get("transport_coverage_fraction")

        green_per_capita = None
        if green_area_m2 is not None and population:
            green_per_capita = safe_divide(green_area_m2, population)
        schools_per_1000 = None
        if schools is not None and population:
            schools_per_1000 = safe_divide(float(schools) * 1000.0, population)
        health_per_1000 = None
        if health is not None and population:
            health_per_1000 = safe_divide(float(health) * 1000.0, population)

        by_id[district_id] = {
            "district_id": district_id,
            "territorial_reference_year": reference_year,
            "population": population,
            "population_year": row.get("population_year"),
            "green_area_m2_per_capita": green_per_capita,
            "schools_per_1000": schools_per_1000,
            "health_centers_per_1000": health_per_1000,
            "transport_coverage_fraction": coverage,
            "_green_area_m2": green_area_m2,
            "_schools_count": schools,
            "_health_centers_count": health,
        }

    green_scores = _component_scores([by_id.get(district_id, {}).get("green_area_m2_per_capita") for district_id in district_ids])
    school_scores = _component_scores([by_id.get(district_id, {}).get("schools_per_1000") for district_id in district_ids])
    health_scores = _component_scores([by_id.get(district_id, {}).get("health_centers_per_1000") for district_id in district_ids])

    for index, district_id in enumerate(district_ids):
        metrics = by_id.setdefault(
            district_id,
            {
                "district_id": district_id,
                "territorial_reference_year": reference_year,
                "population": None,
                "population_year": None,
                "green_area_m2_per_capita": None,
                "schools_per_1000": None,
                "health_centers_per_1000": None,
                "transport_coverage_fraction": None,
                "_green_area_m2": None,
                "_schools_count": None,
                "_health_centers_count": None,
            },
        )
        components = [green_scores[index], school_scores[index], health_scores[index]]
        if all(component is not None for component in components):
            metrics["equipment_access_index"] = round(sum(components) / 3.0, 1)
        else:
            metrics["equipment_access_index"] = None

        coverage = metrics.get("transport_coverage_fraction")
        metrics["mobility_access_index"] = None if coverage is None else round(float(coverage) * 100.0, 1)
        metrics["deficit_flags"] = _deficit_flags(metrics)

    for metrics in by_id.values():
        metrics.pop("_green_area_m2", None)
        metrics.pop("_schools_count", None)
        metrics.pop("_health_centers_count", None)
        for key in (
            "green_area_m2_per_capita",
            "schools_per_1000",
            "health_centers_per_1000",
            "transport_coverage_fraction",
        ):
            metrics[key] = round_number(metrics.get(key), 3)

    return by_id, reference_year


def equipment_from_mock(mock_districts: list[dict[str, Any]], district_ids: list[int]) -> tuple[dict[int, dict[str, Any]], int | None]:
    by_id: dict[int, dict[str, Any]] = {}
    reference_years: list[int] = []
    for district in mock_districts:
        district_id = district.get("district_id")
        if district_id not in district_ids:
            continue
        equipment = dict(district.get("equipment") or {})
        equipment["district_id"] = district_id
        equipment.setdefault("population", district.get("population"))
        equipment["population_year"] = district.get("population_year")
        reference_year = equipment.get("territorial_reference_year") or district.get("territorial_reference_year")
        equipment["territorial_reference_year"] = reference_year
        if reference_year is not None:
            reference_years.append(reference_year)
        equipment.setdefault("deficit_flags", [])
        by_id[district_id] = equipment

    for district_id in district_ids:
        by_id.setdefault(
            district_id,
            {
                "district_id": district_id,
                "territorial_reference_year": reference_years[0] if reference_years else None,
                "population": None,
                "population_year": None,
                "green_area_m2_per_capita": None,
                "schools_per_1000": None,
                "health_centers_per_1000": None,
                "transport_coverage_fraction": None,
                "equipment_access_index": None,
                "mobility_access_index": None,
                "deficit_flags": [],
            },
        )

    reference_year = round(sum(reference_years) / len(reference_years)) if reference_years else None
    return by_id, reference_year
