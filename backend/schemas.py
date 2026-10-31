from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Appliance Schemas ---
class ApplianceBase(BaseModel):
    name: str = Field(..., example="AC")
    category: str = Field("Cooling", example="Cooling")
    rated_power_w: float = Field(..., gt=0, example=1500.0)
    quantity: int = Field(1, ge=1, example=1)
    hours_per_day: float = Field(..., ge=0, le=24, example=6.0)
    days_per_month: int = Field(30, ge=1, le=31, example=30)
    standby_power_w: float = Field(0.0, ge=0, example=5.0)
    priority: str = Field("Medium", example="High")  # Essential, High, Medium, Low
    min_hours_per_day: float = Field(1.0, ge=0, le=24, example=2.0)
    max_hours_per_day: float = Field(12.0, ge=0, le=24, example=8.0)
    is_active: bool = True

class ApplianceCreate(ApplianceBase):
    pass

class ApplianceUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    rated_power_w: Optional[float] = None
    quantity: Optional[int] = None
    hours_per_day: Optional[float] = None
    days_per_month: Optional[int] = None
    standby_power_w: Optional[float] = None
    priority: Optional[str] = None
    min_hours_per_day: Optional[float] = None
    max_hours_per_day: Optional[float] = None
    is_active: Optional[bool] = None

class ApplianceResponse(ApplianceBase):
    id: int
    monthly_kwh: float
    monthly_cost: float
    percentage_contribution: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Tariff Schemas ---
class TariffSlabSchema(BaseModel):
    id: Optional[int] = None
    min_units: float
    max_units: Optional[float] = None  # None for infinity / 301+
    rate_per_unit: float
    slab_order: int
    description: Optional[str] = None

class TariffConfigSchema(BaseModel):
    fixed_charge: float = 150.0
    currency_symbol: str = "₹"
    tariff_name: str = "Standard Residential Slab Tariff (Demo)"
    slabs: List[TariffSlabSchema]

# --- Calculation Schemas ---
class ConsumptionItem(BaseModel):
    appliance_id: Optional[int] = None
    name: str
    category: str
    rated_power_w: float
    quantity: int
    hours_per_day: float
    days_per_month: int
    standby_power_w: float = 0.0
    active_kwh: float
    standby_kwh: float
    total_kwh: float

class ConsumptionCalcResult(BaseModel):
    items: List[ConsumptionItem]
    total_monthly_kwh: float
    total_daily_kwh: float

class SlabBreakdownItem(BaseModel):
    slab_range: str
    units_in_slab: float
    rate_per_unit: float
    cost: float

class BillCalcResult(BaseModel):
    total_kwh: float
    energy_charge: float
    fixed_charge: float
    total_monthly_bill: float
    total_annual_bill: float
    currency: str
    slab_breakdown: List[SlabBreakdownItem]

# --- Analytics Schemas ---
class ApplianceAnalyticsItem(BaseModel):
    id: int
    name: str
    category: str
    rated_power_w: float
    quantity: int
    hours_per_day: float
    days_per_month: int = 30
    standby_power_w: float = 0.0
    priority: str = "Medium"
    min_hours_per_day: float = 1.0
    max_hours_per_day: float = 24.0
    is_active: bool = True
    monthly_kwh: float
    monthly_cost: float
    percentage_contribution: float

class ApplianceAnalyticsSummary(BaseModel):
    total_monthly_kwh: float
    total_monthly_cost: float
    total_annual_cost: float
    highest_consuming_appliance: Optional[str]
    highest_consuming_kwh: float
    lowest_consuming_appliance: Optional[str]
    lowest_consuming_kwh: float
    category_breakdown: Dict[str, float]
    appliances: List[ApplianceAnalyticsItem]

# --- ML Forecast Schemas ---
class ForecastMonth(BaseModel):
    month_name: str
    predicted_kwh: float
    predicted_bill: float
    lower_bound_kwh: float
    upper_bound_kwh: float
    temperature_proxy: float

class ForecastResponse(BaseModel):
    model_name: str
    training_data_points: int
    r2_score: float
    mae_kwh: float
    forecast_months: List[ForecastMonth]
    historical_months: List[Dict[str, Any]]
    explanation: str

# --- Optimizer Schemas ---
class OptimizationRequest(BaseModel):
    target_budget: Optional[float] = None
    max_kwh_limit: Optional[float] = None

class OptimizationApplianceResult(BaseModel):
    appliance_id: int
    name: str
    category: str
    priority: str
    current_hours: float
    optimized_hours: float
    hours_reduction: float
    current_kwh: float
    optimized_kwh: float
    kwh_saved: float
    current_cost: float
    optimized_cost: float
    money_saved: float
    annual_money_saved: float
    reason: str

class OptimizationResponse(BaseModel):
    success: bool
    status_message: str
    current_total_kwh: float
    optimized_total_kwh: float
    total_kwh_saved: float
    current_monthly_bill: float
    optimized_monthly_bill: float
    monthly_money_saved: float
    annual_money_saved: float
    target_budget: Optional[float]
    budget_met: bool
    co2_reduction_kg: float
    appliance_results: List[OptimizationApplianceResult]

# --- Digital Twin & What-If Schemas ---
class DigitalTwinSimulateRequest(BaseModel):
    title: Optional[str] = "What-If Scenario"
    appliance_overrides: List[Dict[str, Any]]  # [{id: 1, hours_per_day: 4, rated_power_w: 1500, quantity: 1, active: true}]

class DigitalTwinSimulateResponse(BaseModel):
    title: str
    original_kwh: float
    simulated_kwh: float
    kwh_saved: float
    original_bill: float
    simulated_bill: float
    monthly_money_saved: float
    annual_money_saved: float
    co2_reduction_kg: float
    percentage_kwh_change: float
    percentage_bill_change: float
    appliance_comparisons: List[Dict[str, Any]]

class WhatIfRequest(BaseModel):
    appliance_id: int
    new_hours_per_day: float
    new_rated_power_w: Optional[float] = None
    new_quantity: Optional[int] = None

class WhatIfResponse(BaseModel):
    appliance_name: str
    old_hours: float
    new_hours: float
    old_kwh: float
    new_kwh: float
    kwh_saved: float
    old_bill: float
    new_bill: float
    monthly_saving: float
    annual_saving: float
    co2_reduction_kg_year: float

# --- Score & Recommendation Schemas ---
class EfficiencyScoreFactor(BaseModel):
    factor_name: str
    weight_percentage: float
    score: float  # 0 to 100
    weighted_score: float
    description: str

class EfficiencyScoreResponse(BaseModel):
    overall_score: float  # 0 to 100
    rating_category: str  # Critical, Needs Improvement, Good, Excellent
    disclaimer: str
    factors: List[EfficiencyScoreFactor]

class RecommendationItem(BaseModel):
    id: str
    title: str
    category: str  # Optimization, Efficiency, Budget, Forecast, Maintenance
    severity: str  # High, Medium, Low, Info
    description: str
    impact_kwh_month: float
    impact_cost_month: float
    actionable_tip: str

class RecommendationsResponse(BaseModel):
    total_recommendations: int
    potential_total_monthly_saving: float
    recommendations: List[RecommendationItem]

# --- Energy Goal Schemas ---
class GoalCreate(BaseModel):
    target_budget: float
    target_kwh: Optional[float] = None

class GoalResponse(BaseModel):
    id: int
    target_budget: float
    target_kwh: Optional[float]
    current_bill: float
    current_kwh: float
    budget_variance: float  # Positive = over budget, Negative = within budget
    budget_met: bool
    is_active: bool

class DailyEnergyResponse(BaseModel):
    date: str
    billing_period_days: int
    monthly_consumption_kwh: float
    monthly_bill: float
    average_daily_consumption_kwh: float
    average_daily_cost: float
    today_consumption_kwh: float
    today_estimated_cost: float
    projected_monthly_bill: float
    today_vs_avg_diff: float
    today_vs_avg_pct: float
    daily_status: str
    daily_status_label: str
    potential_daily_kwh_saved: float
    potential_daily_saving: float
    potential_monthly_saving: float
    potential_annual_saving: float
    top_daily_consumers: List[Dict[str, Any]]
    appliance_daily_breakdown: List[Dict[str, Any]]
    daily_trend_data: List[Dict[str, Any]]
    currency: str

# --- Dashboard Summary Schema ---
class DashboardSummaryResponse(BaseModel):
    total_appliances: int
    monthly_consumption_kwh: float
    estimated_monthly_bill: float
    estimated_annual_bill: float
    average_daily_consumption_kwh: float
    average_daily_cost: float
    today_consumption_kwh: float
    today_estimated_cost: float
    projected_monthly_bill: float
    today_vs_avg_pct: float
    daily_status: str
    optimized_monthly_kwh: float
    potential_daily_saving: float
    potential_monthly_saving: float
    potential_annual_saving: float
    co2_reduction_kg: float
    efficiency_score: float
    efficiency_rating: str
    target_budget: float
    is_over_budget: bool
    currency: str
    top_consuming_appliance: Optional[str]
    top_appliance_kwh: float
