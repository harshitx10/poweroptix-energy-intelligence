import React, { useState, useEffect } from 'react';
import { Activity, Zap, DollarSign, PiggyBank, Leaf, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { ApplianceAnalyticsSummary, WhatIfResponse, Appliance } from '../types';

interface SimulatorProps {
  onDataChanged: () => void;
}

export const Simulator: React.FC<SimulatorProps> = ({ onDataChanged }) => {
  const [data, setData] = useState<ApplianceAnalyticsSummary | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [sliderHours, setSliderHours] = useState<number>(4.0);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initSimulator() {
      try {
        setLoading(true);
        const res = await api.getAppliances();
        setData(res);
        if (res.appliances.length > 0) {
          const defaultApp = res.appliances.find(a => a.name.toLowerCase().includes('ac')) || res.appliances[0];
          setSelectedAppId(defaultApp.id);
          setSliderHours(Math.max(1, defaultApp.hours_per_day - 2));
          fetchWhatIf(defaultApp.id, Math.max(1, defaultApp.hours_per_day - 2));
        }
      } catch (err) {
        console.error('Error initializing simulator:', err);
      } finally {
        setLoading(false);
      }
    }
    initSimulator();
  }, []);

  const fetchWhatIf = async (appId: number, hours: number) => {
    try {
      const res = await api.runWhatIf(appId, hours);
      setWhatIfResult(res);
    } catch (err) {
      console.error('Error running What-If calculation:', err);
    }
  };

  const handleApplianceChange = (appId: number) => {
    setSelectedAppId(appId);
    if (!data) return;
    const app = data.appliances.find(a => a.id === appId);
    if (app) {
      const defaultVal = Math.max(1, app.hours_per_day - 2);
      setSliderHours(defaultVal);
      fetchWhatIf(appId, defaultVal);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setSliderHours(val);
    if (selectedAppId) {
      fetchWhatIf(selectedAppId, val);
    }
  };

  if (loading || !data || !selectedAppId) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Real-Time Simulator...</div>;
  }

  const currentApp = data.appliances.find(a => a.id === selectedAppId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* BANNER */}
      <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Activity size={18} color="var(--accent-cyan)" />
          <span className="badge badge-low" style={{ background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)' }}>
            REAL-TIME INTERACTIVE SLIDER ENGINE
          </span>
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>
          Real-Time What-If Usage Adjustment Simulator
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '750px' }}>
          Move the slider to adjust daily operational hours for any appliance. PowerOptix immediately re-calculates exact kWh, bill impact, monthly savings, and CO₂ reduction in real time.
        </p>
      </div>

      {/* APPLIANCE SELECTOR & INTERACTIVE SLIDER CARD */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'center' }}>
          
          {/* Appliance Selection */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Select Appliance to Adjust
            </label>
            <select
              className="form-select"
              style={{ marginTop: '0.5rem', fontSize: '1rem', fontWeight: 700, padding: '0.75rem' }}
              value={selectedAppId}
              onChange={e => handleApplianceChange(parseInt(e.target.value))}
            >
              {data.appliances.map(app => (
                <option key={app.id} value={app.id}>
                  {app.name} ({app.rated_power_w}W — Current: {app.hours_per_day} hr/d)
                </option>
              ))}
            </select>

            {currentApp && (
              <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rated Power: <strong style={{ color: 'var(--text-primary)' }}>{currentApp.rated_power_w}W</strong></p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quantity: <strong style={{ color: 'var(--text-primary)' }}>{currentApp.quantity}</strong></p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Original Usage: <strong style={{ color: 'var(--accent-amber)' }}>{currentApp.hours_per_day} hours / day</strong></p>
              </div>
            )}
          </div>

          {/* Interactive Range Slider */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Adjust Operating Hours</span>
              <span className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {sliderHours} hr / day
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="24"
              step="0.5"
              value={sliderHours}
              onChange={handleSliderChange}
              style={{
                width: '100%',
                height: '8px',
                accentColor: 'var(--accent-cyan)',
                cursor: 'pointer'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              <span>0 hr/day</span>
              <span>12 hr/day</span>
              <span>24 hr/day</span>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC CALCULATED RESULTS PANEL */}
      {whatIfResult && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-cyan)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Energy Saved</span>
            <h3 className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.3rem' }}>
              ⚡ {whatIfResult.kwh_saved >= 0 ? `${whatIfResult.kwh_saved} kWh` : `${whatIfResult.kwh_saved} kWh`}
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Old: {whatIfResult.old_kwh} kWh → New: {whatIfResult.new_kwh} kWh
            </span>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-emerald)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Monthly Money Saving</span>
            <h3 className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.3rem' }}>
              💰 ₹{whatIfResult.monthly_saving.toLocaleString()}
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Old bill: ₹{whatIfResult.old_bill} → New: ₹{whatIfResult.new_bill}
            </span>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-amber)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Annual Money Saving</span>
            <h3 className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '0.3rem' }}>
              💵 ₹{whatIfResult.annual_saving.toLocaleString()}
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>12-month compound savings</span>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-purple)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Estimated CO₂ Reduction</span>
            <h3 className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '0.3rem' }}>
              🌱 {whatIfResult.co2_reduction_kg_year} kg/yr
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Environmental footprint impact</span>
          </div>
        </div>
      )}

    </div>
  );
};
