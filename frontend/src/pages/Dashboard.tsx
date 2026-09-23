import React, { useEffect, useState } from 'react';
import {
  Zap,
  DollarSign,
  TrendingDown,
  PiggyBank,
  Leaf,
  Award,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
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
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { api } from '../api/client';
import { DashboardSummary, ApplianceAnalyticsSummary, RecommendationsResponse, EfficiencyScoreResponse } from '../types';
import { KpiCard } from '../components/KpiCard';
import { EfficiencyGauge } from '../components/EfficiencyGauge';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  summary: DashboardSummary | null;
  refreshSummary: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, summary, refreshSummary }) => {
  const [analytics, setAnalytics] = useState<ApplianceAnalyticsSummary | null>(null);
  const [recs, setRecs] = useState<RecommendationsResponse | null>(null);
  const [scoreData, setScoreData] = useState<EfficiencyScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [appData, recData, scoreRes] = await Promise.all([
          api.getAppliances(),
          api.getRecommendations(),
          api.getEfficiencyScore()
        ]);
        setAnalytics(appData);
        setRecs(recData);
        setScoreData(scoreRes);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading || !summary) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Loading PowerOptix Intelligence Engine...</p>
      </div>
    );
  }

  // Chart 1: Donut Chart - Consumption Distribution by Category
  const catLabels = analytics ? Object.keys(analytics.category_breakdown) : [];
  const catValues = analytics ? Object.values(analytics.category_breakdown) : [];

  const categoryDonutData = {
    labels: catLabels,
    datasets: [{
      data: catValues,
      backgroundColor: [
        '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'
      ],
      borderWidth: 0
    }]
  };

  // Chart 2: Cost Comparison Bar Chart (Top 5 Appliances)
  const sortedApps = analytics ? [...analytics.appliances].sort((a, b) => (b.monthly_cost || 0) - (a.monthly_cost || 0)).slice(0, 5) : [];
  const appBarData = {
    labels: sortedApps.map(a => a.name),
    datasets: [{
      label: 'Monthly Cost (₹)',
      data: sortedApps.map(a => a.monthly_cost || 0),
      backgroundColor: 'rgba(16, 185, 129, 0.7)',
      borderColor: '#10b981',
      borderRadius: 6
    }]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* HERO HERO SECTION */}
      <div className="glass-panel" style={{
        padding: '2rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-low" style={{ background: 'rgba(16, 185, 129, 0.2)' }}>
                POWEROPTIX CORE PIPELINE
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>COLLECT → ANALYZE → PREDICT → OPTIMIZE → SIMULATE → SAVE</span>
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              AI-Based Electricity Usage & Cost Optimization Engine
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '750px' }}>
              Current monthly household usage is <strong style={{ color: 'var(--accent-emerald)' }}>{summary.monthly_consumption_kwh} kWh</strong> with an estimated bill of <strong style={{ color: 'var(--text-primary)' }}>{summary.currency}{summary.estimated_monthly_bill.toLocaleString()}</strong>.
              SciPy linear optimization can reduce consumption to <strong style={{ color: 'var(--accent-cyan)' }}>{summary.optimized_monthly_kwh} kWh</strong>, saving up to <strong style={{ color: 'var(--accent-emerald)' }}>{summary.currency}{summary.potential_monthly_saving.toLocaleString()}/month</strong> ({summary.currency}{summary.potential_annual_saving.toLocaleString()}/year).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setActiveTab('optimizer')} className="btn btn-primary">
              <TrendingDown size={18} />
              Run Optimizer
            </button>
            <button onClick={() => setActiveTab('digital-twin')} className="btn btn-secondary">
              Digital Twin
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* TOP KPI CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <KpiCard
          title="Monthly Consumption"
          value={`${summary.monthly_consumption_kwh} kWh`}
          subtext="Calculated from active appliances"
          icon={Zap}
          color="var(--accent-emerald)"
          badgeText="Active"
        />
        <KpiCard
          title="Estimated Monthly Bill"
          value={`${summary.currency}${summary.estimated_monthly_bill.toLocaleString()}`}
          subtext={`Annual: ${summary.currency}${summary.estimated_annual_bill.toLocaleString()}`}
          icon={DollarSign}
          color={summary.is_over_budget ? 'var(--accent-rose)' : 'var(--accent-cyan)'}
          badgeText={summary.is_over_budget ? 'Over Budget' : 'Within Budget'}
          badgeType={summary.is_over_budget ? 'danger' : 'success'}
        />
        <KpiCard
          title="Optimized Consumption"
          value={`${summary.optimized_monthly_kwh} kWh`}
          subtext={`Potential reduction: ${roundVal(summary.monthly_consumption_kwh - summary.optimized_monthly_kwh)} kWh`}
          icon={TrendingDown}
          color="var(--accent-cyan)"
          badgeText="SciPy Linprog"
        />
        <KpiCard
          title="Potential Monthly Saving"
          value={`${summary.currency}${summary.potential_monthly_saving.toLocaleString()}`}
          subtext={`Annual saving: ${summary.currency}${summary.potential_annual_saving.toLocaleString()}`}
          icon={PiggyBank}
          color="var(--accent-emerald)"
          badgeText="Available"
        />
        <KpiCard
          title="Estimated CO₂ Reduction"
          value={`${summary.co2_reduction_kg} kg/yr`}
          subtext="0.85 kg CO₂/kWh grid factor"
          icon={Leaf}
          color="var(--accent-emerald)"
        />
      </div>

      {/* CHARTS & EFFICIENCY ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Cost Breakdown Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Top Appliance Monthly Electricity Cost (₹)</h3>
          <div style={{ height: '260px' }}>
            <Bar
              data={appBarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
                  y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }
                }
              }}
            />
          </div>
        </div>

        {/* Category Donut Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Energy Distribution by Category</h3>
          <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut
              data={categoryDonutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af', boxWidth: 12, font: { size: 11 } } } }
              }}
            />
          </div>
        </div>
      </div>

      {/* SCORE & RECOMMENDATION HIGHLIGHTS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <EfficiencyGauge scoreData={scoreData} />

        {/* Smart Recommendation Feed */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="var(--accent-amber)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>PowerOptix Smart Recommendations</h3>
            </div>
            <button onClick={() => setActiveTab('recommendations')} className="btn btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}>
              View All ({recs?.total_recommendations || 0})
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recs && recs.recommendations.slice(0, 2).map((r, idx) => (
              <div key={idx} style={{
                background: 'rgba(0,0,0,0.25)',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `4px solid ${r.severity === 'High' ? 'var(--accent-rose)' : 'var(--accent-amber)'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700 }}>{r.title}</h4>
                  <span className={`badge badge-${r.severity.toLowerCase()}`}>{r.severity}</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{r.actionable_tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

function roundVal(num: number): number {
  return Math.round(num * 10) / 10;
}
