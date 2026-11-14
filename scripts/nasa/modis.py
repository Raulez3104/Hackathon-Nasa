"""Reglas de calidad y escalas de MOD13Q1 (NDVI) y MOD11A2 (LST), coleccion 6.1."""

from __future__ import annotations

from datetime import date
from typing import Any, Iterable

NDVI_SCALE_FACTOR = 0.0001
LST_SCALE_FACTOR = 0.02
KELVIN_OFFSET = 273.15

MOD13Q1_COLLECTION = "061"
MOD11A2_COLLECTION = "061"


def scale_ndvi(raw_value: int | float | None) -> float | None:
    """MOD13Q1 entrega NDVI como entero con factor 0.0001."""
    if raw_value is None:
        return None
    return float(raw_value) * NDVI_SCALE_FACTOR


def scale_lst(raw_value: int | float | None) -> float | None:
    """MOD11A2 entrega LST en Kelvin con factor 0.02; se publica en grados Celsius."""
    if raw_value is None:
        return None
    return float(raw_value) * LST_SCALE_FACTOR - KELVIN_OFFSET


def ndvi_summary_qa_is_valid(qa: int | None) -> bool:
    """SummaryQA de MOD13Q1: 0 bueno, 1 marginal, 2 nieve/hielo, 3 nublado."""
    if qa is None:
        return False
    return (int(qa) & 0b11) in (0, 1)


def lst_qc_is_valid(qc: int | None) -> bool:
    """QC de MOD11A2: bits 0-1; 0-2 son calidad aceptable, 3 no producido."""
    if qc is None:
        return False
    return (int(qc) & 0b11) in (0, 1, 2)


def day_of_year(iso_date: str) -> int:
    parsed = date.fromisoformat(iso_date)
    return parsed.timetuple().tm_yday


def is_in_window(iso_date: str, window: tuple[int, int]) -> bool:
    start, end = window
    doy = day_of_year(iso_date)
    if start <= end:
        return start <= doy <= end
    return doy >= start or doy <= end


def aggregate_observations(
    observations: Iterable[dict[str, Any]],
    year: int,
    window: tuple[int, int],
) -> dict[str, Any]:
    """Agrega observaciones de un distrito-año aplicando QA y ventana estacional fija."""
    ndvi_values: list[float] = []
    lst_values: list[float] = []
    ndvi_total = 0
    lst_total = 0
    observations = list(observations)

    for observation in observations:
        iso_date = observation.get("date")
        if not isinstance(iso_date, str) or not iso_date.startswith(str(year)):
            continue
        if not is_in_window(iso_date, window):
            continue

        if observation.get("ndvi_raw") is not None:
            ndvi_total += 1
            if ndvi_summary_qa_is_valid(observation.get("ndvi_summary_qa")):
                scaled = scale_ndvi(observation.get("ndvi_raw"))
                if scaled is not None:
                    ndvi_values.append(scaled)

        if observation.get("lst_raw") is not None:
            lst_total += 1
            if lst_qc_is_valid(observation.get("lst_qc")):
                scaled = scale_lst(observation.get("lst_raw"))
                if scaled is not None:
                    lst_values.append(scaled)

    ndvi_fraction = (len(ndvi_values) / ndvi_total) if ndvi_total else None
    lst_fraction = (len(lst_values) / lst_total) if lst_total else None

    return {
        "district_id": observations[0].get("district_id") if observations else None,
        "year": year,
        "ndvi_mean": (sum(ndvi_values) / len(ndvi_values)) if ndvi_values else None,
        "ndvi_valid_observation_count": len(ndvi_values),
        "ndvi_valid_pixel_fraction": ndvi_fraction,
        "lst_mean_celsius": (sum(lst_values) / len(lst_values)) if lst_values else None,
        "lst_valid_pixel_fraction": lst_fraction,
    }
