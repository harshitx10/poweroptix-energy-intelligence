import React, { useState, useEffect } from 'react';
import { DollarSign, Zap, TrendingDown, PiggyBank, RefreshCw } from 'lucide-react';
import { api } from '../api/client';

export const PaybackAnalyzer: React.FC = () => {
  const [currentPowerW, setCurrentPowerW] = useState<number>(100);
  const [replacementPowerW, setReplacementPowerW] = useState<number>(10);
  const [hoursPerDay, setHoursPerDay] = useState<number>(8);
  const [costTotal, setCostTotal] = useState<number>(1500);
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runCalculation = async () => {
    try {
      setLoading(true);
      const data = await api.calculateReplacement(currentPowerW, replacementPowerW, hoursPerDay, costTotal);
      setRes(data);
    } catch (err) {
      console.error('Error calculating payback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runCalculation();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* BANNER */}
      <div className="glass-panel" style={{ padding: '1.75rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.05) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <PiggyBank size={18} color="var(--accent-emerald)" />
              <span className="badge badge-low" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--accent-emerald)' }}>
                FINANCIAL INVESTMENT ANALYZER
              </span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.4rem' }}>
              Appliance Replacement & Payback Period Analyzer
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '750px' }}>
              Formula: Payback Period = Replacement Cost / Monthly Financial Saving. Calculates energy reductions and 5-year ROI.
            </p>
          </div>
        </div>
      </div>

      {/* INPUT FORM & RESULT PANEL */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Current Appliance Power (W)</label>
            <input
              type="number"
              className="form-input font-mono"
              style={{ marginTop: '0.25rem' }}
              value={currentPowerW}
              onChange={e => setCurrentPowerW(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Replacement LED/Efficient Power (W)</label>
            <input
              type="number"
              className="form-input font-mono"
              style={{ marginTop: '0.25rem' }}
              value={replacementPowerW}
              onChange={e => setReplacementPowerW(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Daily Operating Hours</label>
            <input
              type="number"
              className="form-input font-mono"
              style={{ marginTop: '0.25rem' }}
              value={hoursPerDay}
              onChange={e => setHoursPerDay(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Replacement Cost (₹)</label>
            <input
              type="number"
              className="form-input font-mono"
              style={{ marginTop: '0.25rem' }}
              value={costTotal}
              onChange={e => setCostTotal(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <button onClick={runCalculation} className="btn btn-primary">
          <RefreshCw size={16} />
          Calculate Financial Payback
        </button>
      </div>

      {res && res.is_beneficial && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-emerald)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Payback Period</span>
            <h3 className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.3rem' }}>
              {res.payback_period_months} Months
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{res.payback_period_years} years to break even</span>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-cyan)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Monthly Financial Saving</span>
            <h3 className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.3rem' }}>
              ₹{res.monthly_money_saved} / mo
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>-{res.monthly_kwh_saved} kWh/month reduction</span>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-amber)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>5-Year Net Profit</span>
            <h3 className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '0.3rem' }}>
              ₹{res.five_year_net_savings.toLocaleString()}
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{res.five_year_roi_pct}% 5-year ROI</span>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-purple)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Power Reduction</span>
            <h3 className="font-mono" style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '0.3rem' }}>
              {res.power_reduction_pct}% Cut
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{res.current_power_w}W → {res.replacement_power_w}W</span>
          </div>
        </div>
      )}

    </div>
  );
};
