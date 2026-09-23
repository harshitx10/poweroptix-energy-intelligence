import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { TariffConfig, TariffSlab } from '../types';

interface SettingsProps {
  onDataChanged: () => void;
}

export const SettingsPage: React.FC<SettingsProps> = ({ onDataChanged }) => {
  const [tariff, setTariff] = useState<TariffConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTariff = async () => {
    try {
      setLoading(true);
      const res = await api.getTariff();
      setTariff(res);
    } catch (err) {
      console.error('Error fetching tariff config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTariff();
  }, []);

  const handleSlabRateChange = (idx: number, newRate: number) => {
    if (!tariff) return;
    const newSlabs = [...tariff.slabs];
    newSlabs[idx].rate_per_unit = newRate;
    setTariff({ ...tariff, slabs: newSlabs });
  };

  const handleFixedChargeChange = (val: number) => {
    if (!tariff) return;
    setTariff({ ...tariff, fixed_charge: val });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tariff) return;
    try {
      await api.updateTariff(tariff);
      alert('Tariff configuration saved successfully!');
      onDataChanged();
    } catch (err) {
      alert(`Error saving tariff: ${err}`);
    }
  };

  if (loading || !tariff) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Tariff Configuration...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* BANNER */}
      <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <SettingsIcon size={18} color="var(--accent-blue)" />
          <span className="badge badge-medium">CONFIGURABLE TARIFF ENGINE</span>
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>
          Electricity Tariff & Slab Rate Configuration
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '750px' }}>
          Note: Tariff values are configurable demo parameters. Update slab unit ranges, rates per unit, and monthly fixed charges to match your specific utility provider.
        </p>
      </div>

      {/* FORM */}
      <form onSubmit={handleSave} className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Tariff Plan Name</label>
            <input
              type="text"
              className="form-input"
              style={{ marginTop: '0.25rem' }}
              value={tariff.tariff_name}
              onChange={e => setTariff({ ...tariff, tariff_name: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>Monthly Fixed Charge (₹)</label>
            <input
              type="number"
              step="1"
              className="form-input font-mono"
              style={{ marginTop: '0.25rem' }}
              value={tariff.fixed_charge}
              onChange={e => handleFixedChargeChange(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>Progressive Electricity Slab Rates</h3>

        <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Slab Range</th>
                <th>Min Units</th>
                <th>Max Units</th>
                <th>Rate per Unit (₹/kWh)</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {tariff.slabs.map((slab, idx) => (
                <tr key={idx}>
                  <td><strong style={{ fontSize: '0.9rem' }}>Slab {idx + 1}</strong></td>
                  <td className="font-mono">{slab.min_units} kWh</td>
                  <td className="font-mono">{slab.max_units !== null ? `${slab.max_units} kWh` : '301+ kWh (Unlimited)'}</td>
                  <td>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input font-mono"
                      style={{ width: '120px', padding: '0.4rem 0.6rem', fontWeight: 700, color: 'var(--accent-emerald)' }}
                      value={slab.rate_per_unit}
                      onChange={e => handleSlabRateChange(idx, parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{slab.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" onClick={loadTariff} className="btn btn-secondary">
            <RefreshCw size={16} />
            Reset Defaults
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={16} />
            Save Tariff Configuration
          </button>
        </div>
      </form>

    </div>
  );
};
