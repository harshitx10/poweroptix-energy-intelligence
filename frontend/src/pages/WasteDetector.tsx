import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, Zap, DollarSign, Lightbulb } from 'lucide-react';
import { api } from '../api/client';

export const WasteDetector: React.FC = () => {
  const [wasteData, setWasteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWaste() {
      try {
        setLoading(true);
        const res = await api.getWasteRadar();
        setWasteData(res);
      } catch (err) {
        console.error('Error fetching waste radar:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWaste();
  }, []);

  if (loading || !wasteData) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Scanning Energy Waste Radar...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* BANNER */}
      <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <AlertTriangle size={18} color="var(--accent-rose)" />
              <span className="badge badge-essential">PATTERN-BASED WASTE RADAR</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              Household Energy Waste Radar & Anomaly Scanner
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '750px' }}>
              Scans active household appliances for idle standby vampire draw, excessive AC runtime, and high-wattage legacy fixtures.
            </p>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Estimated Waste Cost</span>
            <strong className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
              ₹{wasteData.estimated_monthly_waste_cost.toLocaleString()} / month
            </strong>
          </div>
        </div>
      </div>

      {/* WASTE PATTERNS FEED */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {wasteData.patterns.map((p: any) => (
          <div key={p.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: '5px solid var(--accent-rose)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <span className="badge badge-essential" style={{ marginBottom: '0.35rem' }}>{p.severity} Waste Severity</span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{p.title}</h3>
              </div>

              <div style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.25)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Waste Energy</span>
                  <strong className="font-mono" style={{ fontSize: '0.95rem', color: 'var(--accent-rose)' }}>{p.estimated_waste_kwh} kWh/mo</strong>
                </div>
                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem', textAlign: 'right' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Annual Waste Cost</span>
                  <strong className="font-mono" style={{ fontSize: '0.95rem', color: 'var(--accent-amber)' }}>₹{p.potential_annual_saving}/yr</strong>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
              <strong>Evidence: </strong>{p.evidence}
            </p>

            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
              <Lightbulb size={18} color="var(--accent-amber)" />
              <div>
                <strong>Recommended Corrective Action: </strong>
                <span>{p.recommended_action}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
