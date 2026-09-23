import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, TrendingDown, DollarSign, Zap, AlertTriangle, Lightbulb } from 'lucide-react';
import { api } from '../api/client';
import { RecommendationsResponse } from '../types';

export const Recommendations: React.FC = () => {
  const [recsData, setRecsData] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const res = await api.getRecommendations();
      setRecsData(res);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  if (loading || !recsData) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Generating Data-Driven Smart Recommendations...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* BANNER */}
      <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Sparkles size={18} color="var(--accent-amber)" />
              <span className="badge badge-high" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-amber)' }}>
                EXPLAINABLE DATA-DRIVEN ADVISORY
              </span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              Explainable Smart Energy Recommendations
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '750px' }}>
              Rule-based and data-driven insights computed directly from active appliance consumption profiles, tariff slab thresholds, and ML forecast trajectories.
            </p>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Total Potential Monthly Savings</span>
            <strong className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
              ₹{recsData.potential_total_monthly_saving.toLocaleString()} / month
            </strong>
          </div>
        </div>
      </div>

      {/* RECOMMENDATIONS FEED */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {recsData.recommendations.map((rec) => (
          <div key={rec.id} className="glass-panel" style={{
            padding: '1.5rem',
            borderLeft: `5px solid ${rec.severity === 'High' ? 'var(--accent-rose)' : rec.severity === 'Medium' ? 'var(--accent-amber)' : 'var(--accent-emerald)'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span className={`badge badge-${rec.severity.toLowerCase()}`}>{rec.severity} Priority</span>
                  <span className="badge badge-medium">{rec.category}</span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>{rec.title}</h3>
              </div>

              <div style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.25)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Impact kWh</span>
                  <strong className="font-mono" style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)' }}>-{rec.impact_kwh_month} kWh</strong>
                </div>
                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem', textAlign: 'right' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Cost Impact</span>
                  <strong className="font-mono" style={{ fontSize: '0.95rem', color: 'var(--accent-emerald)' }}>₹{rec.impact_cost_month}/mo</strong>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: 1.5 }}>
              {rec.description}
            </p>

            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.85rem',
              color: 'var(--text-primary)'
            }}>
              <Lightbulb size={18} color="var(--accent-amber)" />
              <div>
                <strong>Actionable Tip: </strong>
                <span>{rec.actionable_tip}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
