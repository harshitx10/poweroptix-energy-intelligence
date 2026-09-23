"""
PowerOptix - Peak Load Intelligence & Simultaneous Appliance Demand Optimization Engine
Detects simultaneous operation of high-power appliances and calculates peak demand reduction.
"""

from services.consumption_engine import calculate_total_household_consumption

def calculate_peak_load_analytics(appliances: list, coincidence_factor: float = 0.75) -> dict:
    """
    Calculates simultaneous peak power load (kW) and identifies peak reduction opportunities.
    Coincidence factor ~ 0.70-0.80 represents standard residential coincidence probability.
    """
    if not appliances:
        return {
            "connected_load_kw": 0.0,
            "simultaneous_peak_kw": 0.0,
            "recommended_peak_kw": 0.0,
            "peak_reduction_kw": 0.0,
            "peak_risk_status": "Low",
            "coincident_high_load_items": [],
            "recommendations": []
        }

    consumption_res = calculate_total_household_consumption(appliances)
    items = consumption_res["items"]

    # Connected Load (kW) = Sum of all rated power in kW * Quantity
    connected_load_w = sum(i["rated_power_w"] * i["quantity"] for i in items)
    connected_load_kw = connected_load_w / 1000.0

    # High power appliances (> 1000W)
    high_power_items = [i for i in items if i["rated_power_w"] >= 1000.0]
    high_power_items.sort(key=lambda x: x["rated_power_w"], reverse=True)

    # Simultaneous peak load calculation
    simultaneous_peak_kw = round(connected_load_kw * coincidence_factor, 2)

    # Peak optimization: Shift highest flexible load (e.g. Geyser or Water Pump) away from peak window
    shiftable_item = next((i for i in high_power_items if i["category"].lower() in ["heating", "misc", "laundry"]), high_power_items[0] if high_power_items else None)
    shiftable_kw = (shiftable_item["rated_power_w"] * shiftable_item["quantity"] / 1000.0) if shiftable_item else 0.0

    recommended_peak_kw = max(1.0, round(simultaneous_peak_kw - (shiftable_kw * 0.8), 2))
    peak_reduction_kw = round(simultaneous_peak_kw - recommended_peak_kw, 2)

    if simultaneous_peak_kw > 6.0:
        peak_status = "Critical (Overload Risk)"
    elif simultaneous_peak_kw > 4.0:
        peak_status = "High Demand"
    elif simultaneous_peak_kw > 2.5:
        peak_status = "Moderate Load"
    else:
        peak_status = "Balanced Demand"

    recs = []
    if shiftable_item:
        recs.append({
            "title": f"Shift {shiftable_item['name']} Away From Evening Peak",
            "evidence": f"{shiftable_item['name']} ({shiftable_item['rated_power_w']}W) adds {shiftable_kw} kW directly to simultaneous household peak load.",
            "action": "Schedule operation during off-peak afternoon (12 PM - 4 PM) or solar generation hours.",
            "impact": f"-{shiftable_kw} kW peak demand cut"
        })

    return {
        "connected_load_kw": round(connected_load_kw, 2),
        "simultaneous_peak_kw": simultaneous_peak_kw,
        "recommended_peak_kw": recommended_peak_kw,
        "peak_reduction_kw": peak_reduction_kw,
        "peak_risk_status": peak_status,
        "coincident_high_load_items": [{
            "name": h["name"],
            "power_w": h["rated_power_w"],
            "category": h["category"]
        } for h in high_power_items],
        "recommendations": recs
    }
