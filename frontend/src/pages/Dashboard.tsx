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
  AlertTriangle,
  Calendar,
  Activity,
  TrendingUp
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
import { DashboardSummary, ApplianceAnalyticsSummary, RecommendationsResponse, EfficiencyScoreResponse, DailyEnergyData } from '../types';
import { KpiCard } from '../components/KpiCard';
import { EfficiencyGauge } from '../components/EfficiencyGauge';

import { speakPowerOptix, evaluateEnergyAudioEvents } from '../utils/audioAssistant';
import { Volume2 } from 'lucide-react';

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
  const [dailyData, setDailyData] = useState<DailyEnergyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [appData, recData, scoreRes, dailyRes] = await Promise.all([
          api.getAppliances(),
          api.getRecommendations(),
          api.getEfficiencyScore(),
          api.getDailyEnergy()
        ]);
        setAnalytics(appData);
        setRecs(recData);
        setScoreData(scoreRes);
        setDailyData(dailyRes);

        // 3-Level Audio Evaluation (🟢 GREEN / 🟡 YELLOW / 🔴 RED)
        evaluateEnergyAudioEvents({
          todayVsAvgPct: dailyRes?.today_vs_avg_pct,
          isOverBudget: summary?.is_over_budget,
          monthlySaving: dailyRes?.potential_monthly_saving,
          efficiencyScore: scoreRes?.overall_score
        });
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [summary?.is_over_budget]);

  if (loading || !summary) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Loading PowerOptix Intelligence Engine...</p>
      </div>
    );
  }

  // Daily Trend Chart Data
  const trendLabels = dailyData ? dailyData.daily_trend_data.map(d => d.day_name) : [];
  const trendCosts = dailyData ? dailyData.daily_trend_data.map(d => d.daily_cost) : [];
  const trendKwhs = dailyData ? dailyData.daily_trend_data.map(d => d.daily_kwh) : [];

  const dailyTrendChartData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Daily Cost (₹/day)',
        data: trendCosts,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Daily Consumption (kWh/day)',
        data: trendKwhs,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderDash: [4, 4],
        fill: false,
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

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

  // Daily Status Badge
  const statusType = dailyData?.daily_status === 'HIGH' ? 'danger' : dailyData?.daily_status === 'LOW' ? 'success' : 'medium';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* HERO SECTION */}
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
              Average daily cost is <strong style={{ color: 'var(--accent-cyan)' }}>{summary.currency}{(dailyData?.average_daily_cost ?? roundVal(summary.estimated_monthly_bill / 30)).toFixed(2)}/day</strong>.
              SciPy LP optimization can save <strong style={{ color: 'var(--accent-emerald)' }}>{summary.currency}{(dailyData?.potential_daily_saving ?? roundVal(summary.potential_monthly_saving / 30)).toFixed(2)}/day</strong> ({summary.currency}{summary.potential_monthly_saving.toLocaleString()}/month).
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

      {/* DAILY COST & CONSUMPTION KPI CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <KpiCard
          title="Monthly Electricity Bill"
          value={`${summary.currency}${summary.estimated_monthly_bill.toLocaleString()}`}
          subtext={`Annual: ${summary.currency}${summary.estimated_annual_bill.toLocaleString()}`}
          icon={DollarSign}
          color={summary.is_over_budget ? 'var(--accent-rose)' : 'var(--accent-cyan)'}
          badgeText={summary.is_over_budget ? 'Over Budget' : 'Within Budget'}
          badgeType={summary.is_over_budget ? 'danger' : 'success'}
        />

        <KpiCard
          title="Average Daily Cost"
          value={`${summary.currency}${(dailyData?.average_daily_cost ?? roundVal(summary.estimated_monthly_bill / 30)).toFixed(2)} / day`}
          subtext="Monthly Bill / 30 Billing Days"
          icon={Calendar}
          color="var(--accent-cyan)"
          badgeText="Daily Avg"
        />

        <KpiCard
          title="Average Daily Consumption"
          value={`${(dailyData?.average_daily_consumption_kwh ?? roundVal(summary.monthly_consumption_kwh / 30)).toFixed(2)} kWh/day`}
          subtext="Monthly Load / 30 Days"
          icon={Zap}
          color="var(--accent-emerald)"
        />

        <KpiCard
          title="Today's Estimated Cost"
          value={`${summary.currency}${(dailyData?.today_estimated_cost ?? roundVal(summary.estimated_monthly_bill / 30)).toFixed(2)}`}
          subtext="Estimated from active usage"
          icon={Activity}
          color="var(--accent-amber)"
          badgeText={dailyData?.daily_status || 'NORMAL'}
          badgeType={statusType as any}
        />

        <KpiCard
          title="Today's Estimated Consumption"
          value={`${(dailyData?.today_consumption_kwh ?? roundVal(summary.monthly_consumption_kwh / 30)).toFixed(2)} kWh`}
          subtext="Appliance load & standby"
          icon={Zap}
          color="var(--accent-cyan)"
        />

        <KpiCard
          title="Projected Monthly Bill"
          value={`${summary.currency}${(dailyData?.projected_monthly_bill ?? summary.estimated_monthly_bill).toLocaleString()}`}
          subtext="Based on current daily usage"
          icon={TrendingUp}
          color="var(--accent-rose)"
          badgeText="Projected"
        />
      </div>

      {/* TODAY VS AVERAGE COMPARISON & DAILY POTENTIAL SAVINGS BANNER */}
      {dailyData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `4px solid ${dailyData.today_vs_avg_diff > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)'}` }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TODAY vs AVERAGE DAILY COST</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.25rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>₹{dailyData.today_estimated_cost.toFixed(2)}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>vs Avg ₹{dailyData.average_daily_cost.toFixed(2)}/day</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: dailyData.today_vs_avg_diff > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)', marginTop: '0.25rem', fontWeight: 700 }}>
                {dailyData.today_vs_avg_diff > 0 ? `+₹${dailyData.today_vs_avg_diff.toFixed(2)} (+${dailyData.today_vs_avg_pct}%) above daily average` : `${dailyData.today_vs_avg_pct}% below daily average`}
              </p>
            </div>
            <span className={`badge badge-${statusType}`} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
              {dailyData.daily_status_label}
            </span>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid var(--accent-emerald)' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>POTENTIAL DAILY OPTIMIZATION SAVINGS</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginTop: '0.25rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>₹{dailyData.potential_daily_saving.toFixed(2)} / day</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({dailyData.potential_daily_kwh_saved} kWh/day)</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                SciPy LP solver optimizes hours to save <strong>₹{dailyData.potential_monthly_saving.toLocaleString()}/month</strong> (₹{dailyData.potential_annual_saving.toLocaleString()}/year).
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  const saved = Math.round(dailyData.potential_monthly_saving || 0);
                  const pct = Math.round(dailyData.today_vs_avg_pct);
                  if (pct >= 10) {
                    speakPowerOptix(`Warning. Today's energy consumption is approximately ${pct} percent above your daily average.`, 'HIGH', 'dash_listen_warn_' + Date.now(), 'warning');
                  } else if (saved > 0) {
                    speakPowerOptix(`Good news. Your optimized energy plan can save approximately ${saved} rupees.`, 'MEDIUM', 'dash_listen_good_' + Date.now(), 'success');
                  } else {
                    speakPowerOptix('PowerOptix dashboard loaded. System operating within normal daily parameters.', 'LOW', 'dash_listen_norm_' + Date.now(), 'success');
                  }
                }}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                title="Listen to Today's Energy Intelligence Brief"
              >
                <Volume2 size={15} color="var(--accent-emerald)" />
                Listen
              </button>
              <button onClick={() => setActiveTab('optimizer')} className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
                Optimize Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DAILY TREND CHART & CATEGORY DONUT ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Daily Cost & Consumption Trend Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>7-Day Daily Electricity Cost & Load Trend</h3>
          <div style={{ height: '260px' }}>
            <Line
              data={dailyTrendChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { position: 'top', labels: { color: '#9ca3af', font: { size: 11 } } } },
                scales: {
                  x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'Cost (₹/day)', color: '#06b6d4' },
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#06b6d4' }
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Energy (kWh/day)', color: '#10b981' },
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#10b981' }
                  }
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
