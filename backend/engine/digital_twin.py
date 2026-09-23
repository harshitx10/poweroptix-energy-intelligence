"""
PowerOptix - Energy Digital Twin & Real-Time Simulator Engine ⭐⭐⭐⭐⭐
Deterministic Digital Twin calculating Current State vs Simulated State differences.
"""

from services.consumption_engine import calculate_total_household_consumption, calculate_appliance_monthly_kwh
from services.tariff_engine import calculate_electricity_bill, DEFAULT_FIXED_CHARGE

def simulate_digital_twin_scenario(
    current_appliances: list,
    simulated_overrides: list,  # [{id: 1, hours_per_day: 4, rated_power_w: 1500, quantity: 1, is_active: true}]
    slabs: list = None,
    fixed_charge: float = DEFAULT_FIXED_CHARGE,
    scenario_title: str = "What-If Energy Digital Twin Scenario"
) -> dict:
    """
    Computes deterministic Digital Twin comparison between Current State and Simulated State.
    """
    # 1. Compute Current State
    current_consumption_res = calculate_total_household_consumption(current_appliances)
    cur_total_kwh = current_consumption_res["total_monthly_kwh"]
    cur_bill_res = calculate_electricity_bill(cur_total_kwh, slabs=slabs, fixed_charge=fixed_charge)
    cur_bill = cur_bill_res["total_monthly_bill"]

    # 2. Build Simulated Appliances List
    # Map overrides by appliance ID or index
    override_map = {}
    for ov in simulated_overrides:
        app_id = ov.get("id") or ov.get("appliance_id")
        if app_id is not None:
            override_map[app_id] = ov

    simulated_apps = []
    appliance_comparisons = []

    for app in current_appliances:
        app_id = getattr(app, "id", app.get("id", None)) if isinstance(app, dict) else getattr(app, "id", None)
        name = getattr(app, "name", app.get("name", "Unknown")) if isinstance(app, dict) else app.name
        category = getattr(app, "category", app.get("category", "General")) if isinstance(app, dict) else app.category
        
        orig_power = float(getattr(app, "rated_power_w", app.get("rated_power_w", 0))) if isinstance(app, dict) else float(app.rated_power_w)
        orig_qty = int(getattr(app, "quantity", app.get("quantity", 1))) if isinstance(app, dict) else int(app.quantity)
        orig_hours = float(getattr(app, "hours_per_day", app.get("hours_per_day", 0))) if isinstance(app, dict) else float(app.hours_per_day)
        days = int(getattr(app, "days_per_month", app.get("days_per_month", 30))) if isinstance(app, dict) else int(app.days_per_month)
        standby_w = float(getattr(app, "standby_power_w", app.get("standby_power_w", 0))) if isinstance(app, dict) else float(app.standby_power_w)
        orig_active = getattr(app, "is_active", True) if not isinstance(app, dict) else app.get("is_active", True)

        ov = override_map.get(app_id, {})
        
        sim_power = float(ov.get("rated_power_w", orig_power))
        sim_qty = int(ov.get("quantity", orig_qty))
        sim_hours = float(ov.get("hours_per_day", orig_hours))
        sim_active = bool(ov.get("is_active", orig_active))

        orig_calc = calculate_appliance_monthly_kwh(orig_power, orig_qty, orig_hours, days, standby_w) if orig_active else {"total_kwh": 0.0}
        sim_calc = calculate_appliance_monthly_kwh(sim_power, sim_qty, sim_hours, days, standby_w) if sim_active else {"total_kwh": 0.0}

        orig_kwh = orig_calc["total_kwh"]
        sim_kwh = sim_calc["total_kwh"]

        appliance_comparisons.append({
            "appliance_id": app_id,
            "name": name,
            "category": category,
            "original_power_w": orig_power,
            "simulated_power_w": sim_power,
            "original_hours": orig_hours,
            "simulated_hours": sim_hours,
            "original_quantity": orig_qty,
            "simulated_quantity": sim_qty,
            "original_kwh": orig_kwh,
            "simulated_kwh": sim_kwh,
            "kwh_diff": round(sim_kwh - orig_kwh, 2)
        })

        if sim_active:
            simulated_apps.append({
                "name": name,
                "category": category,
                "rated_power_w": sim_power,
                "quantity": sim_qty,
                "hours_per_day": sim_hours,
                "days_per_month": days,
                "standby_power_w": standby_w,
                "is_active": True
            })

    # 3. Compute Simulated State Totals
    sim_consumption_res = calculate_total_household_consumption(simulated_apps)
    sim_total_kwh = sim_consumption_res["total_monthly_kwh"]
    sim_bill_res = calculate_electricity_bill(sim_total_kwh, slabs=slabs, fixed_charge=fixed_charge)
    sim_bill = sim_bill_res["total_monthly_bill"]

    # Differences & Savings
    kwh_saved = round(cur_total_kwh - sim_total_kwh, 2)
    monthly_money_saved = round(cur_bill - sim_bill, 2)
    annual_money_saved = round(monthly_money_saved * 12.0, 2)

    pct_kwh_change = round(((sim_total_kwh - cur_total_kwh) / max(1.0, cur_total_kwh)) * 100.0, 1)
    pct_bill_change = round(((sim_bill - cur_bill) / max(1.0, cur_bill)) * 100.0, 1)

    co2_reduction_kg = round(max(0.0, kwh_saved) * 0.85 * 12.0, 2)

    return {
        "title": scenario_title,
        "original_kwh": round(cur_total_kwh, 2),
        "simulated_kwh": round(sim_total_kwh, 2),
        "kwh_saved": kwh_saved,
        "original_bill": round(cur_bill, 2),
        "simulated_bill": round(sim_bill, 2),
        "monthly_money_saved": monthly_money_saved,
        "annual_money_saved": annual_money_saved,
        "co2_reduction_kg": co2_reduction_kg,
        "percentage_kwh_change": pct_kwh_change,
        "percentage_bill_change": pct_bill_change,
        "appliance_comparisons": appliance_comparisons
    }
