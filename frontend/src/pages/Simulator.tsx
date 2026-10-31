import React, { useState, useEffect } from 'react';
import { Activity, Zap, DollarSign, PiggyBank, Leaf, RefreshCw, Volume2 } from 'lucide-react';
import { api } from '../api/client';
import { ApplianceAnalyticsSummary, WhatIfResponse, Appliance } from '../types';
import { speakPowerOptix } from '../utils/audioAssistant';

interface SimulatorProps {
  onDataChanged: () => void;
}

export const Simulator: React.FC<SimulatorProps> = ({ onDataChanged }) => {
  const [data, setData] = useState<ApplianceAnalyticsSummary | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [sliderHours, setSliderHours] = useState<number>(4.0);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const speakWhatIfResult = (res: WhatIfResponse) => {
    const saved = Math.round(res.monthly_saving || 0);
    const msg = saved > 0
      ? `Good news. Your simulated plan can save approximately ${saved} rupees.`
      : `Scenario analysis completed. Your simulated plan shows potential savings.`;
    speakPowerOptix(msg, 'MEDIUM', 'what_if_evt', 'success');
  };

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
          fetchWhatIf(defaultApp.id, Math.max(1, defaultApp.hours_per_day - 2), false);
        }
      } catch (err) {
        console.error('Error initializing simulator:', err);
      } finally {
        setLoading(false);
      }
    }
    initSimulator();
  }, []);

  const fetchWhatIf = async (appId: number, hours: number, isUserAction = true) => {
    try {
      const res = await api.runWhatIf(appId, hours);
      setWhatIfResult(res);
      if (isUserAction && res) {
        speakWhatIfResult(res);
      }
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Simulated Impact & Financial Projections</h3>
            <button
              onClick={() => speakWhatIfResult(whatIfResult)}
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              title="Listen to What-If Simulation Results"
            >
              <Volume2 size={15} color="var(--accent-cyan)" />
              Listen
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
            <div className="glass-panel" style={{ padding: '1.1rem', borderLeft: '4px solid var(--accent-cyan)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Energy Saved</span>
              <h3 className="font-mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.3rem' }}>
                ⚡ {whatIfResult.kwh_saved >= 0 ? `${whatIfResult.kwh_saved} kWh` : `${whatIfResult.kwh_saved} kWh`}
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                ({(whatIfResult.kwh_saved / 30).toFixed(2)} kWh/day)
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '1.1rem', borderLeft: '4px solid var(--accent-emerald)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Daily Saving</span>
              <h3 className="font-mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.3rem' }}>
                💰 ₹{(whatIfResult.monthly_saving / 30).toFixed(2)} / day
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Daily electricity saving</span>
            </div>

            <div className="glass-panel" style={{ padding: '1.1rem', borderLeft: '4px solid var(--accent-emerald)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Monthly Money Saving</span>
              <h3 className="font-mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.3rem' }}>
                ₹{whatIfResult.monthly_saving.toLocaleString()}
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                ₹{whatIfResult.old_bill} → ₹{whatIfResult.new_bill}
              </span>
            </div>

            <div className="glass-panel" style={{ padding: '1.1rem', borderLeft: '4px solid var(--accent-amber)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Annual Money Saving</span>
              <h3 className="font-mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '0.3rem' }}>
                💵 ₹{whatIfResult.annual_saving.toLocaleString()}
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>12-month compound savings</span>
            </div>

            <div className="glass-panel" style={{ padding: '1.1rem', borderLeft: '4px solid var(--accent-purple)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Estimated CO₂ Impact</span>
              <h3 className="font-mono" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '0.3rem' }}>
                🌱 {whatIfResult.co2_reduction_kg_year} kg/yr
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Environmental footprint</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
