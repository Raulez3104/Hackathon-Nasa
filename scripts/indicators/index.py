"""Construccion del ICVSA historico con componente territorial fijo."""

from __future__ import annotations

from typing import Any

from config import WEIGHTS
from utils import data_quality_flag, min_max, normalize_min_max, round_number


def compute_indexes(
    environmental_rows: dict[tuple[int, int], dict[str, Any]],
    equipment_by_id: dict[int, dict[str, Any]],
    district_ids: list[int],
    years: list[int],
    quality_override: bool = False,
) -> tuple[dict[tuple[int, int], dict[str, Any]], dict[str, Any]]:
    ndvi_min, ndvi_max = min_max(
        row.get("ndvi_mean") for row in environmental_rows.values()
    )
    lst_min, lst_max = min_max(
        row.get("lst_mean_celsius") for row in environmental_rows.values()
    )

    results: dict[tuple[int, int], dict[str, Any]] = {}
    for district_id in district_ids:
        equipment = equipment_by_id.get(district_id, {})
        equipment_index = equipment.get("equipment_access_index")
        mobility_index = equipment.get("mobility_access_index")
        reference_year = equipment.get("territorial_reference_year")

        for year in years:
            environmental = environmental_rows.get((district_id, year), {})
            ndvi = environmental.get("ndvi_mean")
            lst = environmental.get("lst_mean_celsius")
            s_ndvi = normalize_min_max(ndvi, ndvi_min, ndvi_max)
            s_lst = normalize_min_max(lst, lst_min, lst_max, invert=True)

            environmental_index = None
            if s_ndvi is not None and s_lst is not None:
                environmental_index = round((s_ndvi + s_lst) / 2.0, 1)

            # La sensibilidad sin territorio usa solo NDVI+LST, renormalizado a 1..100.
            index_without_territorial = environmental_index

            socioenvironmental_index = None
            if (
                s_ndvi is not None
                and s_lst is not None
                and equipment_index is not None
                and mobility_index is not None
            ):
                socioenvironmental_index = round(
                    WEIGHTS["vegetation"] * s_ndvi
                    + WEIGHTS["surface_temperature"] * s_lst
                    + WEIGHTS["urban_equipment"] * equipment_index
                    + WEIGHTS["mobility"] * mobility_index,
                    1,
                )

            environmental_available = ndvi is not None and lst is not None
            territorial_available = equipment_index is not None and mobility_index is not None
            if quality_override and environmental_available and territorial_available:
                quality = "ok"
            else:
                quality = data_quality_flag(
                    environmental_available,
                    territorial_available,
                    environmental.get("ndvi_valid_pixel_fraction"),
                    environmental.get("lst_valid_pixel_fraction"),
                )

            results[(district_id, year)] = {
                "district_id": district_id,
                "year": year,
                "ndvi_mean": round_number(ndvi, 4),
                "ndvi_valid_observation_count": environmental.get("ndvi_valid_observation_count"),
                "ndvi_valid_pixel_fraction": round_number(environmental.get("ndvi_valid_pixel_fraction"), 3),
                "lst_mean_celsius": round_number(lst, 2),
                "lst_valid_pixel_fraction": round_number(environmental.get("lst_valid_pixel_fraction"), 3),
                "environmental_index": environmental_index,
                "socioenvironmental_index": socioenvironmental_index,
                "index_without_territorial": index_without_territorial,
                "territorial_reference_year": reference_year,
                "equipment_access_index": equipment_index,
                "mobility_access_index": mobility_index,
                "data_quality_flag": quality,
            }

    normalization = {
        "ndvi_min": round_number(ndvi_min, 4),
        "ndvi_max": round_number(ndvi_max, 4),
        "lst_min_celsius": round_number(lst_min, 2),
        "lst_max_celsius": round_number(lst_max, 2),
        "reference_period": f"{years[0]}-{years[-1]}" if years else None,
        "description": "Min-max fijo sobre todas las observaciones distrito-año del periodo.",
    }
    return results, normalization


def series_for_district(records: dict[tuple[int, int], dict[str, Any]], district_id: int, years: list[int]) -> list[dict[str, Any]]:
    points: list[dict[str, Any]] = []
    for year in years:
        record = records.get((district_id, year), {})
        points.append(
            {
                "year": year,
                "ndvi_mean": record.get("ndvi_mean"),
                "lst_mean_celsius": record.get("lst_mean_celsius"),
                "environmental_index": record.get("environmental_index"),
                "socioenvironmental_index": record.get("socioenvironmental_index"),
                "index_without_territorial": record.get("index_without_territorial"),
                "data_quality_flag": record.get("data_quality_flag", "insufficient"),
            }
        )
    return points
