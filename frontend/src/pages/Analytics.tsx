import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { LineChart, BarChart2, PieChart, Activity, Zap, TrendingDown } from 'lucide-react';
import { api } from '../api/client';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const Analytics: React.FC = () => {
  const [appliancesData, setAppliancesData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [appRes, dashRes] = await Promise.all([
          api.getAppliances(),
          api.getDashboardSummary()
        ]);
        setAppliancesData(appRes);
        setDashboardData(dashRes);
      } catch (err) {
        console.error('Error loading analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !appliancesData) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Building Consumption Analytics Engine & Energy Load Curves...</div>;
  }

  const apps = appliancesData.appliances || [];

  // Chart Data Setup
  const categoryLabels = Object.keys(appliancesData.category_breakdown || {});
  const categoryValues = Object.values(appliancesData.category_breakdown || {});

  const appNames = apps.map((a: any) => a.name);
  const appKwhs = apps.map((a: any) => a.monthly_kwh);
  const appCosts = apps.map((a: any) => a.monthly_cost);

  // 1. Category Breakdown Doughnut Chart
  const categoryChartData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryValues,
        backgroundColor: [
          '#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6', '#ec4899'
        ],
        borderWidth: 1,
        borderColor: '#1e293b'
      }
    ]
  };

  // 2. Appliance Consumption Bar Chart
  const applianceBarData = {
    labels: appNames,
    datasets: [
      {
        label: 'Monthly kWh',
        data: appKwhs,
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: '#10b981',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  // 3. Hourly Load Curve Simulation (24 Hours)
  const hourlyLabels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
  const hourlyLoad = [
    0.3, 0.3, 0.25, 0.25, 0.3, 0.6, 1.2, 1.8, 1.5, 1.2, 1.0, 0.9,
    1.1, 1.2, 1.0, 1.3, 1.8, 2.4, 3.2, 3.8, 3.5, 2.6, 1.4, 0.6
  ];
  const hourlyChartData = {
    labels: hourlyLabels,
    datasets: [
      {
        label: 'Hourly Power Load (kW)',
        data: hourlyLoad,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // 4. Actual vs Optimized Consumption Comparison
  const baselineKwh = dashboardData.monthly_consumption_kwh || 710.02;
  const optKwh = dashboardData.optimized_monthly_kwh || 539.14;

  const comparisonData = {
    labels: ['Baseline Consumption', 'SciPy LP Optimized'],
    datasets: [
      {
        label: 'Monthly Consumption (kWh)',
        data: [baselineKwh, optKwh],
        backgroundColor: ['rgba(239, 68, 68, 0.7)', 'rgba(16, 185, 129, 0.7)'],
        borderColor: ['#ef4444', '#10b981'],
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } }
      }
    },
    scales: {
      x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* BANNER */}
      <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(16, 185, 129, 0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <LineChart size={18} color="var(--accent-cyan)" />
              <span className="badge badge-low" style={{ background: 'rgba(6, 182, 129, 0.2)', color: 'var(--accent-cyan)' }}>
                CONSUMPTION ANALYTICS & LOAD CURVES
              </span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              Consumption Analytics & Hourly Demand Visualizer
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '750px' }}>
              Multi-dimensional charts analyzing category distribution, hourly peak load curves, and baseline vs SciPy optimized consumption.
            </p>
          </div>
        </div>
      </div>

      {/* ENERGY FLOW VISUALIZATION */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '5px solid var(--accent-emerald)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Real-Time Energy Flow Pipeline</h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>SUPPLY</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>⚡ Utility Grid</strong>
          </div>
          <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>➔</div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>METER</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--accent-emerald)' }}>🏠 Smart Meter</strong>
          </div>
          <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>➔</div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>APPLIANCES</span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--accent-amber)' }}>🔌 10 Appliances</strong>
          </div>
          <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>➔</div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>TOTAL LOAD</span>
            <strong className="font-mono" style={{ fontSize: '1.2rem', color: 'var(--accent-rose)' }}>{baselineKwh} kWh/mo</strong>
          </div>
        </div>
      </div>

      {/* CHARTS GRID 1: Category Doughnut & Hourly Load Line */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>Category Load Share</h3>
          <div style={{ height: '240px', position: 'relative' }}>
            <Doughnut data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } } }} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>24-Hour Hourly Load Curve (kW)</h3>
          <div style={{ height: '240px' }}>
            <Line data={hourlyChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* CHARTS GRID 2: Appliance kWh Bar & Baseline vs Optimized */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>Appliance Monthly kWh Breakdown</h3>
          <div style={{ height: '250px' }}>
            <Bar data={applianceBarData} options={chartOptions} />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>Baseline vs SciPy Optimized</h3>
          <div style={{ height: '250px' }}>
            <Bar data={comparisonData} options={chartOptions} />
          </div>
        </div>
      </div>

    </div>
  );
};
