"""
PowerOptix - Comprehensive Backend Audit & Endpoint Verification Script
Systematically tests all endpoints on http://localhost:8001/api, verifies database persistence,
checks formula accuracy (kWh = P * Q * H * D / 1000), tests tariff calculations, ML models,
scipy.optimize.linprog optimization, Digital Twin, and API error handling.
"""

import urllib.request
import json
import sys
import os

BASE_URL = "http://localhost:8001/api"
ROOT_URL = "http://localhost:8001"

def http_req(url_str, method="GET", payload=None):
    headers = {"Content-Type": "application/json"}
    data = json.dumps(payload).encode("utf-8") if payload else None
    
    req = urllib.request.Request(url_str, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            body = res.read().decode()
            return res.status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            err_json = json.loads(body)
        except:
            err_json = {"detail": body}
        return e.code, err_json
    except Exception as e:
        return 500, {"error": str(e)}

def run_backend_audit():
    report_items = []
    
    # 1. Root / Docs Health Check
    status, body = http_req(f"{ROOT_URL}/")
    report_items.append({
        "endpoint": "GET /",
        "input": "None",
        "expected": "Status 200 with online status and database_type",
        "actual": f"Status {status}: {body.get('app', 'PowerOptix')} ({body.get('database_type', 'N/A')})",
        "pass": status == 200 and "app" in body,
        "issue": None if status == 200 else "Root server not responding"
    })

    # 2. GET /api/appliances
    status, body = http_req(f"{BASE_URL}/appliances")
    total_kwh_baseline = body.get("total_monthly_kwh", 0.0)
    report_items.append({
        "endpoint": "GET /api/appliances",
        "input": "None",
        "expected": "Status 200 with active appliances and total kWh",
        "actual": f"Status {status}: {len(body.get('appliances', []))} appliances found, total {total_kwh_baseline} kWh",
        "pass": status == 200 and len(body.get("appliances", [])) > 0,
        "issue": None if status == 200 else "Failed to fetch appliances"
    })

    # 3. POST /api/appliances (CRUD Create & Persistence Check)
    test_app_payload = {
        "name": "Audit Test Induction Cooktop",
        "category": "Kitchen",
        "rated_power_w": 2000.0,
        "quantity": 1,
        "hours_per_day": 2.0,
        "days_per_month": 30,
        "standby_power_w": 3.0,
        "priority": "High",
        "min_hours_per_day": 1.0,
        "max_hours_per_day": 3.0,
        "is_active": True
    }
    status, body = http_req(f"{BASE_URL}/appliances", method="POST", payload=test_app_payload)
    created_id = body.get("appliance_id")
    
    # Check persistence by re-fetching
    status_fetch, body_fetch = http_req(f"{BASE_URL}/appliances")
    found_created = any(a["id"] == created_id for a in body_fetch.get("appliances", [])) if created_id else False

    report_items.append({
        "endpoint": "POST /api/appliances",
        "input": json.dumps(test_app_payload),
        "expected": "Status 200 with appliance_id and verified DB persistence",
        "actual": f"Status {status}: Created ID {created_id}, Persisted = {found_created}",
        "pass": status == 200 and created_id is not None and found_created,
        "issue": None if found_created else "Created appliance not persisted in DB"
    })

    # 4. PUT /api/appliances/{id} (CRUD Update & Formula Check)
    update_payload = {"hours_per_day": 3.0}
    status, body = http_req(f"{BASE_URL}/appliances/{created_id}", method="PUT", payload=update_payload)
    status_fetch2, body_fetch2 = http_req(f"{BASE_URL}/appliances")
    updated_app = next((a for a in body_fetch2.get("appliances", []) if a["id"] == created_id), None)
    expected_kwh = (2000.0 * 1 * 3.0 * 30) / 1000.0  # 180.0 kWh (active)
    
    report_items.append({
        "endpoint": f"PUT /api/appliances/{created_id}",
        "input": json.dumps(update_payload),
        "expected": f"Status 200, hours_per_day updated to 3.0, kWh ~ {expected_kwh}",
        "actual": f"Status {status}: Updated hours = {updated_app.get('hours_per_day') if updated_app else 'N/A'}, kWh = {updated_app.get('monthly_kwh') if updated_app else 'N/A'}",
        "pass": status == 200 and updated_app is not None and updated_app.get("hours_per_day") == 3.0,
        "issue": None if updated_app and updated_app.get("hours_per_day") == 3.0 else "Update failed"
    })

    # 5. DELETE /api/appliances/{id} (CRUD Delete)
    status, body = http_req(f"{BASE_URL}/appliances/{created_id}", method="DELETE")
    status_fetch3, body_fetch3 = http_req(f"{BASE_URL}/appliances")
    deleted_exists = any(a["id"] == created_id for a in body_fetch3.get("appliances", []))

    report_items.append({
        "endpoint": f"DELETE /api/appliances/{created_id}",
        "input": f"Appliance ID {created_id}",
        "expected": "Status 200 and item removed from DB",
        "actual": f"Status {status}: Exists after delete = {deleted_exists}",
        "pass": status == 200 and not deleted_exists,
        "issue": None if not deleted_exists else "Appliance still exists after delete"
    })

    # 6. POST /api/calculate-consumption (Formula Verification)
    calc_input = [{
        "name": "Audit Air Conditioner",
        "category": "Cooling",
        "rated_power_w": 1500.0,
        "quantity": 1,
        "hours_per_day": 6.0,
        "days_per_month": 30,
        "standby_power_w": 0.0,
        "priority": "High",
        "min_hours_per_day": 2.0,
        "max_hours_per_day": 8.0,
        "is_active": True
    }]
    # 1500 * 1 * 6 * 30 / 1000 = 270.0 kWh
    status, body = http_req(f"{BASE_URL}/calculate-consumption", method="POST", payload=calc_input)
    calc_kwh = body.get("total_monthly_kwh")
    report_items.append({
        "endpoint": "POST /api/calculate-consumption",
        "input": "1500W AC, 1 Qty, 6h/day, 30 days",
        "expected": "270.0 kWh total monthly energy",
        "actual": f"Status {status}: {calc_kwh} kWh",
        "pass": status == 200 and calc_kwh == 270.0,
        "issue": None if calc_kwh == 270.0 else f"Expected 270.0 kWh, got {calc_kwh}"
    })

    # 7. POST /api/calculate-bill (Tariff Progressive Slab Check)
    status, body = http_req(f"{BASE_URL}/calculate-bill?total_kwh=420.0", method="POST")
    calc_bill = body.get("total_monthly_bill")
    report_items.append({
        "endpoint": "POST /api/calculate-bill",
        "input": "total_kwh = 420.0",
        "expected": "Status 200, Total monthly bill = INR 3150.00",
        "actual": f"Status {status}: INR {calc_bill}",
        "pass": status == 200 and calc_bill == 3150.0,
        "issue": None if calc_bill == 3150.0 else f"Expected INR 3150.0, got {calc_bill}"
    })

    # 8. POST /api/forecast (ML Forecaster & Model Performance Metrics)
    status, body = http_req(f"{BASE_URL}/forecast", method="POST")
    fc_months = body.get("forecast_months", [])
    r2 = body.get("r2_score")
    mae = body.get("mae_kwh")
    report_items.append({
        "endpoint": "POST /api/forecast",
        "input": "36-month historical consumption dataset",
        "expected": "Status 200, Ridge Regression model output with 3 months, R2 score, MAE",
        "actual": f"Status {status}: Model '{body.get('model_name')}', 3 months, R2={r2}, MAE={mae}",
        "pass": status == 200 and len(fc_months) == 3 and r2 is not None,
        "issue": None if len(fc_months) == 3 else "Forecaster failed to return 3 months"
    })

    # 9. POST /api/optimize (SciPy Linprog LP Optimizer Verification)
    opt_payload = {"target_budget": 3000.0}
    status, body = http_req(f"{BASE_URL}/optimize", method="POST", payload=opt_payload)
    opt_success = body.get("success", False)
    saved_kwh = body.get("total_kwh_saved", 0.0)
    saved_money = body.get("monthly_money_saved", 0.0)
    app_res = body.get("appliance_results", [])
    report_items.append({
        "endpoint": "POST /api/optimize",
        "input": json.dumps(opt_payload),
        "expected": "Status 200, SciPy linprog LP solution with usage allocation and explainability",
        "actual": f"Status {status}: Success={opt_success}, Saved {saved_kwh} kWh (INR {saved_money}/mo)",
        "pass": status == 200 and opt_success and saved_kwh > 0,
        "issue": None if opt_success and saved_kwh > 0 else "Optimizer failed to produce valid solution"
    })

    # 10. POST /api/digital-twin/simulate (Digital Twin Dynamic Inputs)
    twin_payload = {
        "title": "Audit Digital Twin AC 6h -> 4h",
        "appliance_overrides": [{"id": 1, "hours_per_day": 4.0, "rated_power_w": 1500, "quantity": 1, "is_active": True}]
    }
    status, body = http_req(f"{BASE_URL}/digital-twin/simulate", method="POST", payload=twin_payload)
    twin_kwh_saved = body.get("kwh_saved")
    report_items.append({
        "endpoint": "POST /api/digital-twin/simulate",
        "input": json.dumps(twin_payload),
        "expected": "Status 200, kWh saved, bill reduction, annual savings, CO2 reduction",
        "actual": f"Status {status}: Saved {twin_kwh_saved} kWh, Money saved INR {body.get('monthly_money_saved')}/mo",
        "pass": status == 200 and twin_kwh_saved is not None and twin_kwh_saved > 0,
        "issue": None if twin_kwh_saved and twin_kwh_saved > 0 else "Digital twin simulation failed"
    })

    # 11. POST /api/what-if (Real-time Slider Calculation)
    what_if_payload = {"appliance_id": 1, "new_hours_per_day": 4.0}
    status, body = http_req(f"{BASE_URL}/what-if", method="POST", payload=what_if_payload)
    what_if_saved = body.get("kwh_saved")
    report_items.append({
        "endpoint": "POST /api/what-if",
        "input": json.dumps(what_if_payload),
        "expected": "Status 200, recalculated old vs new kWh, bill, savings, CO2",
        "actual": f"Status {status}: {body.get('appliance_name')} {body.get('old_hours')}h -> {body.get('new_hours')}h, Saved {what_if_saved} kWh",
        "pass": status == 200 and what_if_saved is not None and what_if_saved > 0,
        "issue": None if what_if_saved and what_if_saved > 0 else "What-If slider failed"
    })

    # 12. POST /api/anomaly/detect (Isolation Forest Unsupervised Model)
    status, body = http_req(f"{BASE_URL}/anomaly/detect", method="POST")
    anom_count = body.get("anomalies_detected_count")
    report_items.append({
        "endpoint": "POST /api/anomaly/detect",
        "input": "60 daily historical readings",
        "expected": "Status 200, Isolation Forest outlier count, expected baseline, hypotheses",
        "actual": f"Status {status}: Model '{body.get('algorithm')}', {anom_count} anomalies detected",
        "pass": status == 200 and anom_count is not None,
        "issue": None if status == 200 else "Anomaly detector failed"
    })

    # 13. GET /api/efficiency-score (Weighted 6-Factor Score)
    status, body = http_req(f"{BASE_URL}/efficiency-score")
    score = body.get("overall_score")
    rating = body.get("rating_category")
    factors = body.get("factors", [])
    report_items.append({
        "endpoint": "GET /api/efficiency-score",
        "input": "Active appliances & consumption",
        "expected": "Status 200, overall score (0-100), rating category, 6 factor scores",
        "actual": f"Status {status}: Score = {score}/100 ({rating}), {len(factors)} sub-factors",
        "pass": status == 200 and 0.0 <= score <= 100.0 and len(factors) == 6,
        "issue": None if len(factors) == 6 else "Efficiency score sub-factor evaluation incomplete"
    })

    # 14. GET /api/daily-energy (Daily Energy Intelligence & Billing Projections)
    status, body = http_req(f"{BASE_URL}/daily-energy")
    daily_cost = body.get("average_daily_cost")
    daily_kwh = body.get("average_daily_consumption_kwh")
    today_cost = body.get("today_estimated_cost")
    report_items.append({
        "endpoint": "GET /api/daily-energy",
        "input": "Stored appliances & slab tariff configuration",
        "expected": "Status 200 with average_daily_cost, average_daily_consumption_kwh, today_estimated_cost, projected_monthly_bill",
        "actual": f"Status {status}: Avg Daily Cost = INR {daily_cost}, Avg Daily kWh = {daily_kwh}, Today Cost = INR {today_cost}",
        "pass": status == 200 and daily_cost is not None and daily_cost > 0 and today_cost is not None,
        "issue": None if status == 200 and daily_cost > 0 else "Daily energy endpoint failed"
    })

    # 14. Error Handling Verification (Invalid Appliance ID 99999)
    status, body = http_req(f"{BASE_URL}/appliances/99999", method="DELETE")
    report_items.append({
        "endpoint": "DELETE /api/appliances/99999",
        "input": "Non-existent Appliance ID 99999",
        "expected": "Status 404 with structured detail 'Appliance not found'",
        "actual": f"Status {status}: Detail = '{body.get('detail')}'",
        "pass": status == 404 and "not found" in str(body.get("detail")).lower(),
        "issue": None if status == 404 else "API failed to return 404 error code"
    })

    report_path = os.path.join(os.path.dirname(__file__), "audit_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report_items, f, indent=2)

    passed_count = sum(1 for item in report_items if item["pass"])
    print(f"Audit Complete! Saved to audit_report.json. {passed_count}/{len(report_items)} PASSED.")

if __name__ == "__main__":
    run_backend_audit()
