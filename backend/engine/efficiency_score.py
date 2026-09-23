"""
PowerOptix - Energy Efficiency Score Engine
Calculates proposed PowerOptix Energy Efficiency Score (0-100)
based on 6 weighted factors.
"""

def calculate_energy_efficiency_score(
    appliances: list,
    total_monthly_kwh: float,
    current_bill: float,
    target_budget: float = 3000.0,
    optimized_kwh: float = None,
    forecast_trend_pct: float = 0.0
) -> dict:
    """
    Computes dynamic PowerOptix Proposed Energy Efficiency Score (0-100).
    """
    if not appliances:
        return {
            "overall_score": 50.0,
            "rating_category": "Needs Improvement",
            "disclaimer": "PowerOptix Proposed Energy Efficiency Score (Not an official industry standard).",
            "factors": []
        }

    # Factor 1: Energy Consumption Efficiency (25%)
    # Baseline benchmark for a typical household is ~350 kWh
    benchmark_kwh = 350.0
    if total_monthly_kwh <= benchmark_kwh:
        score_1 = 95.0
    else:
        over_ratio = (total_monthly_kwh - benchmark_kwh) / benchmark_kwh
        score_1 = max(10.0, 95.0 - (over_ratio * 50.0))

    # Factor 2: Peak / High-Usage Appliance Ratio (20%)
    # Ratio of consumption by heavy power appliances (>1000W) vs total
    high_power_kwh = 0.0
    for app in appliances:
        p_w = float(getattr(app, "rated_power_w", app.get("rated_power_w", 0))) if isinstance(app, dict) else float(app.rated_power_w)
        h_d = float(getattr(app, "hours_per_day", app.get("hours_per_day", 0))) if isinstance(app, dict) else float(app.hours_per_day)
        qty = int(getattr(app, "quantity", app.get("quantity", 1))) if isinstance(app, dict) else int(app.quantity)
        if p_w >= 1000:
            high_power_kwh += (p_w * qty * h_d * 30.0) / 1000.0

    high_ratio = high_power_kwh / max(1.0, total_monthly_kwh)
    if high_ratio < 0.40:
        score_2 = 90.0
    elif high_ratio < 0.65:
        score_2 = 70.0
    else:
        score_2 = max(20.0, 90.0 - ((high_ratio - 0.40) * 120.0))

    # Factor 3: Optimization Adherence (15%)
    # Gap between current consumption and mathematically optimized consumption
    if optimized_kwh and total_monthly_kwh > 0:
        kwh_gap_pct = max(0.0, (total_monthly_kwh - optimized_kwh) / total_monthly_kwh)
        score_3 = max(20.0, 100.0 - (kwh_gap_pct * 200.0))
    else:
        score_3 = 75.0

    # Factor 4: Budget Adherence (15%)
    if target_budget and target_budget > 0:
        if current_bill <= target_budget:
            score_4 = 95.0
        else:
            budget_over_pct = (current_bill - target_budget) / target_budget
            score_4 = max(10.0, 95.0 - (budget_over_pct * 150.0))
    else:
        score_4 = 80.0

    # Factor 5: Consumption Trend (15%)
    # Increasing trend penalizes score, decreasing trend boosts score
    if forecast_trend_pct > 0:
        score_5 = max(20.0, 85.0 - (forecast_trend_pct * 3.0))
    else:
        score_5 = min(100.0, 85.0 + (abs(forecast_trend_pct) * 3.0))

    # Factor 6: Standby / Idle Consumption (10%)
    standby_kwh_total = 0.0
    for app in appliances:
        st_w = float(getattr(app, "standby_power_w", app.get("standby_power_w", 0))) if isinstance(app, dict) else float(app.standby_power_w)
        h_d = float(getattr(app, "hours_per_day", app.get("hours_per_day", 0))) if isinstance(app, dict) else float(app.hours_per_day)
        qty = int(getattr(app, "quantity", app.get("quantity", 1))) if isinstance(app, dict) else int(app.quantity)
        if st_w > 0:
            non_op = max(0.0, 24.0 - h_d)
            standby_kwh_total += (st_w * qty * non_op * 30.0) / 1000.0

    standby_ratio = standby_kwh_total / max(1.0, total_monthly_kwh)
    score_6 = max(10.0, 95.0 - (standby_ratio * 300.0))

    # Weighted Overall Score
    weights = {
        "energy_consumption": (0.25, score_1, "Energy Consumption Efficiency (25%)", "Measures total monthly usage against normal household baseline."),
        "peak_appliance_ratio": (0.20, score_2, "Peak/High-Usage Appliance Ratio (20%)", "Evaluates reliance on high-wattage heavy appliances."),
        "optimization_adherence": (0.15, score_3, "Optimization Adherence (15%)", "Measures closeness to mathematically optimal usage allocation."),
        "budget_adherence": (0.15, score_4, "Budget Adherence (15%)", "Evaluates alignment with set monthly electricity budget."),
        "consumption_trend": (0.15, score_5, "Consumption Trend (15%)", "Analyzes 3-month forward projected consumption slope."),
        "standby_idle": (0.10, score_6, "Standby/Idle Consumption (10%)", "Assesses vampire load and idle device standby power draw.")
    }

    overall_score = sum(weight * score for weight, score, _, _ in weights.values())
    overall_score = round(max(0.0, min(100.0, overall_score)), 1)

    if overall_score >= 80.0:
        rating_category = "Excellent"
    elif overall_score >= 60.0:
        rating_category = "Good"
    elif overall_score >= 40.0:
        rating_category = "Needs Improvement"
    else:
        rating_category = "Critical"

    factors_list = []
    for key, (w, s, title, desc) in weights.items():
        factors_list.append({
            "factor_name": title,
            "weight_percentage": round(w * 100, 0),
            "score": round(s, 1),
            "weighted_score": round(w * s, 1),
            "description": desc
        })

    return {
        "overall_score": overall_score,
        "rating_category": rating_category,
        "disclaimer": "PowerOptix Proposed Energy Efficiency Score (Not an official industry standard).",
        "factors": factors_list
    }
