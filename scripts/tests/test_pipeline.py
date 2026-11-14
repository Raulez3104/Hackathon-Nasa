"""Pruebas del pipeline DEV2: NASA, indices, tendencias y reglas."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SCRIPTS_DIR))

from indicators.correlations import build_correlations  # noqa: E402
from indicators.equipment import equipment_from_municipal  # noqa: E402
from indicators.hotspots import build_hotspot, filter_hotspots  # noqa: E402
from indicators.index import compute_indexes  # noqa: E402
from indicators.stats import ols, pearson, spearman  # noqa: E402
from indicators.trends import compute_trend  # noqa: E402
from nasa.modis import (  # noqa: E402
    aggregate_observations,
    lst_qc_is_valid,
    ndvi_summary_qa_is_valid,
    scale_lst,
    scale_ndvi,
)
from validate_output import validate_dataset  # noqa: E402


def _series(values: list[float], field: str) -> list[dict]:
    return [
        {"year": 2015 + index, field: value, "data_quality_flag": "ok"}
        for index, value in enumerate(values)
    ]


class NasaProcessingTests(unittest.TestCase):
    def test_scales(self) -> None:
        self.assertAlmostEqual(scale_ndvi(8000), 0.8)
        self.assertAlmostEqual(scale_lst(15000), 26.85)

    def test_qa_rules(self) -> None:
        self.assertTrue(ndvi_summary_qa_is_valid(0))
        self.assertTrue(ndvi_summary_qa_is_valid(1))
        self.assertFalse(ndvi_summary_qa_is_valid(3))
        self.assertTrue(lst_qc_is_valid(2))
        self.assertFalse(lst_qc_is_valid(3))

    def test_aggregate_applies_qa_and_window(self) -> None:
        observations = [
            {"district_id": 1, "date": "2025-01-10", "ndvi_raw": 8000, "ndvi_summary_qa": 0, "lst_raw": 15000, "lst_qc": 0},
            {"district_id": 1, "date": "2025-02-10", "ndvi_raw": 6000, "ndvi_summary_qa": 3, "lst_raw": 16000, "lst_qc": 3},
        ]
        result = aggregate_observations(observations, 2025, (1, 365))
        self.assertAlmostEqual(result["ndvi_mean"], 0.8)
        self.assertEqual(result["ndvi_valid_observation_count"], 1)
        self.assertAlmostEqual(result["ndvi_valid_pixel_fraction"], 0.5)
        self.assertAlmostEqual(result["lst_mean_celsius"], 26.85)


class StatisticsTests(unittest.TestCase):
    def test_ols_and_correlation(self) -> None:
        regression = ols([1, 2, 3, 4], [2, 4, 6, 8])
        self.assertAlmostEqual(regression["slope"] or 0, 2.0)
        pearson_result = pearson([1, 2, 3, 4], [2, 4, 6, 8])
        self.assertAlmostEqual(pearson_result["coefficient"] or 0, 1.0)
        spearman_result = spearman([1, 2, 3, 4], [4, 3, 2, 1])
        self.assertAlmostEqual(spearman_result["coefficient"] or 0, -1.0)

    def test_trend_direction(self) -> None:
        ndvi_trend = compute_trend(_series([0.2, 0.21, 0.22, 0.23, 0.24], "ndvi_mean"), "ndvi")
        self.assertEqual(ndvi_trend["direction"], "improving")
        lst_trend = compute_trend(_series([30, 30.5, 31, 31.5, 32], "lst_mean_celsius"), "lst")
        self.assertEqual(lst_trend["direction"], "worsening")


class IndexTests(unittest.TestCase):
    def test_missing_territorial_marks_insufficient(self) -> None:
        environmental = {
            (1, 2015): {"district_id": 1, "year": 2015, "ndvi_mean": 0.2, "lst_mean_celsius": 30.0, "ndvi_valid_pixel_fraction": 0.9, "lst_valid_pixel_fraction": 0.9},
            (1, 2016): {"district_id": 1, "year": 2016, "ndvi_mean": 0.3, "lst_mean_celsius": 29.0, "ndvi_valid_pixel_fraction": 0.9, "lst_valid_pixel_fraction": 0.9},
        }
        equipment = {1: {"district_id": 1, "territorial_reference_year": 2024, "equipment_access_index": None, "mobility_access_index": None}}
        records, _ = compute_indexes(environmental, equipment, [1], [2015, 2016])
        record = records[(1, 2015)]
        self.assertIsNotNone(record["environmental_index"])
        self.assertIsNone(record["socioenvironmental_index"])
        self.assertEqual(record["index_without_territorial"], record["environmental_index"])
        self.assertEqual(record["data_quality_flag"], "insufficient")

    def test_municipal_equipment_rates(self) -> None:
        payload = {
            "territorial_reference_year": 2024,
            "districts": [
                {"district_id": 1, "population": 10000, "green_area_m2": 50000, "schools_count": 20, "health_centers_count": 4, "transport_coverage_fraction": 0.5},
                {"district_id": 2, "population": 20000, "green_area_m2": 40000, "schools_count": 10, "health_centers_count": 1, "transport_coverage_fraction": 0.2},
            ],
        }
        metrics, reference_year = equipment_from_municipal(payload, [1, 2])
        self.assertEqual(reference_year, 2024)
        self.assertAlmostEqual(metrics[1]["green_area_m2_per_capita"], 5.0)
        self.assertAlmostEqual(metrics[1]["schools_per_1000"], 2.0)
        self.assertAlmostEqual(metrics[2]["mobility_access_index"], 20.0)


class HotspotTests(unittest.TestCase):
    def test_rules_trigger_and_score(self) -> None:
        district = {
            "district_id": 9,
            "name": "Distrito 9",
            "series": [{"year": 2025, "ndvi_mean": 0.1, "environmental_index": 30, "socioenvironmental_index": 25}],
            "trends": [
                {"variable": "ndvi", "slope_per_year": -0.004},
                {"variable": "lst", "slope_per_year": 0.2},
            ],
            "equipment": {"green_area_m2_per_capita": 2.0, "transport_coverage_fraction": 0.2},
        }
        hotspot = build_hotspot(district, 2025)
        triggered = {rule["rule_id"] for rule in hotspot["rules"] if rule["triggered"]}
        self.assertIn("NDVI_NEGATIVE_TREND", triggered)
        self.assertIn("LST_POSITIVE_TREND", triggered)
        self.assertEqual(hotspot["priority_level"], "high")
        self.assertGreater(hotspot["score"] or 0, 0)

    def test_filter_min_priority(self) -> None:
        hotspots = [{"priority_level": "low"}, {"priority_level": "high"}, {"priority_level": "insufficient_data"}]
        filtered = filter_hotspots(hotspots, "medium")
        self.assertEqual(filtered, [{"priority_level": "high"}])


class CorrelationTests(unittest.TestCase):
    def test_min_n_blocks_coefficient(self) -> None:
        districts = [
            {
                "district_id": index + 1,
                "name": f"Distrito {index + 1}",
                "series": [],
                "trends": [{"variable": "ndvi", "slope_per_year": -0.001 * index}],
                "equipment": {"equipment_access_index": 50 + index, "mobility_access_index": 40 + index},
            }
            for index in range(5)
        ]
        results = build_correlations(districts)
        self.assertTrue(results)
        self.assertIsNone(results[0]["coefficient"])
        self.assertIn("Insuficientes", results[0]["interpretation"])


class ValidatorTests(unittest.TestCase):
    def test_rejects_incomplete_dataset(self) -> None:
        dataset = {"contract_version": "0.1.0", "data_status": "illustrative", "districts": []}
        errors = validate_dataset(dataset, [2015, 2016])
        self.assertTrue(any("15 distritos" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
