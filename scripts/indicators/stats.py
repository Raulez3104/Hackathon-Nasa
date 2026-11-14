"""OLS, Pearson, Spearman y valor p bilateral de Student."""

from __future__ import annotations

import math
from typing import Iterable, Sequence


def _clean_pairs(xs: Sequence[float], ys: Sequence[float]) -> tuple[list[float], list[float]]:
    pairs = [(float(x), float(y)) for x, y in zip(xs, ys) if x is not None and y is not None]
    if not pairs:
        return [], []
    return [pair[0] for pair in pairs], [pair[1] for pair in pairs]


def _betacf(a: float, b: float, x: float) -> float:
    max_iterations = 200
    epsilon = 3.0e-12
    fpmin = 1.0e-300
    qab = a + b
    qap = a + 1.0
    qam = a - 1.0
    c = 1.0
    d = 1.0 - qab * x / qap
    if abs(d) < fpmin:
        d = fpmin
    d = 1.0 / d
    h = d
    for m in range(1, max_iterations + 1):
        m2 = 2 * m
        aa = m * (b - m) * x / ((qam + m2) * (a + m2))
        d = 1.0 + aa * d
        if abs(d) < fpmin:
            d = fpmin
        c = 1.0 + aa / c
        if abs(c) < fpmin:
            c = fpmin
        d = 1.0 / d
        h *= d * c
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
        d = 1.0 + aa * d
        if abs(d) < fpmin:
            d = fpmin
        c = 1.0 + aa / c
        if abs(c) < fpmin:
            c = fpmin
        d = 1.0 / d
        delta = d * c
        h *= delta
        if abs(delta - 1.0) < epsilon:
            break
    return h


def _betai(a: float, b: float, x: float) -> float:
    if x <= 0.0:
        return 0.0
    if x >= 1.0:
        return 1.0
    log_beta = math.lgamma(a + b) - math.lgamma(a) - math.lgamma(b)
    front = math.exp(log_beta + a * math.log(x) + b * math.log(1.0 - x))
    if x < (a + 1.0) / (a + b + 2.0):
        return front * _betacf(a, b, x) / a
    return 1.0 - front * _betacf(b, a, 1.0 - x) / b


def _t_p_value(t_statistic: float | None, degrees_freedom: int) -> float | None:
    if t_statistic is None or degrees_freedom <= 0:
        return None
    x = degrees_freedom / (degrees_freedom + t_statistic * t_statistic)
    return _betai(degrees_freedom / 2.0, 0.5, x)


def ols(xs: Sequence[float], ys: Sequence[float]) -> dict[str, float | int | None]:
    x_clean, y_clean = _clean_pairs(xs, ys)
    n = len(x_clean)
    if n < 2:
        return {"slope": None, "intercept": None, "r": None, "p_value": None, "n": n}

    mean_x = sum(x_clean) / n
    mean_y = sum(y_clean) / n
    covariance = sum((x - mean_x) * (y - mean_y) for x, y in zip(x_clean, y_clean))
    variance_x = sum((x - mean_x) ** 2 for x in x_clean)
    variance_y = sum((y - mean_y) ** 2 for y in y_clean)

    if variance_x == 0:
        return {"slope": None, "intercept": None, "r": None, "p_value": None, "n": n}

    slope = covariance / variance_x
    intercept = mean_y - slope * mean_x
    r = covariance / math.sqrt(variance_x * variance_y) if variance_y > 0 else None
    p_value = None
    if r is not None and abs(r) < 1.0:
        t_statistic = r * math.sqrt((n - 2) / (1.0 - r * r))
        p_value = _t_p_value(t_statistic, n - 2)
    elif r is not None and abs(r) >= 1.0:
        p_value = 0.0
    return {"slope": slope, "intercept": intercept, "r": r, "p_value": p_value, "n": n}


def _ranks(values: Sequence[float]) -> list[float]:
    indexed = sorted(range(len(values)), key=lambda index: values[index])
    ranks = [0.0] * len(values)
    position = 0
    while position < len(indexed):
        end = position
        while end + 1 < len(indexed) and values[indexed[end + 1]] == values[indexed[position]]:
            end += 1
        average_rank = (position + end) / 2.0 + 1.0
        for offset in range(position, end + 1):
            ranks[indexed[offset]] = average_rank
        position = end + 1
    return ranks


def pearson(xs: Sequence[float], ys: Sequence[float]) -> dict[str, float | int | None]:
    x_clean, y_clean = _clean_pairs(xs, ys)
    n = len(x_clean)
    if n < 2:
        return {"coefficient": None, "p_value": None, "n": n}
    mean_x = sum(x_clean) / n
    mean_y = sum(y_clean) / n
    covariance = sum((x - mean_x) * (y - mean_y) for x, y in zip(x_clean, y_clean))
    variance_x = sum((x - mean_x) ** 2 for x in x_clean)
    variance_y = sum((y - mean_y) ** 2 for y in y_clean)
    if variance_x == 0 or variance_y == 0:
        return {"coefficient": None, "p_value": None, "n": n}
    coefficient = covariance / math.sqrt(variance_x * variance_y)
    coefficient = max(-1.0, min(1.0, coefficient))
    p_value = None
    if abs(coefficient) < 1.0:
        t_statistic = coefficient * math.sqrt((n - 2) / (1.0 - coefficient * coefficient))
        p_value = _t_p_value(t_statistic, n - 2)
    else:
        p_value = 0.0
    return {"coefficient": coefficient, "p_value": p_value, "n": n}


def spearman(xs: Sequence[float], ys: Sequence[float]) -> dict[str, float | int | None]:
    x_clean, y_clean = _clean_pairs(xs, ys)
    n = len(x_clean)
    if n < 2:
        return {"coefficient": None, "p_value": None, "n": n}
    return pearson(_ranks(x_clean), _ranks(y_clean))


def correlation_for_method(method: str, xs: Sequence[float], ys: Sequence[float]) -> dict[str, float | int | None]:
    return spearman(xs, ys) if method == "spearman" else pearson(xs, ys)


def slope(points: Iterable[tuple[int, float]]) -> float | None:
    clean = list(points)
    if len(clean) < 2:
        return None
    return ols([point[0] for point in clean], [point[1] for point in clean])["slope"]
