"""
PowerOptix - Phase 1 Core Backend Verification Suite
Tests database initialization, CRUD endpoints, consumption formula, tariff calculation,
and SciPy scipy.optimize.linprog LP optimization solver.
"""

import sys
import os
import unittest
import urllib.request
import json

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine, Base, SessionLocal, DB_TYPE
import models
from services.consumption_engine import calculate_appliance_monthly_kwh, calculate_total_household_consumption
from services.tariff_engine import calculate_electricity_bill
from optimizer.energy_optimizer import optimize_appliance_usage

BASE_URL = "http://localhost:8001/api"

def http_get(url):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

def http_post(url, payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

def http_put(url, payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='PUT')
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

def http_delete(url):
    req = urllib.request.Request(url, method='DELETE')
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode())

class TestPhase1CoreBackend(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=engine)

    def test_01_database_tables_created(self):
        """Verifies database tables exist in SQLAlchemy engine metadata."""
        tables = list(Base.metadata.tables.keys())
        self.assertIn("appliances", tables)
        self.assertIn("tariff_slabs", tables)
        self.assertIn("tariff_configs", tables)
        self.assertIn("monthly_consumption_history", tables)
        self.assertIn("optimization_logs", tables)
        self.assertIn("energy_goals", tables)

    def test_02_consumption_formula(self):
        """
        Tests E_i = (P_i * Q_i * H_i * D_i) / 1000
        AC: 1500W, 1 qty, 6 hr/day, 30 days -> 270 kWh/month
        """
        res = calculate_appliance_monthly_kwh(rated_power_w=1500.0, quantity=1, hours_per_day=6.0, days_per_month=30)
        self.assertEqual(res["active_kwh"], 270.0)
        self.assertEqual(res["total_kwh"], 270.0)

    def test_03_tariff_slab_calculation(self):
        """
        Tests progressive slab rates for 420 kWh:
        0-100 @ ₹4 = ₹400
        101-200 @ ₹6 = ₹600
        201-300 @ ₹8 = ₹800
        301-420 (120 units) @ ₹10 = ₹1200
        Fixed charge = ₹150
        Total bill = ₹3,150
        """
        bill = calculate_electricity_bill(420.0)
        self.assertEqual(bill["total_kwh"], 420.0)
        self.assertEqual(bill["energy_charge"], 3000.0)
        self.assertEqual(bill["fixed_charge"], 150.0)
        self.assertEqual(bill["total_monthly_bill"], 3150.0)
        self.assertEqual(bill["total_annual_bill"], 37800.0)

    def test_04_scipy_optimization_solver(self):
        """Tests scipy.optimize.linprog LP optimizer on real appliance dataset."""
        test_appliances = [
            {"id": 1, "name": "AC", "category": "Cooling", "rated_power_w": 1500, "quantity": 1, "hours_per_day": 6, "days_per_month": 30, "priority": "High", "min_hours_per_day": 2, "max_hours_per_day": 8, "is_active": True},
            {"id": 2, "name": "Refrigerator", "category": "Kitchen", "rated_power_w": 180, "quantity": 1, "hours_per_day": 24, "days_per_month": 30, "priority": "Essential", "min_hours_per_day": 24, "max_hours_per_day": 24, "is_active": True},
            {"id": 3, "name": "Smart TV", "category": "Entertainment", "rated_power_w": 120, "quantity": 1, "hours_per_day": 4, "days_per_month": 30, "priority": "Medium", "min_hours_per_day": 1, "max_hours_per_day": 6, "is_active": True}
        ]
        opt = optimize_appliance_usage(test_appliances, target_budget=2500.0)
        self.assertTrue(opt["success"])
        self.assertLess(opt["optimized_total_kwh"], opt["current_total_kwh"])
        self.assertGreater(opt["total_kwh_saved"], 0.0)
        self.assertGreater(opt["monthly_money_saved"], 0.0)
        self.assertGreater(opt["annual_money_saved"], 0.0)

    def test_05_api_dashboard_endpoint(self):
        """Tests GET /api/dashboard endpoint over HTTP."""
        res = http_get(f"{BASE_URL}/dashboard")
        self.assertIn("monthly_consumption_kwh", res)
        self.assertIn("estimated_monthly_bill", res)
        self.assertIn("optimized_monthly_kwh", res)
        self.assertIn("potential_monthly_saving", res)

    def test_06_api_appliances_crud(self):
        """Tests GET, POST, PUT, DELETE for /api/appliances over HTTP."""
        # 1. GET
        get_res = http_get(f"{BASE_URL}/appliances")
        self.assertIn("appliances", get_res)

        # 2. POST (Create)
        new_app = {
            "name": "Phase 1 Test Microwave",
            "category": "Kitchen",
            "rated_power_w": 1100.0,
            "quantity": 1,
            "hours_per_day": 0.5,
            "days_per_month": 30,
            "standby_power_w": 2.0,
            "priority": "Low",
            "min_hours_per_day": 0.1,
            "max_hours_per_day": 1.0,
            "is_active": True
        }
        post_res = http_post(f"{BASE_URL}/appliances", new_app)
        self.assertIn("appliance_id", post_res)
        created_id = post_res["appliance_id"]

        # 3. PUT (Update)
        put_res = http_put(f"{BASE_URL}/appliances/{created_id}", {"hours_per_day": 1.0})
        self.assertIn("message", put_res)

        # 4. DELETE
        del_res = http_delete(f"{BASE_URL}/appliances/{created_id}")
        self.assertIn("message", del_res)

    def test_07_api_optimize_endpoint(self):
        """Tests POST /api/optimize endpoint over HTTP."""
        res = http_post(f"{BASE_URL}/optimize", {"target_budget": 3000.0})
        self.assertTrue(res["success"])
        self.assertIn("appliance_results", res)
        self.assertGreater(len(res["appliance_results"]), 0)

if __name__ == "__main__":
    unittest.main()
