from typing import Dict, Any, List
from sqlalchemy.orm import Session
import models
from services.tariff_engine import get_active_tariff_data, calculate_electricity_bill
from services.consumption_engine import calculate_appliance_monthly_kwh

# Default Time-of-Use Rate Windows (Peak: 6 PM-10 PM @ 1.4x, Shoulder: 6 AM-6 PM @ 1.0x, Off-Peak: 10 PM-6 AM @ 0.7x)
TOU_WINDOWS = [
    {"name": "Off-Peak Night", "start": 22, "end": 6, "rate_multiplier": 0.7, "label": "Lowest Cost Window (10 PM – 6 AM)"},
    {"name": "Daytime Shoulder", "start": 6, "end": 18, "rate_multiplier": 1.0, "label": "Standard Rate Window (6 AM – 6 PM)"},
    {"name": "Evening Peak", "start": 18, "end": 22, "rate_multiplier": 1.4, "label": "Peak Rate Window (6 PM – 10 PM)"}
]

def get_smart_scheduler_recommendations(db: Session) -> Dict[str, Any]:
    appliances = db.query(models.Appliance).all()
    slabs, fixed_charge, currency = get_active_tariff_data(db)

    # Base rate estimation
    avg_rate = 8.5  # INR/kWh effective estimate

    scheduled_items = []
    total_potential_monthly_saving = 0.0

    # Flexible appliances suitable for time-of-day shifting
    flexible_categories = ["laundry", "heating", "kitchen", "cooling", "misc"]

    for app in appliances:
        cat_lower = app.category.lower()
        name_lower = app.name.lower()
        
        # Check if appliance is flexible
        is_shiftable = any(c in cat_lower for c in flexible_categories) or "ac" in name_lower or "washing" in name_lower or "geyser" in name_lower or "cooler" in name_lower or "ev" in name_lower

        if is_shiftable and app.hours_per_day > 0:
            # Determine current operating window heuristic
            if "ac" in name_lower or "cooler" in name_lower:
                current_window = "14:00 – 20:00 (Peak Evening Demand)"
                recommended_window = "22:00 – 04:00 (Off-Peak Night Window)"
                reason = "Shifting cooling to night off-peak reduces thermal load and avoids peak tariff rates."
            elif "washing" in name_lower or "laundry" in name_lower:
                current_window = "19:00 – 20:00 (Evening Peak Window)"
                recommended_window = "23:00 – 00:00 (Off-Peak Night Window)"
                reason = "Washing machines have high motor load. Running during night off-peak window lowers unit cost by 30%."
            elif "geyser" in name_lower or "water heater" in name_lower:
                current_window = "07:00 – 08:00 (Morning Peak Demand)"
                recommended_window = "05:00 – 06:00 (Early Morning Pre-Peak)"
                reason = "Pre-heating water before morning peak hours reduces coincident demand."
            elif "microwave" in name_lower or "oven" in name_lower:
                current_window = "20:00 – 20:30 (Dinner Peak)"
                recommended_window = "17:30 – 18:00 (Early Evening)"
                reason = "Avoiding peak grid overload period (6 PM – 10 PM)."
            else:
                current_window = "18:00 – 22:00 (Peak Window)"
                recommended_window = "11:00 – 15:00 (Solar Daytime Window)"
                reason = "Aligning appliance usage with daytime solar/standard generation."

            monthly_kwh = calculate_appliance_monthly_kwh(app.rated_power_w, app.quantity, app.hours_per_day, app.days_per_month, app.standby_power_w)
            current_cost = round(monthly_kwh * avg_rate * 1.3, 2)
            recommended_cost = round(monthly_kwh * avg_rate * 0.8, 2)
            monthly_saving = round(current_cost - recommended_cost, 2)
            total_potential_monthly_saving += monthly_saving

            scheduled_items.append({
                "appliance_id": app.id,
                "name": app.name,
                "category": app.category,
                "rated_power_w": app.rated_power_w,
                "quantity": app.quantity,
                "hours_per_day": app.hours_per_day,
                "monthly_kwh": monthly_kwh,
                "current_operating_window": current_window,
                "recommended_operating_window": recommended_window,
                "current_monthly_cost": current_cost,
                "recommended_monthly_cost": recommended_cost,
                "monthly_saving": monthly_saving,
                "annual_saving": round(monthly_saving * 12.0, 2),
                "reason": reason
            })

    # Sort scheduler recommendations by monthly saving
    scheduled_items = sorted(scheduled_items, key=lambda x: x["monthly_saving"], reverse=True)

    return {
        "tou_windows": TOU_WINDOWS,
        "total_scheduled_appliances": len(scheduled_items),
        "total_potential_monthly_saving": round(total_potential_monthly_saving, 2),
        "total_potential_annual_saving": round(total_potential_monthly_saving * 12.0, 2),
        "schedule_recommendations": scheduled_items,
        "currency": currency
    }
