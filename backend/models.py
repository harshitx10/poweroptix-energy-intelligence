"""
PowerOptix - Database ORM Models
Defines normalized database schemas for MySQL primary database and SQLite fallback.
Includes relationships, foreign keys, indexes, and timestamps.
"""

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    household_type = Column(String(50), default="Apartment")  # Apartment, Villa, Office, College Lab
    created_at = Column(DateTime, default=datetime.utcnow)

    appliances = relationship("Appliance", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("EnergyGoal", back_populates="user", cascade="all, delete-orphan")

class Appliance(Base):
    __tablename__ = "appliances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    name = Column(String(100), nullable=False, index=True)
    category = Column(String(50), nullable=False, default="General", index=True)  # Cooling, Heating, Entertainment, Kitchen, Lighting, Laundry, Misc
    rated_power_w = Column(Float, nullable=False)  # Watts
    quantity = Column(Integer, nullable=False, default=1)
    hours_per_day = Column(Float, nullable=False, default=4.0)
    days_per_month = Column(Integer, nullable=False, default=30)
    standby_power_w = Column(Float, nullable=False, default=0.0)  # Standby Vampire Load Watts
    priority = Column(String(20), nullable=False, default="Medium")  # Essential, High, Medium, Low
    min_hours_per_day = Column(Float, nullable=False, default=1.0)
    max_hours_per_day = Column(Float, nullable=False, default=12.0)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="appliances")
    usage_records = relationship("ApplianceUsage", back_populates="appliance", cascade="all, delete-orphan")

class ApplianceUsage(Base):
    __tablename__ = "appliance_usage"

    id = Column(Integer, primary_key=True, index=True)
    appliance_id = Column(Integer, ForeignKey("appliances.id", ondelete="CASCADE"), nullable=False, index=True)
    record_date = Column(DateTime, default=datetime.utcnow, index=True)
    actual_hours = Column(Float, nullable=False)
    actual_kwh = Column(Float, nullable=False)

    appliance = relationship("Appliance", back_populates="usage_records")

class TariffConfig(Base):
    __tablename__ = "tariff_configs"

    id = Column(Integer, primary_key=True, index=True)
    tariff_name = Column(String(100), default="Residential Progressive Tariff")
    fixed_charge = Column(Float, default=150.0)
    currency_symbol = Column(String(10), default="₹")
    is_time_of_use = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TariffSlab(Base):
    __tablename__ = "tariff_slabs"

    id = Column(Integer, primary_key=True, index=True)
    min_units = Column(Float, nullable=False)
    max_units = Column(Float, nullable=True)  # Null means unlimited (301+)
    rate_per_unit = Column(Float, nullable=False)
    slab_order = Column(Integer, nullable=False)
    description = Column(String(100), nullable=True)

class MonthlyConsumptionHistory(Base):
    __tablename__ = "monthly_consumption_history"

    id = Column(Integer, primary_key=True, index=True)
    month_year = Column(String(20), nullable=False, index=True)  # e.g., "2024-01"
    month_index = Column(Integer, nullable=False, index=True)  # 1..36
    total_kwh = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    avg_temperature_c = Column(Float, nullable=True, default=28.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class EnergyGoal(Base):
    __tablename__ = "energy_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    target_budget = Column(Float, nullable=False, default=3000.0)
    target_kwh = Column(Float, nullable=True, default=350.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="goals")

class OptimizationLog(Base):
    __tablename__ = "optimization_logs"

    id = Column(Integer, primary_key=True, index=True)
    original_kwh = Column(Float, nullable=False)
    optimized_kwh = Column(Float, nullable=False)
    energy_saved_kwh = Column(Float, nullable=False)
    original_cost = Column(Float, nullable=False)
    optimized_cost = Column(Float, nullable=False)
    monthly_money_saved = Column(Float, nullable=False)
    target_budget = Column(Float, nullable=True)
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ForecastRecord(Base):
    __tablename__ = "forecast_records"

    id = Column(Integer, primary_key=True, index=True)
    forecast_month = Column(String(20), nullable=False)
    predicted_kwh = Column(Float, nullable=False)
    lower_bound_kwh = Column(Float, nullable=True)
    upper_bound_kwh = Column(Float, nullable=True)
    predicted_cost = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class AnomalyRecord(Base):
    __tablename__ = "anomaly_records"

    id = Column(Integer, primary_key=True, index=True)
    record_date = Column(String(20), nullable=False)
    observed_kwh = Column(Float, nullable=False)
    expected_kwh = Column(Float, nullable=False)
    anomaly_score = Column(Float, nullable=False)
    severity = Column(String(20), nullable=False)  # High, Medium, Warning
    explanation = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class DigitalTwinSnapshot(Base):
    __tablename__ = "digital_twin_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    simulated_appliances_json = Column(Text, nullable=False)
    original_kwh = Column(Float, nullable=False)
    simulated_kwh = Column(Float, nullable=False)
    energy_saved_kwh = Column(Float, nullable=False)
    monthly_saving = Column(Float, nullable=False)
    annual_saving = Column(Float, nullable=False)
    co2_reduction_kg = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class WhatIfScenario(Base):
    __tablename__ = "what_if_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    parameters_json = Column(Text, nullable=False)
    simulated_kwh = Column(Float, nullable=False)
    simulated_bill = Column(Float, nullable=False)
    monthly_savings = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class RecommendationRecord(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    appliance_name = Column(String(100), nullable=True)
    title = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)
    impact_level = Column(String(20), nullable=False)  # High, Medium, Low
    potential_kwh_saving = Column(Float, nullable=False)
    potential_money_saving = Column(Float, nullable=False)
    action_text = Column(Text, nullable=False)
    reasoning = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
