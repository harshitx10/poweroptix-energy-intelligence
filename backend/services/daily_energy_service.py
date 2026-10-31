import math
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
import models
from services.consumption_engine import calculate_total_household_consumption
from services.tariff_engine import calculate_electricity_bill, DEFAULT_FIXED_CHARGE
from optimizer.energy_optimizer import optimize_appliance_usage
from ml.forecaster import train_ridge_forecaster

def get_active_tariff_data(db: Session):
    config = db.query(models.TariffConfig).first()
    slabs = db.query(models.TariffSlab).order_by(models.TariffSlab.slab_order.asc()).all()
    fixed_charge = config.fixed_charge if config else DEFAULT_FIXED_CHARGE
    currency = config.currency_symbol if config else "₹"
    return slabs, fixed_charge, currency

def get_daily_energy_intelligence(db: Session, billing_period_days: int = 30) -> Dict[str, Any]:
    appliances = db.query(models.Appliance).all()
    slabs, fixed_charge, currency = get_active_tariff_data(db)

    # 1. Monthly Baseline Calculations
    consumption_res = calculate_total_household_consumption(appliances)
    monthly_kwh = consumption_res["total_monthly_kwh"]
    bill_res = calculate_electricity_bill(monthly_kwh, slabs=slabs, fixed_charge=fixed_charge, currency=currency)
    monthly_bill = bill_res["total_monthly_bill"]
    effective_rate = bill_res["energy_charge"] / max(1.0, monthly_kwh)

    # 2. Average Daily Metrics across the billing period
    # Average Daily Consumption = Monthly Baseline kWh / Billing Period Days
    avg_daily_kwh = round(monthly_kwh / max(1, billing_period_days), 2)
    # Average Daily Cost = Monthly Tariff Bill / Billing Period Days
    avg_daily_cost = round(monthly_bill / max(1, billing_period_days), 2)

    # 3. Today's Estimated Consumption based on active appliance daily operating profiles
    # Today's active appliance load calculates operating hours per day for active inventory.
    today_kwh = 0.0
    appliance_daily_breakdown = []
    
    for app in appliances:
        is_active = getattr(app, "is_active", True)
        if not is_active:
            continue
        
        name = getattr(app, "name", "Unknown")
        category = getattr(app, "category", "General")
        p_w = float(getattr(app, "rated_power_w", 0))
        qty = int(getattr(app, "quantity", 1))
        h_day = float(getattr(app, "hours_per_day", 0))
        standby_w = float(getattr(app, "standby_power_w", 0.0))
        app_id = getattr(app, "id", None)

        # Active & standby kWh for today's operating cycle
        active_kwh_today = (p_w * qty * h_day) / 1000.0
        non_op_h = max(0.0, 24.0 - h_day)
        standby_kwh_today = (standby_w * qty * non_op_h) / 1000.0 if standby_w > 0 else 0.0
        app_today_kwh = round(active_kwh_today + standby_kwh_today, 3)
        
        app_cost_today = round(app_today_kwh * effective_rate, 2)
        today_kwh += app_today_kwh

        appliance_daily_breakdown.append({
            "appliance_id": app_id,
            "name": name,
            "category": category,
            "daily_kwh": round(app_today_kwh, 2),
            "daily_cost": app_cost_today,
            "percentage_daily": 0.0
        })

    today_kwh = round(today_kwh, 2)
    for b in appliance_daily_breakdown:
        b["percentage_daily"] = round((b["daily_kwh"] / max(0.1, today_kwh)) * 100.0, 1)

    # 4. Today's Estimated Cost using Today's Consumption evaluated via Tariff Slabs Engine
    today_bill_res = calculate_electricity_bill(today_kwh * billing_period_days, slabs=slabs, fixed_charge=fixed_charge, currency=currency)
    today_estimated_cost = round(today_bill_res["total_monthly_bill"] / max(1, billing_period_days), 2)

    # 5. Today vs Average Comparison (Difference & Percentage)
    today_vs_avg_diff = round(today_estimated_cost - avg_daily_cost, 2)
    today_vs_avg_pct = round(((today_estimated_cost - avg_daily_cost) / max(0.01, avg_daily_cost)) * 100.0, 2)

    # 6. Status Classification based on actual difference
    if today_vs_avg_pct > 10.0:
        daily_status = "HIGH"
        daily_status_label = f"Above Daily Average (+{today_vs_avg_pct}% High Load)"
    elif today_vs_avg_pct < -10.0:
        daily_status = "LOW"
        daily_status_label = f"Below Daily Average ({today_vs_avg_pct}% Energy Saved)"
    else:
        daily_status = "NORMAL"
        daily_status_label = "Normal Daily Usage Pattern"

    # 7. Projected Monthly Bill (Month-to-date actual + ML Ridge Forecaster for remaining days)
    today = datetime.now()
    current_day_of_month = today.day
    elapsed_days = max(1, current_day_of_month)
    remaining_days = max(0, billing_period_days - elapsed_days)

    fc_kwh_remaining_rate = avg_daily_kwh
    try:
        fc_res = train_ridge_forecaster(current_baseline_kwh=monthly_kwh)
        if fc_res and fc_res.get("forecast_months"):
            fc_kwh_monthly = fc_res["forecast_months"][0]["predicted_kwh"]
            fc_kwh_remaining_rate = fc_kwh_monthly / billing_period_days
    except Exception:
        pass

    projected_monthly_kwh = (elapsed_days * today_kwh) + (remaining_days * fc_kwh_remaining_rate)
    projected_bill_res = calculate_electricity_bill(projected_monthly_kwh, slabs=slabs, fixed_charge=fixed_charge, currency=currency)
    projected_monthly_bill = round(projected_bill_res["total_monthly_bill"], 2)

    # 8. LP Optimizer Potential Daily Savings
    opt_res = optimize_appliance_usage(appliances, target_budget=None, slabs=slabs, fixed_charge=fixed_charge)
    opt_monthly_kwh = opt_res["optimized_total_kwh"]
    opt_monthly_bill = opt_res["optimized_monthly_bill"]
    
    potential_daily_kwh_saved = round(max(0.0, monthly_kwh - opt_monthly_kwh) / billing_period_days, 2)
    potential_daily_saving = round(max(0.0, monthly_bill - opt_monthly_bill) / billing_period_days, 2)
    potential_monthly_saving = opt_res["monthly_money_saved"]
    potential_annual_saving = opt_res["annual_money_saved"]

    # 9. 7-Day Daily Trend Data based on day-of-week load variations
    daily_trend_data = []
    dow_multipliers = [0.95, 0.98, 1.00, 0.97, 1.04, 1.12, 1.08]
    
    for i in range(6, -1, -1):
        dt = today - timedelta(days=i)
        dow_idx = dt.weekday()
        mult = dow_multipliers[dow_idx]
        d_kwh = round(today_kwh * mult, 2)
        d_bill = calculate_electricity_bill(d_kwh * billing_period_days, slabs=slabs, fixed_charge=fixed_charge, currency=currency)
        d_cost = round(d_bill["total_monthly_bill"] / billing_period_days, 2)
        daily_trend_data.append({
            "date": dt.strftime("%Y-%m-%d"),
            "day_name": dt.strftime("%a"),
            "daily_kwh": d_kwh,
            "daily_cost": d_cost,
            "is_today": (i == 0)
        })

    # Sort top daily consumers
    top_daily_consumers = sorted(appliance_daily_breakdown, key=lambda x: x["daily_kwh"], reverse=True)[:5]

    return {
        "date": today.strftime("%Y-%m-%d"),
        "billing_period_days": billing_period_days,
        "monthly_consumption_kwh": monthly_kwh,
        "monthly_bill": monthly_bill,
        "average_daily_consumption_kwh": avg_daily_kwh,
        "average_daily_cost": avg_daily_cost,
        "today_consumption_kwh": today_kwh,
        "today_estimated_cost": today_estimated_cost,
        "projected_monthly_bill": projected_monthly_bill,
        "today_vs_avg_diff": today_vs_avg_diff,
        "today_vs_avg_pct": today_vs_avg_pct,
        "daily_status": daily_status,
        "daily_status_label": daily_status_label,
        "potential_daily_kwh_saved": potential_daily_kwh_saved,
        "potential_daily_saving": potential_daily_saving,
        "potential_monthly_saving": potential_monthly_saving,
        "potential_annual_saving": potential_annual_saving,
        "top_daily_consumers": top_daily_consumers,
        "appliance_daily_breakdown": appliance_daily_breakdown,
        "daily_trend_data": daily_trend_data,
        "currency": currency
    }
