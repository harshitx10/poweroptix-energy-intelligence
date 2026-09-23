import React, { useState, useEffect } from 'react';
import { LineChart, Sparkles, TrendingUp, Calendar, ShieldCheck, Cpu } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { api } from '../api/client';
import { ForecastResponse } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export const Forecast: React.FC = () => {
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadForecast = async () => {
    try {
      setLoading(true);
      const res = await api.getForecast();
      setForecastData(res);
    } catch (err) {
      console.error('Error fetching ML forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast();
  }, []);

  if (loading || !forecastData) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Executing ML Ridge Regression Forecaster...</div>;
  }

  // Build Chart Data: Combine 12-Month Historical + 3-Month Forecast
  const histLabels = forecastData.historical_months.map(h => h.month_year);
  const histValues = forecastData.historical_months.map(h => h.total_kwh);

  const fcLabels = forecastData.forecast_months.map(f => f.month_name);
  const fcValues = forecastData.forecast_months.map(f => f.predicted_kwh);
  const fcUpper = forecastData.forecast_months.map(f => f.upper_bound_kwh);
  const fcLower = forecastData.forecast_months.map(f => f.lower_bound_kwh);

  const allLabels = [...histLabels, ...fcLabels];
  const historicalSeries = [...histValues, null, null, null];
  
  // Connect forecast line from last historical point
  const lastHist = histValues[histValues.length - 1];
  const forecastSeries = [
    ...Array(histValues.length - 1).fill(null),
    lastHist,
    ...fcValues
  ];

  const chartData = {
    labels: allLabels,
    datasets: [
      {
        label: 'Historical Actual Consumption (kWh)',
        data: historicalSeries,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 4
      },
      {
        label: 'ML Ridge Projected Consumption (kWh)',
        data: forecastSeries,
        borderColor: '#06b6d4',
        borderDash: [6, 6],
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: false,
        tension: 0.3,
        pointRadius: 5
      }
    ]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* HEADER BANNER */}
      <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-medium" style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)' }}>
                FEATURE ENGINEERING + RIDGE REGRESSION
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lag-1, Lag-2, Lag-3 & 3-Month Rolling Average</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              ML-Based Electricity Consumption Forecasting
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '750px' }}>
              {forecastData.explanation}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Model R² Accuracy</span>
              <strong className="font-mono" style={{ fontSize: '1.2rem', color: 'var(--accent-emerald)' }}>{(forecastData.r2_score * 100).toFixed(1)}%</strong>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>MAE Error</span>
              <strong className="font-mono" style={{ fontSize: '1.2rem', color: 'var(--accent-cyan)' }}>±{forecastData.mae_kwh} kWh</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3-MONTH FORECAST CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
        {forecastData.forecast_months.map((m, idx) => (
          <div key={idx} className="glass-panel" style={{ padding: '1.5rem', borderTop: '4px solid var(--accent-cyan)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>{m.month_name} Forecast</span>
              <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>Temp: {m.temperature_proxy}°C</span>
            </div>

            <h3 className="font-mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>
              {m.predicted_kwh} kWh
            </h3>

            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Est. Bill: ₹{m.predicted_bill.toLocaleString()}
            </p>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Confidence Interval: <strong style={{ color: 'var(--text-secondary)' }}>{m.lower_bound_kwh} kWh – {m.upper_bound_kwh} kWh</strong>
            </div>
          </div>
        ))}
      </div>

      {/* FORECAST & HISTORICAL CHART */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>
          12-Month Historical Actuals vs 3-Month ML Ridge Predictions
        </h3>
        <div style={{ height: '320px' }}>
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'top', labels: { color: '#9ca3af', font: { size: 12 } } } },
              scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }
              }
            }}
          />
        </div>
      </div>

    </div>
  );
};
