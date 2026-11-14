"""Brechas distritales frente al promedio municipal del mismo año."""

from __future__ import annotations

from typing import Any

from utils import mean, round_number

GAP_VARIABLES = {
    "ndvi": "ndvi_mean",
    "lst": "lst_mean_celsius",
    "environmental_index": "environmental_index",
    "socioenvironmental_index": "socioenvironmental_index",
    "equipment_access_index": "equipment_access_index",
    "mobility_access_index": "mobility_access_index",
}


def build_gaps(records: dict[tuple[int, int], dict[str, Any]], district_ids: list[int], years: list[int]) -> dict[str, Any]:
    result: dict[str, Any] = {"years": {}, "variables": list(GAP_VARIABLES)}
    for year in years:
        averages = {}
        for variable, field in GAP_VARIABLES.items():
            averages[variable] = round_number(mean(records.get((district_id, year), {}).get(field) for district_id in district_ids), 3)

        rows = []
        for district_id in district_ids:
            record = records.get((district_id, year), {})
            gaps = {}
            for variable, field in GAP_VARIABLES.items():
                value = record.get(field)
                average = averages[variable]
                if value is None or average is None:
                    gaps[variable] = {"absolute": None, "relative_percent": None}
                    continue
                absolute = value - average
                relative = (absolute / average * 100.0) if average != 0 else None
                gaps[variable] = {
                    "absolute": round_number(absolute, 3),
                    "relative_percent": round_number(relative, 1),
                }
            rows.append({"district_id": district_id, "gaps": gaps})

        result["years"][str(year)] = {
            "municipal_average": averages,
            "districts": rows,
        }
    return result
