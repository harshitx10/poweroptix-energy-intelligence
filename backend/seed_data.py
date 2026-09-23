"""
PowerOptix - Database Seeder & Demo Profile Setup
Initializes realistic sample household appliances, tariff slabs, and 36-month history.
"""

import logging
from sqlalchemy.orm import Session
import models
from ml.forecaster import generate_synthetic_historical_data

logger = logging.getLogger("poweroptix.seeder")

DEMO_APPLIANCES = [
    {
        "name": "Air Conditioner (1.5 Ton split)",
        "category": "Cooling",
        "rated_power_w": 1500.0,
        "quantity": 1,
        "hours_per_day": 6.0,
        "days_per_month": 30,
        "standby_power_w": 4.0,
        "priority": "High",
        "min_hours_per_day": 2.0,
        "max_hours_per_day": 8.0,
        "is_active": True
    },
    {
        "name": "Refrigerator (Single Door)",
        "category": "Kitchen",
        "rated_power_w": 180.0,
        "quantity": 1,
        "hours_per_day": 24.0,
        "days_per_month": 30,
        "standby_power_w": 0.0,
        "priority": "Essential",
        "min_hours_per_day": 24.0,
        "max_hours_per_day": 24.0,
        "is_active": True
    },
    {
        "name": "Smart LED TV (55 inch)",
        "category": "Entertainment",
        "rated_power_w": 120.0,
        "quantity": 1,
        "hours_per_day": 4.0,
        "days_per_month": 30,
        "standby_power_w": 5.0,
        "priority": "Medium",
        "min_hours_per_day": 1.0,
        "max_hours_per_day": 6.0,
        "is_active": True
    },
    {
        "name": "Washing Machine (Front Load)",
        "category": "Laundry",
        "rated_power_w": 500.0,
        "quantity": 1,
        "hours_per_day": 1.0,
        "days_per_month": 15,
        "standby_power_w": 2.0,
        "priority": "Medium",
        "min_hours_per_day": 0.5,
        "max_hours_per_day": 2.0,
        "is_active": True
    },
    {
        "name": "Geyser / Water Heater",
        "category": "Heating",
        "rated_power_w": 2000.0,
        "quantity": 1,
        "hours_per_day": 1.0,
        "days_per_month": 30,
        "standby_power_w": 0.0,
        "priority": "High",
        "min_hours_per_day": 0.5,
        "max_hours_per_day": 2.0,
        "is_active": True
    },
    {
        "name": "Household Lights (Standard Bulbs)",
        "category": "Lighting",
        "rated_power_w": 40.0,
        "quantity": 8,
        "hours_per_day": 5.0,
        "days_per_month": 30,
        "standby_power_w": 0.0,
        "priority": "Low",
        "min_hours_per_day": 2.0,
        "max_hours_per_day": 6.0,
        "is_active": True
    },
    {
        "name": "Ceiling Fans",
        "category": "Cooling",
        "rated_power_w": 75.0,
        "quantity": 4,
        "hours_per_day": 10.0,
        "days_per_month": 30,
        "standby_power_w": 0.0,
        "priority": "High",
        "min_hours_per_day": 4.0,
        "max_hours_per_day": 14.0,
        "is_active": True
    },
    {
        "name": "Laptop & Workstation",
        "category": "Misc",
        "rated_power_w": 65.0,
        "quantity": 1,
        "hours_per_day": 8.0,
        "days_per_month": 30,
        "standby_power_w": 2.0,
        "priority": "Medium",
        "min_hours_per_day": 4.0,
        "max_hours_per_day": 10.0,
        "is_active": True
    },
    {
        "name": "Microwave Oven",
        "category": "Kitchen",
        "rated_power_w": 1200.0,
        "quantity": 1,
        "hours_per_day": 0.5,
        "days_per_month": 30,
        "standby_power_w": 3.0,
        "priority": "Low",
        "min_hours_per_day": 0.2,
        "max_hours_per_day": 1.0,
        "is_active": True
    },
    {
        "name": "Desert Air Cooler",
        "category": "Cooling",
        "rated_power_w": 200.0,
        "quantity": 1,
        "hours_per_day": 8.0,
        "days_per_month": 30,
        "standby_power_w": 0.0,
        "priority": "Medium",
        "min_hours_per_day": 2.0,
        "max_hours_per_day": 10.0,
        "is_active": True
    }
]

DEMO_SLABS = [
    {"min_units": 0, "max_units": 100, "rate_per_unit": 4.0, "slab_order": 1, "description": "0 - 100 Units (Lifeline Slab)"},
    {"min_units": 100, "max_units": 200, "rate_per_unit": 6.0, "slab_order": 2, "description": "101 - 200 Units (Standard Slab)"},
    {"min_units": 200, "max_units": 300, "rate_per_unit": 8.0, "slab_order": 3, "description": "201 - 300 Units (High Slab)"},
    {"min_units": 300, "max_units": None, "rate_per_unit": 10.0, "slab_order": 4, "description": "301+ Units (Peak Slab)"},
]

def seed_database_if_empty(db: Session):
    # 1. Seed Tariff Config & Slabs
    if db.query(models.TariffConfig).count() == 0:
        logger.info("Seeding Tariff Config and Demo Slabs...")
        t_config = models.TariffConfig(
            fixed_charge=150.0,
            currency_symbol="₹",
            tariff_name="Standard Residential Progressive Slab Tariff (Demo Configurable)"
        )
        db.add(t_config)
        db.commit()

        for slab_data in DEMO_SLABS:
            slab = models.TariffSlab(**slab_data)
            db.add(slab)
        db.commit()

    # 2. Seed Appliances
    if db.query(models.Appliance).count() == 0:
        logger.info("Seeding Demo Household Appliances...")
        for app_data in DEMO_APPLIANCES:
            app = models.Appliance(**app_data)
            db.add(app)
        db.commit()

    # 3. Seed Energy Goal
    if db.query(models.EnergyGoal).count() == 0:
        logger.info("Seeding Energy Target Budget Goal (₹3,000)...")
        goal = models.EnergyGoal(target_budget=3000.0, target_kwh=350.0, is_active=True)
        db.add(goal)
        db.commit()

    # 4. Seed 36-Month Historical Consumption
    if db.query(models.MonthlyConsumptionHistory).count() == 0:
        logger.info("Seeding 36-Month Synthetic Historical Consumption Data for ML Forecaster...")
        hist_df = generate_synthetic_historical_data(months=36, current_avg_kwh=420.0)
        for _, row in hist_df.iterrows():
            record = models.MonthlyConsumptionHistory(
                month_year=row["month_year"],
                month_index=int(row["month_index"]),
                total_kwh=float(row["total_kwh"]),
                total_cost=float(row["total_cost"]),
                avg_temperature_c=float(row["avg_temperature_c"])
            )
            db.add(record)
        db.commit()
    logger.info("Database seeding complete!")
