"""
PowerOptix - Electricity Consumption Calculation Engine
Strict implementation of mathematical formula:
E_i = (P_i * Q_i * H_i * D_i) / 1000 (kWh/month)
E_standby_i = (P_standby_i * Q_i * (24 - H_i) * D_i) / 1000 (kWh/month)
"""

def calculate_appliance_monthly_kwh(
    rated_power_w: float,
    quantity: int,
    hours_per_day: float,
    days_per_month: int = 30,
    standby_power_w: float = 0.0
) -> dict:
    """
    Calculates active, standby, and total monthly kWh for a single appliance.
    """
    # Active energy in kWh/month
    active_kwh = (rated_power_w * quantity * hours_per_day * days_per_month) / 1000.0
    
    # Standby energy for non-operating hours in a 24-hour day
    non_operating_hours = max(0.0, 24.0 - hours_per_day)
    standby_kwh = (standby_power_w * quantity * non_operating_hours * days_per_month) / 1000.0 if standby_power_w > 0 else 0.0
    
    total_kwh = active_kwh + standby_kwh

    return {
        "active_kwh": round(active_kwh, 3),
        "standby_kwh": round(standby_kwh, 3),
        "total_kwh": round(total_kwh, 3),
        "daily_kwh": round(total_kwh / max(1, days_per_month), 3)
    }

def calculate_total_household_consumption(appliances_list: list) -> dict:
    """
    Calculates dynamic total household consumption across all active appliances.
    """
    items_breakdown = []
    total_monthly_kwh = 0.0

    for app in appliances_list:
        # Check active status if it's an object or dict
        is_active = getattr(app, "is_active", None)
        if is_active is None and isinstance(app, dict):
            is_active = app.get("is_active", True)
        if is_active is False:
            continue

        name = getattr(app, "name", app.get("name", "Unknown")) if isinstance(app, dict) else app.name
        category = getattr(app, "category", app.get("category", "General")) if isinstance(app, dict) else app.category
        rated_power_w = float(getattr(app, "rated_power_w", app.get("rated_power_w", 0))) if isinstance(app, dict) else float(app.rated_power_w)
        quantity = int(getattr(app, "quantity", app.get("quantity", 1))) if isinstance(app, dict) else int(app.quantity)
        hours_per_day = float(getattr(app, "hours_per_day", app.get("hours_per_day", 0))) if isinstance(app, dict) else float(app.hours_per_day)
        days_per_month = int(getattr(app, "days_per_month", app.get("days_per_month", 30))) if isinstance(app, dict) else int(app.days_per_month)
        standby_power_w = float(getattr(app, "standby_power_w", app.get("standby_power_w", 0.0))) if isinstance(app, dict) else float(app.standby_power_w)
        app_id = getattr(app, "id", app.get("id", None)) if isinstance(app, dict) else getattr(app, "id", None)

        calc = calculate_appliance_monthly_kwh(
            rated_power_w=rated_power_w,
            quantity=quantity,
            hours_per_day=hours_per_day,
            days_per_month=days_per_month,
            standby_power_w=standby_power_w
        )

        total_monthly_kwh += calc["total_kwh"]

        items_breakdown.append({
            "appliance_id": app_id,
            "name": name,
            "category": category,
            "rated_power_w": rated_power_w,
            "quantity": quantity,
            "hours_per_day": hours_per_day,
            "days_per_month": days_per_month,
            "standby_power_w": standby_power_w,
            "active_kwh": calc["active_kwh"],
            "standby_kwh": calc["standby_kwh"],
            "total_kwh": calc["total_kwh"]
        })

    return {
        "items": items_breakdown,
        "total_monthly_kwh": round(total_monthly_kwh, 2),
        "total_daily_kwh": round(total_monthly_kwh / 30.0, 2)
    }
