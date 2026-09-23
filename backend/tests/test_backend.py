"""
PowerOptix - Backend Automated Test Suite
Verifies mathematical accuracy of consumption, tariff, optimization, digital twin, ML forecaster, and score engines.
"""

import sys
import os
import pytest

# Add parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.consumption_engine import calculate_appliance_monthly_kwh, calculate_total_household_consumption
from services.tariff_engine import calculate_electricity_bill
from optimizer.energy_optimizer import optimize_appliance_usage
from engine.digital_twin import simulate_digital_twin_scenario
from engine.efficiency_score import calculate_energy_efficiency_score
from ml.forecaster import train_ridge_forecaster

def test_consumption_formula():
    # AC: 1500W, 1 qty, 6 hrs/day, 30 days
    # (1500 * 1 * 6 * 30) / 1000 = 270.0 kWh
    res = calculate_appliance_monthly_kwh(rated_power_w=1500.0, quantity=1, hours_per_day=6.0, days_per_month=30)
    assert res["active_kwh"] == 270.0
    assert res["total_kwh"] == 270.0

    # TV with standby power: 120W, 1 qty, 4 hrs/day, 5W standby
    # Active: (120 * 1 * 4 * 30)/1000 = 14.4 kWh
    # Standby: (5 * 1 * 20 * 30)/1000 = 3.0 kWh
    # Total: 17.4 kWh
    tv_res = calculate_appliance_monthly_kwh(rated_power_w=120.0, quantity=1, hours_per_day=4.0, days_per_month=30, standby_power_w=5.0)
    assert tv_res["active_kwh"] == 14.4
    assert tv_res["standby_kwh"] == 3.0
    assert tv_res["total_kwh"] == 17.4

def test_tariff_slab_calculation():
    # Test 420 kWh against default slabs:
    # 0-100 @ ₹4 = 400
    # 101-200 @ ₹6 = 600
    # 201-300 @ ₹8 = 800
    # 301-420 (120 units) @ ₹10 = 1200
    # Energy charge = 400 + 600 + 800 + 1200 = 3000
    # Fixed charge = 150
    # Total bill = 3150
    bill = calculate_electricity_bill(420.0)
    assert bill["total_kwh"] == 420.0
    assert bill["energy_charge"] == 3000.0
    assert bill["fixed_charge"] == 150.0
    assert bill["total_monthly_bill"] == 3150.0
    assert bill["total_annual_bill"] == 3150.0 * 12

def test_optimization_solver():
    sample_appliances = [
        {"id": 1, "name": "AC", "category": "Cooling", "rated_power_w": 1500, "quantity": 1, "hours_per_day": 6, "days_per_month": 30, "priority": "High", "min_hours_per_day": 2, "max_hours_per_day": 8, "is_active": True},
        {"id": 2, "name": "Fridge", "category": "Kitchen", "rated_power_w": 180, "quantity": 1, "hours_per_day": 24, "days_per_month": 30, "priority": "Essential", "min_hours_per_day": 24, "max_hours_per_day": 24, "is_active": True},
        {"id": 3, "name": "TV", "category": "Entertainment", "rated_power_w": 120, "quantity": 1, "hours_per_day": 4, "days_per_month": 30, "priority": "Medium", "min_hours_per_day": 1, "max_hours_per_day": 6, "is_active": True}
    ]
    opt = optimize_appliance_usage(sample_appliances, target_budget=2500.0)
    assert opt["success"] is True
    assert opt["optimized_total_kwh"] < opt["current_total_kwh"]
    assert opt["total_kwh_saved"] > 0
    assert opt["monthly_money_saved"] > 0

def test_digital_twin_simulation():
    sample_appliances = [
        {"id": 1, "name": "AC", "category": "Cooling", "rated_power_w": 1500, "quantity": 1, "hours_per_day": 6, "days_per_month": 30, "is_active": True},
        {"id": 2, "name": "Fridge", "category": "Kitchen", "rated_power_w": 180, "quantity": 1, "hours_per_day": 24, "days_per_month": 30, "is_active": True}
    ]
    # Override AC hours from 6 -> 4
    overrides = [{"id": 1, "hours_per_day": 4.0, "rated_power_w": 1500, "quantity": 1, "is_active": True}]
    twin = simulate_digital_twin_scenario(sample_appliances, overrides)

    # AC energy saved: (1500 * 1 * 2 * 30)/1000 = 90.0 kWh
    assert twin["kwh_saved"] == 90.0
    assert twin["simulated_kwh"] < twin["original_kwh"]
    assert twin["monthly_money_saved"] > 0

def test_ml_forecaster():
    fc = train_ridge_forecaster(current_baseline_kwh=420.0)
    assert len(fc["forecast_months"]) == 3
    assert fc["r2_score"] > 0.5
    assert fc["forecast_months"][0]["predicted_kwh"] > 100

def test_efficiency_score():
    sample_apps = [
        {"rated_power_w": 1500, "quantity": 1, "hours_per_day": 6, "priority": "High"},
        {"rated_power_w": 180, "quantity": 1, "hours_per_day": 24, "priority": "Essential"}
    ]
    score = calculate_energy_efficiency_score(sample_apps, total_monthly_kwh=399.6, current_bill=2980.0, target_budget=3000.0)
    assert 0.0 <= score["overall_score"] <= 100.0
    assert len(score["factors"]) == 6
