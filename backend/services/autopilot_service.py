from typing import Dict, Any, List
from sqlalchemy.orm import Session
import models
from services.daily_energy_service import get_daily_energy_intelligence
from services.consumption_engine import calculate_total_household_consumption
from services.tariff_engine import calculate_electricity_bill, get_active_tariff_data
from services.waste_radar import detect_energy_waste
from services.peak_load_engine import calculate_peak_load_analytics
from optimizer.energy_optimizer import optimize_appliance_usage

def get_energy_autopilot_data(db: Session) -> Dict[str, Any]:
    appliances = db.query(models.Appliance).all()
    slabs, fixed_charge, currency = get_active_tariff_data(db)

    # 1. Baseline & Daily Intelligence
    daily_intel = get_daily_energy_intelligence(db, billing_period_days=30)
    
    # 2. Optimization Opportunity
    opt_res = optimize_appliance_usage(appliances, target_budget=None, slabs=slabs, fixed_charge=fixed_charge)
    
    # 3. Waste & Peak Load
    waste_res = detect_energy_waste(appliances, slabs=slabs, fixed_charge=fixed_charge)
    peak_res = calculate_peak_load_analytics(appliances)

    # 4. Generate Top Autopilot Actions
    actions = []
    
    # Action 1: LP Optimizer Appliance Reductions
    for item in opt_res.get("appliance_results", []):
        if item["hours_reduction"] > 0:
            actions.append({
                "id": f"opt-{item['appliance_id']}",
                "appliance_id": item['appliance_id'],
                "appliance_name": item["name"],
                "category": item["category"],
                "title": f"Reduce {item['name']} daily runtime",
                "action_type": "Runtime Optimization",
                "current_val": f"{item['current_hours']} hr/day",
                "recommended_val": f"{item['optimized_hours']} hr/day",
                "impact_kwh": item["kwh_saved"],
                "impact_cost": item["money_saved"],
                "impact_co2": round(item["kwh_saved"] * 0.85, 1),
                "reason": item["reason"],
                "priority": item["priority"]
            })

    # Action 2: High Demand Peak Load Shift
    if peak_res.get("simultaneous_appliance_count", 0) >= 2:
        actions.append({
            "id": "peak-shift-1",
            "title": "Avoid Simultaneous High-Power Appliance Usage",
            "action_type": "Peak Load Shift",
            "current_val": f"{peak_res.get('coincident_peak_kw', 0)} kW Peak Demand",
            "recommended_val": "Stagger high-wattage loads across off-peak hours",
            "impact_kwh": round(peak_res.get("coincident_peak_kw", 1.0) * 1.5 * 30, 1),
            "impact_cost": round(peak_res.get("coincident_peak_kw", 1.0) * 1.5 * 30 * 8.5, 2),
            "impact_co2": round(peak_res.get("coincident_peak_kw", 1.0) * 1.5 * 30 * 0.85, 1),
            "reason": f"Coincident load of {peak_res.get('simultaneous_appliance_count')} appliances detected during peak period ({peak_res.get('peak_window')}).",
            "priority": "High"
        })

    # Action 3: Vampire Standby Draw
    if waste_res.get("standby_wampire_draw_w", 0) > 10:
        actions.append({
            "id": "waste-standby",
            "title": "Eliminate Vampire Standby Power Draw",
            "action_type": "Vampire Power Cut",
            "current_val": f"{waste_res.get('standby_wampire_draw_w')} W idle draw",
            "recommended_val": "Use smart plugs or switch off idle electronics",
            "impact_kwh": waste_res.get("standby_monthly_kwh", 0),
            "impact_cost": waste_res.get("standby_monthly_cost", 0),
            "impact_co2": round(waste_res.get("standby_monthly_kwh", 0) * 0.85, 1),
            "reason": f"Idle standby power draw represents ₹{waste_res.get('standby_monthly_cost')}/month of silent electricity loss.",
            "priority": "Medium"
        })

    # Sort actions by financial impact
    actions = sorted(actions, key=lambda x: x["impact_cost"], reverse=True)

    # 5. System Status Assessment
    if opt_res["total_kwh_saved"] > 30:
        system_status = "Optimization Opportunity Detected"
        system_status_code = "OPTIMIZATION_AVAILABLE"
    elif waste_res.get("waste_flag_count", 0) > 0:
        system_status = "Energy Waste Detected"
        system_status_code = "WASTE_DETECTED"
    else:
        system_status = "System Optimal"
        system_status_code = "OPTIMAL"

    return {
        "system_status": system_status,
        "system_status_code": system_status_code,
        "current_monthly_kwh": daily_intel["monthly_consumption_kwh"],
        "current_monthly_bill": daily_intel["monthly_bill"],
        "average_daily_cost": daily_intel["average_daily_cost"],
        "today_consumption_kwh": daily_intel["today_consumption_kwh"],
        "today_estimated_cost": daily_intel["today_estimated_cost"],
        "projected_monthly_bill": daily_intel["projected_monthly_bill"],
        "optimized_monthly_kwh": opt_res["optimized_total_kwh"],
        "optimized_monthly_bill": opt_res["optimized_monthly_bill"],
        "estimated_monthly_saving": opt_res["monthly_money_saved"],
        "estimated_annual_saving": opt_res["annual_money_saved"],
        "estimated_kwh_reduction": opt_res["total_kwh_saved"],
        "estimated_co2_reduction_kg": opt_res["co2_reduction_kg"],
        "actions_count": len(actions),
        "autopilot_actions": actions,
        "currency": currency
    }
