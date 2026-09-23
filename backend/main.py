import os
import sys
import json
import logging
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Local imports
from database import engine, Base, get_db, DB_TYPE
import models
import schemas
from seed_data import seed_database_if_empty

from services.consumption_engine import calculate_total_household_consumption, calculate_appliance_monthly_kwh
from services.tariff_engine import calculate_electricity_bill, DEFAULT_SLABS, DEFAULT_FIXED_CHARGE
from services.recommendation_engine import generate_smart_recommendations
from services.waste_radar import detect_energy_waste
from services.nl_assistant import answer_natural_language_query
from services.peak_load_engine import calculate_peak_load_analytics

from ml.forecaster import train_ridge_forecaster
from ml.anomaly_detector import detect_consumption_anomalies

from optimizer.energy_optimizer import optimize_appliance_usage
from engine.digital_twin import simulate_digital_twin_scenario
from engine.efficiency_score import calculate_energy_efficiency_score
from engine.energy_dna import classify_energy_dna
from engine.payback_engine import calculate_appliance_replacement
from engine.solar_ev_engine import simulate_solar_battery_system, optimize_ev_charging

# Initialize Logging & App
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("poweroptix.main")

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PowerOptix API",
    description="AI-Based Electricity Consumption Forecasting, Cost Optimization & Energy Digital Twin Backend API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_db_seed():
    db = next(get_db())
    try:
        seed_database_if_empty(db)
    except Exception as e:
        logger.error(f"Error during startup database seed: {e}")

def get_active_tariff_data(db: Session):
    config = db.query(models.TariffConfig).first()
    slabs = db.query(models.TariffSlab).order_by(models.TariffSlab.slab_order.asc()).all()
    fixed_charge = config.fixed_charge if config else DEFAULT_FIXED_CHARGE
    currency = config.currency_symbol if config else "₹"
    return slabs, fixed_charge, currency

# --- Endpoints ---

@app.get("/")
def read_root():
    from database import DB_TYPE, DB_NAME, DB_ERROR_REASON
    return {
        "app": "PowerOptix Electricity Usage Optimizer",
        "status": "online",
        "database_type": DB_TYPE,
        "database_name": DB_NAME,
        "database_status": "Connected to Primary MySQL" if DB_TYPE == "mysql" else "SQLite Fallback Active",
        "fallback_reason": DB_ERROR_REASON,
        "docs_url": "/docs"
    }

# 1. DASHBOARD SUMMARY
@app.get("/api/dashboard", response_model=schemas.DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    appliances = db.query(models.Appliance).filter(models.Appliance.is_active == True).all()
    slabs, fixed_charge, currency = get_active_tariff_data(db)
    goal = db.query(models.EnergyGoal).filter(models.EnergyGoal.is_active == True).first()
    target_budget = goal.target_budget if goal else 3000.0

    consumption_res = calculate_total_household_consumption(appliances)
    monthly_kwh = consumption_res["total_monthly_kwh"]
    bill_res = calculate_electricity_bill(monthly_kwh, slabs=slabs, fixed_charge=fixed_charge, currency=currency)
    monthly_bill = bill_res["total_monthly_bill"]
    annual_bill = bill_res["total_annual_bill"]

    opt_res = optimize_appliance_usage(appliances, target_budget=target_budget, slabs=slabs, fixed_charge=fixed_charge)
    opt_monthly_kwh = opt_res["optimized_total_kwh"]
    potential_monthly_saving = opt_res["monthly_money_saved"]
    potential_annual_saving = opt_res["annual_money_saved"]
    co2_reduction_kg = opt_res["co2_reduction_kg"]

    score_res = calculate_energy_efficiency_score(
        appliances, monthly_kwh, monthly_bill, target_budget=target_budget, optimized_kwh=opt_monthly_kwh
    )

    items = sorted(consumption_res["items"], key=lambda x: x["total_kwh"], reverse=True)
    top_name = items[0]["name"] if items else None
    top_kwh = items[0]["total_kwh"] if items else 0.0

    return {
        "total_appliances": len(appliances),
        "monthly_consumption_kwh": monthly_kwh,
        "estimated_monthly_bill": monthly_bill,
        "estimated_annual_bill": annual_bill,
        "optimized_monthly_kwh": opt_monthly_kwh,
        "potential_monthly_saving": potential_monthly_saving,
        "potential_annual_saving": potential_annual_saving,
        "co2_reduction_kg": co2_reduction_kg,
        "efficiency_score": score_res["overall_score"],
        "efficiency_rating": score_res["rating_category"],
        "target_budget": target_budget,
        "is_over_budget": (monthly_bill > target_budget),
        "currency": currency,
        "top_consuming_appliance": top_name,
        "top_appliance_kwh": top_kwh
    }

# 2. APPLIANCES CRUD
@app.get("/api/appliances", response_model=schemas.ApplianceAnalyticsSummary)
def get_appliances(db: Session = Depends(get_db)):
    appliances = db.query(models.Appliance).all()
    slabs, fixed_charge, currency = get_active_tariff_data(db)

    consumption_res = calculate_total_household_consumption(appliances)
    total_kwh = consumption_res["total_monthly_kwh"]
    bill_res = calculate_electricity_bill(total_kwh, slabs=slabs, fixed_charge=fixed_charge, currency=currency)
    effective_rate = bill_res["energy_charge"] / max(1.0, total_kwh)

    category_breakdown = {}
    app_items = []
    
    highest_app = None
    highest_kwh = 0.0
    lowest_app = None
    lowest_kwh = float("inf") if appliances else 0.0

    for item in consumption_res["items"]:
        app_id = item["appliance_id"]
        kwh = item["total_kwh"]
        cost = round(kwh * effective_rate, 2)
        pct = round((kwh / max(1.0, total_kwh)) * 100.0, 1)

        cat = item["category"]
        category_breakdown[cat] = round(category_breakdown.get(cat, 0.0) + kwh, 2)

        if kwh > highest_kwh:
            highest_kwh = kwh
            highest_app = item["name"]
        if kwh < lowest_kwh and kwh > 0:
            lowest_kwh = kwh
            lowest_app = item["name"]

        app_items.append({
            "id": app_id,
            "name": item["name"],
            "category": item["category"],
            "rated_power_w": item["rated_power_w"],
            "quantity": item["quantity"],
            "hours_per_day": item["hours_per_day"],
            "monthly_kwh": kwh,
            "monthly_cost": cost,
            "percentage_contribution": pct
        })

    return {
        "total_monthly_kwh": total_kwh,
        "total_monthly_cost": bill_res["total_monthly_bill"],
        "total_annual_cost": bill_res["total_annual_bill"],
        "highest_consuming_appliance": highest_app,
        "highest_consuming_kwh": highest_kwh,
        "lowest_consuming_appliance": lowest_app if lowest_kwh != float("inf") else None,
        "lowest_consuming_kwh": lowest_kwh if lowest_kwh != float("inf") else 0.0,
        "category_breakdown": category_breakdown,
        "appliances": app_items
    }

@app.post("/api/appliances")
def create_appliance(app_data: schemas.ApplianceCreate, db: Session = Depends(get_db)):
    db_app = models.Appliance(**app_data.dict())
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return {"message": "Appliance created successfully", "appliance_id": db_app.id}

@app.put("/api/appliances/{appliance_id}")
def update_appliance(appliance_id: int, app_data: schemas.ApplianceUpdate, db: Session = Depends(get_db)):
    db_app = db.query(models.Appliance).filter(models.Appliance.id == appliance_id).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="Appliance not found")
    
    update_data = app_data.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(db_app, field, val)
    
    db.commit()
    db.refresh(db_app)
    return {"message": "Appliance updated successfully", "appliance_id": db_app.id}

@app.delete("/api/appliances/{appliance_id}")
def delete_appliance(appliance_id: int, db: Session = Depends(get_db)):
    db_app = db.query(models.Appliance).filter(models.Appliance.id == appliance_id).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="Appliance not found")
    db.delete(db_app)
    db.commit()
    return {"message": f"Appliance {appliance_id} deleted successfully"}

# 3. ENERGY DNA
@app.get("/api/energy-dna")
def get_energy_dna(db: Session = Depends(get_db)):
    appliances = db.query(models.Appliance).filter(models.Appliance.is_active == True).all()
    slabs, fixed_charge, _ = get_active_tariff_data(db)
    goal = db.query(models.EnergyGoal).filter(models.EnergyGoal.is_active == True).first()
    target_budget = goal.target_budget if goal else 3000.0

    consumption_res = calculate_total_household_consumption(appliances)
    monthly_kwh = consumption_res["total_monthly_kwh"]
    bill = calculate_electricity_bill(monthly_kwh, slabs=slabs, fixed_charge=fixed_charge)["total_monthly_bill"]

    return classify_energy_dna(appliances, monthly_kwh, bill, target_budget=target_budget)

# 4. ANOMALY DETECTION
@app.post("/api/anomaly/detect")
def run_anomaly_detection(db: Session = Depends(get_db)):
    appliances = db.query(models.Appliance).filter(models.Appliance.is_active == True).all()
    consumption_res = calculate_total_household_consumption(appliances)
    monthly_kwh = consumption_res["total_monthly_kwh"]
    return detect_consumption_anomalies(total_monthly_kwh=monthly_kwh)

# 5. APPLIANCE REPLACEMENT & PAYBACK ANALYZER
@app.post("/api/appliance-replacement")
def post_appliance_replacement(
    current_power_w: float,
    replacement_power_w: float,
    hours_per_day: float,
    quantity: int = 1,
    replacement_cost_total: float = 1500.0,
    db: Session = Depends(get_db)
):
    slabs, fixed_charge, _ = get_active_tariff_data(db)
    tariff_avg = 8.5
    return calculate_appliance_replacement(
        current_power_w=current_power_w,
        replacement_power_w=replacement_power_w,
        hours_per_day=hours_per_day,
        quantity=quantity,
        replacement_cost_total=replacement_cost_total,
        tariff_per_kwh=tariff_avg
    )

# 6. RENEWABLE SOLAR & EV SIMULATORS
@app.post("/api/solar/simulate")
def post_solar_simulate(
    solar_capacity_kw: float = 3.0,
    battery_capacity_kwh: float = 5.0,
    db: Session = Depends(get_db)
):
    appliances = db.query(models.Appliance).filter(models.Appliance.is_active == True).all()
    slabs, fixed_charge, _ = get_active_tariff_data(db)
    monthly_kwh = calculate_total_household_consumption(appliances)["total_monthly_kwh"]
    current_bill = calculate_electricity_bill(monthly_kwh, slabs=slabs, fixed_charge=fixed_charge)["total_monthly_bill"]

    return simulate_solar_battery_system(
        total_monthly_kwh=monthly_kwh,
        current_monthly_bill=current_bill,
        solar_capacity_kw=solar_capacity_kw,
        battery_capacity_kwh=battery_capacity_kwh
    )

@app.post("/api/ev/optimize")
def post_ev_optimize(
    battery_capacity_kwh: float = 30.0,
    current_soc_pct: float = 20.0,
    target_soc_pct: float = 80.0,
    charger_power_kw: float = 3.3
):
    return optimize_ev_charging(
        battery_capacity_kwh=battery_capacity_kwh,
        current_soc_pct=current_soc_pct,
        target_soc_pct=target_soc_pct,
        charger_power_kw=charger_power_kw
    )

# 7. ENERGY WASTE DETECTOR & PEAK LOAD INTELLIGENCE
@app.get("/api/waste-radar")
def get_waste_radar(db: Session = Depends(get_db)):
    appliances = db.query(models.Appliance).filter(models.Appliance.is_active == True).all()
    consumption_res = calculate_total_household_consumption(appliances)
    monthly_kwh = consumption_res["total_monthly_kwh"]
    return detect_energy_waste(appliances, monthly_kwh)

@app.get("/api/peak-load")
def get_peak_load(db: Session = Depends(get_db)):
    appliances = db.query(models.Appliance).filter(models.Appliance.is_active == True).all()
    return calculate_peak_load_analytics(appliances)

# 8. COMPREHENSIVE ENERGY REPORT GENERATOR
@app.post("/api/reports/generate")
def generate_comprehensive_report(db: Session = Depends(get_db)):
    appliances = db.query(models.Appliance).filter(models.Appliance.is_active == True).all()
    slabs, fixed_charge, currency = get_active_tariff_data(db)
    goal = db.query(models.EnergyGoal).filter(models.EnergyGoal.is_active == True).first()
    target_budget = goal.target_budget if goal else 3000.0

    consumption_res = calculate_total_household_consumption(appliances)
    monthly_kwh = consumption_res["total_monthly_kwh"]
    bill_res = calculate_electricity_bill(monthly_kwh, slabs=slabs, fixed_charge=fixed_charge, currency=currency)
    opt_res = optimize_appliance_usage(appliances, target_budget=target_budget, slabs=slabs, fixed_charge=fixed_charge)
    score_res = calculate_energy_efficiency_score(appliances, monthly_kwh, bill_res["total_monthly_bill"], target_budget=target_budget, optimized_kwh=opt_res["optimized_total_kwh"])
    dna_res = classify_energy_dna(appliances, monthly_kwh, bill_res["total_monthly_bill"], target_budget=target_budget)
    waste_res = detect_energy_waste(appliances, monthly_kwh)

    return {
        "report_id": f"REP-POWEROPTIX-{int(os.times().system * 1000)}",
        "generated_at": os.popen("date /t").read().strip() if sys.platform == "win32" else "2026-08-13",
        "currency": currency,
        "executive_summary": {
            "total_appliances": len(appliances),
            "current_monthly_kwh": monthly_kwh,
            "current_monthly_bill": bill_res["total_monthly_bill"],
            "optimized_monthly_kwh": opt_res["optimized_total_kwh"],
            "optimized_monthly_bill": opt_res["optimized_monthly_bill"],
            "monthly_money_saved": opt_res["monthly_money_saved"],
            "annual_money_saved": opt_res["annual_money_saved"],
            "co2_reduction_kg": opt_res["co2_reduction_kg"],
            "efficiency_score": score_res["overall_score"],
            "energy_dna": dna_res["profile_name"]
        },
        "appliance_breakdown": consumption_res["items"],
        "optimization_explainability": opt_res["appliance_results"],
        "waste_patterns": waste_res["patterns"]
    }

# 9. NATURAL LANGUAGE ENERGY ASSISTANT
@app.post("/api/assistant")
def post_assistant_query(query_payload: dict, db: Session = Depends(get_db)):
    q = query_payload.get("query", "")
    appliances = db.query(models.Appliance).filter(models.Appliance.is_active == True).all()
    goal = db.query(models.EnergyGoal).filter(models.EnergyGoal.is_active == True).first()
    target_budget = goal.target_budget if goal else 3000.0
    return answer_natural_language_query(q, appliances, target_budget=target_budget)

# 10. VIVA ACADEMIC DEFENSE METRICS
@app.get("/api/viva-metrics")
def get_viva_metrics(db: Session = Depends(get_db)):
    appliances = db.query(models.Appliance).filter(models.Appliance.is_active == True).all()
    slabs, fixed_charge, _ = get_active_tariff_data(db)
    goal = db.query(models.EnergyGoal).filter(models.EnergyGoal.is_active == True).first()
    target_budget = goal.target_budget if goal else 3000.0

    consumption_res = calculate_total_household_consumption(appliances)
    monthly_kwh = consumption_res["total_monthly_kwh"]
    opt_res = optimize_appliance_usage(appliances, target_budget=target_budget, slabs=slabs, fixed_charge=fixed_charge)
    fc_res = train_ridge_forecaster(current_baseline_kwh=monthly_kwh)
    anom_res = detect_consumption_anomalies(total_monthly_kwh=monthly_kwh)

    return {
        "mathematical_model": {
            "name": "Linear Programming Optimization (scipy.optimize.linprog)",
            "decision_variables": "x_i (daily usage hours for appliance i)",
            "objective": "Minimize Z = sum((P_i * Q_i * D_i / 1000) * x_i * Tariff_i)",
            "bounds": "min_hours_i <= x_i <= max_hours_i",
            "constraints": f"Total Cost <= ₹{target_budget}",
            "baseline_kwh": monthly_kwh,
            "optimized_kwh": opt_res["optimized_total_kwh"],
            "kwh_saved": opt_res["total_kwh_saved"]
        },
        "ml_forecaster": {
            "algorithm": fc_res["model_name"],
            "training_samples": fc_res["training_data_points"],
            "r2_score": fc_res["r2_score"],
            "mae_kwh": fc_res["mae_kwh"],
            "next_month_prediction": fc_res["forecast_months"][0]["predicted_kwh"]
        },
        "anomaly_detector": {
            "algorithm": anom_res["algorithm"],
            "anomalies_detected": anom_res["anomalies_detected_count"]
        }
    }

# 11. SCENARIOS SAVE & LIST
@app.post("/api/scenarios/save")
def save_scenario(payload: dict, db: Session = Depends(get_db)):
    name = payload.get("name", "What-If Saved Scenario")
    params = payload.get("parameters", {})
    sim_kwh = payload.get("simulated_kwh", 0.0)
    sim_bill = payload.get("simulated_bill", 0.0)
    savings = payload.get("monthly_savings", 0.0)

    scenario_obj = models.WhatIfScenario(
        name=name,
        parameters_json=json.dumps(params),
        simulated_kwh=sim_kwh,
        simulated_bill=sim_bill,
        monthly_savings=savings
    )
    db.add(scenario_obj)
    db.commit()
    return {"message": "Scenario saved successfully", "scenario_id": scenario_obj.id}

@app.get("/api/scenarios")
def get_scenarios(db: Session = Depends(get_db)):
    scenarios = db.query(models.WhatIfScenario).order_by(models.WhatIfScenario.created_at.desc()).all()
    return [{
        "id": s.id,
        "name": s.name,
        "simulated_kwh": s.simulated_kwh,
        "simulated_bill": s.simulated_bill,
        "monthly_savings": s.monthly_savings,
        "created_at": s.created_at
    } for s in scenarios]

# 12. ML FORECASTING, OPTIMIZER, DIGITAL TWIN, SIMULATOR, RECOMMENDATIONS, SCORE, GOALS, TARIFF
@app.post("/api/calculate-consumption", response_model=schemas.ConsumptionCalcResult)
def post_calculate_consumption(appliances: List[schemas.ApplianceBase]):
    return calculate_total_household_consumption([app.dict() for app in appliances])

@app.post("/api/calculate-bill", response_model=schemas.BillCalcResult)
def post_calculate_bill(total_kwh: float, custom_fixed_charge: Optional[float] = None, db: Session = Depends(get_db)):
    slabs, fixed_charge, currency = get_active_tariff_data(db)
    fc = custom_fixed_charge if custom_fixed_charge is not None else fixed_charge
    return calculate_electricity_bill(total_kwh, slabs=slabs, fixed_charge=fc, currency=currency)

@app.get("/api/tariff")
def get_tariff(db: Session = Depends(get_db)):
    config = db.query(models.TariffConfig).first()
    slabs = db.query(models.TariffSlab).order_by(models.TariffSlab.slab_order.asc()).all()
    return {
        "tariff_name": config.tariff_name if config else "Standard Tariff",
        "fixed_charge": config.fixed_charge if config else 150.0,
        "currency_symbol": config.currency_symbol if config else "₹",
        "slabs": slabs
    }

@app.put("/api/tariff")
def update_tariff(tariff_req: schemas.TariffConfigSchema, db: Session = Depends(get_db)):
    config = db.query(models.TariffConfig).first()
    if not config:
        config = models.TariffConfig()
        db.add(config)
    config.fixed_charge = tariff_req.fixed_charge
    config.currency_symbol = tariff_req.currency_symbol
    config.tariff_name = tariff_req.tariff_name
    db.commit()

    db.query(models.TariffSlab).delete()
    db.commit()

    for idx, s_data in enumerate(tariff_req.slabs):
        s_obj = models.TariffSlab(
            min_units=s_data.min_units,
            max_units=s_data.max_units,
            rate_per_unit=s_data.rate_per_unit,
            slab_order=idx + 1,
            description=s_data.description
        )
        db.add(s_obj)
    db.commit()
    return {"message": "Tariff configuration updated successfully"}

@app.post("/api/forecast", response_model=schemas.ForecastResponse)
def get_ml_forecast(db: Session = Depends(get_db)):
    history_records = db.query(models.MonthlyConsumptionHistory).order_by(models.MonthlyConsumptionHistory.month_index.asc()).all()
    import pandas as pd
    history_df = pd.DataFrame([{
        "month_year": r.month_year,
        "month_index": r.month_index,
        "total_kwh": r.total_kwh,
        "total_cost": r.total_cost,
        "avg_temperature_c": r.avg_temperature_c or 28.0
    } for r in history_records]) if history_records else None

    appliances = db.query(models.Appliance).filter(models.Appliance.is_active == True).all()
    cur_consumption = calculate_total_household_consumption(appliances)["total_monthly_kwh"]

    return train_ridge_forecaster(history_df=history_df, current_baseline_kwh=cur_consumption)

@app.post("/api/optimize", response_model=schemas.OptimizationResponse)
def run_optimization(req: schemas.OptimizationRequest = None, db: Session = Depends(get_db)):
    appliances = db.query(models.Appliance).filter(models.Appliance.is_active == True).all()
    slabs, fixed_charge, _ = get_active_tariff_data(db)

    target_b = req.target_budget if (req and req.target_budget) else None
    if target_b is None:
        goal = db.query(models.EnergyGoal).filter(models.EnergyGoal.is_active == True).first()
        if goal:
            target_b = goal.target_budget

    max_kwh = req.max_kwh_limit if (req and req.max_kwh_limit) else None
    obj_mode = req.objective_mode if (req and hasattr(req, "objective_mode") and req.objective_mode) else "balanced"

    result = optimize_appliance_usage(
        appliances=appliances,
        target_budget=target_b,
        max_kwh_limit=max_kwh,
        slabs=slabs,
        fixed_charge=fixed_charge,
        objective_mode=obj_mode
    )

    if result["success"]:
        opt_log = models.OptimizationLog(
            original_kwh=result["current_total_kwh"],
            optimized_kwh=result["optimized_total_kwh"],
            energy_saved_kwh=result["total_kwh_saved"],
            original_cost=result["current_monthly_bill"],
            optimized_cost=result["optimized_monthly_bill"],
            monthly_money_saved=result["monthly_money_saved"],
            target_budget=target_b
        )
        db.add(opt_log)
        db.commit()

    return result

@app.post("/api/digital-twin/simulate", response_model=schemas.DigitalTwinSimulateResponse)
def run_digital_twin_simulation(req: schemas.DigitalTwinSimulateRequest, db: Session = Depends(get_db)):
    appliances = db.query(models.Appliance).filter(models.Appliance.is_active == True).all()
    slabs, fixed_charge, _ = get_active_tariff_data(db)

    return simulate_digital_twin_scenario(
        current_appliances=appliances,
        simulated_overrides=req.appliance_overrides,
        slabs=slabs,
        fixed_charge=fixed_charge,
        scenario_title=req.title or "What-If Energy Digital Twin Scenario"
    )

@app.post("/api/what-if", response_model=schemas.WhatIfResponse)
def run_what_if(req: schemas.WhatIfRequest, db: Session = Depends(get_db)):
    appliances = db.query(models.Appliance).filter(models.Appliance.is_active == True).all()
    slabs, fixed_charge, _ = get_active_tariff_data(db)

    target_app = next((app for app in appliances if app.id == req.appliance_id), None)
    if not target_app:
        raise HTTPException(status_code=404, detail=f"Appliance {req.appliance_id} not found")

    ov_power = req.new_rated_power_w if req.new_rated_power_w is not None else target_app.rated_power_w
    ov_qty = req.new_quantity if req.new_quantity is not None else target_app.quantity
    ov_hours = req.new_hours_per_day

    overrides = [{
        "id": req.appliance_id,
        "hours_per_day": ov_hours,
        "rated_power_w": ov_power,
        "quantity": ov_qty,
        "is_active": True
    }]

    dt_res = simulate_digital_twin_scenario(
        current_appliances=appliances,
        simulated_overrides=overrides,
        slabs=slabs,
        fixed_charge=fixed_charge
    )

    app_comp = next((c for c in dt_res["appliance_comparisons"] if c["appliance_id"] == req.appliance_id), None)

    return {
        "appliance_name": target_app.name,
        "old_hours": target_app.hours_per_day,
        "new_hours": ov_hours,
        "old_kwh": app_comp["original_kwh"] if app_comp else 0.0,
        "new_kwh": app_comp["simulated_kwh"] if app_comp else 0.0,
        "kwh_saved": dt_res["kwh_saved"],
        "old_bill": dt_res["original_bill"],
        "new_bill": dt_res["simulated_bill"],
        "monthly_saving": dt_res["monthly_money_saved"],
        "annual_saving": dt_res["annual_money_saved"],
        "co2_reduction_kg_year": dt_res["co2_reduction_kg"]
    }

@app.get("/api/recommendations", response_model=schemas.RecommendationsResponse)
def get_recommendations(db: Session = Depends(get_db)):
    appliances = db.query(models.Appliance).filter(models.Appliance.is_active == True).all()
    slabs, fixed_charge, _ = get_active_tariff_data(db)
    goal = db.query(models.EnergyGoal).filter(models.EnergyGoal.is_active == True).first()
    target_budget = goal.target_budget if goal else 3000.0

    return generate_smart_recommendations(
        appliances=appliances,
        target_budget=target_budget,
        slabs=slabs,
        fixed_charge=fixed_charge
    )

@app.get("/api/efficiency-score", response_model=schemas.EfficiencyScoreResponse)
def get_efficiency_score(db: Session = Depends(get_db)):
    appliances = db.query(models.Appliance).filter(models.Appliance.is_active == True).all()
    slabs, fixed_charge, _ = get_active_tariff_data(db)
    goal = db.query(models.EnergyGoal).filter(models.EnergyGoal.is_active == True).first()
    target_budget = goal.target_budget if goal else 3000.0

    consumption_res = calculate_total_household_consumption(appliances)
    monthly_kwh = consumption_res["total_monthly_kwh"]
    bill = calculate_electricity_bill(monthly_kwh, slabs=slabs, fixed_charge=fixed_charge)["total_monthly_bill"]

    opt_res = optimize_appliance_usage(appliances, target_budget=target_budget, slabs=slabs, fixed_charge=fixed_charge)
    opt_kwh = opt_res["optimized_total_kwh"]

    return calculate_energy_efficiency_score(
        appliances=appliances,
        total_monthly_kwh=monthly_kwh,
        current_bill=bill,
        target_budget=target_budget,
        optimized_kwh=opt_kwh
    )

@app.get("/api/goals", response_model=schemas.GoalResponse)
def get_goal(db: Session = Depends(get_db)):
    goal = db.query(models.EnergyGoal).filter(models.EnergyGoal.is_active == True).first()
    if not goal:
        goal = models.EnergyGoal(target_budget=3000.0, target_kwh=350.0)
        db.add(goal)
        db.commit()

    appliances = db.query(models.Appliance).filter(models.Appliance.is_active == True).all()
    slabs, fixed_charge, _ = get_active_tariff_data(db)

    consumption_res = calculate_total_household_consumption(appliances)
    monthly_kwh = consumption_res["total_monthly_kwh"]
    current_bill = calculate_electricity_bill(monthly_kwh, slabs=slabs, fixed_charge=fixed_charge)["total_monthly_bill"]

    variance = current_bill - goal.target_budget

    return {
        "id": goal.id,
        "target_budget": goal.target_budget,
        "target_kwh": goal.target_kwh,
        "current_bill": current_bill,
        "current_kwh": monthly_kwh,
        "budget_variance": round(variance, 2),
        "budget_met": (variance <= 0),
        "is_active": goal.is_active
    }

@app.post("/api/goals")
def update_goal(req: schemas.GoalCreate, db: Session = Depends(get_db)):
    goal = db.query(models.EnergyGoal).filter(models.EnergyGoal.is_active == True).first()
    if not goal:
        goal = models.EnergyGoal(target_budget=req.target_budget, target_kwh=req.target_kwh)
        db.add(goal)
    else:
        goal.target_budget = req.target_budget
        if req.target_kwh is not None:
            goal.target_kwh = req.target_kwh
    db.commit()
    return {"message": "Energy target budget updated successfully", "target_budget": goal.target_budget}
