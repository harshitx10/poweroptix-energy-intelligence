"""
PowerOptix - Smart Recommendation Engine
Generates data-driven, explainable energy saving recommendations
derived strictly from active appliance calculations, bill data, and optimizer outputs.
"""

from services.consumption_engine import calculate_total_household_consumption, calculate_appliance_monthly_kwh
from services.tariff_engine import calculate_electricity_bill, DEFAULT_FIXED_CHARGE

def generate_smart_recommendations(
    appliances: list,
    target_budget: float = 3000.0,
    forecast_data: dict = None,
    slabs: list = None,
    fixed_charge: float = DEFAULT_FIXED_CHARGE
) -> dict:
    """
    Generates dynamic, rule-based & data-driven actionable energy recommendations.
    """
    recommendations = []
    
    if not appliances:
        return {
            "total_recommendations": 0,
            "potential_total_monthly_saving": 0.0,
            "recommendations": []
        }

    consumption_res = calculate_total_household_consumption(appliances)
    total_kwh = consumption_res["total_monthly_kwh"]
    bill_res = calculate_electricity_bill(total_kwh, slabs=slabs, fixed_charge=fixed_charge)
    current_bill = bill_res["total_monthly_bill"]
    effective_rate = bill_res["energy_charge"] / max(1.0, total_kwh)

    items = consumption_res["items"]
    # Sort items by kWh contribution
    sorted_items = sorted(items, key=lambda x: x["total_kwh"], reverse=True)

    potential_monthly_saving = 0.0

    # Recommendation 1: Highest consuming appliance focus
    if sorted_items:
        top = sorted_items[0]
        top_pct = round((top["total_kwh"] / max(1.0, total_kwh)) * 100.0, 1)
        if top_pct >= 30.0:
            # Calculate savings from 1 hour daily reduction
            power_w = top["rated_power_w"]
            qty = top["quantity"]
            saved_kwh = (power_w * qty * 1.0 * 30.0) / 1000.0
            saved_money = saved_kwh * effective_rate
            potential_monthly_saving += saved_money

            recommendations.append({
                "id": "rec_top_consumer",
                "title": f"High Consumption Alert: {top['name']} ({top_pct}% of total bill)",
                "category": "Optimization",
                "severity": "High" if top_pct > 50 else "Medium",
                "description": f"{top['name']} is responsible for {top_pct}% ({top['total_kwh']} kWh/month) of your total electricity consumption.",
                "impact_kwh_month": round(saved_kwh, 1),
                "impact_cost_month": round(saved_money, 2),
                "actionable_tip": f"Reducing {top['name']} usage by just 1 hour/day can save approximately {round(saved_kwh, 1)} kWh/month (₹{round(saved_money, 2)}/month)."
            })

    # Recommendation 2: Budget Overrun Warning
    if target_budget and current_bill > target_budget:
        over_amt = current_bill - target_budget
        over_kwh = over_amt / max(1.0, effective_rate)
        recommendations.append({
            "id": "rec_budget_overrun",
            "title": f"Monthly Budget Exceeded by ₹{round(over_amt, 2)}",
            "category": "Budget",
            "severity": "High",
            "description": f"Your current estimated bill of ₹{round(current_bill, 2)} exceeds your monthly target budget of ₹{round(target_budget, 2)}.",
            "impact_kwh_month": round(over_kwh, 1),
            "impact_cost_month": round(over_amt, 2),
            "actionable_tip": f"Run the Mathematical Optimizer to auto-allocate usage hours and bring your bill within ₹{round(target_budget, 2)}."
        })

    # Recommendation 3: Incandescent / High-Wattage Lighting Replacement
    for item in items:
        cat = item["category"].lower()
        name = item["name"].lower()
        power = item["rated_power_w"]
        qty = item["quantity"]
        hours = item["hours_per_day"]

        if ("light" in name or "bulb" in name or cat == "lighting") and power >= 40.0:
            # Savings by swapping to 10W LED
            led_power = 10.0
            saved_kwh = ((power - led_power) * qty * hours * 30.0) / 1000.0
            saved_money = saved_kwh * effective_rate
            potential_monthly_saving += saved_money

            recommendations.append({
                "id": f"rec_led_upgrade_{item['appliance_id']}",
                "title": f"Upgrade {item['name']} to Energy Efficient LEDs",
                "category": "Efficiency",
                "severity": "Medium",
                "description": f"Your current lighting setup uses {power}W bulbs. Upgrading to 10W LED bulbs will cut lighting power by {int(((power - 10)/power)*100)}%.",
                "impact_kwh_month": round(saved_kwh, 1),
                "impact_cost_month": round(saved_money, 2),
                "actionable_tip": f"Replace {qty}x {power}W bulbs with 10W LEDs to save ₹{round(saved_money, 2)} every month effortlessly."
            })
            break

    # Recommendation 4: Standby Load Reduction
    total_standby_kwh = sum(item["standby_kwh"] for item in items)
    if total_standby_kwh > 5.0:
        standby_cost = total_standby_kwh * effective_rate
        potential_monthly_saving += standby_cost

        recommendations.append({
            "id": "rec_standby_vampire",
            "title": "Eliminate Vampire Standby Power Draw",
            "category": "Maintenance",
            "severity": "Low",
            "description": f"Your appliances draw {round(total_standby_kwh, 1)} kWh/month in idle standby mode when not actively running.",
            "impact_kwh_month": round(total_standby_kwh, 1),
            "impact_cost_month": round(standby_cost, 2),
            "actionable_tip": f"Use smart power strips or unplug televisions, microwave displays, and chargers when not in use to save ₹{round(standby_cost, 2)}/month."
        })

    # Recommendation 5: ML Forecast Trend Insight
    if forecast_data and "forecast_months" in forecast_data:
        fc = forecast_data["forecast_months"]
        if len(fc) >= 2:
            next_1 = fc[0]["predicted_kwh"]
            next_3 = fc[2]["predicted_kwh"]
            if next_3 > next_1:
                diff_kwh = next_3 - next_1
                diff_cost = diff_kwh * effective_rate
                recommendations.append({
                    "id": "rec_forecast_trend",
                    "title": "Upcoming Seasonal Peak Demand Forecasted",
                    "category": "Forecast",
                    "severity": "Medium",
                    "description": f"ML model predicts consumption will increase from {next_1} kWh in {fc[0]['month_name']} to {next_3} kWh in {fc[2]['month_name']}.",
                    "impact_kwh_month": round(diff_kwh, 1),
                    "impact_cost_month": round(diff_cost, 2),
                    "actionable_tip": f"Prepare for summer/winter seasonal demand spikes by optimizing cooling/heating hours early."
                })

    return {
        "total_recommendations": len(recommendations),
        "potential_total_monthly_saving": round(potential_monthly_saving, 2),
        "recommendations": recommendations
    }
