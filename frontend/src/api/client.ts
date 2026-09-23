import {
  DashboardSummary,
  ApplianceAnalyticsSummary,
  Appliance,
  OptimizationResponse,
  DigitalTwinSimulateResponse,
  WhatIfResponse,
  ForecastResponse,
  EfficiencyScoreResponse,
  RecommendationsResponse,
  TariffConfig,
  EnergyGoal
} from '../types';

const API_BASE = 'http://localhost:8001/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`API Error (${res.status}): ${errText}`);
  }
  return res.json();
}

export const api = {
  getDashboardSummary: () => fetchJson<DashboardSummary>(`${API_BASE}/dashboard`),

  getAppliances: () => fetchJson<ApplianceAnalyticsSummary>(`${API_BASE}/appliances`),

  createAppliance: (app: Partial<Appliance>) =>
    fetchJson<{ message: string; appliance_id: number }>(`${API_BASE}/appliances`, {
      method: 'POST',
      body: JSON.stringify(app),
    }),

  updateAppliance: (id: number, app: Partial<Appliance>) =>
    fetchJson<{ message: string; appliance_id: number }>(`${API_BASE}/appliances/${id}`, {
      method: 'PUT',
      body: JSON.stringify(app),
    }),

  deleteAppliance: (id: number) =>
    fetchJson<{ message: string }>(`${API_BASE}/appliances/${id}`, {
      method: 'DELETE',
    }),

  runOptimization: (target_budget?: number, max_kwh_limit?: number, objective_mode: string = "balanced") =>
    fetchJson<OptimizationResponse>(`${API_BASE}/optimize`, {
      method: 'POST',
      body: JSON.stringify({ target_budget, max_kwh_limit, objective_mode }),
    }),

  simulateDigitalTwin: (title: string, appliance_overrides: any[]) =>
    fetchJson<DigitalTwinSimulateResponse>(`${API_BASE}/digital-twin/simulate`, {
      method: 'POST',
      body: JSON.stringify({ title, appliance_overrides }),
    }),

  runWhatIf: (appliance_id: number, new_hours_per_day: number, new_rated_power_w?: number, new_quantity?: number) =>
    fetchJson<WhatIfResponse>(`${API_BASE}/what-if`, {
      method: 'POST',
      body: JSON.stringify({ appliance_id, new_hours_per_day, new_rated_power_w, new_quantity }),
    }),

  getForecast: () => fetchJson<ForecastResponse>(`${API_BASE}/forecast`, { method: 'POST' }),

  getEfficiencyScore: () => fetchJson<EfficiencyScoreResponse>(`${API_BASE}/efficiency-score`),

  getRecommendations: () => fetchJson<RecommendationsResponse>(`${API_BASE}/recommendations`),

  getTariff: () => fetchJson<TariffConfig>(`${API_BASE}/tariff`),

  updateTariff: (tariff: TariffConfig) =>
    fetchJson<{ message: string }>(`${API_BASE}/tariff`, {
      method: 'PUT',
      body: JSON.stringify(tariff),
    }),

  getGoal: () => fetchJson<EnergyGoal>(`${API_BASE}/goals`),

  updateGoal: (target_budget: number, target_kwh?: number) =>
    fetchJson<{ message: string; target_budget: number }>(`${API_BASE}/goals`, {
      method: 'POST',
      body: JSON.stringify({ target_budget, target_kwh }),
    }),

  getEnergyDna: () => fetchJson<any>(`${API_BASE}/energy-dna`),

  runAnomalyDetection: () => fetchJson<any>(`${API_BASE}/anomaly/detect`, { method: 'POST' }),

  calculateReplacement: (current_power_w: number, replacement_power_w: number, hours_per_day: number, replacement_cost_total: number) =>
    fetchJson<any>(`${API_BASE}/appliance-replacement?current_power_w=${current_power_w}&replacement_power_w=${replacement_power_w}&hours_per_day=${hours_per_day}&replacement_cost_total=${replacement_cost_total}`, { method: 'POST' }),

  simulateSolar: (solar_capacity_kw: number = 3.0, battery_capacity_kwh: number = 5.0) =>
    fetchJson<any>(`${API_BASE}/solar/simulate?solar_capacity_kw=${solar_capacity_kw}&battery_capacity_kwh=${battery_capacity_kwh}`, { method: 'POST' }),

  optimizeEv: (battery_capacity_kwh: number = 30.0, current_soc_pct: number = 20.0, target_soc_pct: number = 80.0) =>
    fetchJson<any>(`${API_BASE}/ev/optimize?battery_capacity_kwh=${battery_capacity_kwh}&current_soc_pct=${current_soc_pct}&target_soc_pct=${target_soc_pct}`, { method: 'POST' }),

  getWasteRadar: () => fetchJson<any>(`${API_BASE}/waste-radar`),

  askAssistant: (query: string) =>
    fetchJson<any>(`${API_BASE}/assistant`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  getVivaMetrics: () => fetchJson<any>(`${API_BASE}/viva-metrics`),
};
