import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { EfficiencyScoreResponse } from '../types';

interface EfficiencyGaugeProps {
  scoreData: EfficiencyScoreResponse | null;
}

export const EfficiencyGauge: React.FC<EfficiencyGaugeProps> = ({ scoreData }) => {
  if (!scoreData) return null;

  const score = scoreData.overall_score;
  const rating = scoreData.rating_category;

  const getColor = (scoreVal: number) => {
    if (scoreVal >= 80) return 'var(--accent-emerald)';
    if (scoreVal >= 60) return 'var(--accent-cyan)';
    if (scoreVal >= 40) return 'var(--accent-amber)';
    return 'var(--accent-rose)';
  };

  const scoreColor = getColor(score);

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>PowerOptix Proposed Energy Efficiency Score</h3>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Multi-factor weighted evaluation engine (0–100)</p>
        </div>
        <span className="badge" style={{
          background: `${scoreColor}20`,
          color: scoreColor,
          border: `1px solid ${scoreColor}40`,
          fontSize: '0.75rem',
          padding: '0.35rem 0.75rem'
        }}>
          {rating}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        {/* Gauge Circle */}
        <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={scoreColor}
              strokeWidth="10"
              strokeDasharray={314}
              strokeDashoffset={314 - (314 * score) / 100}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: scoreColor }}>{score}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Out of 100</span>
          </div>
        </div>

        {/* Factors Breakdown */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {scoreData.factors.map((f, idx) => (
              <div key={idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  <span>{f.factor_name}</span>
                  <strong style={{ color: getColor(f.score) }}>{f.score}</strong>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${f.score}%`, height: '100%', background: getColor(f.score) }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            <Info size={12} />
            <span>{scoreData.disclaimer}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
