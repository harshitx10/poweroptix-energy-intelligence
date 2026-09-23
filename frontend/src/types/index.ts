export interface Appliance {
  id: number;
  name: string;
  category: string;
  rated_power_w: number;
  quantity: number;
  hours_per_day: number;
  days_per_month: number;
  standby_power_w: number;
  priority: 'Essential' | 'High' | 'Medium' | 'Low';
  min_hours_per_day: number;
  max_hours_per_day: number;
  is_active: boolean;
  monthly_kwh?: number;
  monthly_cost?: number;
  percentage_contribution?: number;
}

export type ApplianceCategory = 'Cooling' | 'Heating' | 'Entertainment' | 'Kitchen' | 'Lighting' | 'Laundry' | 'Misc' | 'General';

export interface DashboardSummary {
  total_appliances: number;
  monthly_consumption_kwh: number;
  estimated_monthly_bill: number;
  estimated_annual_bill: number;
  optimized_monthly_kwh: number;
  potential_monthly_saving: number;
  potential_annual_saving: number;
  co2_reduction_kg: number;
  efficiency_score: number;
  efficiency_rating: 'Critical' | 'Needs Improvement' | 'Good' | 'Excellent';
  target_budget: number;
  is_over_budget: boolean;
  currency: string;
  top_consuming_appliance: string | null;
  top_appliance_kwh: number;
}

export interface ApplianceAnalyticsSummary {
  total_monthly_kwh: number;
  total_monthly_cost: number;
  total_annual_cost: number;
  highest_consuming_appliance: string | null;
  highest_consuming_kwh: number;
  lowest_consuming_appliance: string | null;
  lowest_consuming_kwh: number;
  category_breakdown: Record<string, number>;
  appliances: Appliance[];
}

export interface OptimizationResultItem {
  appliance_id: number;
  name: string;
  category: string;
  priority: string;
  current_hours: number;
  optimized_hours: number;
  hours_reduction: number;
  current_kwh: number;
  optimized_kwh: number;
  kwh_saved: number;
  current_cost: number;
  optimized_cost: number;
  money_saved: number;
  annual_money_saved: number;
  reason: string;
}

export interface OptimizationResponse {
  success: boolean;
  status_message: string;
  current_total_kwh: number;
  optimized_total_kwh: number;
  total_kwh_saved: number;
  current_monthly_bill: number;
  optimized_monthly_bill: number;
  monthly_money_saved: number;
  annual_money_saved: number;
  target_budget: number | null;
  budget_met: boolean;
  co2_reduction_kg: number;
  appliance_results: OptimizationResultItem[];
}

export interface DigitalTwinComparison {
  appliance_id: number;
  name: string;
  category: string;
  original_power_w: number;
  simulated_power_w: number;
  original_hours: number;
  simulated_hours: number;
  original_quantity: number;
  simulated_quantity: number;
  original_kwh: number;
  simulated_kwh: number;
  kwh_diff: number;
}

export interface DigitalTwinSimulateResponse {
  title: string;
  original_kwh: number;
  simulated_kwh: number;
  kwh_saved: number;
  original_bill: number;
  simulated_bill: number;
  monthly_money_saved: number;
  annual_money_saved: number;
  co2_reduction_kg: number;
  percentage_kwh_change: number;
  percentage_bill_change: number;
  appliance_comparisons: DigitalTwinComparison[];
}

export interface WhatIfResponse {
  appliance_name: string;
  old_hours: number;
  new_hours: number;
  old_kwh: number;
  new_kwh: number;
  kwh_saved: number;
  old_bill: number;
  new_bill: number;
  monthly_saving: number;
  annual_saving: number;
  co2_reduction_kg_year: number;
}

export interface ForecastMonth {
  month_name: string;
  predicted_kwh: number;
  predicted_bill: number;
  lower_bound_kwh: number;
  upper_bound_kwh: number;
  temperature_proxy: number;
}

export interface ForecastResponse {
  model_name: string;
  training_data_points: number;
  r2_score: number;
  mae_kwh: number;
  forecast_months: ForecastMonth[];
  historical_months: Array<{
    month_year: string;
    total_kwh: number;
    total_cost: number;
    avg_temperature_c: number;
  }>;
  explanation: string;
}

export interface EfficiencyScoreFactor {
  factor_name: string;
  weight_percentage: number;
  score: number;
  weighted_score: number;
  description: string;
}

export interface EfficiencyScoreResponse {
  overall_score: number;
  rating_category: 'Critical' | 'Needs Improvement' | 'Good' | 'Excellent';
  disclaimer: string;
  factors: EfficiencyScoreFactor[];
}

export interface RecommendationItem {
  id: string;
  title: string;
  category: 'Optimization' | 'Efficiency' | 'Budget' | 'Forecast' | 'Maintenance';
  severity: 'High' | 'Medium' | 'Low' | 'Info';
  description: string;
  impact_kwh_month: number;
  impact_cost_month: number;
  actionable_tip: string;
}

export interface RecommendationsResponse {
  total_recommendations: number;
  potential_total_monthly_saving: number;
  recommendations: RecommendationItem[];
}

export interface TariffSlab {
  id?: number;
  min_units: number;
  max_units: number | null;
  rate_per_unit: number;
  slab_order: number;
  description?: string;
}

export interface TariffConfig {
  tariff_name: string;
  fixed_charge: number;
  currency_symbol: string;
  slabs: TariffSlab[];
}

export interface EnergyGoal {
  id: number;
  target_budget: number;
  target_kwh: number | null;
  current_bill: number;
  current_kwh: number;
  budget_variance: number;
  budget_met: boolean;
  is_active: boolean;
}
