"""Lectura de estadisticas zonales de AppEEARS (MOD13Q1 y MOD11A2, coleccion 6.1).

AppEEARS entrega, por distrito y por compuesto, la media zonal de la variable y
un archivo QA separado con el conteo de pixeles por codigo de calidad. Este
modulo agrega esos compuestos a una serie anual sin imputar valores:

- La media anual se pondera por el numero de pixeles de cada compuesto.
- Los compuestos con menos de `MIN_VALID_FRACTION` de pixeles validos se excluyen.
- LST se publica en grados Celsius; las estadisticas de AppEEARS ya vienen
  escaladas a unidades fisicas (Kelvin para LST y fraccion para NDVI).
"""

from __future__ import annotations

import csv
import math
from datetime import date
from pathlib import Path
from typing import Any

from config import MIN_VALID_FRACTION
from utils import read_json

NDVI_STATS_NAME = "MOD13Q1-061-Statistics.csv"
LST_STATS_NAME = "MOD11A2-061-Statistics.csv"
NDVI_QA_PATTERN = "MOD13Q1-061-*Quality-Statistics-QA*.csv"
LST_QA_PATTERN = "MOD11A2-061-QC-Day-Statistics-QA*.csv"
REQUEST_PATTERN = "*request*.json"

KELVIN_OFFSET = 273.15
# Rango fisico aceptable para descartar codigos de relleno del producto.
LST_KELVIN_RANGE = (150.0, 400.0)
# Un año con pocos compuestos no representa un ciclo anual comparable (RN-16).
MIN_ANNUAL_COMPOSITES = {"ndvi": 12, "lst": 24}


def _parse_float(value: Any) -> float | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        number = float(text)
    except ValueError:
        return None
    return number if math.isfinite(number) else None


def aid_to_district_id(aid: Any) -> int | None:
    """Convierte `aid0007` en 7; ignora identificadores sin digitos."""
    digits = "".join(character for character in str(aid) if character.isdigit())
    if not digits:
        return None
    district_id = int(digits)
    return district_id if district_id > 0 else None


def qa_code_is_valid(code: int) -> bool:
    """Bits 0-1 del QA: 0 calidad buena, 1 calidad aceptable, 2-3 no producido."""
    return (int(code) & 0b11) in (0, 1)


def iso_date(value: Any) -> str | None:
    text = str(value or "").strip()[:10]
    try:
        return date.fromisoformat(text).isoformat()
    except ValueError:
        return None


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def resolve_inputs(directory: Path) -> dict[str, Path]:
    """Localiza los cuatro insumos de AppEEARS y falla con un mensaje claro."""
    directory = Path(directory)
    if not directory.is_dir():
        raise FileNotFoundError(f"No existe el directorio de insumos AppEEARS: {directory}")

    def unique(candidates: list[Path], label: str) -> Path:
        if not candidates:
            raise FileNotFoundError(f"Falta el archivo AppEEARS de {label} en {directory}")
        # Prefiere el nombre canonico; si solo existe la copia con sufijo "(1)", la usa.
        return sorted(candidates, key=lambda item: (len(item.name), item.name))[0]

    return {
        "ndvi_stats": unique(list(directory.glob(NDVI_STATS_NAME)), "NDVI"),
        "lst_stats": unique(list(directory.glob(LST_STATS_NAME)), "LST"),
        "ndvi_qa": unique(list(directory.glob(NDVI_QA_PATTERN)), "QA de NDVI"),
        "lst_qa": unique(list(directory.glob(LST_QA_PATTERN)), "QC de LST"),
    }


def load_statistics(path: Path, value_limit: tuple[float, float] | None = None) -> dict[tuple[str, str], tuple[float, float]]:
    """Devuelve (aid, fecha) -> (media, conteo de pixeles) de un Statistics.csv."""
    rows: dict[tuple[str, str], tuple[float, float]] = {}
    for row in _read_csv(path):
        aid = (row.get("aid") or "").strip()
        day = iso_date(row.get("Date"))
        mean = _parse_float(row.get("Mean"))
        count = _parse_float(row.get("Count"))
        if not aid or day is None or mean is None or not count:
            continue
        if value_limit is not None and not (value_limit[0] <= mean <= value_limit[1]):
            continue
        rows[(aid, day)] = (mean, count)
    return rows


def load_qa_fractions(path: Path) -> dict[tuple[str, str], tuple[float, float]]:
    """Devuelve (aid, fecha) -> (pixeles validos, pixeles totales) desde el CSV QA."""
    fractions: dict[tuple[str, str], tuple[float, float]] = {}
    for row in _read_csv(path):
        aid = (row.get("aid") or "").strip()
        day = iso_date(row.get("Date"))
        if not aid or day is None:
            continue
        valid = 0.0
        total = 0.0
        for column, raw in row.items():
            if column is None or not column.strip().isdigit():
                continue
            count = _parse_float(raw)
            if count is None or count <= 0:
                continue
            total += count
            if qa_code_is_valid(int(column.strip())):
                valid += count
        if total > 0:
            fractions[(aid, day)] = (valid, total)
    return fractions


def _annual_mean(
    statistics: dict[tuple[str, str], tuple[float, float]],
    fractions: dict[tuple[str, str], tuple[float, float]],
    aid: str,
    year: int,
    minimum_observations: int,
) -> dict[str, Any]:
    weighted_sum = 0.0
    weight_total = 0.0
    valid_pixels = 0.0
    total_pixels = 0.0
    observations = 0

    for (row_aid, day), (mean, count) in statistics.items():
        if row_aid != aid or day[:4] != str(year):
            continue
        qa = fractions.get((aid, day))
        fraction = (qa[0] / qa[1]) if qa and qa[1] else None
        if qa:
            valid_pixels += qa[0]
            total_pixels += qa[1]
        if fraction is not None and fraction < MIN_VALID_FRACTION:
            continue
        weighted_sum += mean * count
        weight_total += count
        observations += 1

    complete_year = observations >= minimum_observations
    return {
        "mean": (weighted_sum / weight_total) if weight_total and complete_year else None,
        "valid_observation_count": observations,
        "valid_pixel_fraction": (valid_pixels / total_pixels) if total_pixels else None,
    }


def request_coverage_years(directory: Path) -> set[int]:
    """Lee el rango de años del manifiesto request de AppEEARS, si está presente."""
    for path in sorted(Path(directory).glob(REQUEST_PATTERN)):
        try:
            payload = read_json(path)
        except (OSError, ValueError):
            continue
        bounds: list[int] = []
        for item in (payload.get("params") or {}).get("dates") or []:
            for key in ("startDate", "endDate"):
                parts = str(item.get(key) or "").split("-")
                if len(parts) == 3 and parts[2].isdigit():
                    bounds.append(int(parts[2]))
        if bounds:
            return set(range(min(bounds), max(bounds) + 1))
    return set()


def load_appeears_directory(directory: Path, years: list[int]) -> dict[tuple[int, int], dict[str, Any]]:
    """Carga los cuatro CSV de AppEEARS y publica una fila por distrito y ano."""
    directory = Path(directory)
    inputs = resolve_inputs(directory)
    ndvi_stats = load_statistics(inputs["ndvi_stats"], value_limit=(-1.0, 1.0))
    lst_stats = load_statistics(inputs["lst_stats"], value_limit=LST_KELVIN_RANGE)
    ndvi_qa = load_qa_fractions(inputs["ndvi_qa"])
    lst_qa = load_qa_fractions(inputs["lst_qa"])

    requested_years = request_coverage_years(directory)
    target_years = [year for year in years if not requested_years or year in requested_years]

    aids = sorted({aid for aid, _ in ndvi_stats} | {aid for aid, _ in lst_stats})
    results: dict[tuple[int, int], dict[str, Any]] = {}
    for aid in aids:
        district_id = aid_to_district_id(aid)
        if district_id is None:
            continue
        for year in target_years:
            ndvi = _annual_mean(ndvi_stats, ndvi_qa, aid, year, MIN_ANNUAL_COMPOSITES["ndvi"])
            lst = _annual_mean(lst_stats, lst_qa, aid, year, MIN_ANNUAL_COMPOSITES["lst"])
            if ndvi["mean"] is None and lst["mean"] is None:
                continue
            results[(district_id, year)] = {
                "district_id": district_id,
                "year": year,
                "ndvi_mean": ndvi["mean"],
                "ndvi_valid_observation_count": ndvi["valid_observation_count"],
                "ndvi_valid_pixel_fraction": ndvi["valid_pixel_fraction"],
                "lst_mean_celsius": (lst["mean"] - KELVIN_OFFSET) if lst["mean"] is not None else None,
                "lst_valid_pixel_fraction": lst["valid_pixel_fraction"],
            }
    if not results:
        raise ValueError(f"AppEEARS no devolvio observaciones para {years[0]}-{years[-1]} en {directory}")
    return results


def summarize(results: dict[tuple[int, int], dict[str, Any]]) -> dict[str, Any]:
    """Resumen de cobertura para la ficha de metadatos."""
    years = sorted({year for _, year in results})
    districts = sorted({district_id for district_id, _ in results})
    return {
        "districts": len(districts),
        "years": years,
        "observations": len(results),
    }
