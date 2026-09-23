import React, { useState, useEffect } from 'react';
import { Activity, Zap, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';
import { api } from '../api/client';

export const PeakLoad: React.FC = () => {
  const [peakData, setPeakData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPeak() {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:8001/api/peak-load').then(r => r.json());
        setPeakData(res);
      } catch (err) {
        console.error('Error fetching peak load:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPeak();
  }, []);

  if (loading || !peakData) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Analyzing Coincident Peak Power Load...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* BANNER */}
      <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(245, 158, 11, 0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Activity size={18} color="var(--accent-rose)" />
              <span className="badge badge-essential">SIMULTANEOUS DEMAND OPTIMIZER</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              Peak Load Intelligence & Demand Management
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '750px' }}>
              Identifies simultaneous operation of heavy wattage appliances (AC, Geyser, Water Pump) to prevent grid tripping and demand charges.
            </p>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Peak Risk Status</span>
            <strong style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
              {peakData.peak_risk_status}
            </strong>
          </div>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-cyan)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connected Load</span>
          <h3 className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.3rem' }}>{peakData.connected_load_kw} kW</h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sum of all appliances</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-rose)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Simultaneous Peak</span>
          <h3 className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '0.3rem' }}>{peakData.simultaneous_peak_kw} kW</h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>0.75 coincidence factor</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-emerald)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recommended Peak</span>
          <h3 className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.3rem' }}>{peakData.recommended_peak_kw} kW</h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>After demand shift</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-amber)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Peak Reduction</span>
          <h3 className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '0.3rem' }}>-{peakData.peak_reduction_kw} kW</h3>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cut from simultaneous load</span>
        </div>
      </div>

      {/* COINCIDENT HIGH LOAD ITEMS */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>High-Power Coincident Appliances (&gt;1000W)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {peakData.coincident_high_load_items.map((item: any, idx: number) => (
            <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <span className="badge badge-essential" style={{ marginBottom: '0.4rem' }}>{item.category}</span>
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{item.name}</h4>
              <p className="font-mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '0.25rem' }}>{item.power_w} W</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
