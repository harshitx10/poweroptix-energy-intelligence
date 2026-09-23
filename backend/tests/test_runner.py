"""
PowerOptix - Standard Python Unittest Suite
Runs mathematical and logical verification tests across all engine modules.
"""

import sys
import os
import unittest

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.consumption_engine import calculate_appliance_monthly_kwh, calculate_total_household_consumption
from services.tariff_engine import calculate_electricity_bill
from services.waste_radar import detect_energy_waste
from services.nl_assistant import answer_natural_language_query

from optimizer.energy_optimizer import optimize_appliance_usage
from engine.digital_twin import simulate_digital_twin_scenario
from engine.efficiency_score import calculate_energy_efficiency_score
from engine.energy_dna import classify_energy_dna
from engine.payback_engine import calculate_appliance_replacement
from engine.solar_ev_engine import simulate_solar_battery_system, optimize_ev_charging
from ml.forecaster import train_ridge_forecaster
from ml.anomaly_detector import detect_consumption_anomalies

class TestPowerOptixEngines(unittest.TestCase):

    def test_01_consumption_formula(self):
        res = calculate_appliance_monthly_kwh(rated_power_w=1500.0, quantity=1, hours_per_day=6.0, days_per_month=30)
        self.assertEqual(res["active_kwh"], 270.0)
        self.assertEqual(res["total_kwh"], 270.0)

        tv_res = calculate_appliance_monthly_kwh(rated_power_w=120.0, quantity=1, hours_per_day=4.0, days_per_month=30, standby_power_w=5.0)
        self.assertEqual(tv_res["active_kwh"], 14.4)
        self.assertEqual(tv_res["standby_kwh"], 3.0)
        self.assertEqual(tv_res["total_kwh"], 17.4)

    def test_02_tariff_slab_calculation(self):
        bill = calculate_electricity_bill(420.0)
        self.assertEqual(bill["total_kwh"], 420.0)
        self.assertEqual(bill["energy_charge"], 3000.0)
        self.assertEqual(bill["fixed_charge"], 150.0)
        self.assertEqual(bill["total_monthly_bill"], 3150.0)

    def test_03_optimization_solver(self):
        sample_appliances = [
            {"id": 1, "name": "AC", "category": "Cooling", "rated_power_w": 1500, "quantity": 1, "hours_per_day": 6, "days_per_month": 30, "priority": "High", "min_hours_per_day": 2, "max_hours_per_day": 8, "is_active": True},
            {"id": 2, "name": "Fridge", "category": "Kitchen", "rated_power_w": 180, "quantity": 1, "hours_per_day": 24, "days_per_month": 30, "priority": "Essential", "min_hours_per_day": 24, "max_hours_per_day": 24, "is_active": True}
        ]
        opt = optimize_appliance_usage(sample_appliances, target_budget=2500.0)
        self.assertTrue(opt["success"])
        self.assertLess(opt["optimized_total_kwh"], opt["current_total_kwh"])

    def test_04_energy_dna(self):
        sample_apps = [
            {"name": "AC", "category": "Cooling", "rated_power_w": 1500, "quantity": 1, "hours_per_day": 8, "days_per_month": 30}
        ]
        dna = classify_energy_dna(sample_apps, total_monthly_kwh=360.0, current_bill=3000.0)
        self.assertEqual(dna["profile_name"], "Cooling-Heavy Household")

    def test_05_payback_period(self):
        # 100W -> 10W LED, 8 hrs/day, 1 qty, ₹1500 replacement cost
        pb = calculate_appliance_replacement(current_power_w=100.0, replacement_power_w=10.0, hours_per_day=8.0, quantity=1, replacement_cost_total=1500.0, tariff_per_kwh=8.5)
        self.assertTrue(pb["is_beneficial"])
        self.assertGreater(pb["monthly_money_saved"], 0)
        self.assertTrue(pb["payback_period_months"] > 0)

    def test_06_solar_ev_engine(self):
        sol = simulate_solar_battery_system(total_monthly_kwh=420.0, current_monthly_bill=3850.0, solar_capacity_kw=3.0, battery_capacity_kwh=5.0)
        self.assertTrue(sol["is_simulation"])
        self.assertLess(sol["new_grid_kwh"], sol["original_grid_kwh"])

        ev = optimize_ev_charging(battery_capacity_kwh=30.0, current_soc_pct=20.0, target_soc_pct=80.0)
        self.assertLess(ev["off_peak_cost"], ev["immediate_peak_cost"])

    def test_07_anomaly_detection(self):
        anom = detect_consumption_anomalies(total_monthly_kwh=420.0)
        self.assertIn("Isolation Forest", anom["algorithm"])
        self.assertGreaterEqual(anom["total_days_analyzed"], 14)

    def test_08_nl_assistant(self):
        sample_apps = [
            {"id": 1, "name": "Air Conditioner", "category": "Cooling", "rated_power_w": 1500, "quantity": 1, "hours_per_day": 6, "days_per_month": 30, "is_active": True}
        ]
        res = answer_natural_language_query("How much electricity does my AC consume?", sample_apps)
        self.assertIn("Air Conditioner", res["answer"])

if __name__ == "__main__":
    unittest.main()
