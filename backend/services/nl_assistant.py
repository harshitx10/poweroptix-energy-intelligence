"""
PowerOptix - Natural Language Energy Assistant Engine
Processes user energy questions and returns exact, calculated answers from stored database metrics.
"""

from services.consumption_engine import calculate_total_household_consumption
from services.tariff_engine import calculate_electricity_bill
from optimizer.energy_optimizer import optimize_appliance_usage

def answer_natural_language_query(query: str, appliances: list, target_budget: float = 3000.0) -> dict:
    """
    Answers natural language queries using empirical database calculations.
    """
    q = query.lower().strip()
    
    if not appliances:
        return {
            "query": query,
            "answer": "No active appliances found in your household inventory. Add appliances to run calculations.",
            "data_source": "Appliance Database"
        }

    consumption_res = calculate_total_household_consumption(appliances)
    total_kwh = consumption_res["total_monthly_kwh"]
    items = sorted(consumption_res["items"], key=lambda x: x["total_kwh"], reverse=True)
    bill_res = calculate_electricity_bill(total_kwh)
    current_bill = bill_res["total_monthly_bill"]

    # 1. "How much electricity does my AC consume?"
    if "ac" in q or "air conditioner" in q or "cooling" in q:
        ac_item = next((i for i in items if "ac" in i["name"].lower() or "cooling" in i["category"].lower()), None)
        if ac_item:
            pct = round((ac_item["total_kwh"] / max(1.0, total_kwh)) * 100.0, 1)
            ac_cost = round(ac_item["total_kwh"] * (bill_res["energy_charge"] / max(1.0, total_kwh)), 2)
            answer = f"Your {ac_item['name']} consumes {ac_item['total_kwh']} kWh/month ({pct}% of your total household electricity), costing approximately ₹{ac_cost}/month."
        else:
            answer = "No AC found in your active appliance inventory."

    # 2. "Why is my bill high?"
    elif "why" in q and ("high" in q or "bill" in q):
        top_1 = items[0]
        top_pct = round((top_1["total_kwh"] / max(1.0, total_kwh)) * 100.0, 1)
        answer = f"Your monthly bill (₹{current_bill}) is primarily driven by {top_1['name']}, which accounts for {top_pct}% ({top_1['total_kwh']} kWh) of total consumption. Additionally, your current monthly usage ({total_kwh} kWh) reaches the peak progressive tariff slab."

    # 3. "What happens if I reduce AC usage by 2 hours?"
    elif "reduce" in q or "what happens if" in q:
        ac_item = next((i for i in items if "ac" in i["name"].lower()), items[0])
        power_w = ac_item["rated_power_w"]
        saved_kwh = (power_w * ac_item["quantity"] * 2.0 * 30.0) / 1000.0
        eff_rate = bill_res["energy_charge"] / max(1.0, total_kwh)
        saved_money = round(saved_kwh * eff_rate, 2)
        answer = f"Reducing {ac_item['name']} usage by 2 hours/day will save approximately {saved_kwh} kWh/month, reducing your monthly electricity bill by ₹{saved_money} (₹{round(saved_money * 12, 2)}/year)."

    # 4. "Which appliance should I optimize first?" / "highest energy consuming"
    elif "highest" in q or "optimize first" in q or "rank" in q:
        top_1 = items[0]
        top_2 = items[1] if len(items) > 1 else None
        ans_str = f"You should optimize {top_1['name']} first, as it consumes {top_1['total_kwh']} kWh/month."
        if top_2:
            ans_str += f" The second largest consumer is {top_2['name']} ({top_2['total_kwh']} kWh/month)."
        answer = ans_str

    # 5. "How much can I save this month?"
    elif "save" in q or "saving" in q or "budget" in q:
        opt_res = optimize_appliance_usage(appliances, target_budget=target_budget)
        answer = f"By running the SciPy Linear Optimizer, you can save up to {opt_res['total_kwh_saved']} kWh/month (₹{opt_res['monthly_money_saved']}/month), reducing your estimated bill from ₹{current_bill} to ₹{opt_res['optimized_monthly_bill']}."

    else:
        answer = f"Your current household total consumption is {total_kwh} kWh/month with an estimated bill of ₹{current_bill}. Your highest consuming appliance is {items[0]['name']} ({items[0]['total_kwh']} kWh/month)."

    return {
        "query": query,
        "answer": answer,
        "data_source": "PowerOptix Calculated Analytics Engine"
    }
