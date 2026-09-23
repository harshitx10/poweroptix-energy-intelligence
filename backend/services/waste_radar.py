"""
PowerOptix - Pattern-Based Energy Waste Detector
Scans active household appliances for idle standby vampire load, excessive AC runtime,
and baseline load shifts.
"""

from services.consumption_engine import calculate_total_household_consumption

def detect_energy_waste(appliances: list, total_monthly_kwh: float, effective_rate: float = 8.5) -> dict:
    """
    Identifies pattern-based energy waste anomalies with evidence and waste cost estimates.
    """
    waste_patterns = []
    total_waste_kwh = 0.0

    if not appliances:
        return {
            "total_waste_items": 0,
            "estimated_monthly_waste_kwh": 0.0,
            "estimated_monthly_waste_cost": 0.0,
            "patterns": []
        }

    consumption_res = calculate_total_household_consumption(appliances)
    items = consumption_res["items"]

    # Pattern 1: High Standby / Vampire Load Draw
    total_standby_kwh = sum(i["standby_kwh"] for i in items)
    if total_standby_kwh > 4.0:
        waste_cost = total_standby_kwh * effective_rate
        total_waste_kwh += total_standby_kwh
        waste_patterns.append({
            "id": "waste_standby_load",
            "title": "Vampire Standby Power Draw",
            "severity": "Medium",
            "evidence": f"TVS, microwave displays, and workstation power supplies draw {total_standby_kwh} kWh/month when not in active use.",
            "estimated_waste_kwh": total_standby_kwh,
            "estimated_waste_cost": round(waste_cost, 2),
            "potential_annual_saving": round(waste_cost * 12.0, 2),
            "recommended_action": "Unplug chargers and use smart power strips with master-slave cutoffs."
        })

    # Pattern 2: Excessive Cooling Runtime (> 7 hrs/day)
    for i in items:
        cat = i["category"].lower()
        name = i["name"].lower()
        hours = i["hours_per_day"]
        power = i["rated_power_w"]

        if ("ac" in name or "air conditioner" in name or cat == "cooling") and hours > 7.0:
            excess_hours = hours - 6.0
            excess_kwh = (power * i["quantity"] * excess_hours * 30.0) / 1000.0
            waste_cost = excess_kwh * effective_rate
            total_waste_kwh += excess_kwh

            waste_patterns.append({
                "id": f"waste_excess_ac_{i['appliance_id']}",
                "title": f"Excessive AC Runtime ({hours} hrs/day)",
                "severity": "High",
                "evidence": f"{i['name']} operates {hours} hours daily, exceeding normal household cooling efficiency benchmark (6 hrs/day).",
                "estimated_waste_kwh": round(excess_kwh, 1),
                "estimated_waste_cost": round(waste_cost, 2),
                "potential_annual_saving": round(waste_cost * 12.0, 2),
                "recommended_action": "Set thermostat timer to auto-turn off during early morning sleep hours."
            })
            break

    # Pattern 3: High Wattage Lighting (Non-LED)
    for i in items:
        if i["category"].lower() == "lighting" and i["rated_power_w"] >= 40.0:
            power_diff = i["rated_power_w"] - 10.0
            w_kwh = (power_diff * i["quantity"] * i["hours_per_day"] * 30.0) / 1000.0
            w_cost = w_kwh * effective_rate
            total_waste_kwh += w_kwh

            waste_patterns.append({
                "id": f"waste_incandescent_{i['appliance_id']}",
                "title": f"Inefficient Lighting Hardware ({i['rated_power_w']}W)",
                "severity": "Medium",
                "evidence": f"Using legacy {i['rated_power_w']}W bulbs instead of 10W LED technology causes unnecessary energy dissipation as heat.",
                "estimated_waste_kwh": round(w_kwh, 1),
                "estimated_waste_cost": round(w_cost, 2),
                "potential_annual_saving": round(w_cost * 12.0, 2),
                "recommended_action": "Replace standard bulbs with high-efficiency 10W LED fixtures."
            })
            break

    total_waste_cost = total_waste_kwh * effective_rate

    return {
        "total_waste_items": len(waste_patterns),
        "estimated_monthly_waste_kwh": round(total_waste_kwh, 1),
        "estimated_monthly_waste_cost": round(total_waste_cost, 2),
        "patterns": waste_patterns
    }
