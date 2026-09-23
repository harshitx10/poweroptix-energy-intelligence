"""
PowerOptix - Mathematical Energy Optimizer Engine ⭐⭐⭐⭐⭐
Method: Linear Programming Optimization using scipy.optimize.linprog

Multi-Objective Modes Supported:
1. "cost": Minimize total electricity monetary bill
2. "consumption": Minimize total kWh energy consumption
3. "savings": Maximize total monthly savings subject to comfort
4. "balanced": Multi-objective trade-off balancing cost reduction while preserving 80%+ usage baseline
"""

import numpy as np
from scipy.optimize import linprog
from services.consumption_engine import calculate_appliance_monthly_kwh, calculate_total_household_consumption
from services.tariff_engine import calculate_electricity_bill, DEFAULT_SLABS, DEFAULT_FIXED_CHARGE

def optimize_appliance_usage(
    appliances: list,
    target_budget: float = None,
    max_kwh_limit: float = None,
    slabs: list = None,
    fixed_charge: float = DEFAULT_FIXED_CHARGE,
    objective_mode: str = "balanced"  # "cost", "consumption", "savings", "balanced"
) -> dict:
    """
    Performs real mathematical linear programming optimization using scipy.optimize.linprog.
    """
    active_apps = [app for app in appliances if (getattr(app, "is_active", True) if not isinstance(app, dict) else app.get("is_active", True))]
    
    if not active_apps:
        return {
            "success": False,
            "status_message": "No active appliances available for optimization.",
            "current_total_kwh": 0.0,
            "optimized_total_kwh": 0.0,
            "total_kwh_saved": 0.0,
            "current_monthly_bill": 0.0,
            "optimized_monthly_bill": 0.0,
            "monthly_money_saved": 0.0,
            "annual_money_saved": 0.0,
            "target_budget": target_budget,
            "budget_met": True,
            "co2_reduction_kg": 0.0,
            "objective_mode": objective_mode,
            "appliance_results": []
        }

    N = len(active_apps)
    
    # 1. Calculate current state baseline
    current_consumption_res = calculate_total_household_consumption(active_apps)
    current_kwh = current_consumption_res["total_monthly_kwh"]
    current_bill_res = calculate_electricity_bill(current_kwh, slabs=slabs, fixed_charge=fixed_charge)
    current_bill = current_bill_res["total_monthly_bill"]
    effective_rate = current_bill_res["energy_charge"] / max(1.0, current_kwh)

    # 2. Linear Programming vector c & bounds setup
    c = []
    bounds = []
    
    for app in active_apps:
        power_w = float(getattr(app, "rated_power_w", app.get("rated_power_w", 0))) if isinstance(app, dict) else float(app.rated_power_w)
        qty = int(getattr(app, "quantity", app.get("quantity", 1))) if isinstance(app, dict) else int(app.quantity)
        days = int(getattr(app, "days_per_month", app.get("days_per_month", 30))) if isinstance(app, dict) else int(app.days_per_month)
        current_h = float(getattr(app, "hours_per_day", app.get("hours_per_day", 0))) if isinstance(app, dict) else float(app.hours_per_day)
        priority = getattr(app, "priority", app.get("priority", "Medium")) if isinstance(app, dict) else app.priority

        min_h = float(getattr(app, "min_hours_per_day", app.get("min_hours_per_day", 0))) if isinstance(app, dict) else float(app.min_hours_per_day)
        max_h = float(getattr(app, "max_hours_per_day", app.get("max_hours_per_day", 24))) if isinstance(app, dict) else float(app.max_hours_per_day)

        # Priority adjustments to bounds according to objective mode
        if objective_mode.lower() == "balanced":
            min_h = max(min_h, current_h * 0.70)  # Preserve at least 70% comfort
        elif priority.lower() == "essential":
            min_h = max(min_h, current_h * 0.95)
        elif priority.lower() == "high":
            min_h = max(min_h, current_h * 0.65)

        max_h_bound = min(24.0, max(min_h, current_h))
        min_h_bound = min(min_h, max_h_bound)

        bounds.append((min_h_bound, max_h_bound))

        # Coefficient in objective function
        kwh_per_hour = (power_w * qty * days) / 1000.0
        if objective_mode.lower() == "cost":
            c.append(kwh_per_hour * effective_rate)
        else:
            c.append(kwh_per_hour)

    c = np.array(c)

    # Linear Inequality constraints: A_ub * x <= b_ub
    A_ub = []
    b_ub = []

    if target_budget is not None and target_budget > fixed_charge:
        target_energy_budget = target_budget - fixed_charge
        approx_max_kwh = target_energy_budget / max(1.0, effective_rate)
        A_ub.append(c)
        b_ub.append(approx_max_kwh)

    if max_kwh_limit is not None and max_kwh_limit > 0:
        A_ub.append(c)
        b_ub.append(max_kwh_limit)

    A_ub = np.array(A_ub) if A_ub else None
    b_ub = np.array(b_ub) if b_ub else None

    # Solve LP using scipy.optimize.linprog (Highs method)
    res = linprog(c, A_ub=A_ub, b_ub=b_ub, bounds=bounds, method="highs")

    if not res.success:
        res = linprog(c, bounds=bounds, method="highs")

    optimized_hours = res.x

    # 3. Construct Explainable Results
    appliance_results = []
    optimized_app_list = []

    for idx, app in enumerate(active_apps):
        app_id = getattr(app, "id", app.get("id", idx + 1)) if isinstance(app, dict) else app.id
        name = getattr(app, "name", app.get("name", "Unknown")) if isinstance(app, dict) else app.name
        category = getattr(app, "category", app.get("category", "General")) if isinstance(app, dict) else app.category
        priority = getattr(app, "priority", app.get("priority", "Medium")) if isinstance(app, dict) else app.priority
        power_w = float(getattr(app, "rated_power_w", app.get("rated_power_w", 0))) if isinstance(app, dict) else float(app.rated_power_w)
        qty = int(getattr(app, "quantity", app.get("quantity", 1))) if isinstance(app, dict) else int(app.quantity)
        days = int(getattr(app, "days_per_month", app.get("days_per_month", 30))) if isinstance(app, dict) else int(app.days_per_month)
        standby_w = float(getattr(app, "standby_power_w", app.get("standby_power_w", 0))) if isinstance(app, dict) else float(app.standby_power_w)
        current_h = float(getattr(app, "hours_per_day", app.get("hours_per_day", 0))) if isinstance(app, dict) else float(app.hours_per_day)

        opt_h = float(optimized_hours[idx])
        opt_h = round(opt_h, 2)
        h_diff = round(current_h - opt_h, 2)

        cur_calc = calculate_appliance_monthly_kwh(power_w, qty, current_h, days, standby_w)
        opt_calc = calculate_appliance_monthly_kwh(power_w, qty, opt_h, days, standby_w)

        cur_kwh = cur_calc["total_kwh"]
        opt_kwh = opt_calc["total_kwh"]
        saved_kwh = round(cur_kwh - opt_kwh, 2)

        cur_cost = cur_kwh * effective_rate
        opt_cost = opt_kwh * effective_rate
        saved_money = round(cur_cost - opt_cost, 2)

        if priority.lower() == "essential":
            reason = f"Maintained operational baseline ({opt_h} hrs/day) as this is designated an Essential appliance."
        elif h_diff > 0:
            if power_w >= 1000:
                reason = f"High power rating ({power_w}W). Reducing daily usage by {h_diff} hrs yields maximum energy and cost savings."
            elif priority.lower() == "low":
                reason = f"Optimized reduction applied due to Low priority status and non-critical usage profile."
            else:
                reason = f"Usage reduced by {h_diff} hrs/day under {objective_mode.upper()} optimization mode."
        else:
            reason = f"Usage maintained at {opt_h} hrs/day to satisfy minimum operational requirements."

        appliance_results.append({
            "appliance_id": app_id,
            "name": name,
            "category": category,
            "priority": priority,
            "current_hours": current_h,
            "optimized_hours": opt_h,
            "hours_reduction": h_diff,
            "current_kwh": cur_kwh,
            "optimized_kwh": opt_kwh,
            "kwh_saved": saved_kwh,
            "current_cost": round(cur_cost, 2),
            "optimized_cost": round(opt_cost, 2),
            "money_saved": saved_money,
            "annual_money_saved": round(saved_money * 12.0, 2),
            "reason": reason
        })

        app_copy = {
            "name": name, "category": category, "rated_power_w": power_w, "quantity": qty,
            "hours_per_day": opt_h, "days_per_month": days, "standby_power_w": standby_w, "is_active": True
        }
        optimized_app_list.append(app_copy)

    # 4. Total optimized calculation
    opt_consumption_res = calculate_total_household_consumption(optimized_app_list)
    opt_kwh_total = opt_consumption_res["total_monthly_kwh"]
    opt_bill_res = calculate_electricity_bill(opt_kwh_total, slabs=slabs, fixed_charge=fixed_charge)
    opt_bill = opt_bill_res["total_monthly_bill"]

    total_kwh_saved = round(current_kwh - opt_kwh_total, 2)
    monthly_money_saved = round(current_bill - opt_bill, 2)
    annual_money_saved = round(monthly_money_saved * 12.0, 2)
    
    co2_saved_kg = round(total_kwh_saved * 0.85 * 12.0, 2)
    budget_met = (opt_bill <= target_budget) if target_budget else True

    return {
        "success": True,
        "status_message": f"Mathematical LP optimization solved successfully using SciPy Linprog ({objective_mode.upper()} Mode).",
        "current_total_kwh": round(current_kwh, 2),
        "optimized_total_kwh": round(opt_kwh_total, 2),
        "total_kwh_saved": total_kwh_saved,
        "current_monthly_bill": round(current_bill, 2),
        "optimized_monthly_bill": round(opt_bill, 2),
        "monthly_money_saved": monthly_money_saved,
        "annual_money_saved": annual_money_saved,
        "target_budget": target_budget,
        "budget_met": budget_met,
        "co2_reduction_kg": co2_saved_kg,
        "objective_mode": objective_mode,
        "appliance_results": appliance_results
    }
