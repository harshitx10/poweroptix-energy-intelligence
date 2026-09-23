import React, { useState, useEffect } from 'react';
import { Zap, ShieldCheck, Flame, PieChart } from 'lucide-react';
import { api } from '../api/client';

export const EnergyDna: React.FC = () => {
  const [dna, setDna] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDna() {
      try {
        setLoading(true);
        const res = await api.getEnergyDna();
        setDna(res);
      } catch (err) {
        console.error('Error fetching Energy DNA:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDna();
  }, []);

  if (loading || !dna) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Analyzing Household Energy DNA Signature...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* HERO BANNER */}
      <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-low" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)' }}>
                BEHAVIORAL CONSUMPTION PROFILE
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Empirical Appliance Analysis</span>
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              {dna.icon_symbol} {dna.profile_name}
            </h2>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-emerald)', marginBottom: '0.5rem' }}>
              "{dna.tagline}"
            </p>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '750px' }}>
              {dna.explanation}
            </p>
          </div>

          <div style={{
            fontSize: '3.5rem',
            width: '90px',
            height: '90px',
            borderRadius: '20px',
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-color)'
          }}>
            {dna.icon_symbol}
          </div>
        </div>
      </div>

      {/* DNA DRIVER & CATEGORY BREAKDOWN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Primary Consumption Driver</h3>
          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--accent-cyan)' }}>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {dna.primary_driver}
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Vampire standby power draw across idle appliances contributes approximately <strong style={{ color: 'var(--text-primary)' }}>{dna.standby_kwh_month} kWh/month</strong>.
            </p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Category Load Share</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {dna.category_percentages && Object.entries(dna.category_percentages).map(([cat, pct]: any) => (
              <div key={cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{cat}</span>
                  <strong style={{ color: 'var(--accent-emerald)' }}>{pct}%</strong>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-emerald)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
