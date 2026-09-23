import React, { useState, useEffect } from 'react';
import { Sun, Battery, Car, Zap, DollarSign, TrendingDown } from 'lucide-react';
import { api } from '../api/client';

export const SolarEvSimulator: React.FC = () => {
  const [solarKw, setSolarKw] = useState<number>(3.0);
  const [batteryKwh, setBatteryKwh] = useState<number>(5.0);
  const [solarRes, setSolarRes] = useState<any>(null);
  const [evRes, setEvRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runSimulations = async () => {
    try {
      setLoading(true);
      const [sData, eData] = await Promise.all([
        api.simulateSolar(solarKw, batteryKwh),
        api.optimizeEv(30.0, 20.0, 80.0)
      ]);
      setSolarRes(sData);
      setEvRes(eData);
    } catch (err) {
      console.error('Error running Solar/EV simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulations();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* BANNER */}
      <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(16, 185, 129, 0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Sun size={18} color="var(--accent-amber)" />
              <span className="badge badge-high" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--accent-amber)' }}>
                RENEWABLE SOLAR + BATTERY & EV OPTIMIZER
              </span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              Solar PV Generation & EV Smart Charging Simulator
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '750px' }}>
              Simulate grid dependency reduction from rooftop solar panels and battery storage, while optimizing EV charging windows for off-peak night rates.
            </p>
          </div>
        </div>
      </div>

      {/* SOLAR PV + BATTERY SECTION */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sun size={20} color="var(--accent-amber)" />
          Rooftop Solar PV & Battery Storage Balance
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '1.5rem', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Solar Capacity (kW Peak)</label>
            <input
              type="number"
              step="0.5"
              className="form-input font-mono"
              style={{ marginTop: '0.25rem' }}
              value={solarKw}
              onChange={e => setSolarKw(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Battery Storage (kWh)</label>
            <input
              type="number"
              step="1"
              className="form-input font-mono"
              style={{ marginTop: '0.25rem' }}
              value={batteryKwh}
              onChange={e => setBatteryKwh(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <button onClick={runSimulations} className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Simulate Solar & Battery Yield
            </button>
          </div>
        </div>

        {solarRes && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Monthly Solar Gen</span>
              <h4 className="font-mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{solarRes.monthly_solar_generation_kwh} kWh</h4>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>New Grid kWh</span>
              <h4 className="font-mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{solarRes.new_grid_kwh} kWh</h4>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Grid Dependency</span>
              <h4 className="font-mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{solarRes.grid_dependency_pct}%</h4>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Annual Bill Saving</span>
              <h4 className="font-mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>₹{solarRes.annual_bill_saving.toLocaleString()}</h4>
            </div>
          </div>
        )}
      </div>

      {/* EV CHARGING SECTION */}
      {evRes && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Car size={20} color="var(--accent-cyan)" />
            EV Smart Charging Window Optimizer
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--accent-rose)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Immediate Peak Charging (6 PM)</span>
              <h4 className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-rose)', marginTop: '0.2rem' }}>₹{evRes.immediate_peak_cost} / charge</h4>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--accent-emerald)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Off-Peak Night Charging (11 PM)</span>
              <h4 className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.2rem' }}>₹{evRes.off_peak_cost} / charge</h4>
            </div>

            <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--accent-cyan)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Annual EV Charge Saving</span>
              <h4 className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>₹{evRes.annual_ev_saving.toLocaleString()} / yr</h4>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
