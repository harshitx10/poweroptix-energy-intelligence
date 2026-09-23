"""
PowerOptix - Appliance Replacement & Investment Payback Analyzer
Calculates energy savings, financial savings, simple payback period, and 5-year ROI
for replacing inefficient hardware (e.g. 100W incandescent -> 10W LED).
"""

def calculate_appliance_replacement(
    current_power_w: float,
    replacement_power_w: float,
    hours_per_day: float,
    quantity: int = 1,
    days_per_month: int = 30,
    replacement_cost_total: float = 1500.0,
    tariff_per_kwh: float = 8.5
) -> dict:
    """
    Computes exact energy, bill, payback period, and 5-year financial impact.
    Formula:
    Monthly kWh saved = ((P_old - P_new) * Q * H * D) / 1000
    Monthly saving = Monthly kWh saved * tariff_per_kwh
    Payback Period (Months) = Replacement Cost / Monthly Saving
    """
    if replacement_power_w >= current_power_w:
        return {
            "is_beneficial": False,
            "message": "Replacement power rating must be lower than current rating to yield energy savings.",
            "monthly_kwh_saved": 0.0,
            "monthly_saving": 0.0,
            "payback_period_months": 0.0
        }

    power_diff_w = current_power_w - replacement_power_w
    monthly_kwh_old = (current_power_w * quantity * hours_per_day * days_per_month) / 1000.0
    monthly_kwh_new = (replacement_power_w * quantity * hours_per_day * days_per_month) / 1000.0
    monthly_kwh_saved = monthly_kwh_old - monthly_kwh_new

    monthly_saving = monthly_kwh_saved * tariff_per_kwh
    annual_saving = monthly_saving * 12.0

    payback_months = (replacement_cost_total / max(0.01, monthly_saving))
    payback_years = payback_months / 12.0

    five_year_net_savings = (annual_saving * 5.0) - replacement_cost_total
    five_year_roi_pct = ((annual_saving * 5.0) / max(1.0, replacement_cost_total)) * 100.0

    return {
        "is_beneficial": True,
        "current_power_w": current_power_w,
        "replacement_power_w": replacement_power_w,
        "power_reduction_pct": round((power_diff_w / current_power_w) * 100.0, 1),
        "monthly_kwh_old": round(monthly_kwh_old, 2),
        "monthly_kwh_new": round(monthly_kwh_new, 2),
        "monthly_kwh_saved": round(monthly_kwh_saved, 2),
        "monthly_money_saved": round(monthly_saving, 2),
        "annual_money_saved": round(annual_saving, 2),
        "replacement_cost_total": round(replacement_cost_total, 2),
        "payback_period_months": round(payback_months, 1),
        "payback_period_years": round(payback_years, 2),
        "five_year_net_savings": round(five_year_net_savings, 2),
        "five_year_roi_pct": round(five_year_roi_pct, 1),
        "formula_explanation": f"Payback Period ({round(payback_months, 1)} mos) = Replacement Cost (₹{replacement_cost_total}) / Monthly Saving (₹{round(monthly_saving, 2)})"
    }
