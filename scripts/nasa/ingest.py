"""Lectura de entradas NASA: observaciones crudas MODIS o estadisticas zonales ya agregadas."""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Any

from nasa.modis import aggregate_observations
from utils import read_json


def load_observations(path: Path, years: list[int], window: tuple[int, int]) -> dict[tuple[int, int], dict[str, Any]]:
    """Lee observaciones crudas y aplica QA, escala y ventana estacional."""
    payload = read_json(path)
    if isinstance(payload, dict):
        observations = payload.get("observations", [])
    else:
        observations = payload
    if not isinstance(observations, list):
        raise ValueError("modis_observations.json debe contener una lista 'observations'")

    grouped: dict[int, list[dict[str, Any]]] = {}
    for observation in observations:
        district_id = observation.get("district_id")
        if not isinstance(district_id, int):
            continue
        grouped.setdefault(district_id, []).append(observation)

    results: dict[tuple[int, int], dict[str, Any]] = {}
    for district_id, district_observations in grouped.items():
        for year in years:
            aggregated = aggregate_observations(district_observations, year, window)
            aggregated["district_id"] = district_id
            results[(district_id, year)] = aggregated
    return results


def load_zonal_csv(path: Path) -> dict[tuple[int, int], dict[str, Any]]:
    """Lee una tabla distrito-año exportada desde GEE, ya filtrada por QA.

    Columnas aceptadas:
    district_id, year, ndvi_mean, ndvi_valid_observation_count,
    ndvi_valid_pixel_fraction, lst_mean_celsius | lst_mean_kelvin,
    lst_valid_pixel_fraction.
    """
    results: dict[tuple[int, int], dict[str, Any]] = {}
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            try:
                district_id = int(row["district_id"])
                year = int(row["year"])
            except (KeyError, TypeError, ValueError):
                continue

            lst_value: float | None
            if row.get("lst_mean_celsius") not in (None, ""):
                lst_value = float(row["lst_mean_celsius"])
            elif row.get("lst_mean_kelvin") not in (None, ""):
                lst_value = float(row["lst_mean_kelvin"]) - 273.15
            else:
                lst_value = None

            def optional_float(key: str) -> float | None:
                raw = row.get(key)
                if raw in (None, ""):
                    return None
                try:
                    return float(raw)
                except ValueError:
                    return None

            def optional_int(key: str) -> int | None:
                raw = row.get(key)
                if raw in (None, ""):
                    return None
                try:
                    return int(float(raw))
                except ValueError:
                    return None

            results[(district_id, year)] = {
                "district_id": district_id,
                "year": year,
                "ndvi_mean": optional_float("ndvi_mean"),
                "ndvi_valid_observation_count": optional_int("ndvi_valid_observation_count"),
                "ndvi_valid_pixel_fraction": optional_float("ndvi_valid_pixel_fraction"),
                "lst_mean_celsius": lst_value,
                "lst_valid_pixel_fraction": optional_float("lst_valid_pixel_fraction"),
            }
    return results


def nasa_rows_from_mock(mock_districts: list[dict[str, Any]]) -> dict[tuple[int, int], dict[str, Any]]:
    """Datos ilustrativos para desarrollo mientras no existan insumos NASA reales."""
    results: dict[tuple[int, int], dict[str, Any]] = {}
    for district in mock_districts:
        district_id = district["district_id"]
        for point in district.get("series", []):
            results[(district_id, point["year"])] = {
                "district_id": district_id,
                "year": point["year"],
                "ndvi_mean": point.get("ndvi_mean"),
                "ndvi_valid_observation_count": None,
                "ndvi_valid_pixel_fraction": None,
                "lst_mean_celsius": point.get("lst_mean_celsius"),
                "lst_valid_pixel_fraction": None,
            }
    return results
