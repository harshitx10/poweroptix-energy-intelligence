"""
PowerOptix - Energy DNA Classification Engine
Analyzes household appliance metrics, category breakdowns, and consumption patterns
to assign an explainable Energy DNA profile.
"""

def classify_energy_dna(appliances: list, total_monthly_kwh: float, current_bill: float, target_budget: float = 3000.0) -> dict:
    """
    Computes household Energy DNA profile based on empirical appliance data.
    """
    if not appliances:
        return {
            "profile_name": "Balanced Consumer",
            "tagline": "Standard Household Consumption Profile",
            "icon_symbol": "🏠",
            "primary_driver": "Default baseline profile",
            "explanation": "Add appliances to analyze your unique household Energy DNA signature."
        }

    category_kwh = {}
    total_power_w = 0.0
    standby_kwh = 0.0

    for app in appliances:
        cat = getattr(app, "category", app.get("category", "General")) if isinstance(app, dict) else app.category
        p_w = float(getattr(app, "rated_power_w", app.get("rated_power_w", 0))) if isinstance(app, dict) else float(app.rated_power_w)
        qty = int(getattr(app, "quantity", app.get("quantity", 1))) if isinstance(app, dict) else int(app.quantity)
        hours = float(getattr(app, "hours_per_day", app.get("hours_per_day", 0))) if isinstance(app, dict) else float(app.hours_per_day)
        st_w = float(getattr(app, "standby_power_w", app.get("standby_power_w", 0))) if isinstance(app, dict) else float(app.standby_power_w)
        days = int(getattr(app, "days_per_month", app.get("days_per_month", 30))) if isinstance(app, dict) else int(app.days_per_month)

        kwh = (p_w * qty * hours * days) / 1000.0
        category_kwh[cat] = category_kwh.get(cat, 0.0) + kwh
        total_power_w += (p_w * qty)
        if st_w > 0:
            standby_kwh += (st_w * qty * max(0.0, 24.0 - hours) * days) / 1000.0

    cooling_kwh = category_kwh.get("Cooling", 0.0)
    cooling_pct = (cooling_kwh / max(1.0, total_monthly_kwh)) * 100.0

    # Classification logic based on empirical metrics
    if cooling_pct >= 45.0:
        profile = {
            "profile_name": "Cooling-Heavy Household",
            "tagline": "Air conditioning & space cooling dominate your monthly bill",
            "icon_symbol": "❄️",
            "primary_driver": f"Cooling accounts for {round(cooling_pct, 1)}% ({round(cooling_kwh, 1)} kWh) of total consumption.",
            "explanation": f"Your energy profile is strongly driven by refrigeration and air conditioning. Optimizing AC temperature setpoints and daily operating hours yields the highest financial savings."
        }
    elif total_monthly_kwh > 650.0:
        profile = {
            "profile_name": "High-Load Household",
            "tagline": "Heavy power demand across multiple high-wattage appliances",
            "icon_symbol": "⚡",
            "primary_driver": f"Connected power load is {round(total_power_w, 0)}W producing {round(total_monthly_kwh, 1)} kWh/month.",
            "explanation": "High baseline energy intensity. Linear programming usage allocation and peak-shifting provide maximum cost reduction opportunity."
        }
    elif current_bill <= target_budget and total_monthly_kwh <= 350.0:
        profile = {
            "profile_name": "Efficiency-Focused Consumer",
            "tagline": "Lean electricity consumption profile with disciplined energy habits",
            "icon_symbol": "🌱",
            "primary_driver": f"Monthly consumption ({round(total_monthly_kwh, 1)} kWh) remains well within efficiency benchmark.",
            "explanation": "Your household exhibits minimal waste and stays comfortably within budget limits. Incremental savings can be achieved through LED upgrades and standby power elimination."
        }
    elif current_bill > target_budget:
        profile = {
            "profile_name": "Budget-Conscious Consumer",
            "tagline": "Active target budget tracking with overage alerts",
            "icon_symbol": "💰",
            "primary_driver": f"Estimated bill (₹{round(current_bill, 0)}) exceeds target limit (₹{round(target_budget, 0)}).",
            "explanation": "You are focused on controlling monthly expenses. PowerOptix Budget Guardian identifies exact hourly reductions needed to meet your ₹3,000 target budget."
        }
    else:
        profile = {
            "profile_name": "Balanced Consumer",
            "tagline": "Evenly distributed energy load across household appliance categories",
            "icon_symbol": "🏠",
            "primary_driver": "No single appliance category disproportionately dominates total consumption.",
            "explanation": "Your consumption profile shows balanced usage across heating, cooling, entertainment, and kitchen appliances."
        }

    profile["category_percentages"] = {
        cat: round((kwh / max(1.0, total_monthly_kwh)) * 100.0, 1)
        for cat, kwh in category_kwh.items()
    }
    profile["standby_kwh_month"] = round(standby_kwh, 2)

    return profile
