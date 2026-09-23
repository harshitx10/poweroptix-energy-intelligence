"""
PowerOptix - Solar, Battery & EV Charging Optimization Engine
Simulates solar PV generation, battery storage charging/discharging balance, grid dependency,
and computes optimal EV charging windows.
"""

def simulate_solar_battery_system(
    total_monthly_kwh: float,
    current_monthly_bill: float,
    solar_capacity_kw: float = 3.0,
    battery_capacity_kwh: float = 5.0,
    battery_efficiency_pct: float = 90.0,
    grid_tariff_avg: float = 8.5
) -> dict:
    """
    Simulates Solar PV generation and Battery storage balance.
    Average solar yield factor: ~4.0 kWh per kW peak capacity per day.
    """
    daily_solar_gen = solar_capacity_kw * 4.0  # e.g., 3kW * 4h = 12 kWh/day
    monthly_solar_gen = daily_solar_gen * 30.0  # 360 kWh/month

    daily_household_demand = total_monthly_kwh / 30.0

    # Self-consumption vs Grid export simulation
    # Direct daytime solar usage ~60%, battery storage ~30%, grid export ~10%
    direct_solar_used = min(daily_household_demand * 0.5, daily_solar_gen * 0.6)
    
    # Battery storage capacity constraint
    eff = battery_efficiency_pct / 100.0
    usable_battery_kwh = min(battery_capacity_kwh, (daily_solar_gen - direct_solar_used)) * eff if battery_capacity_kwh > 0 else 0.0

    total_daily_solar_offset = direct_solar_used + usable_battery_kwh
    monthly_solar_offset_kwh = min(total_monthly_kwh, total_daily_solar_offset * 30.0)

    new_grid_kwh = max(0.0, total_monthly_kwh - monthly_solar_offset_kwh)
    new_grid_bill = new_grid_kwh * grid_tariff_avg

    monthly_bill_saving = max(0.0, current_monthly_bill - new_grid_bill)
    annual_bill_saving = monthly_bill_saving * 12.0

    # Simple System payback estimate (Assuming ~₹45,000 per kW solar + ₹30,000 battery)
    estimated_system_cost = (solar_capacity_kw * 45000.0) + (battery_capacity_kwh * 6000.0)
    payback_years = estimated_system_cost / max(1.0, annual_bill_saving)

    grid_dependency_pct = round((new_grid_kwh / max(1.0, total_monthly_kwh)) * 100.0, 1)

    return {
        "is_simulation": True,
        "label": "Smart Meter & Renewable Energy Simulation",
        "solar_capacity_kw": solar_capacity_kw,
        "battery_capacity_kwh": battery_capacity_kwh,
        "monthly_solar_generation_kwh": round(monthly_solar_gen, 1),
        "monthly_grid_offset_kwh": round(monthly_solar_offset_kwh, 1),
        "original_grid_kwh": round(total_monthly_kwh, 1),
        "new_grid_kwh": round(new_grid_kwh, 1),
        "grid_dependency_pct": grid_dependency_pct,
        "original_bill": round(current_monthly_bill, 2),
        "new_grid_bill": round(new_grid_bill, 2),
        "monthly_bill_saving": round(monthly_bill_saving, 2),
        "annual_bill_saving": round(annual_bill_saving, 2),
        "estimated_system_cost": round(estimated_system_cost, 2),
        "payback_years": round(payback_years, 1)
    }

def optimize_ev_charging(
    battery_capacity_kwh: float = 30.0,
    current_soc_pct: float = 20.0,
    target_soc_pct: float = 80.0,
    charger_power_kw: float = 3.3,
    peak_rate: float = 10.0,
    off_peak_rate: float = 5.0,
    normal_rate: float = 7.5
) -> dict:
    """
    Calculates EV energy needed and compares Immediate vs Off-Peak vs Smart Optimized charging.
    """
    needed_pct = max(0.0, target_soc_pct - current_soc_pct)
    energy_needed_kwh = (battery_capacity_kwh * needed_pct) / 100.0
    charging_hours = energy_needed_kwh / max(0.5, charger_power_kw)

    # Cost scenarios
    immediate_cost = energy_needed_kwh * peak_rate  # Assume charging right after work (Peak 6pm-10pm)
    off_peak_cost = energy_needed_kwh * off_peak_rate  # Overnight (11pm-6am)
    smart_cost = energy_needed_kwh * off_peak_rate * 0.95  # Off-peak + Solar preference

    savings_per_charge = immediate_cost - off_peak_cost
    monthly_ev_savings = savings_per_charge * 12.0  # ~12 charges/month

    return {
        "battery_capacity_kwh": battery_capacity_kwh,
        "current_soc_pct": current_soc_pct,
        "target_soc_pct": target_soc_pct,
        "energy_needed_kwh": round(energy_needed_kwh, 2),
        "charging_duration_hours": round(charging_hours, 2),
        "recommended_window": "11:00 PM – 05:00 AM (Off-Peak Night Tariff)",
        "immediate_peak_cost": round(immediate_cost, 2),
        "off_peak_cost": round(off_peak_cost, 2),
        "smart_cost": round(smart_cost, 2),
        "cost_saving_per_charge": round(savings_per_charge, 2),
        "estimated_monthly_ev_saving": round(monthly_ev_savings, 2),
        "annual_ev_saving": round(monthly_ev_savings * 12.0, 2)
    }
