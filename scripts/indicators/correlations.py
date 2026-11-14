"""Correlaciones exploratorias entre tendencia ambiental y acceso territorial."""

from __future__ import annotations

from typing import Any

from config import CORRELATION_MIN_N
from indicators.stats import correlation_for_method
from utils import round_number

X_VARIABLES = {
    "ndvi_trend": "ndvi",
    "lst_trend": "lst",
    "environmental_index_trend": "environmental_index",
}
Y_FIELDS = {
    "equipment_access_index": "equipment_access_index",
    "mobility_access_index": "mobility_access_index",
}


def _interpretation(coefficient: float | None, n: int, y_variable: str) -> str:
    if coefficient is None or n < CORRELATION_MIN_N:
        return (
            f"Insuficientes distritos con datos completos (n={n}); no se calcula un coeficiente "
            "concluyente ni se establece causalidad."
        )
    magnitude = abs(coefficient)
    if magnitude >= 0.7:
        strength = "fuerte"
    elif magnitude >= 0.4:
        strength = "moderada"
    elif magnitude >= 0.2:
        strength = "débil"
    else:
        strength = "muy débil"
    sign = "positiva" if coefficient > 0 else "negativa"
    target = "equipamiento" if y_variable.startswith("equipment") else "movilidad"
    return (
        f"Relación {sign} {strength} entre la tendencia ambiental y el acceso a {target} "
        f"con n={n}; es exploratoria y no implica causalidad."
    )


def build_correlations(districts: list[dict[str, Any]]) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    for x_variable, trend_key in X_VARIABLES.items():
        for y_variable, equipment_key in Y_FIELDS.items():
            rows: list[dict[str, Any]] = []
            for district in districts:
                trend = next(
                    (item for item in district.get("trends", []) if item.get("variable") == trend_key),
                    {},
                )
                equipment = district.get("equipment") or {}
                x = trend.get("slope_per_year")
                y = equipment.get(equipment_key)
                if x is None or y is None:
                    continue
                rows.append(
                    {
                        "district_id": district.get("district_id"),
                        "district_name": district.get("name"),
                        "x": x,
                        "y": y,
                    }
                )

            xs = [row["x"] for row in rows]
            ys = [row["y"] for row in rows]
            for method in ("pearson", "spearman"):
                stats = correlation_for_method(method, xs, ys)
                n = int(stats["n"] or 0)
                coefficient = stats["coefficient"] if n >= CORRELATION_MIN_N else None
                p_value = stats["p_value"] if n >= CORRELATION_MIN_N else None
                results.append(
                    {
                        "x_variable": x_variable,
                        "y_variable": y_variable,
                        "coefficient": round_number(coefficient, 3),
                        "method": method,
                        "n": n,
                        "p_value": round_number(p_value, 4),
                        "interpretation": _interpretation(coefficient, n, y_variable),
                        "districts": rows,
                    }
                )
    return results
