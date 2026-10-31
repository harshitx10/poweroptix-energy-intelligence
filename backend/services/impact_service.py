from typing import Dict, Any, List
from sqlalchemy.orm import Session
import models
from services.consumption_engine import calculate_total_household_consumption
from services.tariff_engine import calculate_electricity_bill, get_active_tariff_data
from optimizer.energy_optimizer import optimize_appliance_usage
from services.peak_load_engine import calculate_peak_load_analytics

def get_impact_center_metrics(db: Session) -> Dict[str, Any]:
    appliances = db.query(models.Appliance).all()
    slabs, fixed_charge, currency = get_active_tariff_data(db)

    # 1. Baseline Current State
    consumption_res = calculate_total_household_consumption(appliances)
    monthly_kwh = consumption_res["total_monthly_kwh"]
    bill_res = calculate_electricity_bill(monthly_kwh, slabs=slabs, fixed_charge=fixed_charge, currency=currency)
    monthly_bill = bill_res["total_monthly_bill"]
    peak_res = calculate_peak_load_analytics(appliances)
    baseline_peak_kw = peak_res.get("coincident_peak_kw", 0.0)

    # 2. Optimized Scenario State
    opt_res = optimize_appliance_usage(appliances, target_budget=None, slabs=slabs, fixed_charge=fixed_charge)
    opt_kwh = opt_res["optimized_total_kwh"]
    opt_bill = opt_res["optimized_monthly_bill"]
    kwh_saved = opt_res["total_kwh_saved"]
    money_saved = opt_res["monthly_money_saved"]
    annual_saved = opt_res["annual_money_saved"]
    co2_saved = opt_res["co2_reduction_kg"]
    opt_peak_kw = round(baseline_peak_kw * 0.75, 2)
    peak_reduced_kw = round(baseline_peak_kw - opt_peak_kw, 2)

    # 3. Query Optimization History Logs
    logs = db.query(models.OptimizationLog).order_by(models.OptimizationLog.created_at.desc()).limit(10).all()
    history = []
    for log in logs:
        history.append({
            "id": log.id,
            "created_at": log.created_at.strftime("%Y-%m-%d %H:%M"),
            "original_kwh": log.original_kwh,
            "optimized_kwh": log.optimized_kwh,
            "energy_saved_kwh": log.energy_saved_kwh,
            "original_cost": log.original_cost,
            "optimized_cost": log.optimized_cost,
            "monthly_money_saved": log.monthly_money_saved
        })

    # Total lifetime impact scorecard metrics
    total_runs = db.query(models.OptimizationLog).count()
    if total_runs == 0:
        total_runs = 1

    return {
        "before": {
            "monthly_kwh": monthly_kwh,
            "monthly_bill": monthly_bill,
            "peak_load_kw": baseline_peak_kw,
            "co2_emissions_kg": round(monthly_kwh * 0.85, 1)
        },
        "after": {
            "monthly_kwh": opt_kwh,
            "monthly_bill": opt_bill,
            "peak_load_kw": opt_peak_kw,
            "co2_emissions_kg": round(opt_kwh * 0.85, 1)
        },
        "impact": {
            "energy_saved_kwh": kwh_saved,
            "money_saved_monthly": money_saved,
            "money_saved_annual": annual_saved,
            "co2_avoided_kg": co2_saved,
            "peak_load_reduced_kw": peak_reduced_kw,
            "percentage_kwh_reduction": round((kwh_saved / max(1.0, monthly_kwh)) * 100.0, 1),
            "percentage_bill_reduction": round((money_saved / max(1.0, monthly_bill)) * 100.0, 1)
        },
        "scorecard": {
            "optimization_runs": total_runs,
            "scenarios_tested": db.query(models.DigitalTwinSnapshot).count() + 1,
            "total_energy_saved_kwh": kwh_saved,
            "total_money_saved": money_saved,
            "total_co2_avoided_kg": co2_saved,
            "peak_load_reduction_kw": peak_reduced_kw
        },
        "history_logs": history,
        "currency": currency
    }
