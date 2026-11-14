"""Mapa de calor precalculado por celdas distritales y raster PNG de apoyo."""

from __future__ import annotations

import binascii
import struct
import zlib
from pathlib import Path
from typing import Any

from config import (
    HEATMAP_ICVSA_CLASSES,
    HEATMAP_LST_CLASSES,
    HEATMAP_RESOLUTION_M,
    HEATMAP_SEVERITY_CLASSES,
)
from indicators.hotspots import build_hotspot
from utils import geometry_bbox, geometry_centroid, round_number, risk_level_from_index

COLORS = {
    "low": (46, 160, 67),
    "medium": (230, 170, 30),
    "high": (200, 55, 45),
    "insufficient": (170, 170, 170),
    "background": (245, 245, 245),
}


def _classify_lst(value: float | None) -> str:
    if value is None:
        return "insufficient"
    if value < HEATMAP_LST_CLASSES["low"]:
        return "low"
    if value < HEATMAP_LST_CLASSES["medium"]:
        return "medium"
    return "high"


def _classify_icvsa(value: float | None) -> str:
    if value is None:
        return "insufficient"
    if value >= HEATMAP_ICVSA_CLASSES["low"]:
        return "low"
    if value >= HEATMAP_ICVSA_CLASSES["medium"]:
        return "medium"
    return "high"


def _classify_severity(value: float | None) -> str:
    if value is None:
        return "insufficient"
    if value < HEATMAP_SEVERITY_CLASSES["low"]:
        return "low"
    if value < HEATMAP_SEVERITY_CLASSES["medium"]:
        return "medium"
    return "high"


def _cells_for(district: dict[str, Any], year: int, variable: str) -> dict[str, Any]:
    latitude, longitude = geometry_centroid(district.get("geometry"))
    point = next((item for item in district.get("series", []) if item.get("year") == year), {})
    if variable == "icvsa":
        value = point.get("socioenvironmental_index")
        value_class = _classify_icvsa(value)
    elif variable == "severity":
        hotspot = build_hotspot(district, year)
        value = hotspot.get("score")
        value_class = _classify_severity(value)
    else:
        value = point.get("lst_mean_celsius")
        value_class = _classify_lst(value)
    return {
        "district_id": district.get("district_id"),
        "latitude": round_number(latitude, 6),
        "longitude": round_number(longitude, 6),
        "value": round_number(value, 2),
        "class": value_class,
    }


def _png_chunk(chunk_type: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + chunk_type
        + data
        + struct.pack(">I", binascii.crc32(chunk_type + data) & 0xFFFFFFFF)
    )


def write_png(path: Path, width: int, height: int, pixels: list[list[tuple[int, int, int]]]) -> None:
    raw = bytearray()
    for row in pixels:
        raw.append(0)
        for red, green, blue in row:
            raw.extend((red, green, blue))
    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    payload = (
        b"\x89PNG\r\n\x1a\n"
        + _png_chunk(b"IHDR", header)
        + _png_chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + _png_chunk(b"IEND", b"")
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(payload)


def render_raster(
    districts: list[dict[str, Any]],
    year: int,
    variable: str,
    path: Path,
    size: int = 256,
) -> list[float] | None:
    bboxes = [bbox for bbox in (geometry_bbox(district.get("geometry")) for district in districts) if bbox]
    if not bboxes:
        return None
    bbox = [
        min(item[0] for item in bboxes),
        min(item[1] for item in bboxes),
        max(item[2] for item in bboxes),
        max(item[3] for item in bboxes),
    ]
    longitudes = max(bbox[2] - bbox[0], 1e-9)
    latitudes = max(bbox[3] - bbox[1], 1e-9)

    pixels = [[COLORS["background"] for _ in range(size)] for _ in range(size)]
    for district in districts:
        district_bbox = geometry_bbox(district.get("geometry"))
        if not district_bbox:
            continue
        cell = _cells_for(district, year, variable)
        color = COLORS.get(cell["class"], COLORS["insufficient"])
        x_start = int((district_bbox[0] - bbox[0]) / longitudes * (size - 1))
        x_end = int((district_bbox[2] - bbox[0]) / longitudes * (size - 1))
        y_start = int((bbox[3] - district_bbox[3]) / latitudes * (size - 1))
        y_end = int((bbox[3] - district_bbox[1]) / latitudes * (size - 1))
        for y in range(max(0, y_start), min(size, y_end + 1)):
            for x in range(max(0, x_start), min(size, x_end + 1)):
                pixels[y][x] = color

    write_png(path, size, size, pixels)
    return [round_number(value, 6) for value in bbox]


def build_heatmap(districts: list[dict[str, Any]], years: list[int], variable: str) -> dict[str, Any]:
    units = {"lst": "°C", "icvsa": "índice", "severity": "puntaje"}
    method = {
        "lst": "Media zonal MOD11A2 por distrito; celdas agregadas para visualización.",
        "icvsa": "ICVSA precalculado por distrito; celdas agregadas para visualización.",
        "severity": "Puntaje de reglas de hotspot por distrito; celdas agregadas para visualización.",
    }
    cells_by_year: dict[str, list[dict[str, Any]]] = {}
    for year in years:
        cells_by_year[str(year)] = [_cells_for(district, year, variable) for district in districts]

    return {
        "variable": variable,
        "unit": units.get(variable, "índice"),
        "resolution_m": HEATMAP_RESOLUTION_M,
        "method": method.get(variable, "Celdas agregadas por distrito."),
        "years": cells_by_year,
    }


def build_risk_levels(districts: list[dict[str, Any]], years: list[int]) -> dict[str, dict[str, str]]:
    result: dict[str, dict[str, str]] = {}
    for year in years:
        result[str(year)] = {
            str(district.get("district_id")): risk_level_from_index(
                next(
                    (
                        point.get("socioenvironmental_index")
                        for point in district.get("series", [])
                        if point.get("year") == year
                    ),
                    None,
                )
            )
            for district in districts
        }
    return result
