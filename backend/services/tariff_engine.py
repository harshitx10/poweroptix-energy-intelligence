"""
PowerOptix - Electricity Tariff & Cost Engine
Dynamic slab rate calculation and cost estimation engine.
Supports configurable tariff slabs and fixed charges.
"""

DEFAULT_SLABS = [
    {"id": 1, "min_units": 0, "max_units": 100, "rate_per_unit": 4.0, "slab_order": 1, "description": "0 - 100 Units (Lifeline Slab)"},
    {"id": 2, "min_units": 100, "max_units": 200, "rate_per_unit": 6.0, "slab_order": 2, "description": "101 - 200 Units (Standard Slab)"},
    {"id": 3, "min_units": 200, "max_units": 300, "rate_per_unit": 8.0, "slab_order": 3, "description": "201 - 300 Units (High Slab)"},
    {"id": 4, "min_units": 300, "max_units": None, "rate_per_unit": 10.0, "slab_order": 4, "description": "301+ Units (Peak Slab)"},
]

DEFAULT_FIXED_CHARGE = 150.0
DEFAULT_CURRENCY = "₹"

def calculate_electricity_bill(
    total_kwh: float,
    slabs: list = None,
    fixed_charge: float = DEFAULT_FIXED_CHARGE,
    currency: str = DEFAULT_CURRENCY
) -> dict:
    """
    Calculates electricity bill based on progressive slab rates.
    """
    if slabs is None or len(slabs) == 0:
        slabs = DEFAULT_SLABS

    # Sort slabs by slab_order or min_units
    sorted_slabs = sorted(slabs, key=lambda s: getattr(s, "slab_order", s.get("slab_order", 0)) if isinstance(s, dict) else s.slab_order)

    remaining_units = max(0.0, float(total_kwh))
    energy_charge = 0.0
    slab_breakdown = []

    for slab in sorted_slabs:
        min_u = float(getattr(slab, "min_units", slab.get("min_units", 0))) if isinstance(slab, dict) else float(slab.min_units)
        max_u = getattr(slab, "max_units", slab.get("max_units", None)) if isinstance(slab, dict) else slab.max_units
        rate = float(getattr(slab, "rate_per_unit", slab.get("rate_per_unit", 0))) if isinstance(slab, dict) else float(slab.rate_per_unit)
        desc = getattr(slab, "description", slab.get("description", "")) if isinstance(slab, dict) else (slab.description or "")

        if remaining_units <= 0:
            units_in_slab = 0.0
        else:
            if max_u is not None:
                max_u = float(max_u)
                capacity = max_u - min_u
                units_in_slab = min(remaining_units, capacity)
            else:
                units_in_slab = remaining_units

        cost_for_slab = units_in_slab * rate
        energy_charge += cost_for_slab

        slab_label = f"{int(min_u)}-{int(max_u) if max_u is not None else '+'}"
        slab_breakdown.append({
            "slab_range": slab_label,
            "units_in_slab": round(units_in_slab, 2),
            "rate_per_unit": round(rate, 2),
            "cost": round(cost_for_slab, 2),
            "description": desc
        })

        remaining_units -= units_in_slab

    total_monthly_bill = energy_charge + fixed_charge
    total_annual_bill = total_monthly_bill * 12.0

    return {
        "total_kwh": round(total_kwh, 2),
        "energy_charge": round(energy_charge, 2),
        "fixed_charge": round(fixed_charge, 2),
        "total_monthly_bill": round(total_monthly_bill, 2),
        "total_annual_bill": round(total_annual_bill, 2),
        "currency": currency,
        "slab_breakdown": slab_breakdown
    }
