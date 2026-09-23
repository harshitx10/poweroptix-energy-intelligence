import React, { useState, useEffect } from 'react';
import { Cpu, Zap, DollarSign, TrendingDown, RefreshCw, Save, ArrowRight, Check } from 'lucide-react';
import { api } from '../api/client';
import { ApplianceAnalyticsSummary, DigitalTwinSimulateResponse, Appliance } from '../types';

interface DigitalTwinProps {
  onDataChanged: () => void;
}

export const DigitalTwin: React.FC<DigitalTwinProps> = ({ onDataChanged }) => {
  const [baseData, setBaseData] = useState<ApplianceAnalyticsSummary | null>(null);
  const [twinResult, setTwinResult] = useState<DigitalTwinSimulateResponse | null>(null);
  const [scenarioTitle, setScenarioTitle] = useState('AC Reduction & LED Upgrade Scenario');
  const [overrides, setOverrides] = useState<Record<number, { hours_per_day: number; rated_power_w: number; quantity: number; is_active: boolean }>>({});
  const [loading, setLoading] = useState(true);

  const loadBaseline = async () => {
    try {
      setLoading(true);
      const res = await api.getAppliances();
      setBaseData(res);

      // Initialize default scenario overrides (e.g. AC 6h -> 4h)
      const initialOverrides: Record<number, any> = {};
      res.appliances.forEach(app => {
        initialOverrides[app.id] = {
          hours_per_day: app.hours_per_day,
          rated_power_w: app.rated_power_w,
          quantity: app.quantity,
          is_active: app.is_active
        };
      });

      // Preset demo scenario: AC hours 6 -> 4, lights 40W -> 10W
      res.appliances.forEach(app => {
        if (app.name.toLowerCase().includes('ac') || app.name.toLowerCase().includes('air conditioner')) {
          initialOverrides[app.id].hours_per_day = 4.0;
        }
        if (app.name.toLowerCase().includes('light') || app.name.toLowerCase().includes('bulb')) {
          initialOverrides[app.id].rated_power_w = 10.0; // LED upgrade
        }
      });

      setOverrides(initialOverrides);
      runSimulation(initialOverrides, res.appliances);
    } catch (err) {
      console.error('Error setting up Digital Twin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaseline();
  }, []);

  const runSimulation = async (currOverrides: Record<number, any>, appliancesList?: Appliance[]) => {
    try {
      const overrideList = Object.entries(currOverrides).map(([id, val]) => ({
        id: parseInt(id),
        ...val
      }));
      const res = await api.simulateDigitalTwin(scenarioTitle, overrideList);
      setTwinResult(res);
    } catch (err) {
      console.error('Error running Digital Twin simulation:', err);
    }
  };

  const handleOverrideChange = (appId: number, field: string, value: any) => {
    const updated = {
      ...overrides,
      [appId]: {
        ...overrides[appId],
        [field]: value
      }
    };
    setOverrides(updated);
    runSimulation(updated);
  };

  const handleReset = () => {
    if (!baseData) return;
    const resetOverrides: Record<number, any> = {};
    baseData.appliances.forEach(app => {
      resetOverrides[app.id] = {
        hours_per_day: app.hours_per_day,
        rated_power_w: app.rated_power_w,
        quantity: app.quantity,
        is_active: app.is_active
      };
    });
    setOverrides(resetOverrides);
    runSimulation(resetOverrides);
  };

  if (loading || !baseData || !twinResult) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Initializing Energy Digital Twin Engine...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* HEADER BANNER */}
      <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span className="badge badge-medium" style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-purple)' }}>
                DETERMINISTIC ENERGY DIGITAL TWIN
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Real-time Household Virtual Simulation</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              What-If Energy Digital Twin Scenario Sandbox
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '750px' }}>
              Simulate appliance hardware upgrades (e.g. LED bulbs), usage hour shifts, or load shedding. The Digital Twin calculates exact deterministic energy, bill, and carbon differences.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleReset} className="btn btn-secondary">
              <RefreshCw size={16} />
              Reset Baseline
            </button>
          </div>
        </div>
      </div>

      {/* CURRENT STATE VS SIMULATED STATE METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-purple)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Simulated Monthly Consumption</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.4rem' }}>
            <span className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-purple)' }}>{twinResult.simulated_kwh} kWh</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{twinResult.original_kwh} kWh</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 700 }}>
            {twinResult.kwh_saved >= 0 ? `⚡ -${twinResult.kwh_saved} kWh saved` : `⚡ +${Math.abs(twinResult.kwh_saved)} kWh increased`}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-emerald)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Simulated Monthly Bill</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.4rem' }}>
            <span className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>₹{twinResult.simulated_bill.toLocaleString()}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{twinResult.original_bill.toLocaleString()}</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
            💰 Save ₹{twinResult.monthly_money_saved.toLocaleString()}/month
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-cyan)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Annual Money Saved</span>
          <h3 className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.4rem' }}>
            ₹{twinResult.annual_money_saved.toLocaleString()} / year
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{twinResult.percentage_bill_change}% bill difference</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-amber)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Estimated CO₂ Reduction</span>
          <h3 className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '0.4rem' }}>
            {twinResult.co2_reduction_kg} kg / year
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Green energy impact</span>
        </div>
      </div>

      {/* DIGITAL TWIN SIMULATION TABLE */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Digital Twin Interactive Hardware & Usage Control</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Modify power rating (W), operating hours, or active state to see immediate Digital Twin calculations.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Appliance</th>
                <th>Baseline Power (W)</th>
                <th>Simulated Power (W)</th>
                <th>Baseline Hours</th>
                <th>Simulated Hours</th>
                <th>Baseline kWh</th>
                <th>Simulated kWh</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {baseData.appliances.map(app => {
                const ov = overrides[app.id] || { hours_per_day: app.hours_per_day, rated_power_w: app.rated_power_w, quantity: app.quantity, is_active: app.is_active };
                const comp = twinResult.appliance_comparisons.find(c => c.appliance_id === app.id);
                const isModified = ov.hours_per_day !== app.hours_per_day || ov.rated_power_w !== app.rated_power_w;

                return (
                  <tr key={app.id} style={{ background: isModified ? 'rgba(139, 92, 246, 0.08)' : 'transparent' }}>
                    <td>
                      <div style={{ fontWeight: 700 }}>
                        {app.name}
                        {isModified && <span className="badge badge-medium" style={{ marginLeft: '0.5rem', fontSize: '0.6rem' }}>MODIFIED</span>}
                      </div>
                    </td>
                    <td className="font-mono">{app.rated_power_w}W</td>
                    <td>
                      <input
                        type="number"
                        className="form-input font-mono"
                        style={{ width: '90px', padding: '0.35rem 0.5rem' }}
                        value={ov.rated_power_w}
                        onChange={e => handleOverrideChange(app.id, 'rated_power_w', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="font-mono">{app.hours_per_day} hr/d</td>
                    <td>
                      <input
                        type="number"
                        step="0.5"
                        className="form-input font-mono"
                        style={{ width: '90px', padding: '0.35rem 0.5rem' }}
                        value={ov.hours_per_day}
                        onChange={e => handleOverrideChange(app.id, 'hours_per_day', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="font-mono">{comp?.original_kwh} kWh</td>
                    <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>
                      {comp?.simulated_kwh} kWh
                    </td>
                    <td className="font-mono" style={{ fontWeight: 700, color: (comp?.kwh_diff || 0) <= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                      {comp?.kwh_diff && comp.kwh_diff <= 0 ? `${comp.kwh_diff} kWh` : `+${comp?.kwh_diff} kWh`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
